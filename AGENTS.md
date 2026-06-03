# PromptDeck 프로젝트 코딩 규칙

## 인코딩 규칙 (필수)

- 모든 파일은 **UTF-8 without BOM**으로 저장한다.
- PowerShell로 파일을 생성하거나 수정할 때는 반드시 `-Encoding utf8` 옵션을 사용한다.
- Bash/Node.js 스크립트로 파일을 쓸 때는 `utf8` 인코딩을 명시한다.
- 절대로 `UTF-16`, `ANSI`, `CP949` 인코딩을 사용하지 않는다.
- 한글이 포함된 파일을 읽을 때는 PowerShell에서 `Get-Content -Encoding utf8`을 사용한다.
- 파일 수정 후 한글이 `?`, `�`, 깨진 자모, 이상한 기호로 바뀌지 않았는지 확인한다.

## 파일 수정 규칙

- 기존 파일을 수정할 때는 반드시 **Edit 도구**를 사용한다 (Write로 전체 덮어쓰기 금지).
- 임시 파일(`app_test.js`, `app_fix.js`, `fix_*.py` 등)을 생성하지 않는다. 직접 원본 파일을 수정한다.
- 작업 전 파일을 Read로 먼저 읽고, 이후 Edit으로 수정한다.
- `Set-Content`, `Out-File`, 리다이렉션(`>`, `>>`)으로 기존 소스 파일 전체를 다시 쓰지 않는다.
- `Get-Content` 결과를 변수에 담아 다시 `Set-Content`로 쓰는 방식은 파일 잘림 위험이 있으므로 피한다.
- `backup/`, `backups/` 폴더의 파일은 사용자가 명시적으로 요청하지 않는 한 수정하지 않는다.

## 파일 잘림 방지

- `index.html`, `app.js`, `src/*.js`, `styles/*.css`처럼 큰 파일은 전체 재작성하지 않는다.
- 큰 파일을 수정할 때는 변경 전후 주변 40~80줄을 확인한다.
- 수정 후 파일 크기가 비정상적으로 줄었는지 확인한다.
- `Select-Object -First`, `Select-Object -Skip`으로 일부만 읽은 내용을 전체 파일처럼 덮어쓰지 않는다.
- 프롬프트 생성 로직 수정 시 `buildFullPrompt`, `buildPromptSections`, `getConflicts`, `getResolvedConflicts` 경로를 함께 점검한다.

## PowerShell 사용 시 인코딩

```powershell
# 파일 쓰기 시 항상 UTF-8 지정
Set-Content -Path "file.js" -Value $content -Encoding utf8
Out-File -FilePath "file.js" -Encoding utf8
```

단, 위 명령은 새 파일 생성이 꼭 필요한 경우에만 사용한다. 기존 소스 파일 수정은 부분 패치 방식으로 한다.

## 검증 규칙

- JavaScript 수정 후 최소한 해당 파일에 대해 `node --check`를 실행한다.
- 주요 앱 로직 수정 후 가능하면 다음 검사를 실행한다.

```powershell
node --check app.js
node --check src\designer-config-globals.js
node --check src\promptdeck-api-globals.js
node scripts\smoke-test.mjs
```

- CSS만 수정한 경우에도 가능하면 `node scripts\smoke-test.mjs`를 실행한다.
- HTML의 script 로딩 순서를 바꾸지 않는다.
- DOM id, data attribute, CSS 클래스명을 변경할 때는 `index.html`, `app.js`, `src/`, `styles/`에서 참조를 함께 검색한다.

## 프로젝트 구조

- `index.html` — 메인 HTML (UTF-8, BOM 없음)
- `app.js` — 메인 앱 로직
- `src/` — 모듈 파일들
- `styles/` — CSS 파일들
- `backup/` — 백업 파일 (수정 금지)

## 언어

- 코드 내 주석은 한국어 허용
- 변수명/함수명은 영어 camelCase

## Git 작업 주의

- 사용자가 만들었을 수 있는 기존 변경을 되돌리지 않는다.
- `git reset --hard`, `git checkout --`, `git clean` 같은 파괴적 명령은 사용하지 않는다.
- 현재 작업과 무관한 변경 파일은 그대로 둔다.
- 커밋이나 스테이징은 사용자가 명시적으로 요청한 경우에만 수행한다.
