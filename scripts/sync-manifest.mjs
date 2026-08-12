import fs from 'fs/promises';
import path from 'path';

async function syncManifest() {
  const outputDir = path.join('outputs', 'mixer_samples');
  const manifestPath = path.join(outputDir, 'manifest.json');

  try {
    console.log("=========================================");
    console.log("🔄 믹서 샘플 매니페스트 동기화 및 복구 스크립트");
    console.log("=========================================");

    // 1. 기존 매니페스트 파일 로드
    let manifest = {};
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
      console.log(`💡 기존 매니페스트 로드 완료 (등록 건수: ${Object.keys(manifest).length}건)`);
    } catch {
      console.log("⚠️ 기존 매니페스트 파일이 없거나 유효하지 않습니다. 새로 생성합니다.");
    }

    // 2. outputs/mixer_samples 디렉토리 스캔
    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

    console.log(`📂 폴더 내 이미지 파일 검색 완료 (총 ${imageFiles.length}개 발견)`);

    let updatedCount = 0;

    // 3. 파일 목록을 순회하며 매니페스트와 비교/동기화
    for (const filename of imageFiles) {
      // 파일명이 ID_INDEX.EXT 패턴인지 분해 (예: mix-talent-energy-001_0.jpg -> ID: mix-talent-energy-001, IDX: 0)
      const match = filename.match(/^(.+)_(\d+)\.(jpg|png)$/);
      if (!match) continue;

      const medId = match[1];
      const idx = parseInt(match[2], 10);
      const serverUrl = `/outputs/mixer_samples/${filename}`;

      // 매니페스트에 누락되었거나 다른 경로가 있으면 업데이트
      if (!Array.isArray(manifest[medId])) {
        manifest[medId] = [null, null, null];
      }
      
      while (manifest[medId].length <= idx) {
        manifest[medId].push(null);
      }

      if (manifest[medId][idx] !== serverUrl) {
        manifest[medId][idx] = serverUrl;
        updatedCount++;
      }
    }

    // 4. 동기화된 매니페스트 저장
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log("=========================================");
    console.log("🎉 매니페스트 복구 동기화 작업이 완료되었습니다!");
    console.log(`   - 신규 갱신/등록된 매핑: ${updatedCount}건`);
    console.log(`   - 최종 등록된 매핑 수: ${Object.keys(manifest).length}건`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ 매니페스트 동기화 중 에러 발생:", error);
  }
}

syncManifest();
