export const GRID_SIZE = 5;
export const CELL_SIZE = 70;
export const BOARD_PADDING = 20;

export const RANKS = {
    NORMAL: { name: '일반', color: '#94a3b8', prob: 0.65, power: 15, sell: 20 },
    RARE: { name: '희귀', color: '#38bdf8', prob: 0.25, power: 35, sell: 40 },
    EPIC: { name: '영웅', color: '#a855f7', prob: 0.08, power: 85, sell: 100 },
    LEGEND: { name: '전설', color: '#fbbf24', prob: 0.015, power: 220, sell: 250 },
    MYTHIC: { name: '신화', color: '#f43f5e', prob: 0.005, power: 650, sell: 1000 }
};

export const UNIT_TYPES = [
    { id: 'MG', name: '머신건', icon: '⚡' },
    { id: 'RL', name: '레이저', icon: '📡' },
    { id: 'CN', name: '캐논포', icon: '🔥' },
    { id: 'CR', name: '냉각탄', icon: '❄️' }
];
