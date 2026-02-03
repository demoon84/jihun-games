# 🎮 JIHUN GAMES

초등학생을 위한 교육용 게임 플랫폼

🌐 **LIVE**: [https://jhgame.vercel.app](https://jhgame.vercel.app)

## 게임 목록

### ⚡ 속담 파워 (Proverb Power)
한국 속담을 재미있게 배우는 퀴즈 게임

- **주관식 모드**: 빈칸에 직접 답 입력 (60초, 3점)
- **객관식 모드**: 4지선다 (30초, 2점)
- **혼합 모드**: 주관식 + 객관식 믹스

**특징**:
- 📚 200개 초등학생 수준 속담
- 💡 초성 힌트 제공
- ❤️ 5개 라이프 시스템
- 📊 학습 결과표

## 기술 스택

- **Frontend**: React + Vite
- **Styling**: TailwindCSS
- **Deploy**: Vercel

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── games/
│   └── proverb/
│       ├── ProverbGame.jsx   # 속담 게임 컴포넌트
│       └── proverbs.json     # 200개 속담 데이터
├── components/               # 공통 컴포넌트
├── pages/                    # 페이지
└── styles/                   # 스타일
```

## 라이선스

MIT License
