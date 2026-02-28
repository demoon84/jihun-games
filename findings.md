# Findings

## 구조/배포 관련
- `src/main.jsx`는 `@app-entry`를 사용해 앱 엔트리를 선택한다.
- `vite.config.js`에서 `VITE_APP_TARGET=game`일 때 `src/apps/game/GameApp.jsx`를 엔트리로 사용한다.
- 기본값은 `studio`라서 데스크톱 개발/운영 툴 동작은 그대로 유지된다.
- `package.json`의 `vercel-build`는 `build:game`을 실행한다.
- `vercel.json`으로 Vercel 빌드 커맨드를 `npm run build:game`으로 고정했다.

## 홈 화면 관련
- 게임 앱 엔트리(`GameApp`)에서 `/`는 `Home`으로 라우팅된다.
- `Home.jsx`의 "프로젝트 대시보드로" 링크는 데스크톱 환경에서만 노출되도록 변경했다.

## 변경사항 검사 단계(git-diff) 관련
- 배포 단계의 변경사항 검사는 `git diff --cached --quiet`를 사용한다.
- 이 명령은 `exitCode 0=변경 없음`, `exitCode 1=변경 있음`, 그 외 코드=오류이다.
- 현재 UI는 `git-diff`에서 `0`을 "변경 없음", `1`을 "변경 있음"으로 표시한다.
- 메인 프로세스에서 `git-diff` 결과에 따라 상태 문구를 분기해, 변경이 없을 때 실패처럼 보이지 않도록 했다.
