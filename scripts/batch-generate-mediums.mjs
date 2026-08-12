import fs from 'fs/promises';
import path from 'path';

async function getMixerManifest(outputDir) {
  const p = path.join(outputDir, "manifest.json");
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return {};
  }
}

async function saveMixerManifest(outputDir, manifest) {
  const p = path.join(outputDir, "manifest.json");
  await fs.writeFile(p, JSON.stringify(manifest, null, 2));
}

// 429 및 일시적 에러 발생 시 재시도하는 헬퍼 함수
async function fetchWithRetry(url, options = {}, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`    ⚠️ 429 Rate Limit 감지됨. ${delay / 1000}초 대기 후 재시도합니다... (시도 ${i + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // 지수 백오프
        continue;
      }
      if (!res.ok) throw new Error(`HTTP 에러 (상태코드: ${res.status})`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`    ⚠️ 에러 발생: ${err.message}. ${delay / 1000}초 대기 후 재시도합니다... (시도 ${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

async function runBatch() {
  try {
    // 1. 브라우저 IIFE 스크립트 로드 및 데이터 추출
    const mediumsFilePath = path.join('src', 'concept-mixer-presets', 'mediums.js');
    const mediumsFileContent = await fs.readFile(mediumsFilePath, 'utf8');

    // IIFE 환경 격리 및 window 객체 흉내내어 MIXER_MEDIUMS 로드
    const sandbox = { window: { CONCEPT_MIXER_PRESETS: {} } };
    const runScript = new Function('window', mediumsFileContent + '\nreturn window;');
    const windowObj = runScript(sandbox.window);
    const mixerMediums = windowObj.CONCEPT_MIXER_PRESETS?.MIXER_MEDIUMS;

    if (!mixerMediums) {
      console.error("❌ MIXER_MEDIUMS 데이터를 찾을 수 없습니다.");
      process.exit(1);
    }

    // 2. outputs/mixer_samples 디렉토리 준비
    const outputDir = path.join('outputs', 'mixer_samples');
    await fs.mkdir(outputDir, { recursive: true });

    console.log("=========================================");
    console.log("🚀 화풍(스타일) 참고 이미지 일괄 생성 스크립트 (RateLimit 방지 탑재)");
    console.log("=========================================");

    const manifest = await getMixerManifest(outputDir);

    // 3. 고유한 화풍 수집
    const allTasks = [];
    for (const medium of mixerMediums) {
      if (!medium.id || medium.id === 'none') continue;
      if (!allTasks.some(t => t.id === medium.id)) {
        allTasks.push(medium);
      }
    }

    console.log(`💡 총 ${allTasks.length}개의 화풍 스타일을 발견했습니다. 순차 생성을 진행합니다.`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < allTasks.length; i++) {
      const medium = allTasks[i];
      const filename = `${medium.id}_0.jpg`;
      const filePath = path.join(outputDir, filename);

      // 이미 파일이 존재한다면 생성 건너뛰기
      let exists = false;
      try {
        await fs.access(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      if (exists) {
        console.log(`[${i + 1}/${allTasks.length}] ⏭️ 스킵: ${medium.nameKo} (${filename}) - 이미 존재함`);
        const serverUrl = `/outputs/mixer_samples/${filename}`;
        if (!Array.isArray(manifest[medium.id]) || manifest[medium.id][0] !== serverUrl) {
          manifest[medium.id] = [serverUrl, null, null];
          await saveMixerManifest(outputDir, manifest);
        }
        skipCount++;
        continue;
      }

      // 프롬프트 조합
      const prefix = String(medium.prefix || '').trim();
      const suffix = String(medium.suffix || '').trim();
      const coreSubject = "stylized corporate design objects with clean abstract geometric shapes";
      
      const promptParts = [];
      if (prefix) promptParts.push(prefix);
      promptParts.push(coreSubject);
      if (suffix) promptParts.push(suffix);

      const prompt = promptParts.join(", ");

      console.log(`[${i + 1}/${allTasks.length}] 🤖 생성 중: ${medium.nameKo} -> "${prompt.slice(0, 70)}..."`);

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=320&height=240&nologo=true&seed=${seed}`;

        const res = await fetchWithRetry(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await fs.writeFile(filePath, buffer);
        
        // 매니페스트 정보 갱신 및 파일 쓰기
        const serverUrl = `/outputs/mixer_samples/${filename}`;
        manifest[medium.id] = [serverUrl, null, null];
        await saveMixerManifest(outputDir, manifest);

        console.log(`  -> 💾 저장 및 매니페스트 갱신 성공: ${filename}`);
        successCount++;

        // 속도 제한 방지를 위한 안전한 기본 지연 (1.5초 대기)
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`  -> ❌ 생성 실패 (${medium.nameKo}): ${err.message}`);
        failCount++;
      }
    }

    console.log("\n=========================================");
    console.log("🎉 화풍 일괄 생성 및 캐싱 작업이 완료되었습니다!");
    console.log(`   - 신규 생성 및 등록: ${successCount}건`);
    console.log(`   - 스킵(이미 존재): ${skipCount}건`);
    console.log(`   - 실패: ${failCount}건`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ 화풍 일괄 생성 처리 중 치명적인 에러 발생:", error);
  }
}

runBatch();
