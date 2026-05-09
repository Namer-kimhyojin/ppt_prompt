# PromptDeck 프로젝트 코딩 규칙

## 인코딩 규칙 (필수)

- 모든 파일은 **UTF-8 without BOM**으로 저장한다.
- PowerShell로 파일을 생성하거나 수정할 때는 반드시 `-Encoding utf8` 옵션을 사용한다.
- Bash/Node.js 스크립트로 파일을 쓸 때는 `utf8` 인코딩을 명시한다.
- 절대로 `UTF-16`, `ANSI`, `CP949` 인코딩을 사용하지 않는다.

## 파일 수정 규칙

- 기존 파일을 수정할 때는 반드시 **Edit 도구**를 사용한다 (Write로 전체 덮어쓰기 금지).
- 임시 파일(`app_test.js`, `app_fix.js`, `fix_*.py` 등)을 생성하지 않는다. 직접 원본 파일을 수정한다.
- 작업 전 파일을 Read로 먼저 읽고, 이후 Edit으로 수정한다.

## PowerShell 사용 시 인코딩

```powershell
# 파일 쓰기 시 항상 UTF-8 지정
Set-Content -Path "file.js" -Value $content -Encoding utf8
Out-File -FilePath "file.js" -Encoding utf8
```

## 프로젝트 구조

- `index.html` — 메인 HTML (UTF-8, BOM 없음)
- `app.js` — 메인 앱 로직
- `src/` — 모듈 파일들
- `styles/` — CSS 파일들
- `backup/` — 백업 파일 (수정 금지)

## 언어

- 코드 내 주석은 한국어 허용
- 변수명/함수명은 영어 camelCase
