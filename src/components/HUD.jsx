import React from 'react';
import { AudioMgr } from '../game/audio';

export default function HUD({ state, onShopClick, onInfoClick }) {
    const handleMute = () => {
        const isMuted = AudioMgr.toggleMute();
        document.getElementById('mute-btn-text').innerText = isMuted ? "🔇 OFF" : "🔊 ON";
    };

    return (
        <div data-id="hud-container" className="w-full bg-slate-900 border-x-2 border-t-2 border-slate-700 rounded-t-xl p-3 flex justify-between items-center shadow-lg relative z-10">
            {/* Left: Title & Currency */}
            <div data-id="hud-left" className="flex flex-col gap-1">
                <h1 data-id="hud-title" className="text-lg md:text-xl text-red-500 tracking-tighter uppercase font-black italic flex items-center gap-2">
                    <span data-id="hud-title-icon" className="text-2xl">⚡</span> 디펜스 <span data-id="hud-title-subtitle" className="text-[10px] text-slate-500 not-italic font-bold tracking-widest hidden md:inline-block">전술 시스템</span>
                </h1>
                <div data-id="hud-currency" className="flex gap-2">
                    <span data-id="hud-wave" className="bg-slate-950 px-2 py-1 border border-slate-700 rounded text-[10px] font-bold text-slate-400">
                        WAVE <span data-id="hud-wave-value" className="text-white text-xs ml-1">{Math.floor(state.wave)}</span>
                    </span>
                    <span data-id="hud-gold" className="bg-slate-950 px-2 py-1 border border-yellow-900/30 rounded text-[10px] font-bold text-yellow-500">
                        GOLD <span data-id="hud-gold-value" className="text-white text-xs ml-1">{Math.floor(state.gold).toLocaleString()}</span>
                    </span>
                </div>
            </div>

            {/* Right: Status & Config */}
            <div data-id="hud-right" className="text-right flex flex-col items-end gap-1">
                <div data-id="hud-buttons" className="flex items-center gap-1 mb-1">
                    <button
                        data-id="hud-home-btn"
                        onClick={() => window.location.href = '/'}
                        className="bg-slate-800 hover:bg-slate-700 w-6 h-6 rounded flex items-center justify-center text-[10px] border border-slate-600 text-slate-400 font-bold transition-colors"
                    >
                        🏠
                    </button>
                    <button
                        data-id="hud-info-btn"
                        onClick={onInfoClick}
                        className="bg-slate-800 hover:bg-slate-700 w-6 h-6 rounded flex items-center justify-center text-[10px] border border-sky-500/50 text-sky-500 font-bold transition-colors"
                    >
                        ℹ️
                    </button>
                    <button
                        data-id="hud-mute-btn"
                        onClick={handleMute}
                        className="bg-slate-800 hover:bg-slate-700 px-2 py-0.5 h-6 rounded text-[9px] border border-slate-600 font-bold text-slate-300 uppercase transition-colors"
                    >
                        <span id="mute-btn-text">🔊 ON</span>
                    </button>
                    <button
                        data-id="hud-shop-btn"
                        onClick={onShopClick}
                        className="lg:hidden bg-slate-800 hover:bg-slate-700 px-2 py-0.5 h-6 rounded text-[9px] border border-yellow-500/50 font-bold text-yellow-500 uppercase transition-colors"
                    >
                        🛒 상점
                    </button>
                </div>

                <div data-id="hud-stats" className="flex items-center gap-2">
                    <div data-id="hud-skulls" className="bg-slate-950 px-2 py-1 border border-red-900/30 rounded flex items-center gap-1">
                        <span data-id="hud-skulls-label" className="text-[10px] text-red-500 font-bold">SKULLS</span>
                        <span data-id="hud-skulls-value" className="text-red-400 font-black text-sm">{Math.floor(state.skulls).toLocaleString()}</span>
                    </div>
                    <div data-id="hud-hp" className="bg-slate-950 px-2 py-1 border border-slate-700 rounded flex items-center gap-1">
                        <span data-id="hud-hp-label" className="text-[10px] text-slate-500 font-bold">HP</span>
                        <span data-id="hud-hp-value" className={`font-black text-sm ${state.life <= 5 ? "text-red-500 animate-pulse" : "text-sky-400"}`}>{state.life}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
