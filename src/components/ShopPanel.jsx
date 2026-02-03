import React, { useState } from 'react';

export default function ShopPanel({ engine, state }) {
    const [coupon, setCoupon] = useState('');

    const handleBuy = (type) => {
        if (!engine) return;
        engine.buyItem(type);
    };

    const handleRedeem = () => {
        if (!coupon.trim()) return;
        // Basic Coupon Logic (Client-side for now, can be moved to Engine)
        const code = coupon.trim().toUpperCase();

        // This logic should ideally be in Engine to modify state safely
        // For now, we will assume Engine has a method or we'll add one.
        // Let's assume we added redeemCode to engine or we handle it here by modifying state directly (not ideal).
        // Best approach: Add `redeemCode` to GameEngine.

        if (engine.redeemCode) {
            if (engine.redeemCode(code)) {
                setCoupon('');
                alert("코드 승인!");
            } else {
                alert("유효하지 않거나 이미 사용된 코드입니다.");
            }
        } else {
            // Fallback if engine update missing
            console.warn("Engine doesn't support redeemCode yet");
        }
    };

    return (
        <div data-id="shop-container" className="flex flex-col w-full lg:w-56 gap-4 transition-all duration-500 self-stretch font-tech">
            <div data-id="shop-coupon-section" className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col gap-2 shadow-2xl">
                <h3 data-id="shop-coupon-title" className="text-[10px] text-sky-400 uppercase tracking-widest text-center font-bold">보안 프로토콜</h3>
                <div data-id="shop-coupon-form" className="flex flex-col gap-2">
                    <input
                        data-id="shop-coupon-input"
                        type="text"
                        placeholder="코드 입력..."
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="w-full text-xs p-2 rounded bg-black border border-slate-700 text-center focus:border-sky-500 outline-none text-white"
                    />
                    <button
                        data-id="shop-coupon-submit-btn"
                        onClick={handleRedeem}
                        className="w-full bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-bold py-2 rounded transition-all shadow-lg"
                    >
                        코드 승인
                    </button>
                </div>
            </div>

            <div data-id="shop-items-section" className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col flex-1 shadow-2xl overflow-y-auto max-h-[400px] custom-scrollbar">
                <h2 data-id="shop-items-title" className="text-base font-bold text-red-400 mb-4 text-center border-b border-slate-800 pb-2 uppercase tracking-tighter italic">병기창 상점</h2>
                <div data-id="shop-items-list" className="flex flex-col gap-3 text-xs">
                    <button data-id="shop-heal-btn" onClick={() => handleBuy('HEAL')} className="group flex flex-col items-center p-3 border-2 border-slate-800 rounded-lg bg-slate-800/30 hover:border-red-500 transition-all active:scale-95">
                        <span data-id="shop-heal-icon" className="text-2xl mb-1">🔧</span>
                        <span data-id="shop-heal-label" className="text-[10px] font-bold text-slate-300 text-center">장벽 복구 (+5)</span>
                        <span data-id="shop-heal-cost" className="text-sm font-bold text-red-400 mt-1">💀 150</span>
                    </button>
                    <button data-id="shop-interest-btn" onClick={() => handleBuy('INTEREST')} className="group flex flex-col items-center p-3 border-2 border-slate-800 rounded-lg bg-slate-800/30 hover:border-red-500 transition-all active:scale-95">
                        <span data-id="shop-interest-icon" className="text-2xl mb-1">🪙</span>
                        <span data-id="shop-interest-label" className="text-[10px] font-bold text-slate-300 text-center">보급 증폭 (LV.{state.interestLevel})</span>
                        <span data-id="shop-interest-cost" className="text-sm font-bold text-red-400 mt-1">💀 400</span>
                    </button>
                    <button data-id="shop-luck-btn" onClick={() => handleBuy('LUCK')} className={`group flex flex-col items-center p-3 border-2 border-slate-800 rounded-lg bg-slate-800/30 transition-all active:scale-95 ${state.luckBoost ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-500'}`} disabled={state.luckBoost}>
                        <span data-id="shop-luck-icon" className="text-2xl mb-1">🚀</span>
                        <span data-id="shop-luck-label" className="text-[10px] font-bold text-slate-300 text-center uppercase tracking-widest">출력 최적화</span>
                        <span data-id="shop-luck-cost" className="text-sm font-bold text-red-400 mt-1">💀 800</span>
                    </button>
                </div>

                {state.killCount >= 100 && (
                    <div data-id="shop-secret-code" className="mt-6 animate-bounce bg-red-900/40 border-2 border-yellow-500 rounded-lg p-3 text-center">
                        <p data-id="shop-secret-label" className="text-[9px] text-yellow-400 font-bold uppercase mb-1">최종 보병 섬멸 지원 코드</p>
                        <p data-id="shop-secret-value" className="text-sm font-black text-yellow-300">디펜스_100</p>
                    </div>
                )}
            </div>
        </div>
    );
}
