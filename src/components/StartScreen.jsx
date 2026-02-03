import React, { useState } from 'react';

export default function StartScreen({ onStart }) {
    const [name, setName] = useState(localStorage.getItem('defense_nickname') || '');

    const handleStart = () => {
        if (!name.trim()) return alert("코드명을 입력하십시오.");
        localStorage.setItem('defense_nickname', name);
        onStart(name, window.difficulty || 'NORMAL');
    };

    const setDifficulty = (diff) => {
        window.difficulty = diff;
        document.querySelectorAll('.diff-btn').forEach(b => {
            b.classList.remove('border-sky-500', 'text-sky-500', 'bg-slate-800');
            b.classList.add('border-slate-700', 'text-slate-500', 'bg-slate-900');
        });
        const btn = document.getElementById(`diff-${diff.toLowerCase()}-btn`);
        if (btn) {
            btn.classList.remove('border-slate-700', 'text-slate-500', 'bg-slate-900');
            btn.classList.add('border-sky-500', 'text-sky-500', 'bg-slate-800');
        }
    };

    return (
        <div data-id="start-container" className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-40 text-center shadow-2xl overflow-hidden">

            {/* 1. Logo / Title Section */}
            <div data-id="start-header" className="mb-6 fade-in mt-2">
                <h2 data-id="start-title" className="text-3xl text-red-600 mb-2 font-black italic uppercase tracking-tighter drop-shadow-lg">디펜스 기갑 탱크 시스템</h2>
                <p data-id="start-subtitle" className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">해골을 수집하여 지휘부의 탱크 사단을 강화하십시오</p>
            </div>

            <div data-id="start-form" className="w-full max-w-[340px] flex flex-col gap-3 mb-4">

                {/* 2. Code Name Input */}
                <div data-id="start-name-wrapper" className="relative group bg-slate-900 border-2 border-slate-700 rounded-xl p-1 flex items-center">
                    <input
                        data-id="start-name-input"
                        type="text"
                        id="name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={8}
                        placeholder="게임 코드명"
                        className="w-full bg-transparent border-none focus:ring-0 text-center font-bold text-lg text-white placeholder:text-slate-600 h-10"
                    />
                    {name && (
                        <button
                            data-id="start-name-clear-btn"
                            onClick={() => setName('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-900/30 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold px-3 py-1 rounded transition-all"
                        >
                            삭제
                        </button>
                    )}
                </div>

                {/* 3. Difficulty Buttons */}
                <div data-id="start-difficulty" className="grid grid-cols-3 gap-3 h-12">
                    <button
                        data-id="start-easy-btn"
                        id="diff-easy-btn"
                        onClick={() => setDifficulty('EASY')}
                        className="diff-btn border-2 border-slate-700 bg-slate-900 text-slate-500 rounded-xl font-bold transition-all hover:bg-slate-800 text-sm"
                    >
                        쉬움
                    </button>
                    <button
                        data-id="start-normal-btn"
                        id="diff-normal-btn"
                        onClick={() => setDifficulty('NORMAL')}
                        className="diff-btn border-2 border-sky-500 bg-slate-800 text-sky-500 rounded-xl font-bold transition-all hover:bg-slate-800 text-sm"
                    >
                        중간
                    </button>
                    <button
                        data-id="start-hard-btn"
                        id="diff-hard-btn"
                        onClick={() => setDifficulty('HARD')}
                        className="diff-btn border-2 border-slate-700 bg-slate-900 text-slate-500 rounded-xl font-bold transition-all hover:bg-slate-800 text-sm"
                    >
                        어려움
                    </button>
                </div>

                {/* 4. Start Button */}
                <button
                    data-id="start-play-btn"
                    onClick={handleStart}
                    className="w-full font-black italic bg-red-700 hover:bg-red-600 text-white text-xl py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] border-b-4 border-red-900 tracking-widest mt-1"
                >
                    전투 가동
                </button>
            </div>

            {/* 5. Ranking Box (Bottom) */}
            <div data-id="start-ranking" className="w-full max-w-[340px] bg-slate-900/50 rounded-xl p-3 min-h-[100px]">
                <h3 data-id="start-ranking-title" className="text-[10px] font-black text-red-500 mb-2 uppercase tracking-tighter flex items-center justify-center gap-2">
                    <span data-id="start-ranking-indicator" className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> 실시간 작전 보고 (TOP 5)
                </h3>
                <div data-id="start-ranking-content" className="flex flex-col justify-center items-center h-full">
                    <div data-id="start-ranking-loading" className="text-slate-600 text-[10px] italic">지휘부 통신망 연결 대기중...</div>
                </div>
            </div>
        </div>
    );
}
