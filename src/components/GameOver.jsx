import React, { useEffect } from 'react';
import { FirebaseMgr } from '../lib/firebase';

export default function GameOver({ state, onRestart }) {
    useEffect(() => {
        if (state.isGameOver) {
            FirebaseMgr.saveScore(state);
        }
    }, [state.isGameOver]);

    if (!state.isGameOver) return null;

    return (
        <div data-id="gameover-container" className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-lg z-50 text-center p-6 border-4 border-red-900 font-tech animate-in fade-in zoom-in duration-300">
            <h2 data-id="gameover-title" className="text-4xl font-black text-red-600 mb-2 italic uppercase tracking-widest">System Down</h2>
            <div data-id="gameover-stats" className="mb-6 text-center">
                <p data-id="gameover-wave" className="text-sm text-slate-400 font-bold uppercase mb-1">Last Wave: {Math.floor(state.wave)}</p>
                <p data-id="gameover-skulls" className="text-5xl text-red-500 font-black italic">💀 {Math.floor(state.skulls).toLocaleString()}</p>
            </div>
            <div data-id="gameover-actions" className="flex flex-col gap-3 w-full max-w-[220px]">
                <button
                    data-id="gameover-restart-btn"
                    onClick={() => window.location.reload()}
                    className="bg-red-700 hover:bg-red-600 text-white py-3 rounded font-black text-lg shadow-lg uppercase transition-all"
                >
                    다시하기
                </button>
            </div>
        </div>
    );
}
