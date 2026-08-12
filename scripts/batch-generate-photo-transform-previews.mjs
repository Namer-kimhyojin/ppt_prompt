#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const DEFAULTS = Object.freeze({
  baseUrl: process.env.PHOTO_PREVIEW_BASE_URL || "http://127.0.0.1:4173",
  initialDelayMs: 0,
  itemDelayMs: 15_000,
  batchSize: 5,
  batchDelayMs: 30_000,
  retryDelayMs: 15_000,
  retries: 2,
  timeoutMs: 300_000,
  checkpoint: "outputs/photo-transform-preview-batch-state.json",
  lockFile: "outputs/.photo-transform-preview.lock",
  lockWaitMs: 21_600_000,
  headful: false,
  dryRun: false,
  listCategories: false,
  includeExistingPresets: false,
  categories: []
});

const HELP = `
사진 변환 프리셋 미리보기를 카테고리별로 천천히 생성·저장합니다.

사용법:
  node scripts/batch-generate-photo-transform-previews.mjs [옵션]

옵션:
  --categories <id,id>       처리할 카테고리(쉼표 구분, 여러 번 지정 가능)
  --base-url <url>           실행 중인 PromptDeck 서버 (기본: ${DEFAULTS.baseUrl})
  --initial-delay-ms <ms>    실행 시작 전 지연 (기본: ${DEFAULTS.initialDelayMs})
  --item-delay-ms <ms>       생성 항목 사이 지연 (기본: ${DEFAULTS.itemDelayMs})
  --batch-size <count>        긴 휴식을 넣을 생성 항목 묶음 크기 (기본: ${DEFAULTS.batchSize})
  --batch-delay-ms <ms>      항목 묶음 사이 긴 지연 (기본: ${DEFAULTS.batchDelayMs})
  --retry-delay-ms <ms>      실패 재시도 사이 지연 (기본: ${DEFAULTS.retryDelayMs})
  --retries <count>          항목별 추가 재시도 횟수 (기본: ${DEFAULTS.retries})
  --timeout-ms <ms>          항목별 최대 대기 시간 (기본: ${DEFAULTS.timeoutMs})
  --checkpoint <path>        진행 기록 파일 (기본: ${DEFAULTS.checkpoint})
  --lock-file <path>         단일 writer 잠금 파일 (기본: ${DEFAULTS.lockFile})
  --lock-wait-ms <ms>        잠금 해제 최대 대기 (기본: ${DEFAULTS.lockWaitMs})
  --include-existing-presets expanded- 이외의 기존 프리셋도 포함
  --dry-run                  생성하지 않고 대상과 저장 상태만 확인
  --list-categories          사용 가능한 카테고리와 개수 출력
  --headful                  브라우저 창을 표시
  -h, --help                 도움말 출력

예시:
  npm run batch:photo-previews -- --categories profile,editorial
  npm run batch:photo-previews -- --categories film --item-delay-ms 10000
  npm run batch:photo-previews -- --include-existing-presets

중단과 재개:
  Ctrl+C를 한 번 누르면 현재 항목을 마친 뒤 안전하게 중단합니다. 같은 명령을
  다시 실행하면 서버에 이미 저장된 현재 버전은 건너뛰고 누락 항목부터 계속합니다.
`;

function takeValue(argv, index, inlineValue, flag) {
  const value = inlineValue ?? argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${flag} 값이 필요합니다.`);
  return { value, consumed: inlineValue === undefined ? 1 : 0 };
}

function readNumber(value, flag, { min = 0 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number) || number < min) {
    throw new Error(`${flag}에는 ${min} 이상의 정수를 지정해야 합니다.`);
  }
  return number;
}

function parseArgs(argv) {
  const options = { ...DEFAULTS, categories: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "-h" || argument === "--help") return { ...options, help: true };
    if (argument === "--dry-run") { options.dryRun = true; continue; }
    if (argument === "--headful") { options.headful = true; continue; }
    if (argument === "--list-categories") { options.listCategories = true; continue; }
    if (argument === "--include-existing-presets") { options.includeExistingPresets = true; continue; }

    const [flag, inlineValue] = argument.split(/=(.*)/s, 2);
    const valueFlags = new Set([
      "--categories", "--category", "--base-url", "--initial-delay-ms", "--item-delay-ms", "--batch-size",
      "--batch-delay-ms", "--category-delay-ms", "--retry-delay-ms",
      "--retries", "--timeout-ms", "--checkpoint", "--lock-file", "--lock-wait-ms"
    ]);
    if (!valueFlags.has(flag)) throw new Error(`알 수 없는 옵션: ${argument}`);
    const next = takeValue(argv, index, inlineValue, flag);
    index += next.consumed;

    if (flag === "--categories" || flag === "--category") {
      options.categories.push(...next.value.split(",").map((value) => value.trim()).filter(Boolean));
    } else if (flag === "--base-url") {
      options.baseUrl = next.value;
    } else if (flag === "--checkpoint") {
      options.checkpoint = next.value;
    } else if (flag === "--lock-file") {
      options.lockFile = next.value;
    } else if (flag === "--lock-wait-ms") {
      options.lockWaitMs = readNumber(next.value, flag);
    } else if (flag === "--initial-delay-ms") {
      options.initialDelayMs = readNumber(next.value, flag);
    } else if (flag === "--item-delay-ms") {
      options.itemDelayMs = readNumber(next.value, flag);
    } else if (flag === "--batch-size") {
      options.batchSize = readNumber(next.value, flag, { min: 1 });
    } else if (flag === "--batch-delay-ms" || flag === "--category-delay-ms") {
      options.batchDelayMs = readNumber(next.value, flag);
    } else if (flag === "--retry-delay-ms") {
      options.retryDelayMs = readNumber(next.value, flag);
    } else if (flag === "--retries") {
      options.retries = readNumber(next.value, flag);
    } else if (flag === "--timeout-ms") {
      options.timeoutMs = readNumber(next.value, flag, { min: 1_000 });
    }
  }
  options.categories = [...new Set(options.categories)];
  return options;
}

function previewMedId(preset) {
  return `photo-transform-${preset.id}-v${preset.previewVersion || 1}`;
}

function legacyPreviewMedId(preset) {
  return preset.previewVersion === 1 || preset.previewVersion == null
    ? `photo-transform-${preset.id}`
    : null;
}

async function loadCheckpoint(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    return parsed?.version === 1 ? parsed : null;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    console.warn(`[경고] 체크포인트를 읽지 못했습니다: ${error.message}`);
    return null;
  }
}

async function saveCheckpoint(filePath, state) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  state.updatedAt = new Date().toISOString();
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

async function acquireWriterLock(filePath, waitMs, shouldStop) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const payload = { token, pid: process.pid, host: os.hostname(), startedAt: new Date().toISOString() };
  const deadline = Date.now() + waitMs;
  let lastNoticeAt = 0;

  while (!shouldStop()) {
    try {
      const handle = await fs.open(filePath, "wx");
      await handle.writeFile(`${JSON.stringify(payload, null, 2)}\n`, "utf8");
      return async () => {
        await handle.close().catch(() => {});
        try {
          const current = JSON.parse(await fs.readFile(filePath, "utf8"));
          if (current?.token === token) await fs.unlink(filePath);
        } catch (error) {
          if (error?.code !== "ENOENT") console.warn(`[경고] 잠금 해제 실패: ${error.message}`);
        }
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      let owner;
      try { owner = JSON.parse(await fs.readFile(filePath, "utf8")); } catch { owner = null; }
      const sameHost = owner?.host === os.hostname();
      if (sameHost && isProcessAlive(owner?.pid) === false) {
        console.warn(`종료된 PID ${owner.pid}의 오래된 잠금을 회수합니다.`);
        await fs.unlink(filePath).catch((unlinkError) => {
          if (unlinkError?.code !== "ENOENT") throw unlinkError;
        });
        continue;
      }
      const ownerText = owner ? `PID ${owner.pid || "?"} @ ${owner.host || "?"}` : "소유자 정보 없음";
      if (Date.now() >= deadline) {
        throw new Error(`잠금 대기 ${waitMs}ms가 초과되었습니다 (${ownerText}).`);
      }
      if (Date.now() - lastNoticeAt >= 60_000 || lastNoticeAt === 0) {
        console.log(`다른 배치의 잠금 해제 대기 중: ${ownerText}`);
        lastNoticeAt = Date.now();
      }
      await delay(Math.min(5_000, deadline - Date.now()), shouldStop);
    }
  }
  throw new Error("중단 요청으로 잠금 대기를 종료했습니다.");
}

async function delay(ms, shouldStop) {
  const end = Date.now() + ms;
  while (!shouldStop() && Date.now() < end) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(500, end - Date.now())));
  }
}

async function waitForApp(page) {
  await page.waitForFunction(() => (
    typeof window.PromptDeckPhotoTransform?.getPresets === "function"
    && typeof window.PhotoTransformPresets?.generatePreviewById === "function"
  ));
}

async function launchBrowser(headful) {
  const launchOptions = { headless: !headful };
  try {
    return await chromium.launch(launchOptions);
  } catch (error) {
    if (!/Executable doesn't exist/i.test(error?.message || "")) throw error;
    for (const channel of ["chrome", "msedge"]) {
      try {
        console.warn(`Playwright 번들 브라우저가 없어 시스템 ${channel} 채널을 사용합니다.`);
        return await chromium.launch({ ...launchOptions, channel });
      } catch (channelError) {
        if (!/executable|browser.*not found/i.test(channelError?.message || "")) throw channelError;
      }
    }
    throw new Error("사용 가능한 Chromium 브라우저가 없습니다. `npx playwright install chromium`을 실행하세요.");
  }
}

async function getPreviewEntries(page) {
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/photo-preview-status", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || `HTTP ${response.status}`);
    return body;
  });
  return new Map((result.entries || []).filter((entry) => entry.url).map((entry) => [entry.medId, entry]));
}

async function getPhotoPreviewEngine(page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/config", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || `HTTP ${response.status}`);
    return {
      provider: body.photoPreviewProvider,
      model: body.openaiImageModel,
      quality: body.openaiImageQuality,
      hasOpenAIKey: Boolean(body.openaiApiKey),
    };
  });
}

async function generatePreview(page, id, timeoutMs) {
  let timer;
  const generation = page.evaluate(async (presetId) => {
    const api = window.PhotoTransformPresets;
    if (typeof api?.generatePreviewById !== "function") {
      throw new Error("PhotoTransformPresets.generatePreviewById API를 찾을 수 없습니다.");
    }
    return api.generatePreviewById(presetId);
  }, id);
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${timeoutMs}ms 동안 생성이 완료되지 않았습니다.`);
      error.code = "PREVIEW_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([generation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function isValidSavedEntry(entry) {
  return Boolean(entry?.url && Number(entry.bytes) > 0);
}

function hasSavedPreview(previewEntries, preset) {
  const legacy = legacyPreviewMedId(preset);
  return isValidSavedEntry(previewEntries.get(previewMedId(preset)))
    || (legacy && isValidSavedEntry(previewEntries.get(legacy)));
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[옵션 오류] ${error.message}\n${HELP}`);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(HELP.trim());
    return;
  }

  const checkpointPath = path.resolve(options.checkpoint);
  const lockPath = path.resolve(options.lockFile);
  const previousCheckpoint = await loadCheckpoint(checkpointPath);
  const checkpoint = {
    version: 1,
    baseUrl: options.baseUrl,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedCategories: options.categories,
    completed: previousCheckpoint?.completed || {},
    failures: previousCheckpoint?.failures || {},
    lastItem: previousCheckpoint?.lastItem || null
  };

  let stopRequested = false;
  let signalCount = 0;
  const requestStop = (signal) => {
    signalCount += 1;
    if (signalCount > 1) {
      console.error(`\n${signal} 재수신: 즉시 종료합니다.`);
      process.exit(130);
    }
    stopRequested = true;
    console.warn(`\n${signal} 수신: 현재 항목 후 체크포인트를 저장하고 중단합니다.`);
  };
  process.on("SIGINT", () => requestStop("SIGINT"));
  process.on("SIGTERM", () => requestStop("SIGTERM"));

  let browser;
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let attemptedItems = 0;
  let writeCheckpoint = true;
  let releaseWriterLock;
  try {
    if (options.initialDelayMs > 0) {
      console.log(`분산 실행 시작까지 ${options.initialDelayMs}ms 대기`);
      await delay(options.initialDelayMs, () => stopRequested);
      if (stopRequested) return;
    }
    if (!options.dryRun && !options.listCategories) {
      releaseWriterLock = await acquireWriterLock(lockPath, options.lockWaitMs, () => stopRequested);
      console.log(`단일 writer 잠금 획득: ${lockPath}`);
    }
    browser = await launchBrowser(options.headful);
    const page = await browser.newPage();
    if (!options.dryRun && !options.listCategories) {
      const username = process.env.PROMPTDECK_BATCH_ADMIN_USERNAME || "";
      const password = process.env.PROMPTDECK_BATCH_ADMIN_PASSWORD || "";
      if (!username || !password) {
        throw new Error("배치 실행에는 PROMPTDECK_BATCH_ADMIN_USERNAME과 PROMPTDECK_BATCH_ADMIN_PASSWORD 환경변수가 필요합니다.");
      }
      const loginUrl = new URL("/api/auth/login", options.baseUrl).href;
      const loginResponse = await page.context().request.post(loginUrl, { data: { username, password } });
      const loginResult = await loginResponse.json().catch(() => null);
      if (!loginResponse.ok() || !loginResult?.ok || loginResult.role !== "admin") {
        throw new Error(loginResult?.error || "관리자 배치 로그인에 실패했습니다.");
      }
    }
    await page.addInitScript(() => {
      sessionStorage.setItem("promptdeck_session", JSON.stringify({
        userId: "photo-preview-batch",
        username: "photo-preview-batch",
        role: "admin",
        tabPermissions: null,
        requestedTabs: [],
        expiresAt: Date.now() + 60 * 60 * 1000
      }));
      localStorage.setItem("promptdeck_has_users", "1");
    });
    page.on("console", (message) => {
      if (message.type() === "error") console.warn(`[브라우저] ${message.text()}`);
    });
    page.on("pageerror", (error) => console.warn(`[브라우저 오류] ${error.message}`));

    const appUrl = new URL(options.baseUrl);
    appUrl.searchParams.set("photoPreviewAuto", "0");
    console.log(`서버 연결: ${appUrl.href}`);
    await page.goto(appUrl.href, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    const engine = await getPhotoPreviewEngine(page);
    if (!options.dryRun && !options.listCategories && (engine.provider !== "openai" || !engine.hasOpenAIKey)) {
      throw new Error("사진 미리보기용 OpenAI API 키가 없습니다. API 이미지 생성 탭에서 OpenAI GPT Image 2와 API 키를 저장하세요.");
    }
    console.log(`생성 엔진: ${engine.model || "gpt-image-2"} · 품질 ${engine.quality || "medium"}`);

    const allPresets = await page.evaluate(() => window.PromptDeckPhotoTransform.getPresets());
    const presets = options.includeExistingPresets
      ? allPresets
      : allPresets.filter((preset) => preset.id.startsWith("expanded-"));
    if (!presets.length) {
      throw new Error("신규 expanded- 프리셋을 찾지 못했습니다. 프리셋 데이터가 로드되었는지 확인하세요.");
    }
    const categoryGroups = new Map();
    for (const preset of presets) {
      if (!categoryGroups.has(preset.category)) categoryGroups.set(preset.category, []);
      categoryGroups.get(preset.category).push(preset);
    }

    if (options.listCategories) {
      for (const [category, items] of categoryGroups) console.log(`${category}\t${items.length}`);
      writeCheckpoint = false;
      return;
    }

    const unknown = options.categories.filter((category) => !categoryGroups.has(category));
    if (unknown.length) {
      throw new Error(`알 수 없는 카테고리: ${unknown.join(", ")} (가능: ${[...categoryGroups.keys()].join(", ")})`);
    }
    const selectedCategories = options.categories.length ? options.categories : [...categoryGroups.keys()];
    checkpoint.selectedCategories = selectedCategories;
    let previewEntries = await getPreviewEntries(page);
    const targetCount = selectedCategories.reduce((sum, category) => sum + categoryGroups.get(category).length, 0);
    console.log(`대상: ${selectedCategories.length}개 카테고리, ${targetCount}개 프리셋`);
    console.log(`지연: 항목 ${options.itemDelayMs}ms / ${options.batchSize}개 묶음마다 ${options.batchDelayMs}ms`);
    if (previousCheckpoint) console.log(`체크포인트 재개: ${checkpointPath}`);

    for (let categoryIndex = 0; categoryIndex < selectedCategories.length && !stopRequested; categoryIndex += 1) {
      const category = selectedCategories[categoryIndex];
      const items = categoryGroups.get(category);
      console.log(`\n[${categoryIndex + 1}/${selectedCategories.length}] 카테고리 ${category} (${items.length}개)`);

      for (let itemIndex = 0; itemIndex < items.length && !stopRequested; itemIndex += 1) {
        const preset = items[itemIndex];
        const medId = previewMedId(preset);
        previewEntries = await getPreviewEntries(page);
        checkpoint.lastItem = { category, id: preset.id, medId, index: itemIndex, status: "checking" };

        if (hasSavedPreview(previewEntries, preset)) {
          skipped += 1;
          checkpoint.completed[medId] = { id: preset.id, category, status: "existing", at: new Date().toISOString() };
          delete checkpoint.failures[medId];
          console.log(`  [${itemIndex + 1}/${items.length}] 건너뜀: ${preset.title} (저장됨)`);
          await saveCheckpoint(checkpointPath, checkpoint);
          continue;
        }
        if (options.dryRun) {
          console.log(`  [${itemIndex + 1}/${items.length}] 생성 대상: ${preset.title} (${preset.id})`);
          continue;
        }

        attemptedItems += 1;
        let succeeded = false;
        let lastError;
        let attemptsThisRun = 0;
        for (let attempt = 0; attempt <= options.retries && !stopRequested; attempt += 1) {
          attemptsThisRun += 1;
          console.log(`  [${itemIndex + 1}/${items.length}] 생성: ${preset.title} (${attempt + 1}/${options.retries + 1})`);
          checkpoint.lastItem.status = "generating";
          checkpoint.lastItem.attempt = attempt + 1;
          await saveCheckpoint(checkpointPath, checkpoint);
          try {
            await generatePreview(page, preset.id, options.timeoutMs);
            previewEntries = await getPreviewEntries(page);
            const savedEntry = previewEntries.get(medId);
            if (!isValidSavedEntry(savedEntry)) throw new Error(`저장 파일 유효성 확인에 실패했습니다: ${medId}`);
            succeeded = true;
            generated += 1;
            checkpoint.completed[medId] = { id: preset.id, category, status: "generated", at: new Date().toISOString() };
            delete checkpoint.failures[medId];
            checkpoint.lastItem.status = "generated";
            console.log(`    저장 완료: ${medId}`);
            await saveCheckpoint(checkpointPath, checkpoint);
            break;
          } catch (error) {
            lastError = error;
            console.warn(`    실패: ${error.message}`);
            if (error?.code === "PREVIEW_TIMEOUT") {
              await page.reload({ waitUntil: "domcontentloaded" });
              await waitForApp(page);
            }
            if (attempt < options.retries && !stopRequested) await delay(options.retryDelayMs, () => stopRequested);
          }
        }
        if (!succeeded) {
          failed += 1;
          const previousAttempts = checkpoint.failures[medId]?.attempts || 0;
          checkpoint.failures[medId] = {
            id: preset.id,
            category,
            attempts: previousAttempts + attemptsThisRun,
            error: lastError?.message || "중단됨",
            at: new Date().toISOString()
          };
          checkpoint.lastItem.status = stopRequested ? "interrupted" : "failed";
          await saveCheckpoint(checkpointPath, checkpoint);
        }

        if (!stopRequested) {
          const hasMoreItems = itemIndex < items.length - 1 || categoryIndex < selectedCategories.length - 1;
          if (hasMoreItems && attemptedItems % options.batchSize === 0) {
            console.log(`    ${options.batchSize}개 묶음 완료: ${options.batchDelayMs}ms 대기`);
            await delay(options.batchDelayMs, () => stopRequested);
          } else if (hasMoreItems) {
            console.log(`    다음 생성 대상 전 최소 ${options.itemDelayMs}ms 대기`);
            await delay(options.itemDelayMs, () => stopRequested);
          }
        }
      }
    }
  } catch (error) {
    failed += 1;
    console.error(`[배치 오류] ${error.message}`);
    if (/ERR_CONNECTION_REFUSED|net::ERR_CONNECTION/.test(error.message)) {
      console.error(`먼저 로컬 서버를 실행하세요: npm run dev:server`);
    }
  } finally {
    checkpoint.finishedAt = new Date().toISOString();
    checkpoint.interrupted = stopRequested;
    if (writeCheckpoint) {
      await saveCheckpoint(checkpointPath, checkpoint).catch((error) => console.warn(`[경고] 체크포인트 저장 실패: ${error.message}`));
    }
    await browser?.close().catch(() => {});
    await releaseWriterLock?.();
  }

  console.log(`\n결과: 생성 ${generated} / 기존 저장 건너뜀 ${skipped} / 실패 ${failed}`);
  console.log(`체크포인트: ${checkpointPath}`);
  if (stopRequested) process.exitCode = 130;
  else if (failed) process.exitCode = 1;
}

await main();
