import React from 'react';
import { RANKS } from '../game/constants';

export default function GameInfo({ onClose }) {
    const luckyRates = {
        MYTHIC: '0.5%',
        LEGEND: '1.5%',
        EPIC: '3.0%',
        RARE: '95.0%' // Approximation for UI based on logic: 100 - (0.5+1.5+3)
    };

    return (
        <div data-id="gameinfo-overlay" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div data-id="gameinfo-container" className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-sm w-full p-4 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button data-id="gameinfo-close-btn" onClick={onClose} className="absolute top-2 right-3 text-slate-500 hover:text-white font-bold text-xl">✕</button>

                <h2 data-id="gameinfo-title" className="text-lg font-black text-white italic uppercase mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                    <span data-id="gameinfo-title-icon" className="text-yellow-500">ℹ️</span> 작전 가이드
                </h2>

                <div data-id="gameinfo-content" className="space-y-4 font-tech text-xs">

                    {/* Gacha Rates */}
                    <div data-id="gameinfo-gacha-section">
                        <h3 data-id="gameinfo-gacha-title" className="font-bold text-sky-400 mb-2 uppercase">📊 소환 확률 (300G)</h3>
                        <div data-id="gameinfo-gacha-grid" className="grid grid-cols-2 gap-2">
                            {/* Standard Draw */}
                            <div data-id="gameinfo-standard-draw" className="bg-slate-950 p-2 rounded border border-slate-800">
                                <div data-id="gameinfo-standard-title" className="text-[10px] text-slate-500 font-bold mb-1 text-center">일반 소환 (기본)</div>
                                <div data-id="gameinfo-standard-normal" className="flex justify-between px-2 text-slate-300">
                                    <span>{RANKS.NORMAL.name}</span>
                                    <span className="font-mono">{RANKS.NORMAL.prob * 100}%</span>
                                </div>
                                <div data-id="gameinfo-standard-rare" className="flex justify-between px-2 text-sky-300">
                                    <span>{RANKS.RARE.name}</span>
                                    <span className="font-mono">{RANKS.RARE.prob * 100}%</span>
                                </div>
                                <div data-id="gameinfo-standard-epic" className="flex justify-between px-2 text-purple-300">
                                    <span>{RANKS.EPIC.name}</span>
                                    <span className="font-mono">{RANKS.EPIC.prob * 100}%</span>
                                </div>
                                <div data-id="gameinfo-standard-legend" className="flex justify-between px-2 text-yellow-300">
                                    <span>{RANKS.LEGEND.name}</span>
                                    <span className="font-mono">{RANKS.LEGEND.prob * 100}%</span>
                                </div>
                            </div>

                            {/* Lucky Draw */}
                            <div data-id="gameinfo-lucky-draw" className="bg-red-950/20 p-2 rounded border border-red-900/50">
                                <div data-id="gameinfo-lucky-title" className="text-[10px] text-red-400 font-bold mb-1 text-center">랜덤 뽑기 (300G)</div>
                                <div data-id="gameinfo-lucky-mythic" className="flex justify-between px-2 text-red-300">
                                    <span>{RANKS.MYTHIC.name}</span>
                                    <span className="font-mono">5%</span>
                                </div>
                                <div data-id="gameinfo-lucky-legend" className="flex justify-between px-2 text-yellow-300">
                                    <span>{RANKS.LEGEND.name}</span>
                                    <span className="font-mono">15%</span>
                                </div>
                                <div data-id="gameinfo-lucky-epic" className="flex justify-between px-2 text-purple-300">
                                    <span>{RANKS.EPIC.name}</span>
                                    <span className="font-mono">30%</span>
                                </div>
                                <div data-id="gameinfo-lucky-rare" className="flex justify-between px-2 text-sky-300">
                                    <span>{RANKS.RARE.name}</span>
                                    <span className="font-mono">50%</span>
                                </div>
                            </div>
                        </div>
                        <p data-id="gameinfo-luck-note" className="text-[9px] text-slate-500 mt-1 italic text-center">* 행운(Luck) 아이템 보유 시 확률 상승</p>
                    </div>

                    {/* Controls Guide */}
                    <div data-id="gameinfo-controls-section">
                        <h3 data-id="gameinfo-controls-title" className="font-bold text-sky-400 mb-2 uppercase">🎮 조작법</h3>
                        <ul data-id="gameinfo-controls-list" className="list-disc pl-4 space-y-1 text-slate-300">
                            <li data-id="gameinfo-control-merge"><span className="text-white font-bold">합성:</span> 같은 등급/종류 유닛 터치 → 녹색으로 빛나는 유닛 터치</li>
                            <li data-id="gameinfo-control-sell"><span className="text-white font-bold">판매:</span> 유닛 더블 터치 (빠른 판매)</li>
                            <li data-id="gameinfo-control-move"><span className="text-white font-bold">이동:</span> 유닛은 자동 공격합니다. 위치 선정 중요!</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
