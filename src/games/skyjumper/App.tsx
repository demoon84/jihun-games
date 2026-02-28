import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Monitor, Smartphone, Tablet, ShieldAlert, Zap, Lock, Terminal, Unlock, Sliders, Gift, X, Star, Shield, Minimize2, Gauge, Sparkles, Settings2, User, Medal, Gem, PlaneTakeoff, Power, PlusCircle, Trash2, ArrowUp, AlertTriangle, CheckCircle2, ChevronRight, Map, CheckCircle, Circle, Globe, Heart, Landmark, Cpu, Rocket } from 'lucide-react';

// --- 게임 기본 물리 설정 ---
const GRAVITY = 0.55;         
const JUMP_STRENGTH = -8.5;   
const OBSTACLE_WIDTH = 70;    
const INITIAL_GAP = 250;      
const MIN_GAP = 130;          
const GAP_DECREASE_RATE = 4;  
const PLANE_X = 70;
const PLANE_SIZE = 48; 

const SCREEN_SIZES = [
  { id: 'mobile', icon: <Smartphone size={16}/>, name: '세로형', w: 400, h: 650 },
  { id: 'tablet', icon: <Tablet size={16}/>, name: '정방형', w: 600, h: 600 },
  { id: 'pc', icon: <Monitor size={16}/>, name: '가로형', w: 800, h: 500 },
];

const COLORS = [
  { id: '0', name: '크림슨 레드', fill: 'text-rose-500', bg: 'bg-rose-500' },
  { id: '1', name: '코발트 블루', fill: 'text-blue-500', bg: 'bg-blue-500' },
  { id: '2', name: '네온 그린', fill: 'text-emerald-500', bg: 'bg-emerald-500' },
  { id: '3', name: '임페리얼 골드', fill: 'text-amber-400', bg: 'bg-amber-400' },
  { id: '4', name: '갤럭시 퍼플', fill: 'text-violet-500', bg: 'bg-violet-500' },
  { id: '5', name: '스노우 화이트', fill: 'text-slate-100', bg: 'bg-slate-100' },
  { id: 'cyber', name: '사이버 네온', fill: 'text-cyan-400', bg: 'bg-gradient-to-br from-cyan-400 to-fuchsia-500' },
];

const SECRET_BUFFS = [
  { id: 'none', name: '지급 안 함 (회수)' },
  { id: 'inf_boost', name: '무한 부스터 (30초)' },
  { id: 'auto_7s', name: '오토파일럿 (7초)' },
  { id: 'slow_mo', name: '슬로우 모션 (속도 저하)' },
  { id: 'mini_plane', name: '초소형 기체 (크기 축소)' },
];

const ITEM_TYPES = [
  { id: 'score', name: '스타 코인', icon: <Star size={20} className="text-yellow-400 fill-yellow-400" />, color: 'bg-yellow-500/30 border-yellow-400', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.6)]', effectText: '보너스 +3점!' },
  { id: 'shield', name: '블루 쉴드', icon: <Shield size={20} className="text-sky-400 fill-sky-400" />, color: 'bg-sky-500/30 border-sky-400', shadow: 'shadow-[0_0_15px_rgba(56,189,248,0.6)]', effectText: '방어막 전개!' },
  { id: 'shrink', name: '마이크로 캡슐', icon: <Minimize2 size={20} className="text-fuchsia-400" strokeWidth={3} />, color: 'bg-fuchsia-500/30 border-fuchsia-400', shadow: 'shadow-[0_0_15px_rgba(232,121,249,0.6)]', effectText: '기체 소형화! (5초)' },
  { id: 'cyber_stone', name: '사이버 스톤', icon: <Gem size={20} className="text-cyan-300 fill-fuchsia-500 animate-pulse" />, color: 'bg-cyan-500/30 border-fuchsia-400', shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.8)]', effectText: '사이버 스톤 획득!' }
];

const HISTORICAL_FIGURES = [
  { name: '세종대왕', emoji: '👑', bg: 'bg-amber-600' },
  { name: '이순신', emoji: '⚔️', bg: 'bg-slate-700' },
  { name: '아인슈타인', emoji: '🧠', bg: 'bg-blue-700' },
  { name: '링컨', emoji: '🎩', bg: 'bg-zinc-800' },
  { name: '퀴리부인', emoji: '🧪', bg: 'bg-emerald-700' },
  { name: '다빈치', emoji: '🎨', bg: 'bg-orange-700' }
];

const WORLD_THEMES = {
  normal: {
    id: 'normal', name: '일반 세계', icon: <Globe size={16}/>,
    bg: 'bg-gradient-to-b from-indigo-950 via-purple-900 to-sky-900',
    bgAuto: 'bg-gradient-to-b from-amber-950 via-red-900 to-indigo-950',
    pipe: 'bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800',
    pipeCap: 'bg-slate-800 border-slate-950',
    glow: 'bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.8)]',
    text: 'text-sky-400'
  },
  candy: {
    id: 'candy', name: '사탕 세계', icon: <Heart size={16}/>,
    bg: 'bg-gradient-to-b from-pink-950 via-rose-900 to-red-950',
    bgAuto: 'bg-gradient-to-b from-yellow-900 via-orange-500 to-red-900',
    pipe: 'bg-gradient-to-r from-pink-600 via-pink-400 to-pink-700',
    pipeCap: 'bg-rose-900 border-rose-950',
    glow: 'bg-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.8)]',
    text: 'text-pink-400'
  },
  history: {
    id: 'history', name: '역사 세계', icon: <Landmark size={16}/>,
    bg: 'bg-gradient-to-b from-amber-950 via-orange-950 to-yellow-950',
    bgAuto: 'bg-gradient-to-b from-red-950 via-rose-900 to-amber-900',
    pipe: 'bg-gradient-to-r from-yellow-800 via-amber-600 to-yellow-900',
    pipeCap: 'bg-amber-950 border-orange-950',
    glow: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    text: 'text-amber-400'
  },
  cyber: {
    id: 'cyber', name: '사이버 세계', icon: <Cpu size={16}/>,
    bg: 'bg-gradient-to-b from-slate-950 via-fuchsia-950 to-cyan-950',
    bgAuto: 'bg-gradient-to-b from-slate-950 via-rose-950 to-orange-950',
    pipe: 'bg-gradient-to-r from-slate-800 via-slate-600 to-slate-900',
    pipeCap: 'bg-slate-900 border-black',
    glow: 'bg-fuchsia-500/80 shadow-[0_0_15px_rgba(217,70,239,0.8)]',
    text: 'text-cyan-400'
  }
};

const FighterIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <rect x="4" y="43" width="12" height="14" fill="#334155" rx="2" />
    <rect x="2" y="45" width="6" height="10" fill="#0f172a" rx="1" />
    <path d="M 30 50 L 15 20 L 55 35 Z" fill="currentColor" />
    <path d="M 30 50 L 15 20 L 55 35 Z" fill="black" opacity="0.4" />
    <path d="M 12 50 C 12 38, 40 38, 92 50 C 40 62, 12 62, 12 50 Z" fill="currentColor" />
    <path d="M 12 50 C 12 38, 40 38, 92 50 C 40 62, 12 62, 12 50 Z" fill="black" opacity="0.15" />
    <path d="M 30 50 L 15 80 L 55 65 Z" fill="currentColor" />
    <path d="M 30 50 L 15 80 L 55 65 Z" fill="white" opacity="0.15" />
    <path d="M 45 50 C 45 42, 65 42, 75 50 C 65 54, 45 54, 45 50 Z" fill="#0ea5e9" />
    <path d="M 50 48 C 58 45, 65 45, 70 48 Z" fill="white" opacity="0.6" /> 
  </svg>
);
const DroneIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <line x1="20" y1="20" x2="80" y2="80" stroke="black" strokeWidth="8" opacity="0.3" strokeLinecap="round" />
    <circle cx="50" cy="50" r="22" fill="currentColor" />
    <circle cx="50" cy="50" r="22" fill="black" opacity="0.2" />
    <circle cx="50" cy="50" r="14" fill="#1e293b" />
    <circle cx="50" cy="50" r="6" fill="#ef4444" className="animate-pulse" />
    <circle cx="48" cy="48" r="2" fill="white" opacity="0.8" />
    <g className="animate-[spin_0.2s_linear_infinite]" style={{ transformOrigin: '20px 20px' }}>
      <ellipse cx="20" cy="20" rx="18" ry="4" fill="#94a3b8" opacity="0.8" />
      <ellipse cx="20" cy="20" rx="4" ry="18" fill="#94a3b8" opacity="0.8" />
    </g>
    <g className="animate-[spin_0.2s_linear_infinite]" style={{ transformOrigin: '80px 20px' }}>
      <ellipse cx="80" cy="20" rx="18" ry="4" fill="#94a3b8" opacity="0.8" />
      <ellipse cx="80" cy="20" rx="4" ry="18" fill="#94a3b8" opacity="0.8" />
    </g>
    <g className="animate-[spin_0.2s_linear_infinite]" style={{ transformOrigin: '20px 80px' }}>
      <ellipse cx="20" cy="80" rx="18" ry="4" fill="#94a3b8" opacity="0.8" />
      <ellipse cx="20" cy="80" rx="4" ry="18" fill="#94a3b8" opacity="0.8" />
    </g>
    <g className="animate-[spin_0.2s_linear_infinite]" style={{ transformOrigin: '80px 80px' }}>
      <ellipse cx="80" cy="80" rx="18" ry="4" fill="#94a3b8" opacity="0.8" />
      <ellipse cx="80" cy="80" rx="4" ry="18" fill="#94a3b8" opacity="0.8" />
    </g>
  </svg>
);
const UfoIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <path d="M 25 50 C 25 15, 75 15, 75 50 Z" fill="#22d3ee" opacity="0.6" />
    <path d="M 35 45 C 40 25, 60 25, 65 45 Z" fill="white" opacity="0.4" />
    <ellipse cx="50" cy="40" rx="6" ry="8" fill="#16a34a" opacity="0.8" />
    <ellipse cx="48" cy="38" rx="2" ry="1" fill="black" transform="rotate(-30 48 38)" />
    <ellipse cx="52" cy="38" rx="2" ry="1" fill="black" transform="rotate(30 52 38)" />
    <ellipse cx="50" cy="50" rx="45" ry="16" fill="currentColor" />
    <ellipse cx="50" cy="53" rx="45" ry="16" fill="black" opacity="0.3" /> 
    <ellipse cx="50" cy="47" rx="35" ry="10" fill="white" opacity="0.2" /> 
    <g className="animate-[spin_3s_linear_infinite]" style={{ transformOrigin: '50px 50px' }}>
      <circle cx="15" cy="50" r="4" fill="#fbbf24" />
      <circle cx="85" cy="50" r="4" fill="#fbbf24" />
      <circle cx="50" cy="15" r="4" fill="#fbbf24" />
      <circle cx="50" cy="85" r="4" fill="#fbbf24" />
    </g>
    <ellipse cx="50" cy="62" rx="15" ry="5" fill="#38bdf8" opacity="0.8" />
  </svg>
);
const HeliIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <rect x="5" y="46" width="40" height="8" fill="currentColor" />
    <rect x="5" y="46" width="40" height="8" fill="black" opacity="0.3" />
    <path d="M 5 35 L 15 35 L 10 50 Z" fill="currentColor" />
    <ellipse cx="8" cy="40" rx="2" ry="14" fill="#cbd5e1" opacity="0.8" className="animate-pulse" />
    <ellipse cx="60" cy="50" rx="28" ry="18" fill="currentColor" />
    <ellipse cx="60" cy="50" rx="28" ry="18" fill="black" opacity="0.2" />
    <path d="M 65 35 C 85 35, 88 45, 88 50 L 65 50 Z" fill="#0ea5e9" />
    <path d="M 70 38 C 80 38, 83 45, 83 48 Z" fill="white" opacity="0.5" />
    <path d="M 45 66 L 50 78 L 85 78 L 80 66" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinejoin="round" />
    <rect x="55" y="24" width="6" height="12" fill="#475569" />
    <ellipse cx="58" cy="24" rx="42" ry="3" fill="#cbd5e1" opacity="0.8" className="animate-[ping_0.1s_linear_infinite]" />
  </svg>
);
const ApacheIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <path d="M 10 50 L 40 50 L 40 60 L 10 55 Z" fill="currentColor" />
    <path d="M 10 50 L 40 50 L 40 60 L 10 55 Z" fill="black" opacity="0.2" />
    <path d="M 5 35 L 15 35 L 12 55 L 5 55 Z" fill="currentColor" />
    <circle cx="10" cy="45" r="4" fill="#334155" />
    <g className="animate-[spin_0.1s_linear_infinite]" style={{ transformOrigin: '10px 45px' }}>
       <rect x="2" y="43" width="16" height="4" fill="#cbd5e1" opacity="0.8" />
       <rect x="8" y="37" width="4" height="16" fill="#cbd5e1" opacity="0.8" />
    </g>
    <path d="M 35 50 C 35 35, 75 35, 90 50 C 95 60, 75 65, 35 60 Z" fill="currentColor" />
    <path d="M 35 50 C 35 35, 75 35, 90 50 C 95 60, 75 65, 35 60 Z" fill="black" opacity="0.3" />
    <path d="M 50 48 C 50 38, 65 38, 70 48 Z" fill="#0ea5e9" opacity="0.8" />
    <path d="M 68 48 C 68 42, 80 42, 82 48 Z" fill="#0ea5e9" opacity="0.8" />
    <path d="M 50 48 C 50 38, 65 38, 70 48 Z" fill="white" opacity="0.4" />
    <path d="M 50 55 L 70 55 L 65 65 L 45 65 Z" fill="#475569" />
    <path d="M 50 55 L 70 55 L 65 65 L 45 65 Z" fill="black" opacity="0.4" />
    <rect x="48" y="58" width="18" height="4" fill="#1e293b" rx="2" />
    <circle cx="66" cy="60" r="2" fill="#ef4444" />
    <rect x="46" y="62" width="18" height="4" fill="#1e293b" rx="2" />
    <circle cx="64" cy="64" r="2" fill="#ef4444" />
    <path d="M 80 60 L 85 60 L 85 68 L 95 68 L 95 70 L 82 70 Z" fill="#1e293b" />
    <rect x="52" y="25" width="6" height="15" fill="#475569" />
    <ellipse cx="55" cy="25" rx="45" ry="3" fill="#cbd5e1" opacity="0.8" className="animate-[ping_0.1s_linear_infinite]" />
  </svg>
);
const BlackEaglesIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-[0_10px_20px_rgba(251,191,36,0.3)]`} overflow="visible">
    <defs>
      <linearGradient id="beBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="beGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <rect x="2" y="40" width="18" height="20" fill="#334155" rx="3" />
    <rect x="0" y="44" width="8" height="12" fill="#000" rx="1" />
    <path d="M 25 50 L 50 15 L 75 25 L 60 50 Z" fill="url(#beBody)" />
    <path d="M 32 48 L 52 20 L 68 28 L 55 48 Z" fill="url(#beGold)" />
    <path d="M 10 50 C 10 38, 45 35, 96 50 C 45 65, 10 62, 10 50 Z" fill="url(#beBody)" />
    <path d="M 25 50 L 50 85 L 75 75 L 60 50 Z" fill="url(#beBody)" />
    <path d="M 25 50 L 50 85 L 75 75 L 60 50 Z" fill="white" opacity="0.1" />
    <path d="M 32 52 L 52 80 L 68 72 L 55 52 Z" fill="url(#beGold)" />
    <path d="M 15 50 C 15 45, 50 42, 85 50 C 50 58, 15 55, 15 50 Z" fill="none" stroke="url(#beGold)" strokeWidth="2.5" />
    <path d="M 50 50 C 50 40, 65 38, 82 50 Z" fill="#38bdf8" opacity="0.9" />
    <path d="M 55 48 C 65 43, 70 43, 78 48 Z" fill="white" opacity="0.5" />
    <path d="M 12 50 L 25 25 L 40 25 L 35 50 Z" fill="url(#beBody)" />
    <path d="M 20 48 L 28 28 L 36 28 L 32 48 Z" fill="url(#beGold)" />
  </svg>
);

const StaraxBomberIcon = ({ size, className }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={`${className} drop-shadow-xl`} overflow="visible">
    <rect x="15" y="38" width="70" height="28" fill="currentColor" rx="6" />
    <rect x="15" y="38" width="70" height="28" fill="black" opacity="0.2" rx="6" />
    <rect x="68" y="42" width="14" height="12" fill="#0ea5e9" rx="2" />
    <rect x="48" y="42" width="16" height="12" fill="#0ea5e9" rx="1" />
    <rect x="24" y="42" width="16" height="12" fill="#0ea5e9" rx="1" />
    <rect x="15" y="58" width="70" height="4" fill="black" opacity="0.1" />
    <circle cx="30" cy="66" r="6" fill="#1e293b" />
    <circle cx="70" cy="66" r="6" fill="#1e293b" />
    <circle cx="30" cy="66" r="3" fill="#94a3b8" />
    <circle cx="70" cy="66" r="3" fill="#94a3b8" />
    <path d="M 45 40 L 15 25 L 15 55 L 45 42 Z" fill="currentColor" />
    <path d="M 45 40 L 15 25 L 15 55 L 45 42 Z" fill="black" opacity="0.3" />
    <path d="M 15 38 L 2 30 L 2 46 L 15 46 Z" fill="currentColor" />
    <rect x="35" y="65" width="30" height="8" fill="#334155" rx="2" />
    <circle cx="40" cy="73" r="3" fill="#ef4444" className="animate-pulse" />
    <circle cx="50" cy="73" r="3" fill="#ef4444" className="animate-pulse" />
    <circle cx="60" cy="73" r="3" fill="#ef4444" className="animate-pulse" />
  </svg>
);

const VEHICLES = [
  { id: 'fighter', name: '전투기', Icon: FighterIcon, unlockScore: 0 },
  { id: 'drone', name: '드론', Icon: DroneIcon, unlockScore: 0 },
  { id: 'ufo', name: 'UFO', Icon: UfoIcon, unlockScore: 0 },
  { id: 'heli', name: '헬기', Icon: HeliIcon, unlockScore: 0 },
  { id: 'apache', name: '아파치', Icon: ApacheIcon, unlockScore: 20 }, 
  { id: 'black_eagles', name: '블랙이글스', Icon: BlackEaglesIcon, isSpecial: true, unlockScore: 300 }, 
  { id: 'starax_bomber', name: '스타랙스 폭격기', Icon: StaraxBomberIcon, unlockScore: 1500 }, 
];

const INITIAL_LEADERBOARD = [
  { id: 'user1', name: 'ACE_PILOT', score: 250, vehicle: 'black_eagles' },
  { id: 'user2', name: 'Maverick', score: 180, vehicle: 'apache' },
  { id: 'user3', name: 'AlienBoy', score: 120, vehicle: 'ufo' },
  { id: 'user4', name: 'Chopper', score: 85, vehicle: 'heli' },
  { id: 'user5', name: 'Noob', score: 40, vehicle: 'drone' },
];

const QUEST_STAGES = [
  { stage: 1, score: 30, items: 3, plays: 3 },
  { stage: 2, score: 50, items: 6, plays: 6 },
  { stage: 3, score: 80, items: 10, plays: 10 },
];

export default function App() {
  const [gameState, setGameState] = useState('intro'); 
  const [scoreState, setScoreState] = useState(0); 
  const [bestScore, setBestScore] = useState(0); 
  const [isShaking, setIsShaking] = useState(false); 
  
  const [playerName, setPlayerName] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
  
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [playCount, setPlayCount] = useState(0);      
  const [totalItems, setTotalItems] = useState(0);    
  const [currentWorld, setCurrentWorld] = useState('normal'); 
  const [unlockedWorlds, setUnlockedWorlds] = useState(['normal']);

  const itemsCollectedThisRun = useRef(0);

  const [sysModal, setSysModal] = useState({ show: false, message: '', isConfirm: false, onConfirm: null });

  const showAlert = useCallback((message) => {
    setSysModal({ show: true, message, isConfirm: false, onConfirm: null });
  }, []);
  const showConfirm = useCallback((message, onConfirm) => {
    setSysModal({ show: true, message, isConfirm: true, onConfirm });
  }, []);
  const closeSysModal = useCallback(() => {
    setSysModal({ show: false, message: '', isConfirm: false, onConfirm: null });
  }, []);

  const [selectedVehicle, setSelectedVehicle] = useState('fighter');
  const [selectedColor, setSelectedColor] = useState('3'); 
  const [gameSize, setGameSize] = useState(SCREEN_SIZES[0]); 
  const [scale, setScale] = useState(1); 

  const [boostersCount, setBoostersCount] = useState(0);
  const [missilesCount, setMissilesCount] = useState(0);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [autoPilotTimeLeft, setAutoPilotTimeLeft] = useState(0);
  
  const activeMissiles = useRef([]);

  const [cyberStones, setCyberStones] = useState(0);
  const [unlockedCyberVehicles, setUnlockedCyberVehicles] = useState([]); 
  const cyberStonesRef = useRef(0);
  const unlockedCyberRef = useRef([]);

  const [adminName, setAdminName] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [adminUnlockAll, setAdminUnlockAll] = useState(false); 
  const [adminBuff, setAdminBuff] = useState('none'); 
  const [adminCustomGap, setAdminCustomGap] = useState(0); 
  const [adminSpeed, setAdminSpeed] = useState(4.5); 
  const [adminJumpStrength, setAdminJumpStrength] = useState(8.5); 
  
  const [itemRates, setItemRates] = useState({ score: 0.0, shield: 0.0, shrink: 0.0, cyber_stone: 0.0 });
  const [giftedPlayers, setGiftedPlayers] = useState({});
  const [giftTarget, setGiftTarget] = useState('');
  const [giftBuff, setGiftBuff] = useState('inf_boost');
  const [currentRunBuff, setCurrentRunBuff] = useState('none');
  const [deleteTarget, setDeleteTarget] = useState('');

  const boosterConfigRef = useRef({ duration: 30000, theme: 'bg-gradient-to-br from-amber-400 to-amber-600', name: '부스터' });

  const planeY = useRef(0); 
  const planeXRef = useRef(PLANE_X); 
  const velocity = useRef(0);
  const obstacles = useRef([]);
  const items = useRef([]); 
  const frameCount = useRef(0);
  const generatedPipes = useRef(0); 
  const reqRef = useRef(null);
  const boosterEndTime = useRef(0);
  
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0); 
  const setScore = (val) => {
    const newScore = typeof val === 'function' ? val(scoreRef.current) : val;
    scoreRef.current = newScore;
    setScoreState(newScore);
  };

  const hasShield = useRef(false);
  const shrinkEndTime = useRef(0);
  const invincibleEndTime = useRef(0); 
  const eventMsgRef = useRef({ text: '', color: '', expiry: 0 });
  
  const takeoffPhase = useRef(0); 
  const graceEndTime = useRef(0); 
  const goMessageShown = useRef(false);

  const [, setTick] = useState(0); 

  const isShrunkByItem = Date.now() < shrinkEndTime.current;
  const basePlaneSize = currentRunBuff === 'mini_plane' ? PLANE_SIZE * 0.5 : PLANE_SIZE;
  const currentPlaneSize = isShrunkByItem ? basePlaneSize * 0.6 : basePlaneSize;
  const currentSpeed = currentRunBuff === 'slow_mo' ? adminSpeed * 0.6 : adminSpeed;
  const hitboxPadding = currentPlaneSize < 30 ? 4 : 8;

  const effectiveBuff = giftedPlayers[playerName] && giftedPlayers[playerName] !== 'none' ? giftedPlayers[playerName] : adminBuff;

  useEffect(() => {
    const handleResize = () => {
      const padding = 100; 
      const availableW = window.innerWidth - padding;
      const availableH = window.innerHeight - padding;
      const scaleW = availableW / (gameSize.w + 320); 
      const scaleH = availableH / gameSize.h;
      setScale(Math.min(scaleW, scaleH, 1.0)); 
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameSize]);

  useEffect(() => {
    if (selectedColor === 'cyber' && !unlockedCyberVehicles.includes(selectedVehicle) && !adminUnlockAll) {
      setSelectedColor('3');
    }
  }, [selectedVehicle, selectedColor, unlockedCyberVehicles, adminUnlockAll]);

  const currentStageIndex = Math.min(unlockedWorlds.length - 1, 2); 
  const currentQuest = QUEST_STAGES[currentStageIndex];

  useEffect(() => {
    if (unlockedWorlds.length >= 4) return; 
    const q1 = bestScore >= currentQuest.score;
    const q2 = totalItems >= currentQuest.items;
    const q3 = playCount >= currentQuest.plays;
    if (q1 && q2 && q3) {
      setUnlockedWorlds(prev => {
         if (prev.length > currentStageIndex + 1) return prev;
         const lockedWorlds = ['candy', 'history', 'cyber'].filter(w => !prev.includes(w));
         if (lockedWorlds.length > 0) {
           const randomWorld = lockedWorlds[Math.floor(Math.random() * lockedWorlds.length)];
           const worldName = WORLD_THEMES[randomWorld].name;
           setTimeout(() => {
             showAlert(`🎉 [${currentQuest.stage}단계 퀘스트 올클리어!]\n무작위로 [${worldName}] 맵이 오픈되었습니다!`);
           }, 800);
           return [...prev, randomWorld];
         }
         return prev;
      });
    }
  }, [bestScore, totalItems, playCount, currentQuest, unlockedWorlds.length, showAlert]);

  const handleAdminLogin = (e) => {
    if (e) e.preventDefault();
    if (adminName === '문지훈' && adminPwd === '0801') {
      setIsAdmin(true);
      setAdminName('');
      setAdminPwd('');
    } else {
      showAlert("정보가 일치하지 않습니다.");
    }
  };

  const handleGiveGift = () => {
    if (!giftTarget) return showAlert("대상을 선택해주세요.");
    const targetUser = leaderboard.find(l => l.id.toString() === giftTarget.toString());
    if(!targetUser) return;
    setGiftedPlayers(prev => ({ ...prev, [targetUser.name]: giftBuff }));
    showAlert(giftBuff === 'none' ? `[${targetUser.name}]님의 선물을 회수했습니다.` : `[${targetUser.name}]님에게 선물이 배송되었습니다!`);
  };

  const handleDeleteRanking = (targetId) => {
    const idToUse = (typeof targetId === 'string' || typeof targetId === 'number') ? targetId : deleteTarget;
    if (!idToUse) return showAlert("삭제할 대상을 선택해주세요.");
    const targetUser = leaderboard.find(l => l.id.toString() === idToUse.toString());
    if(!targetUser) return;
    showConfirm(`정말로 [${targetUser.name}]님의 기록을 삭제하시겠습니까?`, () => {
      setLeaderboard(prev => prev.filter(user => user.id.toString() !== idToUse.toString()));
      showAlert(`[${targetUser.name}]님의 기록이 완전히 삭제되었습니다.`);
      setDeleteTarget('');
    });
  };

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    if (!playerName || !playerName.trim()) {
      showAlert("닉네임을 입력해주세요!");
      return;
    }
    setIsGuestMode(false);
    setGameState('start'); 
  };

  const handleGuestLogin = () => {
    setPlayerName('');
    setIsGuestMode(true);
    setGameState('start');
  };

  const startGame = useCallback(() => {
    isGameOverRef.current = false; 
    planeY.current = gameSize.h - currentPlaneSize - 20; 
    planeXRef.current = -60; 
    velocity.current = 0;
    obstacles.current = [];
    items.current = [];
    activeMissiles.current = []; 
    frameCount.current = 0;
    generatedPipes.current = 0; 
    hasShield.current = false;
    shrinkEndTime.current = 0;
    invincibleEndTime.current = Date.now() + 5000; 
    graceEndTime.current = 0;
    goMessageShown.current = false;
    itemsCollectedThisRun.current = 0; 
    eventMsgRef.current = { text: 'AUTO TAKEOFF', color: 'text-2xl text-amber-400', expiry: Date.now() + 2000 };
    takeoffPhase.current = 1; 
    setScore(0);
    setIsShaking(false);
    setCurrentRunBuff(effectiveBuff);
    let bCount = 0;
    let mCount = 0; 
    let bConfig = { duration: 30000, theme: 'from-amber-400 to-amber-600 border-amber-200', name: '부스터' };
    if (effectiveBuff === 'inf_boost' || effectiveBuff === 'auto_7s') {
      bCount = 999;
      bConfig.duration = effectiveBuff === 'auto_7s' ? 7000 : 30000;
      bConfig.theme = 'from-rose-500 to-rose-700 border-rose-300';
      bConfig.name = '관리자 부스터';
    } else {
      if (selectedVehicle === 'black_eagles') {
        bCount = selectedColor === 'cyber' ? 4 : 3; 
        bConfig.duration = 30000;
        bConfig.name = '독수리 부스터';
      } else if (selectedVehicle === 'starax_bomber') {
        bCount = 0;
        mCount = 5;
        bConfig.duration = 100000;
        bConfig.theme = 'from-cyan-500 to-blue-700 border-cyan-300';
        bConfig.name = '폭격 시스템';
      } else if (selectedVehicle === 'apache') {
        mCount = 2;
      } else if (selectedColor === 'cyber') {
        bCount = 1; 
        bConfig.duration = 15000;
        bConfig.theme = 'from-cyan-400 to-fuchsia-500 border-cyan-200';
        bConfig.name = '사이버 부스터';
      }
    }
    setBoostersCount(bCount);
    setMissilesCount(mCount);
    boosterConfigRef.current = bConfig;
    
    const isStarax = selectedVehicle === 'starax_bomber' && effectiveBuff === 'none';
    if (isStarax) {
      setIsAutoPilot(true);
      boosterEndTime.current = Date.now() + 100000; 
      setAutoPilotTimeLeft(100);
      eventMsgRef.current = { text: '폭격 시스템 가동! (100초)', color: 'text-2xl text-cyan-400 font-black', expiry: Date.now() + 3000 };
    } else {
      setIsAutoPilot(false);
      setAutoPilotTimeLeft(0);
    }
    setGameState('takeoff'); 
  }, [gameSize, selectedVehicle, selectedColor, effectiveBuff, currentPlaneSize]);

  const triggerGameOver = () => {
    if (isGameOverRef.current) return; 
    isGameOverRef.current = true;
    if (!isGuestMode) {
      setLeaderboard(prev => {
        if (scoreRef.current > 0) {
          const finalName = playerName.trim() !== '' ? playerName.trim() : 'GUEST';
          const existingIdx = prev.findIndex(p => p.name === finalName);
          let newList = [...prev];
          if (existingIdx >= 0) {
            if (scoreRef.current > newList[existingIdx].score) { newList[existingIdx].score = scoreRef.current; newList[existingIdx].vehicle = selectedVehicle; }
          } else newList.push({ id: `user_${Date.now()}`, name: finalName, score: scoreRef.current, vehicle: selectedVehicle });
          return newList.sort((a, b) => b.score - a.score).slice(0, 10);
        }
        return prev;
      });
    }
    setPlayCount(p => p + 1);
    setTotalItems(p => p + itemsCollectedThisRun.current);
    setGameState('gameover');
    setBestScore(prev => Math.max(prev, scoreRef.current));
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500); 
  };

  const jump = useCallback(() => {
    if (sysModal.show || showQuestModal || showAdminModal || showRankingModal) return;
    if (gameState === 'playing' && !isAutoPilot && Date.now() > graceEndTime.current) {
      velocity.current = -adminJumpStrength; 
    }
  }, [gameState, isAutoPilot, adminJumpStrength, sysModal.show, showQuestModal, showAdminModal, showRankingModal]);

  const activateBooster = useCallback(() => {
    if (gameState === 'playing' && boostersCount > 0 && !isAutoPilot && Date.now() > graceEndTime.current) {
      setBoostersCount(prev => prev - 1);
      setIsAutoPilot(true);
      boosterEndTime.current = Date.now() + boosterConfigRef.current.duration; 
    }
  }, [gameState, boostersCount, isAutoPilot]);

  const fireMissile = useCallback(() => {
    if (gameState === 'playing' && missilesCount > 0 && Date.now() > graceEndTime.current) {
      setMissilesCount(prev => prev - 1);
      activeMissiles.current.push({
        id: Date.now() + Math.random(),
        x: planeXRef.current + currentPlaneSize,
        y: planeY.current + currentPlaneSize / 2 - 6
      });
    }
  }, [gameState, missilesCount, currentPlaneSize]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAdminModal || showRankingModal || sysModal.show || showQuestModal) return;
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'intro') setGameState('login'); 
        else if (gameState === 'playing') jump();
        else if (gameState === 'start' || gameState === 'gameover') startGame();
      }
      if (e.code === 'KeyB') activateBooster();
      if (e.code === 'KeyM') fireMissile(); 
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, startGame, activateBooster, fireMissile, showAdminModal, showRankingModal, sysModal.show, showQuestModal]);

  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      if (gameState === 'takeoff') {
        if (takeoffPhase.current === 1) {
          planeXRef.current += 4.5;
          if (planeXRef.current >= PLANE_X) { planeXRef.current = PLANE_X; takeoffPhase.current = 2; }
        } 
        else if (takeoffPhase.current === 2) {
          velocity.current = -5.5; 
          planeY.current += velocity.current;
          if (planeY.current <= gameSize.h / 2) {
            setGameState('playing');
            velocity.current = 0; 
            graceEndTime.current = now + 3000;
            invincibleEndTime.current = now + 3000; 
            goMessageShown.current = false;
            eventMsgRef.current = { text: '안전 고도 도달!', color: 'text-2xl text-emerald-400', expiry: now + 1500 };
          }
        }
        setTick(t => t + 1);
        reqRef.current = requestAnimationFrame(loop);
        return;
      }
      if (gameState === 'playing') {
        const isGracePeriod = now < graceEndTime.current;
        if (isGracePeriod) {
            velocity.current = 0; 
            planeY.current = gameSize.h / 2 + Math.sin(now / 200) * 5; 
            frameCount.current = 0; 
        } else {
            if (!goMessageShown.current) {
                goMessageShown.current = true;
                eventMsgRef.current = { text: 'GO!', color: 'text-6xl text-rose-500 animate-bounce', expiry: now + 1500 };
                velocity.current = -4; 
                frameCount.current = 1; 
            }
            frameCount.current += 1;
            velocity.current += GRAVITY;
            planeY.current += velocity.current;
            if (planeY.current < 0) { planeY.current = 0; velocity.current = 0; }
        }
        if (boosterEndTime.current > now && !isGracePeriod) {
          const nextObs = obstacles.current.find(obs => !obs.destroyed && obs.x + OBSTACLE_WIDTH > PLANE_X - 20);
          let targetY = gameSize.h / 2;
          if (nextObs) targetY = nextObs.holeTop + (nextObs.gap / 2); 
          if (planeY.current > targetY + 15 && velocity.current >= -1) velocity.current = -adminJumpStrength * 0.85; 
          setAutoPilotTimeLeft(Math.ceil((boosterEndTime.current - now) / 1000));
        } else if (isAutoPilot) setIsAutoPilot(false); 
        if (planeY.current + currentPlaneSize > gameSize.h) {
          if (now < boosterEndTime.current || hasShield.current || now < invincibleEndTime.current) {
            velocity.current = -adminJumpStrength; 
            if (hasShield.current && now >= boosterEndTime.current) {
              hasShield.current = false;
              invincibleEndTime.current = now + 1500;
              eventMsgRef.current = { text: '방어막 파괴!', color: 'text-2xl text-red-400', expiry: now + 2000 };
            }
          } else if (!isGracePeriod) triggerGameOver();
        }
        for (let i = activeMissiles.current.length - 1; i >= 0; i--) {
          let m = activeMissiles.current[i];
          m.x += 18; 
          let hit = false;
          for (let j = 0; j < obstacles.current.length; j++) {
              let obs = obstacles.current[j];
              if (!obs.destroyed && m.x + 20 > obs.x && m.x < obs.x + OBSTACLE_WIDTH) {
                  obs.destroyed = true; hit = true;
                  eventMsgRef.current = { text: '💥 기둥 파괴!', color: 'text-3xl text-rose-500 font-black', expiry: now + 1000 };
                  if (!obs.passed) { obs.passed = true; setScore(s => s + 1); }
                  break;
              }
          }
          if (hit || m.x > gameSize.w) activeMissiles.current.splice(i, 1);
        }
        for (let i = items.current.length - 1; i >= 0; i--) {
          let item = items.current[i];
          if (!isGracePeriod) item.x -= currentSpeed;
          if (!item.collected) {
            const iSize = 34;
            if (PLANE_X + currentPlaneSize > item.x && PLANE_X < item.x + iSize && 
                planeY.current + currentPlaneSize > item.y && planeY.current < item.y + iSize) {
              item.collected = true; itemsCollectedThisRun.current += 1;
              eventMsgRef.current = { text: item.type.effectText, color: 'text-2xl text-white', expiry: now + 2000 };
              if (item.type.id === 'score') setScore(s => s + 3);
              if (item.type.id === 'shield') hasShield.current = true;
              if (item.type.id === 'shrink') shrinkEndTime.current = now + 5000;
              if (item.type.id === 'cyber_stone') {
                cyberStonesRef.current += 1;
                if (cyberStonesRef.current >= 3) {
                  cyberStonesRef.current = 0;
                  const locked = VEHICLES.map(v => v.id).filter(id => !unlockedCyberRef.current.includes(id));
                  if (locked.length > 0) {
                    const rid = locked[Math.floor(Math.random() * locked.length)];
                    unlockedCyberRef.current.push(rid); setUnlockedCyberVehicles([...unlockedCyberRef.current]);
                    eventMsgRef.current = { text: `[${VEHICLES.find(v=>v.id===rid).name}] 스킨 해금!`, color: 'text-2xl text-cyan-400', expiry: now + 3000 };
                  } else setScore(s => s + 10);
                }
                setCyberStones(cyberStonesRef.current);
              }
            }
          }
          if (item.x < -50 || item.collected) items.current.splice(i, 1);
        }
        for (let i = 0; i < obstacles.current.length; i++) {
          let obs = obstacles.current[i];
          if (!isGracePeriod) obs.x -= currentSpeed; 
          if (!obs.passed && obs.x + OBSTACLE_WIDTH < PLANE_X) { 
            obs.passed = true; if (!obs.destroyed) setScore(s => s + 1); 
          }
          if (!obs.destroyed && now >= boosterEndTime.current && now >= invincibleEndTime.current) {
            const pLeft = PLANE_X + hitboxPadding; const pRight = PLANE_X + currentPlaneSize - hitboxPadding;
            const pTop = planeY.current + hitboxPadding + 4; const pBottom = planeY.current + currentPlaneSize - hitboxPadding;
            if (pRight > obs.x && pLeft < obs.x + OBSTACLE_WIDTH) {
              if (pTop < obs.holeTop || pBottom > obs.holeTop + obs.gap) {
                if (hasShield.current) {
                  hasShield.current = false; invincibleEndTime.current = now + 1500;
                  eventMsgRef.current = { text: '방어막 파괴!', color: 'text-2xl text-red-400', expiry: now + 2000 };
                  velocity.current = -adminJumpStrength * 0.5; 
                } else triggerGameOver();
              }
            }
          }
        }
        if (obstacles.current.length > 0 && obstacles.current[0].x + OBSTACLE_WIDTH < 0) obstacles.current.shift();
        if (!isGracePeriod) {
            const sf = Math.max(40, Math.floor(80 * (4.5 / currentSpeed))); 
            if (frameCount.current % sf === 0) {
              generatedPipes.current += 1;
              let cg = adminCustomGap > 0 ? adminCustomGap : Math.max(MIN_GAP, INITIAL_GAP - (generatedPipes.current * GAP_DECREASE_RATE));
              const isH = currentWorld === 'history';
              const mt = isH ? 110 : 80; const xt = gameSize.h - cg - mt;
              const hTop = Math.floor(Math.random() * (Math.max(mt, xt) - mt + 1)) + mt;
              const fig = isH ? HISTORICAL_FIGURES[Math.floor(Math.random() * HISTORICAL_FIGURES.length)] : null;
              obstacles.current.push({ id: frameCount.current, x: gameSize.w, holeTop: hTop, passed: false, gap: cg, figure: fig, destroyed: false });
              ITEM_TYPES.forEach((type) => {
                if (Math.random() < itemRates[type.id]) {
                  items.current.push({ id: frameCount.current + '_' + type.id, x: gameSize.w + 20, y: hTop + cg/2 - 17, type: type, collected: false });
                }
              });
            }
        }
        setTick(t => t + 1);
      }
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameState, gameSize, isAutoPilot, adminCustomGap, adminSpeed, adminJumpStrength, itemRates, currentPlaneSize, currentSpeed, currentWorld]);

  const planeRotation = (gameState === 'takeoff' && takeoffPhase.current === 2) ? -25 : (gameState === 'playing' && Date.now() < graceEndTime.current) ? 0 : Math.min(Math.max(velocity.current * 4, -20), 70);

  const renderVehicle = (size, extraClass = '', forceVehicle = null, forceColor = null) => {
    const vId = forceVehicle || selectedVehicle;
    const cId = forceColor || selectedColor;
    let colorClass = '';
    if (cId === 'cyber') colorClass = 'text-cyan-400 fill-fuchsia-900 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse';
    else colorClass = (vId === 'black_eagles' || vId === 'apache') ? 'text-slate-900' : COLORS.find(c=>c.id===cId).fill;
    const ActiveIcon = VEHICLES.find(v => v.id === vId)?.Icon || FighterIcon;
    return <ActiveIcon size={size} className={`${colorClass} ${extraClass} transition-all duration-300`} />;
  };

  const activeTheme = WORLD_THEMES[currentWorld] || WORLD_THEMES['normal'];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans text-slate-100 overflow-hidden">
      <style>{`
        @keyframes scrollBg { from { background-position: 0 0; } to { background-position: -1000px 0; } }
        @keyframes scrollRunway { from { background-position: 0 0; } to { background-position: -400px 0; } }
        @keyframes shake { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(5px, 5px) rotate(1deg); } 50% { transform: translate(-5px, -2px) rotate(-1deg); } 75% { transform: translate(-2px, 5px) rotate(0deg); } }
        @keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes itemFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.05); } }
        .animate-scroll-slow { animation: scrollBg 30s linear infinite; }
        .animate-scroll-fast { animation: scrollBg 15s linear infinite; }
        .animate-runway { animation: scrollRunway 0.3s linear infinite; }
        .apply-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .apply-flash { animation: flash 0.5s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-item { animation: itemFloat 2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>

      <div className="flex flex-row gap-6 items-start justify-center max-w-[1200px] w-full" style={{ transform: `scale(${scale})` }}>
        
        {/* --- 왼쪽: 게임 화면 --- */}
        <div className={`relative origin-top-left transition-transform duration-500 ease-out shrink-0 ${isShaking ? 'apply-shake' : ''}`} style={{ width: gameSize.w, height: gameSize.h }}>
          <div className={`absolute inset-0 rounded-[2rem] shadow-[0_0_50px_rgba(30,58,138,0.5)] border-[6px] border-slate-800 overflow-hidden transition-colors duration-1000 ${isAutoPilot ? activeTheme.bgAuto : activeTheme.bg}`}>
            
            {(gameState === 'playing' || gameState === 'takeoff') && !sysModal.show && !showAdminModal && !showRankingModal && !showQuestModal && (
              <div className="absolute inset-0 z-[25] cursor-pointer touch-none select-none" onPointerDown={(e) => { e.preventDefault(); if (gameState === 'playing') jump(); }} />
            )}

            <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjkwIiByPSIxIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNTAiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] animate-scroll-slow pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMCA1MCBRIDUwIDAgMTAwIDUwIFQgMjAwIDUwIFQgMzAwIDUwIFQgNDAwIDUwIEwgNDAwIDEwMCBMMCAxMDAgWiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] animate-scroll-fast pointer-events-none" style={{ backgroundSize: '400px 100%', backgroundPosition: 'bottom' }} />

            {gameState === 'intro' && (
              <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center backdrop-blur-[2px] z-[30] cursor-pointer animate-in fade-in duration-1000 select-none" onClick={() => setGameState('login')}>
                <div className="animate-float mb-8 relative pointer-events-none">
                  <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-[50px] animate-pulse"></div>
                  {renderVehicle(120, 'drop-shadow-[0_0_30px_rgba(56,189,248,0.8)]', 'fighter', '1')}
                </div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-200 to-sky-500 tracking-tighter drop-shadow-[0_0_20px_rgba(56,189,248,0.5)] mb-2">SKY JUMPER</h1>
                <p className="text-sky-400 font-bold tracking-[0.4em] uppercase text-sm mb-16">스카이 점퍼</p>
                <div className="flex flex-col items-center animate-pulse">
                  <div className="flex items-center gap-2 text-white/90 font-bold text-lg tracking-widest mb-3"><Power size={20} className="text-sky-400" /> 화면을 터치하여 접속</div>
                  <div className="w-16 h-1.5 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                </div>
              </div>
            )}

            {gameState === 'login' && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-md z-[50] p-4 animate-in zoom-in-95 duration-300">
                <div className="bg-slate-900 border border-sky-500/30 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(56,189,248,0.2)] flex flex-col items-center relative">
                  <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center border border-sky-500/50 text-sky-400 mb-4"><User size={32} /></div>
                  <h2 className="text-2xl font-black text-white mb-2">파일럿 등록</h2>
                  <p className="text-slate-400 text-xs text-center mb-6">스카이 점퍼에 오신 것을 환영합니다.</p>
                  <form onSubmit={handleLoginSubmit} className="w-full flex flex-col items-center">
                    <input type="text" value={playerName} onChange={(e)=>setPlayerName(e.target.value)} placeholder="닉네임 (최대 10자)" maxLength={10} className="w-full px-4 py-4 bg-black/50 border border-slate-700 rounded-xl text-white text-center text-lg font-bold focus:border-sky-500 outline-none mb-4" autoFocus />
                    <div className="flex gap-3 w-full">
                      <button type="button" onClick={handleGuestLogin} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer">저장 안하기</button>
                      <button type="submit" className="flex-[1.5] py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer">기록 저장하기 <ChevronRight size={18}/></button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {gameState === 'takeoff' && (
              <>
                <div className="absolute bottom-0 w-full h-8 bg-slate-800 border-t-4 border-slate-600 pointer-events-none">
                  <div className="w-full h-1 mt-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0Ij48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] animate-runway" />
                </div>
                <div className="absolute top-[20%] w-full flex flex-col items-center z-10 animate-pulse">
                  <div className="bg-amber-500/20 border border-amber-500/50 px-6 py-2 rounded-full backdrop-blur-md">
                    <span className="text-amber-400 font-black tracking-widest flex items-center gap-2"><PlaneTakeoff size={18} /> 자동 이륙 시스템 작동 중...</span>
                  </div>
                </div>
              </>
            )}

            {gameState === 'playing' && (
              <div className="absolute top-[10%] w-full flex flex-col items-center z-10 pointer-events-none">
                <span key={scoreState} className="text-[120px] font-black text-white/20 drop-shadow-2xl mb-4">{scoreState}</span>
                {isAutoPilot && (
                  <div className="bg-amber-500/20 border border-amber-500/50 backdrop-blur-md px-6 py-2 rounded-full animate-pulse flex items-center gap-2">
                    <ShieldAlert className="text-amber-400" size={20} />
                    <span className="text-amber-400 font-black text-xl tracking-widest">자동 비행 (무적) : {autoPilotTimeLeft}초</span>
                  </div>
                )}
              </div>
            )}

            {(gameState === 'playing' || gameState === 'takeoff') && Date.now() < eventMsgRef.current.expiry && (
              <div className="absolute top-[35%] w-full flex justify-center z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
                <span className={`font-black ${eventMsgRef.current.color} drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}>{eventMsgRef.current.text}</span>
              </div>
            )}

            {obstacles.current.map(obs => !obs.destroyed && (
              <React.Fragment key={obs.id}>
                <div className={`absolute shadow-2xl z-10 ${activeTheme.pipe} pointer-events-none flex flex-col justify-end pb-12`} style={{ left: obs.x, top: 0, width: OBSTACLE_WIDTH, height: obs.holeTop }}>
                  <div className={`absolute -left-[5%] bottom-0 w-[110%] h-8 border-y-2 rounded-md flex items-center justify-center ${activeTheme.pipeCap}`}>
                    <div className={`w-full h-1 ${isAutoPilot ? 'bg-amber-500' : activeTheme.glow}`} />
                  </div>
                  {currentWorld === 'history' && obs.figure && obs.holeTop > 80 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                      <div className={`w-14 h-16 ${obs.figure.bg} border-[3px] border-amber-400 rounded-md shadow-lg flex flex-col items-center justify-center relative`}>
                        <span className="text-2xl relative z-10">{obs.figure.emoji}</span>
                        <span className="text-[9px] font-black text-white relative z-10 mt-1">{obs.figure.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`absolute shadow-2xl z-10 ${activeTheme.pipe} pointer-events-none`} style={{ left: obs.x, top: obs.holeTop + obs.gap, width: OBSTACLE_WIDTH, height: gameSize.h - (obs.holeTop + obs.gap) }}>
                  <div className={`absolute -left-[5%] top-0 w-[110%] h-8 border-y-2 rounded-md flex items-center justify-center ${activeTheme.pipeCap}`}>
                    <div className={`w-full h-1 ${isAutoPilot ? 'bg-amber-500' : activeTheme.glow}`} />
                  </div>
                  {currentWorld === 'history' && obs.figure && (gameSize.h - (obs.holeTop + obs.gap)) > 80 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                      <div className={`w-14 h-16 ${obs.figure.bg} border-[3px] border-amber-400 rounded-md shadow-lg flex flex-col items-center justify-center relative`}>
                        <span className="text-2xl relative z-10">{obs.figure.emoji}</span>
                        <span className="text-[9px] font-black text-white relative z-10 mt-1">{obs.figure.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}

            {items.current.map((item, i) => (
              <div key={`${item.id}-${i}`} className={`absolute z-15 w-[34px] h-[34px] rounded-full flex items-center justify-center border-2 backdrop-blur-sm animate-item ${item.type.color} ${item.type.shadow} pointer-events-none`} style={{ left: item.x, top: item.y }}>{item.type.icon}</div>
            ))}

            {activeMissiles.current.map(m => (
              <div key={m.id} className="absolute z-[25] pointer-events-none flex items-center" style={{ left: m.x, top: m.y }}>
                 <div className="w-10 h-3 bg-gradient-to-r from-transparent via-orange-500 to-red-600 rounded-full animate-pulse shadow-[0_0_15px_red]" />
                 <div className="w-4 h-4 bg-white rounded-full -ml-2 shadow-[0_0_10px_white]" />
              </div>
            ))}

            {(gameState === 'playing' || gameState === 'takeoff' || gameState === 'gameover') && (
              <div className="absolute z-20 transition-transform duration-75 ease-linear flex items-center justify-center pointer-events-none" style={{ left: planeXRef.current, top: planeY.current, width: currentPlaneSize, height: currentPlaneSize, transform: `rotate(${planeRotation}deg)` }}>
                {renderVehicle(currentPlaneSize, 'relative z-10')}
                {isAutoPilot && <div className="absolute inset-[-15px] border-[3px] border-amber-400 rounded-full animate-[spin_3s_linear_infinite] border-dashed opacity-80 z-20" />}
                {hasShield.current && !isAutoPilot && <div className="absolute inset-[-15px] bg-sky-500/20 border-2 border-sky-400 rounded-full animate-pulse z-20" />}
              </div>
            )}

            {gameState === 'playing' && missilesCount > 0 && selectedVehicle === 'apache' && (
              <div className="absolute bottom-6 left-6 z-[30]">
                <button onClick={fireMissile} className="flex flex-col items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-700 rounded-full shadow-lg border-4 border-rose-300 hover:scale-110 active:scale-95 transition-all cursor-pointer select-none">
                  <Rocket size={28} className="text-white" fill="currentColor" />
                  <span className="text-white font-black text-[10px] mt-1">미사일({missilesCount})</span>
                </button>
              </div>
            )}

            {gameState === 'playing' && boostersCount > 0 && !isAutoPilot && (
              <div className="absolute bottom-6 right-6 z-[30]">
                <button onClick={activateBooster} className={`flex flex-col items-center justify-center w-20 h-20 bg-gradient-to-br ${boosterConfigRef.current.theme} rounded-full shadow-lg border-4 hover:scale-110 active:scale-95 transition-all cursor-pointer select-none`}>
                  <Zap size={28} className="text-white" fill="currentColor" />
                  <span className="text-white font-black text-xs mt-1">{boosterConfigRef.current.name}({boostersCount > 99 ? '∞' : boostersCount})</span>
                </button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-md z-[50] p-6 animate-in fade-in duration-300 select-none">
                <div className="bg-slate-900/90 p-8 rounded-[2.5rem] border border-white/10 w-full max-w-[320px] shadow-2xl relative">
                  <h2 className="text-3xl font-black text-white mb-6 text-center flex items-center justify-center gap-2"><RotateCcw className="text-rose-400" /> MISSION FAILED</h2>
                  <div className="space-y-4 mb-8">
                    <div className="bg-black/40 rounded-2xl p-4 flex justify-between items-center"><span className="text-sm font-bold text-slate-400">SCORE</span><span className="text-5xl font-black text-white">{scoreState}</span></div>
                    <div className="bg-black/40 rounded-2xl p-4 flex justify-between items-center"><span className="text-sm font-bold text-amber-400 flex items-center gap-1"><Trophy size={16} /> BEST</span><span className="text-2xl font-black text-amber-400">{bestScore}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGameState('start')} className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl cursor-pointer">메뉴</button>
                    <button onClick={startGame} className="flex-[2.5] flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black text-xl py-5 rounded-2xl shadow-lg cursor-pointer"><Play size={24} fill="currentColor" /> 다시하기</button>
                  </div>
                </div>
              </div>
            )}

            {gameState === 'start' && !showRankingModal && !showAdminModal && !showQuestModal && !sysModal.show && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center backdrop-blur-md z-[40] p-6 animate-in fade-in duration-300 select-none">
                <div className="absolute top-4 right-4 z-40">
                  <button onClick={() => setShowAdminModal(true)} className="p-3 text-slate-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-full border border-white/10 cursor-pointer"><Terminal size={20} /></button>
                </div>
                <div className="w-full max-w-[360px] space-y-4 mt-8">
                  <button onClick={() => setShowQuestModal(true)} className="w-full bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">{activeTheme.icon}<span className={`text-sm font-bold ${activeTheme.text}`}>{activeTheme.name}</span></div>
                    <span className="text-[10px] text-sky-400 font-bold uppercase bg-sky-500/20 px-2 py-1 rounded-md">월드 변경</span>
                  </button>
                  <div className="bg-black/50 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-2xl relative">
                    <div className="bg-slate-900/60 rounded-2xl p-3 border border-sky-500/30 flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center border border-sky-500/50 text-sky-400"><User size={20} /></div>
                        <div><p className="text-[10px] text-sky-300 font-bold uppercase">{isGuestMode ? '게스트' : '현재 파일럿'}</p><p className="text-base font-black text-white">{playerName || 'GUEST'}</p></div>
                      </div>
                      <button onClick={() => setGameState('login')} className="text-[10px] bg-sky-600 px-3 py-2 rounded-lg text-white font-bold cursor-pointer">설정</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {VEHICLES.map(v => {
                        const locked = v.unlockScore > 0 && bestScore < v.unlockScore && !adminUnlockAll;
                        const sel = selectedVehicle === v.id;
                        return (
                          <button key={v.id} onClick={() => { if(locked) showAlert(`${v.unlockScore}점 달성 시 해금!`); else setSelectedVehicle(v.id); }} className={`relative flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer ${locked ? 'opacity-40 grayscale' : sel ? 'bg-indigo-600 scale-110 z-10 shadow-lg' : 'bg-white/5 text-white/50'}`}>
                            {locked ? <Lock size={20} /> : <>{renderVehicle(32, '', v.id)}<span className="text-[9px] font-bold mt-1">{v.name}</span></>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-3"><p className="text-sky-200 font-bold text-[10px] uppercase">커스텀 도색</p></div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {COLORS.map(c => {
                          const cyberLocked = c.id === 'cyber' && !unlockedCyberVehicles.includes(selectedVehicle) && !adminUnlockAll;
                          return (
                            <button key={c.id} onClick={() => { if(cyberLocked) showAlert("사이버 스톤을 모아 해금하세요!"); else setSelectedColor(c.id); }} className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer ${c.bg} ${cyberLocked ? 'opacity-20' : selectedColor === c.id ? 'ring-2 ring-white ring-offset-2' : 'opacity-40'}`}>
                              {cyberLocked && <Lock size={12} className="text-slate-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={() => setShowRankingModal(true)} className="flex-1 flex flex-col items-center justify-center gap-1 bg-slate-800 text-amber-400 font-black text-xs py-3 rounded-2xl shadow-md cursor-pointer"><Trophy size={20} />랭킹</button>
                    <button onClick={() => setShowQuestModal(true)} className="flex-1.2 flex flex-col items-center justify-center gap-1 bg-slate-800 text-fuchsia-400 font-black text-xs py-3 rounded-2xl shadow-md cursor-pointer"><Globe size={20} />월드/퀘스트</button>
                    <button onClick={startGame} className="flex-2 flex items-center justify-center gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black text-xl py-3 rounded-2xl shadow-md cursor-pointer"><Play size={24} fill="currentColor" />출격</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- 오른쪽: 사이드 대시보드 --- */}
        <div className="w-[300px] flex flex-col gap-4 h-full pointer-events-none select-none">
          <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-[2rem] shadow-2xl backdrop-blur-md pointer-events-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-500/50 text-sky-400"><User size={28} /></div>
              <div><p className="text-[10px] text-sky-400 font-black uppercase">ELITE PILOT</p><p className="text-xl font-black text-white truncate max-w-[160px]">{playerName || '익명의 파일럿'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[9px] font-bold text-slate-500 mb-1">SCORE</p><p className="text-2xl font-black text-white">{scoreState}</p></div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[9px] font-bold text-amber-500 mb-1">BEST</p><p className="text-2xl font-black text-amber-400">{bestScore}</p></div>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-[2rem] shadow-2xl backdrop-blur-md pointer-events-auto">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><Cpu size={14} className="text-sky-400" /> Vehicle Status</h3>
            <div className="flex flex-col items-center py-4 bg-black/40 rounded-2xl border border-white/5 mb-4">
              <div className="animate-float">{renderVehicle(80)}</div>
              <p className="mt-4 font-black text-lg text-white">{VEHICLES.find(v => v.id === selectedVehicle)?.name}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400 font-bold">Boosters</span><span className="text-white font-black">{boostersCount > 99 ? '∞' : boostersCount}</span></div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-sky-500 h-full" style={{ width: boostersCount > 0 ? '100%' : '0%' }} /></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400 font-bold">Shield</span><span className={`font-black ${hasShield.current ? 'text-emerald-400' : 'text-slate-600'}`}>{hasShield.current ? 'ACTIVE' : 'OFFLINE'}</span></div>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-[2rem] shadow-2xl backdrop-blur-md pointer-events-auto flex-1">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><Globe size={14} className="text-fuchsia-400" /> Mission Area</h3>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 ${activeTheme.bg} border-white/10`}>
              <div className={`p-3 rounded-full bg-black/40 ${activeTheme.text}`}>{activeTheme.icon}</div>
              <p className={`font-black text-lg ${activeTheme.text}`}>{activeTheme.name}</p>
            </div>
            <button onClick={() => setShowQuestModal(true)} className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black text-slate-300 pointer-events-auto flex items-center justify-center gap-2">MISSION LOG <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {sysModal.show && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-[300px] shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">{sysModal.isConfirm ? <AlertTriangle size={36} className="text-amber-400" /> : <CheckCircle2 size={36} className="text-sky-400" />}</div>
              <h3 className="text-white font-bold text-lg leading-relaxed">{sysModal.message}</h3>
            </div>
            <div className="flex border-t border-slate-800">
              {sysModal.isConfirm && <button onClick={closeSysModal} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-800 cursor-pointer">취소</button>}
              <button onClick={() => { if (sysModal.onConfirm) sysModal.onConfirm(); closeSysModal(); }} className={`flex-1 py-4 font-black cursor-pointer ${sysModal.isConfirm ? 'text-rose-500' : 'text-sky-400'}`}>확인</button>
            </div>
          </div>
        </div>
      )}

      {showQuestModal && !sysModal.show && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md select-none">
          <div className="bg-slate-900 border border-fuchsia-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            <button onClick={() => setShowQuestModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 cursor-pointer"><X size={24} /></button>
            <div className="p-6 pb-4 border-b border-white/10"><h2 className="text-2xl font-black text-center text-fuchsia-200">월드 & 퀘스트</h2></div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.values(WORLD_THEMES).map(w => {
                  const unlocked = unlockedWorlds.includes(w.id);
                  return (
                    <button key={w.id} onClick={() => { if(unlocked) setCurrentWorld(w.id); else showAlert('퀘스트 달성 시 오픈!'); }} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${currentWorld === w.id ? `border-white/50 bg-white/10 ${w.text}` : unlocked ? 'border-transparent bg-slate-800/50' : 'opacity-50'}`}>
                      {unlocked ? w.icon : <Lock size={16}/>}<span className="text-xs font-bold">{unlocked ? w.name : '잠김'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                <h3 className="text-center text-xs font-bold text-slate-400 mb-4">{currentQuest.stage}단계 퀘스트</h3>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between mb-2"><span className="text-sm">1. {currentQuest.score}점 돌파</span>{bestScore >= currentQuest.score ? <CheckCircle className="text-fuchsia-400" size={18}/> : <Circle className="text-slate-500" size={18}/>}</div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden"><div className="bg-fuchsia-500 h-full" style={{ width: `${Math.min((bestScore/currentQuest.score)*100, 100)}%` }} /></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950"><button onClick={() => setShowQuestModal(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer">닫기</button></div>
          </div>
        </div>
      )}

      {showRankingModal && !sysModal.show && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
            <button onClick={() => setShowRankingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 cursor-pointer"><X size={24} /></button>
            <div className="p-6 pb-4 border-b border-white/10"><h2 className="text-2xl font-black text-center text-amber-200">명예의 전당</h2></div>
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-2">
              {leaderboard.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 text-slate-300">
                  <div className="flex items-center gap-3"><span className="w-6 text-center font-black">{i+1}</span><div className="w-10 h-10 flex items-center justify-center bg-black/30 rounded-lg">{renderVehicle(32, '', e.vehicle)}</div><span className="text-sm truncate max-w-[100px]">{e.name}</span></div>
                  <div className="flex items-center gap-3">
                    <div className="font-black text-lg">{e.score}</div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteRanking(e.id)} className="p-1 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer" title="기록 삭제">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-950"><button onClick={() => setShowRankingModal(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer">닫기</button></div>
          </div>
        </div>
      )}

      {showAdminModal && !sysModal.show && (
        <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowAdminModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 cursor-pointer"><X size={20} /></button>
            {!isAdmin ? (
              <div className="p-8 overflow-y-auto">
                <h2 className="text-xl font-bold text-center text-white mb-6">SKY JUMPER ADMIN</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input type="text" value={adminName} onChange={(e)=>setAdminName(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="관리자 이름" />
                  <input type="password" value={adminPwd} onChange={(e)=>setAdminPwd(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="비밀번호" />
                  <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer">접속</button>
                </form>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar pb-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800"><Terminal className="text-cyan-400" size={24} /><div><h2 className="text-lg font-bold text-white">관리자 설정</h2><p className="text-xs text-cyan-400">접속자: {adminName}</p></div></div>
                <div className="space-y-5">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-white">비행 속도</span><span className="text-xs font-mono text-emerald-400">{adminSpeed.toFixed(1)}x</span></div>
                    <input type="range" min="2" max="10" step="0.5" value={adminSpeed} onChange={(e)=>setAdminSpeed(parseFloat(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" />
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-white">점프 높이</span><span className="text-xs font-mono text-purple-400">{adminJumpStrength.toFixed(1)}</span></div>
                    <input type="range" min="4" max="15" step="0.5" value={adminJumpStrength} onChange={(e)=>setAdminJumpStrength(parseFloat(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700"><span className="text-sm font-bold text-white">모든 기체 해금</span><button onClick={()=>setAdminUnlockAll(!adminUnlockAll)} className={`w-12 h-6 rounded-full relative cursor-pointer ${adminUnlockAll ? 'bg-amber-500' : 'bg-slate-600'}`}><div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${adminUnlockAll ? 'translate-x-6' : ''}`} /></button></div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-white">기록 삭제</span></div>
                    <div className="flex gap-2">
                      <select value={deleteTarget} onChange={(e)=>setDeleteTarget(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-rose-500">
                        <option value="">대상 선택</option>
                        {leaderboard.map(l => <option key={l.id} value={l.id}>{l.name} ({l.score}점)</option>)}
                      </select>
                      <button onClick={() => handleDeleteRanking()} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"><Trash2 size={16}/> 삭제</button>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold text-white">선물 지급 (버프)</span></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select value={giftTarget} onChange={(e)=>setGiftTarget(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none">
                          <option value="">대상 선택</option>
                          {leaderboard.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select value={giftBuff} onChange={(e)=>setGiftBuff(e.target.value)} className="flex-[1.2] bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none">
                          {SECRET_BUFFS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <button onClick={handleGiveGift} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2"><Gift size={16}/> 지급/회수</button>
                    </div>
                  </div>
                </div>
                <button onClick={()=>setShowAdminModal(false)} className="w-full mt-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors cursor-pointer">닫기 및 적용</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
