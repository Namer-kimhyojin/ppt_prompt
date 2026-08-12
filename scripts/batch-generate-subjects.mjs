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

async function runBatch() {
  try {
    // 1. 브라우저 IIFE 스크립트 로드 및 데이터 추출
    const subjectsFilePath = path.join('src', 'concept-mixer-presets', 'subjects.js');
    const subjectsFileContent = await fs.readFile(subjectsFilePath, 'utf8');

    // IIFE 환경 격리 및 window 객체 흉내내어 MIXER_SUBJECTS 로드
    const sandbox = { window: { CONCEPT_MIXER_PRESETS: {} } };
    const runScript = new Function('window', subjectsFileContent + '\nreturn window;');
    const windowObj = runScript(sandbox.window);
    const mixerSubjects = windowObj.CONCEPT_MIXER_PRESETS?.MIXER_SUBJECTS;

    if (!mixerSubjects) {
      console.error("❌ MIXER_SUBJECTS 데이터를 찾을 수 없습니다.");
      process.exit(1);
    }

    // 2. outputs/mixer_samples 디렉토리 준비
    const outputDir = path.join('outputs', 'mixer_samples');
    await fs.mkdir(outputDir, { recursive: true });

    const manifest = await getMixerManifest(outputDir);

    console.log("=========================================");
    console.log("🚀 주제 참고 이미지 일괄 생성 스크립트");
    console.log("=========================================");

    // 모든 카테고리의 모든 주제 수집 (none 제외)
    const allTasks = [];
    for (const [category, subjects] of Object.entries(mixerSubjects)) {
      for (const subject of subjects) {
        if (subject.id === 'none') continue;
        // 중복 수집 방지
        if (!allTasks.some(t => t.id === subject.id)) {
          allTasks.push(subject);
        }
      }
    }

    console.log(`💡 총 ${allTasks.length}개의 고유 주제를 발견했습니다. 순차 생성을 진행합니다.`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < allTasks.length; i++) {
      const subject = allTasks[i];
      const prompt = subject.prompt;
      const filename = `${subject.id}_0.jpg`;
      const filePath = path.join(outputDir, filename);

      // 이미 파일이 존재한다면 생성 건너뛰기 (매니페스트 동기화 보장)
      let exists = false;
      try {
        await fs.access(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      if (exists) {
        console.log(`[${i + 1}/${allTasks.length}] ⏭️ 스킵: ${subject.nameKo} (${filename}) - 이미 존재함`);
        const serverUrl = `/outputs/mixer_samples/${filename}`;
        if (!Array.isArray(manifest[subject.id]) || manifest[subject.id][0] !== serverUrl) {
          manifest[subject.id] = [serverUrl, null, null];
          await saveMixerManifest(outputDir, manifest);
        }
        skipCount++;
        continue;
      }

      console.log(`[${i + 1}/${allTasks.length}] 🤖 생성 중: ${subject.nameKo} -> "${prompt.slice(0, 60)}..."`);

      try {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=256&height=192&nologo=true&seed=${seed}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP 에러 (상태코드: ${res.status})`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await fs.writeFile(filePath, buffer);
        
        // 매니페스트 갱신 및 저장
        const serverUrl = `/outputs/mixer_samples/${filename}`;
        manifest[subject.id] = [serverUrl, null, null];
        await saveMixerManifest(outputDir, manifest);

        console.log(`  -> 💾 저장 및 매니페스트 갱신 성공: ${filename}`);
        successCount++;

        // Pollinations API 속도 제약에 발맞추고 서버 부하를 줄이기 위한 대기
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`  -> ❌ 생성 실패 (${subject.nameKo}): ${err.message}`);
        failCount++;
      }
    }

    console.log("\n=========================================");
    console.log("🎉 일괄 생성 및 캐싱 작업이 완료되었습니다!");
    console.log(`   - 신규 생성: ${successCount}건`);
    console.log(`   - 스킵(존재): ${skipCount}건`);
    console.log(`   - 실패: ${failCount}건`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ 일괄 생성 처리 중 치명적인 에러 발생:", error);
  }
}

runBatch();
