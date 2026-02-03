import React from 'react';

export default function GameControls({ engine, state }) {
    if (!engine) return null;

    return (
        <div data-id="game-controls-container" className="w-full bg-slate-900 border-x-2 border-b-2 border-slate-700 rounded-b-xl p-3 flex flex-col gap-2 shadow-lg relative z-10 font-tech animate-in fade-in slide-in-from-top-2">

            {/* Main Actions Row */}
            <div data-id="game-controls-main-actions" className="grid grid-cols-2 gap-2">
                <button
                    data-id="game-controls-summon-btn"
                    onClick={() => engine.summonUnit(50)}
                    className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 border border-slate-600 hover:border-sky-500 p-2 px-3 rounded transition-all active:scale-[0.98] group"
                >
                    <div data-id="game-controls-summon-info" className="flex flex-col items-start">
                        <span data-id="game-controls-summon-label" className="text-[10px] font-bold text-white group-hover:text-sky-400">포탑 설치</span>
                        <span data-id="game-controls-summon-desc" className="text-[9px] text-slate-500">기본 유닛 배치</span>
                    </div>
                    <span data-id="game-controls-summon-cost" className="text-xs font-bold text-yellow-500">50 G</span>
                </button>

                <button
                    data-id="game-controls-random-btn"
                    onClick={() => engine.summonUnit(300, true)}
                    className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 border border-red-900/50 hover:border-red-500 p-2 px-3 rounded transition-all active:scale-[0.98] group"
                >
                    <div data-id="game-controls-random-info" className="flex flex-col items-start">
                        <span data-id="game-controls-random-label" className="text-[10px] font-bold text-white group-hover:text-red-400">랜덤 뽑기</span>
                        <span data-id="game-controls-random-desc" className="text-[9px] text-red-900/60 group-hover:text-red-900">고위험 고수익</span>
                    </div>
                    <span data-id="game-controls-random-cost" className="text-xs font-bold text-yellow-500">300 G</span>
                </button>
            </div>

            {/* Secondary Actions Row */}
            <div data-id="game-controls-secondary-actions" className="grid grid-cols-2 gap-2">
                <button
                    data-id="game-controls-upgrade-btn"
                    onClick={() => engine.handleUpgrade()}
                    className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-700 hover:border-sky-500 p-2 rounded transition-all active:scale-[0.98]"
                >
                    <span data-id="game-controls-upgrade-icon" className="text-lg">⚡</span>
                    <div data-id="game-controls-upgrade-info" className="flex flex-col items-start leading-none">
                        <span data-id="game-controls-upgrade-label" className="text-[10px] font-bold text-slate-300">화력 강화</span>
                        <span data-id="game-controls-upgrade-cost" className="text-[9px] text-red-500 font-mono">LV.{state.upgradeLevel} • 150 해골</span>
                    </div>
                </button>

                <button
                    data-id="game-controls-sell-btn"
                    onClick={() => engine.sellUnit()}
                    disabled={!state.selectedUnit}
                    className={`flex items-center justify-center gap-2 border p-2 rounded transition-all active:scale-[0.98]
                        ${state.selectedUnit
                            ? 'bg-red-950/50 border-red-500 hover:bg-red-900/50 cursor-pointer'
                            : 'bg-slate-950 border-slate-800 opacity-50 cursor-not-allowed'}`}
                >
                    <span data-id="game-controls-sell-icon" className="text-lg">♻️</span>
                    <div data-id="game-controls-sell-info" className="flex flex-col items-start leading-none">
                        <span data-id="game-controls-sell-label" className="text-[10px] font-bold text-slate-300">탱크 철거</span>
                        <span data-id="game-controls-sell-cost" className="text-[9px] text-slate-500">
                            {state.selectedUnit ? `반 환: ${Math.floor(state.selectedUnit.rank.sell / 2)} G` : '유닛 선택 필요'}
                        </span>
                    </div>
                </button>
            </div>

            {/* Status Footer */}
            <div data-id="game-controls-status" className="flex justify-between items-center bg-black/40 px-2 py-1 rounded text-[9px] font-mono text-slate-500">
                <span data-id="game-controls-status-label">시스템 상태: 정상</span>
                <span data-id="game-controls-unit-count">가동 유닛: <span className={state.units.length >= 15 ? "text-red-500 font-bold" : "text-sky-500"}>{state.units.length}/15</span></span>
            </div>
        </div>
    );
}
