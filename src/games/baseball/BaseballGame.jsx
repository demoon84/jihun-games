import React, { useEffect, useRef, useState } from 'react';

// Settings
const PITCHER_Y = 200;
const BATTER_Y = 650;
const STRIKE_ZONE_Y = 650;
const STRIKE_ZONE_RADIUS = 60;
const BALL_START_SIZE = 5;
const BALL_END_SIZE = 30;

export default function BaseballGame() {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    // UI State
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [outs, setOuts] = useState(0);
    const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
    const [message, setMessage] = useState({ text: '', color: '', visible: false });

    // Game Logic State (Mutable)
    const game = useRef({
        ball: null,
        swingActive: false,
        swingFrame: 0,
        isPlaying: false,
        width: 600,
        height: 800
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // --- Classes ---
        class Ball {
            constructor(w, h) {
                this.reset(w, h);
            }
            reset(w, h) {
                this.x = w / 2;
                this.y = PITCHER_Y;
                this.targetX = w / 2 + (Math.random() * 40 - 20);
                this.speed = 4 + Math.random() * 6;
                this.size = BALL_START_SIZE;
                this.active = true;
                this.hit = false;
                this.missed = false;
                this.opacity = 1;
            }
            update() {
                if (!this.active) return;
                const distToBatter = BATTER_Y - PITCHER_Y;
                const progress = (this.y - PITCHER_Y) / distToBatter;
                this.y += this.speed;
                this.x += (this.targetX - game.current.width / 2) * 0.02;
                this.size = Math.max(0.1, BALL_START_SIZE + (BALL_END_SIZE - BALL_START_SIZE) * progress);

                if (this.y > BATTER_Y + 100 && !this.hit && !this.missed) {
                    this.missed = true;
                    handleMiss();
                }
                if (this.y > game.current.height + 100 || this.y < -500) {
                    this.active = false;
                    if (game.current.isPlaying) setTimeout(() => spawnBall(), 1000);
                }
            }
            draw(ctx) {
                if (!this.active) return;
                const drawSize = Math.max(0.1, this.size);
                ctx.save();
                ctx.globalAlpha = this.opacity;
                // Shadow
                ctx.beginPath();
                ctx.ellipse(this.x, this.y + 10, drawSize, Math.max(0.1, drawSize / 2), 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fill();
                // Ball
                ctx.beginPath();
                ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Stitching
                if (drawSize > 2) {
                    ctx.beginPath();
                    ctx.arc(this.x - drawSize * 0.5, this.y, drawSize * 0.8, -0.5, 0.5);
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(this.x + drawSize * 0.5, this.y, drawSize * 0.8, Math.PI - 0.5, Math.PI + 0.5);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // --- Logic ---
        const spawnBall = () => {
            if (!game.current.isPlaying) return;
            game.current.ball = new Ball(game.current.width, game.current.height);
        };

        const handleMiss = () => {
            setOuts(o => {
                const newOuts = o + 1;
                if (newOuts >= 3) gameOver();
                return newOuts;
            });
            setCombo(0);
            showMessage("스트라이크!", "text-red-500");
        };

        const gameOver = () => {
            game.current.isPlaying = false;
            setGameState('GAMEOVER');
        };

        const drawField = () => {
            const w = game.current.width;
            const h = game.current.height;
            const cx = w / 2;

            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.moveTo(cx, 150);
            ctx.lineTo(cx + 250, 450);
            ctx.lineTo(cx, 750);
            ctx.lineTo(cx - 250, 450);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            const baseSize = 25;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(cx, 750);
            ctx.lineTo(cx - baseSize, 750 - baseSize);
            ctx.lineTo(cx - baseSize, 750 - baseSize * 2);
            ctx.lineTo(cx + baseSize, 750 - baseSize * 2);
            ctx.lineTo(cx + baseSize, 750 - baseSize);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, PITCHER_Y + 30, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#78350f';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, STRIKE_ZONE_Y, STRIKE_ZONE_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        };

        const drawCharacters = () => {
            const cx = game.current.width / 2;
            ctx.font = '60px serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚾', cx, PITCHER_Y);

            ctx.save();
            ctx.translate(cx, BATTER_Y + 50);
            if (game.current.swingActive) {
                const angle = (game.current.swingFrame / 10) * Math.PI - Math.PI / 4;
                ctx.rotate(angle);
                ctx.fillText('🏏', 40, -20);
            } else {
                ctx.fillText('👤', 0, 0);
            }
            ctx.restore();
        };

        const update = () => {
            if (game.current.ball) game.current.ball.update();
            if (game.current.swingActive) {
                game.current.swingFrame++;
                if (game.current.swingFrame > 15) game.current.swingActive = false;
            }
        };

        const draw = () => {
            // Resize handling basic
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                game.current.width = canvas.width;
                game.current.height = canvas.height;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Background
            const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.height);
            grad.addColorStop(0, '#4ade80');
            grad.addColorStop(1, '#166534');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawField();
            if (game.current.ball) game.current.ball.draw(ctx);
            drawCharacters();
        };

        const loop = () => {
            // Check Force Spawn
            if (game.current.forceSpawn) {
                game.current.forceSpawn = false;
                game.current.ball = new Ball(game.current.width, game.current.height);
            }

            update();
            draw();
            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // --- Interaction Handlers ---
    const showMessage = (text, colorClass) => {
        setMessage({ text, color: colorClass, visible: true });
        setTimeout(() => setMessage(m => ({ ...m, visible: false })), 800);
    };

    const handleSwing = () => {
        if (!game.current.isPlaying || game.current.swingActive) return;

        game.current.swingActive = true;
        game.current.swingFrame = 0;

        // CSS Shake effect on canvas container? handled via CSS classes usually, but here we might just skip or animate canvas

        const ball = game.current.ball;
        if (ball && !ball.hit && !ball.missed) {
            const dist = Math.abs(ball.y - STRIKE_ZONE_Y);
            const horizontalDist = Math.abs(ball.x - game.current.width / 2);

            if (dist < 40 && horizontalDist < 50) {
                ball.hit = true;

                let hitType = "";
                let points = 0;
                let color = "";
                let newCombo = combo + 1; // get latest combo value properly? 
                // Actually relying on React state inside Event Handler without ref is stale.
                setCombo(c => {
                    newCombo = c + 1;
                    return newCombo;
                });

                if (dist < 10) {
                    hitType = "홈런!!";
                    points = 1000 + (newCombo * 100); // Use approximate combo
                    color = "text-yellow-400";
                } else if (dist < 25) {
                    hitType = "안타!";
                    points = 500 + (newCombo * 50);
                    color = "text-green-400";
                } else {
                    hitType = "파울?";
                    points = 100;
                    color = "text-blue-300";
                }

                setScore(s => s + points);
                showMessage(hitType, color);

                ball.speed = -15;
                ball.targetX = (Math.random() - 0.5) * 1000;
            }
        }
    };

    const startGame = () => {
        setScore(0);
        setCombo(0);
        setOuts(0);
        setGameState('PLAYING');
        game.current.isPlaying = true;

        // Delay first ball
        setTimeout(() => {
            if (game.current.isPlaying) game.current.ball = null; // Clear old
            // Spawn logic inside Update loop or explicit here?
            // The loop spawns if active is false.
            // Force spawn
            game.current.ball = { active: false }; // Dummy to trigger spawn check? 
            // Actually `spawnBall` creates a ball.
            // Just set active=false on current ball if any, loop will respawn?
            // No, loop respawns if y > limits.
            // Manual spawn:
            game.current.ball = null;
            // Let's create one.
            // We need access to Ball class or spawn function. 
            // Refactor: We defined classes INSIDE useEffect, so we can't access them here.
            // Solution: Use a ref "command" system or move logic outside.
            // Quick fix: Set a flag in ref.
            game.current.forceSpawn = true;
        }, 100);
    };

    // Need to handle "Force Spawn" inside effect loop if classes are hidden
    // OR just move classes out (Better, like ZombieGame).
    // For now assuming we refactor classes out in next step for stability.

    // Quick handle inputs
    const handleInput = () => {
        handleSwing();
    };

    return (
        <div
            data-id="baseball-container"
            className="relative w-full h-screen bg-slate-900 overflow-hidden select-none touch-manipulation"
            onMouseDown={handleInput}
            onTouchStart={handleInput}
            onKeyDown={(e) => { if (e.code === 'Space') handleInput(); }}
            tabIndex="0"
        >
            <canvas data-id="baseball-canvas" ref={canvasRef} className="block w-full h-full" />

            {/* UI Overlay */}
            <div data-id="baseball-hud" className="absolute top-5 left-5 text-white font-bold drop-shadow-lg pointer-events-none">
                <div data-id="baseball-score" className="text-2xl">점수: {score}</div>
                <div data-id="baseball-combo" className="text-xl text-yellow-400">콤보: {combo}</div>
                <div data-id="baseball-outs" className="text-lg text-red-400">아웃: {outs} / 3</div>
            </div>

            {/* Home Button */}
            {gameState === 'PLAYING' && (
                <button
                    data-id="baseball-home-btn"
                    onClick={(e) => { e.stopPropagation(); window.location.href = '/'; }}
                    className="absolute bottom-5 right-5 bg-black/50 hover:bg-black/80 w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-white/20 transition-colors z-10"
                >
                    🏠
                </button>
            )}

            {/* Message Box */}
            <div data-id="baseball-message" className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-200 z-10 ${message.visible ? 'opacity-100' : 'opacity-0'}`}>
                <h2 data-id="baseball-message-text" className={`text-7xl font-black ${message.color} drop-shadow-[0_5px_5px_rgba(0,0,0,1)]`}>{message.text}</h2>
            </div>

            {/* Menus */}
            {gameState !== 'PLAYING' && (
                <div data-id="baseball-menu" className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                    <h1 data-id="baseball-title" className="text-6xl mb-8 font-black text-yellow-400 italic transform -skew-x-12">마구마구갓</h1>
                    {gameState === 'GAMEOVER' && (
                        <div data-id="baseball-gameover" className="text-center mb-8 animate-pulse">
                            <h2 data-id="baseball-gameover-title" className="text-4xl text-red-500 font-bold mb-2">GAME OVER</h2>
                            <p data-id="baseball-gameover-score" className="text-xl">최종 점수: {score}</p>
                        </div>
                    )}
                    <p data-id="baseball-instructions" className="text-xl mb-12 text-center px-8 opacity-80">공이 노란색 원 안에 들어왔을 때<br />화면을 클릭하여 배트를 휘두르세요!</p>

                    <div data-id="baseball-menu-buttons" className="flex gap-4">
                        <button
                            data-id="baseball-start-btn"
                            onClick={(e) => { e.stopPropagation(); startGame(); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-full text-2xl font-bold transition-transform active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                        >
                            {gameState === 'MENU' ? '게임 시작' : '다시 시작'}
                        </button>
                        <button
                            data-id="baseball-exit-btn"
                            onClick={(e) => { e.stopPropagation(); window.location.href = '/'; }}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-transform active:scale-95"
                        >
                            나가기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
