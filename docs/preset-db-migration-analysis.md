# 비주얼 믹서 프리셋 DB화 사전 분석

> 작성일: 2026-07-01  
> 목적: 정적 JS 프리셋 파일 → 서버 JSON + API 래퍼 전환을 위한 Phase 0 분석  
> 관련 계획: 서버 JSON + API 래퍼 방식 (Phase 0~7)

---

## 1. 현재 파일 구조

```
src/concept-mixer-presets/
├── mediums.js       251 KB   ← 화풍/기법
├── subjects.js      217 KB   ← 주제
├── palettes.js       70 KB   ← 색상
├── compositions.js   27 KB   ← 구도
└── typographies.js   26 KB   ← 타이포그래피
```

**로딩 방식**: 각 파일이 IIFE `(function() { ... })()` 로 감싸져 있고,  
마지막에 `Object.assign(window.CONCEPT_MIXER_PRESETS, { ... })` 로 전역 노출.

`concept-mixer.js:3`에서 동기적으로 읽음:
```js
const presetStore = window.CONCEPT_MIXER_PRESETS;
```

---

## 2. 프리셋 항목 수 현황

### mediums.js — 화풍/기법
| 카테고리 ID | 레이블 | 항목 수 |
|------------|--------|---------|
| tech3d | 3D & 테크니컬 | 16 |
| analog | 아날로그 & 회화 | 16 |
| graphic | 그래픽 & 디자인 | 26 |
| anime | 만화 & 애니메이션 | 47 |
| youtube_anim | 유튜브 & 설명영상 | 12 |
| photo | 사진 & 실사 | 22 |
| craft | 핸드메이드 & 실물 공예 | 16 |
| official | 공공 & 보고서 | 47 |
| cardnews | 카드뉴스 | 32 |
| game | 게임 & 픽셀 | 16 |
| trad | 전통 & 판화 | 16 |
| abstract | 추상 & 실험 | 16 |
| arch | 건축 & 공간 | 16 |
| editorial | 에디토리얼 & 패션 | 16 |
| digital_paint | 디지털 페인팅 | 16 |
| ui_ux | UI/UX & 앱 디자인 | 16 |
| pixel_adv | 고급 픽셀 & 도트 | 16 |
| nature_photo | 자연 & 풍경 사진 | 16 |
| **합계** | | **197** |

**필드 구조**:
```js
{
  id: 'med-xxx',          // 고유 ID (필수)
  category: 'tech3d',    // 카테고리 ID (필수)
  nameKo: '...',          // 한글 이름 (필수)
  emoji: '🧊',            // 이모지 (필수)
  desc: '...',            // 짧은 설명 (필수)
  prefix: '...',          // 프롬프트 앞 부분 (필수)
  suffix: '...',          // 프롬프트 뒤 부분 (필수)
  group: 'render3d',      // 표현군 필터 ID (필수)
  texture: 'glossy',      // 텍스처 필터 (필수)
  usage: 'proposal'       // 용도 힌트 (필수)
}
```

---

### subjects.js — 주제
| 카테고리 ID | 항목 수 (mix- prefix) |
|------------|----------------------|
| steel, energy, software, bio, finance, public, brand, space | 각 ~7 |
| regional, policy, urban, food, culture, education, health | 각 ~7 |
| mobility, ocean, materials, creative, environment | 각 ~7 |
| tech_transfer, talent_cultivation, networking | 각 ~7 |
| pubinst_viz (별도 할당) | 12 |
| **합계 (mix-)** | **167** |
| none (무제) | 1 |
| **전체 합계** | **180** |

**카테고리 수**: 24개 (23개 일반 + pubinst_viz)  
**중요**: `MIXER_SUBJECTS`는 `const MIXER_SUBJECTS = { steel: [...], ... }` 로 선언 후  
`MIXER_SUBJECTS.pubinst_viz = [...]` 를 별도 라인에서 후속 할당.

**필드 구조**:
```js
{
  id: 'mix-xxx' | 'none',  // 고유 ID
  nameKo: '...',            // 한글 이름
  emoji: '⚪',              // 이모지
  desc: '...',              // 설명
  prompt: '...',            // 실제 프롬프트 텍스트
  group: 'general',         // 그룹 필터
  scene: 'abstract',        // 씬 필터
  usage: 'report'           // 용도 필터
}
```

---

### palettes.js — 색상
| 카테고리 ID | 항목 수 |
|------------|---------|
| tech | 16 |
| nature | 16 |
| energy | 16 |
| soft | 18 |
| official | 16 |
| light_pastel | 16 |
| morning | 16 |
| nordic | 16 |
| candy | 19 |
| warm_earth | 16 |
| multicolor | 24 |
| none (선택안함) | 1 |
| **합계** | **80 (+ none = 81)** |

**필드 구조** (mediums/subjects와 다름 — 주의):
```js
{
  id: 'pal-xxx' | 'none',
  category: 'tech',
  name: '...',             // nameKo 아님, name
  mode: 'light' | 'dark',
  colors: ['#...', ...],   // HEX 배열
  colorMapping: '...',
  mood: '...',
  usage: '...',
  // 추가 필드: tags, description 등 팔레트별로 다름
}
```

---

### compositions.js — 구도
| 카테고리 ID | 항목 수 |
|------------|---------|
| shot | ~14 |
| angle | ~14 |
| layout | ~10 |
| none | 1 |
| **합계** | **70** |

**필드 구조**:
```js
{
  id: 'comp-xxx' | 'none',
  category: 'shot',
  nameKo: '...',
  emoji: '...',
  desc: '...',
  prefix: '...',
  suffix: ''
}
```

---

### typographies.js — 타이포그래피
| 카테고리 ID | 항목 수 |
|------------|---------|
| sans | 5 |
| serif | 4 |
| display | ~10 |
| script | ~5 |
| experimental | ~5 |
| none | 1 |
| **합계** | **56** |

**필드 구조**:
```js
{
  id: 'typo-xxx' | 'none',
  category: 'sans',
  nameKo: '...',
  emoji: '...',
  desc: '...',
  prompt: '...'            // prefix/suffix 아님, prompt 단일 필드
}
```

---

## 3. 전체 프리셋 수 요약

| 타입 | 파일 | 항목 수 | 카테고리 수 |
|------|------|---------|------------|
| 화풍/기법 | mediums.js | 197 | 18 |
| 주제 | subjects.js | 180 (none 포함) | 24 |
| 색상 | palettes.js | 81 (none 포함) | 11 |
| 구도 | compositions.js | 70 (none 포함) | 3 |
| 타이포 | typographies.js | 56 (none 포함) | 5 |
| **총합** | | **584** | **61** |

---

## 4. 하드코딩 참조 — JSON 필드로 전환 필요

### 4-1. `PUBINST_MEDIUM_IDS` (mediums.js:3078)

**현황**: `new Set([...])` 로 63개 화풍 ID 하드코딩  
**사용 위치**:
- `concept-mixer.js` `renderMediums()` — 공공기관 필터 적용
- `concept-mixer.js` `btnMixerInstRandom` 핸들러 — 랜덤 pubinst 화풍 선택

**전환 전략**: 각 medium 객체에 `"pubinst": true` 필드 추가  
마이그레이션 시 Set 체크로 자동 주입 가능:
```js
// 마이그레이션 스크립트에서
medium.pubinst = PUBINST_MEDIUM_IDS.has(medium.id);
```
런타임에서는:
```js
// buildPresetStore()에서 재구성
const PUBINST_MEDIUM_IDS = new Set(
  data.mediums.filter(m => m.pubinst).map(m => m.id)
);
```

---

### 4-2. `MIXER_MEDIUM_SAMPLES` (mediums.js:2623)

**현황**: `{ 'med-xxx': ['photo-...', ...], ... }` 형태의 Unsplash 사진 ID 매핑  
**사용 위치**: `concept-mixer.js` 프리뷰 카드 렌더링 (썸네일 이미지 URL 생성)

**전환 전략**: 각 medium 객체에 `"unsplashSamples": ["photo-xxx", ...]` 필드 추가  
런타임에서는:
```js
// buildPresetStore()에서 재구성
const MIXER_MEDIUM_SAMPLES = Object.fromEntries(
  data.mediums.map(m => [m.id, m.unsplashSamples || ['photo-1618005182384-a83a8bd57fbe']])
);
```

---

### 4-3. `MIXER_SUBJECT_CATEGORY_FALLBACKS` (mediums.js:3051)

**현황**: `{ steel: 'photo-xxx', energy: 'photo-xxx', ... }` — 22개 카테고리 키  
**위치 주의**: mediums.js에 있음 (subjects.js 아님)  
**사용 위치**: `concept-mixer.js:8171` — 주제 카테고리별 기본 썸네일 이미지

**전환 전략**: 별도 `subjectCategories` 배열을 JSON에 추가  
```json
{
  "subjectCategories": [
    { "id": "steel", "fallbackUnsplash": "photo-1518770660439-4636190af475" },
    ...
  ]
}
```
또는 subjects.json 최상단에 메타데이터로 포함.

---

## 5. 타입별 필드명 불일치 — 주의사항

| 타입 | 이름 필드 | 프롬프트 필드 |
|------|----------|--------------|
| mediums | `nameKo` | `prefix` + `suffix` |
| subjects | `nameKo` | `prompt` (단일) |
| palettes | `name` (한글) | `colors[]` + `colorMapping` |
| compositions | `nameKo` | `prefix` + `suffix` |
| typographies | `nameKo` | `prompt` (단일) |

**마이그레이션 시 타입별로 다른 처리 함수 필요. 단일 루프 불가.**

---

## 6. 추가 구조체 (mediums.js 내 위치)

| 구조체 | 위치 | 내용 |
|--------|------|------|
| `MEDIUM_CATEGORIES[]` | mediums.js 상단 | 18개 카테고리 메타 (id, label) |
| `MIXER_MEDIUM_SAMPLES{}` | mediums.js:2623 | 화풍별 Unsplash photo ID 매핑 |
| `MIXER_SUBJECT_CATEGORY_FALLBACKS{}` | mediums.js:3051 | 주제 카테고리별 fallback 이미지 |
| `PUBINST_MEDIUM_IDS` Set | mediums.js:3078 | 공공기관 필터 63개 ID |

**mediums.js에 subjects 관련 데이터(FALLBACKS)가 섞여 있음** — 마이그레이션 시 분리 필요.

---

## 7. 서버 현황 (local-server.js)

- **프레임워크**: 없음. 순수 Node.js `http.createServer` + if/else 라우팅
- **데이터 저장 패턴**: JSON 파일 → `fs.readFile` / `fs.writeFile` (auth.json, admin-settings.json, manifest.json)
- **인증**: `resolveSession(req)` → `role === 'admin'` 체크
- **기존 API 패턴**:
  ```
  GET  /api/admin-settings
  POST /api/admin-settings   (admin 전용)
  GET  /api/mixer-images
  POST /api/save-mixer-sample
  ```

**신규 API 추가 방식**: 동일한 if/else 블록에 추가하면 됨. Express 도입 불필요.

---

## 8. 마이그레이션 대상 JSON 파일 구조 (안)

```
data/
  presets/
    mediums.json          ← MIXER_MEDIUMS + pubinst 필드 + unsplashSamples 필드
    subjects.json         ← MIXER_SUBJECTS (객체) + subjectCategories 메타
    palettes.json         ← MIXER_PALETTES
    compositions.json     ← MIXER_COMPOSITIONS
    typographies.json     ← MIXER_TYPOGRAPHIES
    meta.json             ← MIXER_SUBJECT_CATEGORY_FALLBACKS, MEDIUM_CATEGORIES 등
```

또는 단일 파일로:
```
data/presets/all.json     ← 한 번에 fetch로 받을 경우 (round-trip 최소화)
```

---

## 9. Phase별 작업 순서 (내일 실행)

| Phase | 작업 | 예상 시간 | 리스크 |
|-------|------|----------|--------|
| 1 | JSON 스키마 확정 | 30분 | 낮음 |
| 2 | 마이그레이션 스크립트 작성 (`scripts/migrate-presets-to-json.mjs`) | 1~2시간 | 낮음 |
| 3 | 서버 API (읽기 전용 2개 엔드포인트) | 1~2시간 | 낮음 |
| 4 | 프론트 비동기 초기화 전환 (`concept-mixer.js`) | 3~5시간 | **높음** |
| 5 | 서버 API (쓰기 — admin 전용) | 1시간 | 낮음 |
| 6 | admin UI 연결 | 1시간 | 낮음 |
| 7 | 정적 JS 파일 제거 | 30분 | 낮음 |

**Phase 4 진입 전 필수 체크포인트**:
- `GET /api/presets` 응답 정상
- `buildPresetStore(data)` 함수 단위 테스트 완료
- `window.CONCEPT_MIXER_PRESETS` 구조가 기존 동기 버전과 동일한지 console.log 비교

---

## 10. Phase 4 상세 전략 (비동기 초기화)

```js
// 변경 전 (현재): concept-mixer-presets/*.js 로딩 후 동기
const presetStore = window.CONCEPT_MIXER_PRESETS; // 즉시 사용 가능

// 변경 후: 탭 클릭 시 fetch → 초기화
async function loadAndInitMixer() {
  if (window.CONCEPT_MIXER_PRESETS) {
    initConceptMixer(); // 이미 로드됨
    return;
  }
  showMixerLoading(); // 로딩 UI
  try {
    const res = await fetch('/api/presets');
    const data = await res.json();
    window.CONCEPT_MIXER_PRESETS = buildPresetStore(data); // 구조 변환
    initConceptMixer();
  } catch (e) {
    showMixerError(e);
  }
}

function buildPresetStore(data) {
  // PUBINST_MEDIUM_IDS 재구성
  const PUBINST_MEDIUM_IDS = new Set(
    data.mediums.filter(m => m.pubinst).map(m => m.id)
  );
  // MIXER_MEDIUM_SAMPLES 재구성
  const MIXER_MEDIUM_SAMPLES = Object.fromEntries(
    data.mediums.map(m => [m.id, m.unsplashSamples || []])
  );
  // MIXER_SUBJECT_CATEGORY_FALLBACKS 재구성
  const MIXER_SUBJECT_CATEGORY_FALLBACKS = Object.fromEntries(
    (data.subjectCategories || []).map(c => [c.id, c.fallbackUnsplash])
  );

  return {
    MIXER_MEDIUMS: data.mediums,
    MIXER_SUBJECTS: data.subjects,       // { steel: [...], ... }
    MIXER_PALETTES: data.palettes,
    MIXER_COMPOSITIONS: data.compositions,
    MIXER_TYPOGRAPHIES: data.typographies,
    MEDIUM_CATEGORIES: data.mediumCategories,
    PALETTE_CATEGORIES: data.paletteCategories,
    // ... 기타 카테고리 메타
    PUBINST_MEDIUM_IDS,
    MIXER_MEDIUM_SAMPLES,
    MIXER_SUBJECT_CATEGORY_FALLBACKS,
    UNSPLASH_CACHE: {},
    // concept-mixer.js가 기대하는 나머지 키들
  };
}
```

**`initConceptMixer()` 내부 코드는 변경하지 않음** — `presetStore` 구조만 동일하게 맞추면 됨.

---

## 11. 롤백 계획

| 상황 | 롤백 방법 |
|------|----------|
| Phase 2~3 문제 | JSON 파일 삭제, API 엔드포인트 제거 → 원복 |
| Phase 4 실패 | `window.CONCEPT_MIXER_PRESETS` 조건부 체크 제거 → 정적 JS 로딩으로 복귀 |
| Phase 7 후 문제 | git checkout — src/concept-mixer-presets/ |

**Phase 4 전까지는 정적 JS 파일을 유지하므로 언제든 즉시 롤백 가능.**

---

*이 문서는 Phase 0 분석 완료 후 작성됨. Phase 1 시작 전 스키마 최종 확정 필요.*
