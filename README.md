# 🎮 JIHUN GAMES DESKTOP OPS

게임 제작 프로젝트를 관리하는 Electron + React 대시보드와 기존 게임 모음을 함께 제공하는 앱입니다.

🌐 **LIVE**: [https://jhgame.vercel.app](https://jhgame.vercel.app)

## 주요 기능

- 프로젝트 폴더 등록 및 메타데이터 스캔 (엔진 타입, 스크립트, Git 여부)
- 현재 개발된 로컬 게임 목록 자동 불러오기
- 프로젝트별 작업 칸반 보드 (TODO / IN PROGRESS / DONE)
- 게임 폴더 관리 (`src/games` 기준 폴더 생성/삭제/열기)
- 프로젝트 스크립트 실행 로그 확인
- 선택 프로젝트 기준 Gemini 대화(`pro3-preview` + fast 모드 기본)
- 기존 JIHUN GAMES 메인(`/`) 유지
- 프로젝트 관리 대시보드(`/manager`) 제공

## 게임 목록

- 디펜스 기갑 탱크
- 수비대: 좀비 습격
- 마구마구갓
- 속담 파워

## 기술 스택

- **Desktop**: Electron
- **Frontend**: React + Vite + TailwindCSS
- **Styling**: TailwindCSS

## 로컬 실행

```bash
# 의존성 설치
npm install

# 웹 개발 서버
npm run dev

# Electron + 웹 동시 실행 (권장)
npm run dev:desktop

# Electron (빌드된 dist 사용)
npm run build
npm run desktop

# 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── pages/
│   ├── ProjectManager.jsx    # Electron 프로젝트 관리 대시보드
│   └── Home.jsx              # 기존 게임 홈 (/arcade)
├── games/                    # 게임 모음
├── lib/desktopApi.js         # Electron IPC + 웹 폴백 API
└── styles/index.css

electron/
├── main.cjs                  # BrowserWindow + IPC 핸들러
└── preload.cjs               # contextBridge API
```

## 라이선스

MIT License
