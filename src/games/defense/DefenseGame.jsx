import React, { useState, useCallback } from 'react';
import GameCanvas from '../../components/GameCanvas';
import StartScreen from '../../components/StartScreen';
import HUD from '../../components/HUD';
import ShopPanel from '../../components/ShopPanel';
import GameControls from '../../components/GameControls';
import GameOver from '../../components/GameOver';
import GameInfo from '../../components/GameInfo';
import { AudioMgr } from '../../game/audio';

function DefenseGame() {
    const [engine, setEngine] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleStart = (name, difficulty) => {
        if (engine) {
            engine.reset(difficulty, name);
            AudioMgr.resume();
        }
    };

    const onStateUpdate = (newState) => {
        requestAnimationFrame(() => setGameState(newState));
    };

    return (
        <div data-id="defense-container" className="flex flex-col lg:flex-row gap-6 items-center justify-center min-h-screen p-2 md:p-4 overflow-x-hidden bg-[#0f172a]">

            {showInfo && <GameInfo onClose={() => setShowInfo(false)} />}

            {/* Side Panel (Shop) */}
            {gameState?.isStarted && (
                <div data-id="defense-shop-overlay" className={`
              fixed inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center transition-all duration-300
              lg:static lg:bg-transparent lg:p-0 lg:w-auto lg:h-auto lg:block
              ${isShopOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto hidden lg:flex'}
          `}>
                    {/* Close Button for Mobile */}
                    <button
                        data-id="defense-shop-close-btn"
                        onClick={() => setIsShopOpen(false)}
                        className="lg:hidden absolute top-4 right-4 text-white text-2xl font-bold p-2 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>

                    <ShopPanel engine={engine} state={gameState} />
                </div>
            )}

            {/* Main Game Console Frame */}
            <div data-id="defense-game-frame" className="flex flex-col items-center relative w-full max-w-[500px]">

                {/* HUD (Top) */}
                {gameState?.isStarted && (
                    <HUD
                        state={gameState}
                        onShopClick={() => setIsShopOpen(true)}
                        onInfoClick={() => setShowInfo(true)}
                    />
                )}

                {/* Screen Container (Middle) */}
                <div data-id="defense-screen" className={`relative w-full aspect-square md:aspect-auto bg-black border-x-2 border-slate-700 ${!gameState?.isStarted ? 'rounded-xl border-y-2' : ''}`}>
                    <GameCanvas
                        onEngineInit={(eng) => {
                            eng.callbacks = {
                                onStateUpdate: (s) => setGameState({ ...s }),
                                onGameOver: (s) => setGameState({ ...s })
                            };
                            setEngine(eng);
                            setGameState({ ...eng.state });
                        }}
                    />

                    {/* Start Screen Overlay */}
                    {(!gameState || !gameState.isStarted) && (
                        <StartScreen onStart={handleStart} />
                    )}

                    {/* Game Over Overlay */}
                    {gameState?.isGameOver && (
                        <GameOver state={gameState} />
                    )}
                </div>

                {/* Controls (Bottom) */}
                {gameState?.isStarted && (
                    <GameControls engine={engine} state={gameState} />
                )}

            </div>
        </div>
    );
}

export default DefenseGame;
