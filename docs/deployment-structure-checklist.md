# 구조 분리 체크리스트

## 목표
- 홈 화면은 게임 홈 화면으로 제공
- 프로젝트를 `게임 제작(studio)` / `게임(game)` 2개 구조로 분리
- Git 배포는 전체 코드 기준
- Vercel 배포는 게임 앱만 노출

## 폴더 트리(목표)
```text
jihun-games/
├─ electron/
├─ src/
│  ├─ apps/
│  │  ├─ game/
│  │  │  └─ GameApp.jsx
│  │  └─ studio/
│  │     └─ StudioApp.jsx
│  ├─ games/
│  │  ├─ defense/
│  │  ├─ zombie/
│  │  ├─ baseball/
│  │  └─ proverb/
│  ├─ pages/
│  │  ├─ Home.jsx
│  │  └─ ProjectManager.jsx
│  ├─ main.jsx
│  └─ styles/
├─ docs/
│  └─ deployment-structure-checklist.md
├─ vercel.json
├─ vite.config.js
└─ package.json
```

## 작업 목록
- [x] `src/apps/game` / `src/apps/studio` 엔트리 분리
- [x] Vite 엔트리 alias(`@app-entry`)로 빌드 타깃 분기
- [x] 기본(dev/desktop) 타깃을 `studio`로 유지
- [x] Vercel 빌드(`vercel-build`)를 `build:game`으로 고정
- [x] `vercel.json`에서 `buildCommand=build:game`, `outputDirectory=dist`, SPA 라우팅 fallback 고정
- [x] Git 푸시를 전체 변경(`git add -A`) 기준으로 유지
- [x] 로컬 빌드 검증: `npm run build`, `npm run build:game`, `npm run vercel-build`
- [ ] 데스크톱 배포 버튼 실동작(선택 프로젝트 기준) 회귀 테스트
- [x] Vercel 실배포 후 `/`(게임 홈), `/<게임경로>` 접근 검증
