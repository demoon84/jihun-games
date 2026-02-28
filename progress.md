# Progress Log

## 2026-02-28
- 구조 분리 상태 확인: `src/apps/game`, `src/apps/studio` 엔트리 분기 확인.
- 빌드 검증 완료:
  - `npm run build`
  - `npm run build:game`
  - `npm run vercel-build`
- 게임 전용 배포 고정:
  - `vercel.json` 추가 (`buildCommand: npm run build:game`, `outputDirectory: dist`, SPA fallback route)
- 게임 홈 화면 정리:
  - `Home.jsx`의 대시보드 링크를 데스크톱 환경에서만 표시되도록 수정.
- 체크리스트 문서 업데이트:
  - `docs/deployment-structure-checklist.md`에 트리/작업 상태 반영.
- 배포 단계 UX 보강:
  - `electron/main.cjs`에서 `git-diff` 결과가 `변경 없음/변경 있음`으로 상태 문구 분기되도록 보강.
- 런타임 확인:
  - `npm run dev:desktop` 실행 시 `5173` 포트 점유로 부팅 실패 확인.
  - 점유 프로세스: `node ... vite --host 127.0.0.1 --port 5173 --strictPort` (PID 15309).
- 재시작 완료:
  - 기존 PID 15309 종료 후 `npm run dev:desktop` 재실행.
  - 현재 Vite(PID 23619), Electron(PID 23627) 정상 기동 확인.
- 배포 흐름 검증:
  - `git add -A` 이후 `git diff --cached --quiet` 종료코드가 `1`(변경 있음)으로 확인됨.
  - 메인 프로세스 상태 문구 분기(`변경 없음/변경 있음`)가 의미와 일치함을 재검증.
- Vercel 실배포 검증:
  - `npx vercel --prod --yes` 성공, Alias: `https://jhgame.vercel.app`.
  - 경로 응답: `/`, `/zombie`, `/defense`, `/proverb`, `/baseball`, `/manager` 모두 `200`.
  - 배포 JS(`/assets/index-3D3ijGnR.js`) 검사 결과: `ProjectManager` 관련 문자열 미포함, 게임 라우트 문자열 포함.
