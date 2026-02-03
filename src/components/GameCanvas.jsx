import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/engine';

export default function GameCanvas({ onEngineInit }) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            engineRef.current = new GameEngine(canvasRef.current, {
                onStateUpdate: () => { },
                onGameOver: () => { }
            });

            if (onEngineInit) {
                onEngineInit(engineRef.current);
            }
        }

        return () => {
            if (engineRef.current) {
                engineRef.current.stopLoop();
            }
        };
    }, []);

    const handleClick = (e) => {
        if (!engineRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        // Handle both MouseEvent and Touch-like objects
        const clientX = e.clientX;
        const clientY = e.clientY;

        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        engineRef.current.handleClick(x, y);
    };

    return (
        <div data-id="game-canvas-container" className="relative w-full h-full">
            <div data-id="game-canvas-scanline" className="absolute w-full h-[2px] bg-red-500/10 pointer-events-none z-10 animate-[scanline_4s_linear_infinite]"
                style={{ animationName: 'scanline' }}>
            </div>
            {/* Embedded styles for animation if needed, though index.css handles it */}
            <canvas
                data-id="game-canvas"
                ref={canvasRef}
                onMouseDown={handleClick}
                onTouchStart={(e) => {
                    // Basic touch support: prevent scroll if desired (optional) and Map touch to click
                    //e.preventDefault(); 
                    const touch = e.touches[0];
                    handleClick({ clientX: touch.clientX, clientY: touch.clientY });
                }}
                className="bg-slate-900 w-full h-auto touch-none block"
            />
        </div>
    );
}
