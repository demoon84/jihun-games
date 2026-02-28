# Task Plan

## Goal
- 게임 제작 툴(studio)과 게임 앱(game)을 구조적으로 분리한다.
- Git에는 전체 코드가 올라가고, Vercel에는 게임 앱만 배포되게 고정한다.
- 게임 홈(`/`)이 기본 진입점이 되도록 보장한다.

## Phases
1. 완료: 현재 구조/배포 상태 점검
2. 완료: 앱 엔트리 분리 및 빌드 타깃 분기 확정
3. 완료: Vercel 게임 전용 빌드/라우팅 고정
4. 완료: 배포 플로우 상태 문구 및 동작 검증
5. 진행중: 실제 데스크톱 배포 버튼 회귀 검증(실배포 URL 검증 완료)

## Deliverables
- `docs/deployment-structure-checklist.md`
- `src/apps/game/GameApp.jsx`
- `src/apps/studio/StudioApp.jsx`
- `vite.config.js`
- `package.json`
- `vercel.json`

## Errors Encountered
| Error | Attempt | Resolution |
|---|---:|---|
| `git push` non-fast-forward | 1 | 기존 자동 복구 로직(`pull --rebase` 후 재푸시) 유지, UI 단계 로그로 원인 노출 |
| `dev:desktop` 포트 충돌 (`5173 already in use`) | 1 | 기존 실행중 Vite PID 확인(`15309`), 회귀 테스트는 기존 세션 재사용 또는 포트 정리 후 진행 필요 |
