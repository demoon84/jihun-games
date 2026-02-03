import React, { useEffect, useRef, useState } from 'react';

// --- Game Classes ---
class Leader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.radius = 30;
        this.speed = 5;
    }
    update(state) {
        if (state.input.active) {
            const dx = state.input.x - this.x;
            const dy = state.input.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        this.x = Math.max(this.radius, Math.min(state.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(state.height - this.radius, this.y));
    }
    draw(ctx, state) {
        // Outer glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + 15);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main body (white circle)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Yellow triangle in center
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 12);
        ctx.lineTo(this.x - 10, this.y + 8);
        ctx.lineTo(this.x + 10, this.y + 8);
        ctx.closePath();
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        // HP bar (red, below leader)
        const hpWidth = 60;
        const hpHeight = 8;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(this.x - hpWidth / 2, this.y + this.radius + 10, hpWidth * (this.hp / this.maxHp), hpHeight);
    }
}

class Follower {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.radius = 18;
        this.attackCooldown = 0;
        this.angle = (index / 3) * Math.PI * 2;
    }
    update(state) {
        const targetAngle = this.angle + state.frameCount * 0.015;
        const orbitRadius = 70 + this.index * 25;
        const targetX = state.leader.x + Math.cos(targetAngle) * orbitRadius;
        const targetY = state.leader.y + Math.sin(targetAngle) * orbitRadius;

        this.x += (targetX - this.x) * state.stats.followerSpeed;
        this.y += (targetY - this.y) * state.stats.followerSpeed;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            const target = this.findTarget(state);
            if (target) {
                this.shoot(state, target);
                this.attackCooldown = Math.floor(60 / state.stats.attackSpeed);
            }
        }
    }
    findTarget(state) {
        let closest = null;
        let closestDist = state.stats.followerRange;
        for (const enemy of state.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }
    shoot(state, target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        state.projectiles.push(new Projectile(
            this.x, this.y,
            (dx / dist) * 8, (dy / dist) * 8,
            state.stats.followerAtk,
            state.stats.critChance,
            state.stats.knockback
        ));
    }
    draw(ctx) {
        // Blue body with glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + 5);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();

        // White eye
        ctx.beginPath();
        ctx.arc(this.x, this.y - 3, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

class Enemy {
    constructor(x, y, type, level) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = type === 'tank' ? 35 : (type === 'fast' ? 18 : 25);
        this.speed = type === 'fast' ? 2.5 : (type === 'tank' ? 1 : 1.5);
        this.hp = type === 'tank' ? 80 + level * 10 : (type === 'fast' ? 20 + level * 3 : 40 + level * 5);
        this.maxHp = this.hp;
        this.damage = type === 'tank' ? 15 : (type === 'fast' ? 5 : 10);
        this.attackCooldown = 0;
    }
    update(state, onGameOver) {
        const dx = state.leader.x - this.x;
        const dy = state.leader.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > state.leader.radius + this.radius) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        } else {
            if (this.attackCooldown <= 0) {
                state.leader.hp -= this.damage;
                this.attackCooldown = 60;
                if (state.leader.hp <= 0) {
                    onGameOver();
                }
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
    draw(ctx) {
        const color = this.type === 'tank' ? '#166534' : (this.type === 'fast' ? '#4ade80' : '#22c55e');

        // Main body (green circle)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Antennae
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        // Left antenna
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius * 0.4, this.y - this.radius * 0.6);
        ctx.lineTo(this.x - this.radius * 0.6, this.y - this.radius * 1.2);
        ctx.stroke();

        // Right antenna
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.4, this.y - this.radius * 0.6);
        ctx.lineTo(this.x + this.radius * 0.6, this.y - this.radius * 1.2);
        ctx.stroke();

        // Red antenna tips
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.6, this.y - this.radius * 1.2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + this.radius * 0.6, this.y - this.radius * 1.2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Eyes (red)
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + 6, this.y - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, vx, vy, damage, critChance, knockback) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.critChance = critChance;
        this.knockback = knockback;
        this.radius = 6;
        this.life = 120;
    }
    update(state, createParticles, killEnemy) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.radius + this.radius) {
                const isCrit = Math.random() < this.critChance;
                const dmg = isCrit ? this.damage * 2 : this.damage;
                enemy.hp -= dmg;

                const kbDist = this.knockback * 10;
                enemy.x += (dx / dist) * kbDist;
                enemy.y += (dy / dist) * kbDist;

                if (enemy.hp <= 0) {
                    killEnemy(i);
                }

                createParticles(this.x, this.y, isCrit ? '#fbbf24' : '#60a5fa', 5);
                this.life = 0;
                break;
            }
        }
    }
    draw(ctx) {
        // Blue projectile with glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + 3);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
    }
}

export default function ZombieGame() {
    const canvasRef = useRef(null);
    const loopRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);

    const [level, setLevel] = useState(1);
    const [exp, setExp] = useState(0);
    const [maxExp, setMaxExp] = useState(100);
    const [unitCount, setUnitCount] = useState(3);
    const [timeStr, setTimeStr] = useState("00:00");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [finalStats, setFinalStats] = useState("");
    const [upgradeOptions, setUpgradeOptions] = useState([]);

    const gameState = useRef({
        level: 1, exp: 0, maxExp: 100,
        leader: null, followers: [], enemies: [], projectiles: [], particles: [],
        input: { x: 0, y: 0, active: false },
        stats: { followerAtk: 12, followerRange: 180, followerSpeed: 0.06, attackSpeed: 1, critChance: 0.05, knockback: 0.5, spawnRate: 120, armorGlow: 0 },
        width: 0, height: 0, frameCount: 0, gameTime: 0,
        isPaused: false
    });

    const getTimeStr = (t) => {
        const m = Math.floor(t / 60), s = t % 60;
        return `${m}:${s < 10 ? '0' + s : s}`;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const handleGameOver = () => {
            setFinalStats(`최종 레벨: ${gameState.current.level} | 생존 시간: ${getTimeStr(gameState.current.gameTime)}`);
            setIsGameOver(true);
            setIsRunning(false);
            cancelAnimationFrame(loopRef.current);
        };

        const createParticles = (x, y, c, n = 10) => {
            const state = gameState.current;
            for (let i = 0; i < n; i++)
                state.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, alpha: 1, color: c, size: Math.random() * 3 + 1 });
        };

        const killEnemy = (idx) => {
            const state = gameState.current;
            createParticles(state.enemies[idx].x, state.enemies[idx].y, '#22c55e');
            state.enemies.splice(idx, 1);
            gainExp(35);
        };

        const gainExp = (amt) => {
            const state = gameState.current;
            state.exp += amt;
            if (state.exp >= state.maxExp) levelUp();
            setExp(state.exp);
        };

        const levelUp = () => {
            const state = gameState.current;
            state.level++;
            state.exp = 0;
            state.maxExp = Math.floor(state.maxExp * 1.38);
            state.isPaused = true;

            setLevel(state.level);
            setMaxExp(state.maxExp);
            generateUpgrades();
        };

        const generateUpgrades = () => {
            const state = gameState.current;
            const options = [
                { title: '수비대 충원', desc: '새로운 대원을 영입합니다.', action: () => { state.followers.push(new Follower(state.leader.x, state.leader.y, state.followers.length)); setUnitCount(c => c + 1); } },
                { title: '공격력 증강', desc: '대원들의 파괴력이 25% 상승합니다.', action: () => state.stats.followerAtk *= 1.25 },
                { title: '연사 속도', desc: '공격 속도가 20% 빨라집니다.', action: () => state.stats.attackSpeed *= 1.2 },
                { title: '치명타 상향', desc: '치명타 확률이 10% 증가합니다.', action: () => state.stats.critChance += 0.1 },
                { title: '넉백 강화', desc: '적을 더 멀리 밀쳐냅니다.', action: () => state.stats.knockback += 0.4 },
                { title: '사거리 증가', desc: '공격 사거리가 15% 넓어집니다.', action: () => state.stats.followerRange *= 1.15 },
                { title: '응급 치료', desc: '리더의 체력을 30% 회복합니다.', action: () => state.leader.hp = Math.min(state.leader.maxHp, state.leader.hp + 30) },
                { title: '방어 시스템', desc: '보호막 생성 및 체력이 증가합니다.', action: () => { state.stats.armorGlow += 1; state.leader.maxHp += 20; state.leader.hp += 20; } }
            ];
            setUpgradeOptions(options.sort(() => 0.5 - Math.random()).slice(0, 3));
            setShowUpgrade(true);
        };

        const resize = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gameState.current.width = canvas.width;
            gameState.current.height = canvas.height;
        };

        const loop = () => {
            const state = gameState.current;
            if (!isRunning || state.isPaused) {
                if (isRunning) loopRef.current = requestAnimationFrame(loop);
                return;
            }

            // Dark background
            ctx.fillStyle = '#0f0f0f';
            ctx.fillRect(0, 0, state.width, state.height);

            // Grid lines
            ctx.strokeStyle = '#1f1f1f';
            ctx.lineWidth = 1;
            const gridSize = 100;
            for (let x = 0; x < state.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, state.height);
                ctx.stroke();
            }
            for (let y = 0; y < state.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(state.width, y);
                ctx.stroke();
            }

            // Update & Draw Leader
            if (state.leader) {
                state.leader.update(state);
                state.leader.draw(ctx, state);
            }

            // Spawn enemies
            if (state.frameCount % state.stats.spawnRate === 0) {
                let x, y, side = Math.floor(Math.random() * 4);
                if (side === 0) { x = Math.random() * state.width; y = -50; }
                else if (side === 1) { x = state.width + 50; y = Math.random() * state.height; }
                else if (side === 2) { x = Math.random() * state.width; y = state.height + 50; }
                else { x = -50; y = Math.random() * state.height; }

                let r = Math.random(), type = r > 0.92 ? 'tank' : (r > 0.78 ? 'fast' : 'normal');
                state.enemies.push(new Enemy(x, y, type, state.level));
                if (state.stats.spawnRate > 40 && state.frameCount % 300 === 0) state.stats.spawnRate -= 5;
            }

            // Update & Draw Projectiles
            for (let i = state.projectiles.length - 1; i >= 0; i--) {
                state.projectiles[i].update(state, createParticles, killEnemy);
                state.projectiles[i].draw(ctx);
                if (state.projectiles[i].life <= 0) state.projectiles.splice(i, 1);
            }

            // Update & Draw Enemies
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                state.enemies[i].update(state, handleGameOver);
                state.enemies[i].draw(ctx);
            }

            // Update & Draw Followers
            state.followers.forEach(f => { f.update(state); f.draw(ctx); });

            // Particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx; p.y += p.vy; p.alpha -= 0.025;
                if (p.alpha <= 0) state.particles.splice(i, 1);
                else {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }

            state.frameCount++;
            if (state.frameCount % 60 === 0) {
                state.gameTime++;
                setTimeStr(getTimeStr(state.gameTime));
            }

            loopRef.current = requestAnimationFrame(loop);
        };

        const updateInput = (e) => {
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            gameState.current.input.x = cx;
            gameState.current.input.y = cy;
            gameState.current.input.active = true;
        };

        window.addEventListener('resize', resize);
        canvas.addEventListener('mousedown', updateInput);
        canvas.addEventListener('mousemove', (e) => { if (gameState.current.input.active) updateInput(e); });
        canvas.addEventListener('mouseup', () => gameState.current.input.active = false);
        canvas.addEventListener('touchstart', (e) => { updateInput(e); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { updateInput(e); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchend', () => gameState.current.input.active = false);

        resize();

        if (isRunning) {
            loopRef.current = requestAnimationFrame(loop);
        }

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(loopRef.current);
        };
    }, [isRunning]);

    const handleStartClick = () => {
        const state = gameState.current;
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.level = 1;
        state.exp = 0;
        state.maxExp = 100;
        state.frameCount = 0;
        state.gameTime = 0;
        state.enemies = [];
        state.projectiles = [];
        state.particles = [];
        state.stats = { followerAtk: 12, followerRange: 180, followerSpeed: 0.06, attackSpeed: 1, critChance: 0.05, knockback: 0.5, spawnRate: 120, armorGlow: 0 };
        state.isPaused = false;

        state.leader = new Leader(state.width / 2, state.height / 2);
        state.followers = [];
        for (let i = 0; i < 3; i++) {
            state.followers.push(new Follower(state.leader.x, state.leader.y, i));
        }

        setLevel(1);
        setExp(0);
        setMaxExp(100);
        setUnitCount(3);
        setTimeStr("0:00");
        setIsGameOver(false);
        setIsRunning(true);
    };

    return (
        <div data-id="zombie-container" className="relative w-full h-screen bg-black overflow-hidden font-sans select-none touch-none">
            <canvas data-id="zombie-canvas" ref={canvasRef} className="block w-full h-full" />

            {/* Home Button */}
            {isRunning && !isGameOver && (
                <button
                    data-id="zombie-home-btn"
                    onClick={() => window.location.href = '/'}
                    className="bg-black/50 hover:bg-black/80 w-12 h-12 rounded-full flex items-center justify-center text-xl border border-white/20 transition-colors fixed bottom-4 right-4 z-10"
                >
                    🏠
                </button>
            )}

            {/* UI Layer */}
            {isRunning && !isGameOver && (
                <div data-id="zombie-hud" className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white pointer-events-none">
                    <div data-id="zombie-hud-left" className="flex flex-col gap-1">
                        <div data-id="zombie-level" className="text-2xl font-black text-green-400 drop-shadow-lg">Lv.{level}</div>
                        <div data-id="zombie-exp-bar" className="w-56 h-4 bg-gray-900 rounded-full border border-gray-700 overflow-hidden shadow-inner">
                            <div data-id="zombie-exp-fill" className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" style={{ width: `${(exp / maxExp) * 100}%` }}></div>
                        </div>
                        <div data-id="zombie-exp-text" className="text-[10px] text-green-300 font-bold uppercase tracking-wider">EXP: {Math.floor(exp)} / {Math.floor(maxExp)}</div>
                    </div>
                    <div data-id="zombie-hud-right" className="text-right">
                        <div data-id="zombie-unit-count" className="text-xl font-black text-blue-400">수비대: {unitCount}명</div>
                        <div data-id="zombie-survival-time" className="text-sm text-gray-400">Survival: {timeStr}</div>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {!isRunning && !isGameOver && (
                <div data-id="zombie-start" className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
                    <h1 data-id="zombie-start-title" className="text-6xl md:text-8xl text-green-600 font-black mb-4 tracking-tighter text-center drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]">수비대</h1>
                    <p className="text-gray-400 mb-8 text-center px-4">화면을 터치/클릭하여 리더를 이동하세요<br />자동으로 좀비를 공격합니다!</p>
                    <div data-id="zombie-start-buttons" className="flex flex-col sm:flex-row gap-4 w-full px-10 max-w-lg">
                        <button data-id="zombie-play-btn" onClick={handleStartClick} className="flex-1 py-5 bg-green-600 hover:bg-green-500 text-white text-2xl font-bold rounded-3xl transition-all active:scale-95 shadow-xl">방어 시작</button>
                        <button data-id="zombie-exit-btn" onClick={() => window.location.href = '/'} className="flex-1 py-5 bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold rounded-3xl transition-all active:scale-95 shadow-xl">나가기</button>
                    </div>
                </div>
            )}

            {/* Game Over */}
            {isGameOver && (
                <div data-id="zombie-gameover" className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50">
                    <h1 data-id="zombie-gameover-title" className="text-6xl text-red-700 font-black mb-2 animate-pulse">GAME OVER</h1>
                    <p data-id="zombie-gameover-stats" className="text-white text-2xl mb-6 font-light">{finalStats}</p>
                    <div data-id="zombie-gameover-buttons" className="flex gap-4 w-full px-10 max-w-lg">
                        <button data-id="zombie-restart-btn" onClick={handleStartClick} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xl font-bold rounded-2xl transition-all">재시작</button>
                        <button data-id="zombie-exit-btn" onClick={() => window.location.href = '/'} className="flex-1 py-4 bg-blue-700 hover:bg-blue-600 text-white text-xl font-bold rounded-2xl transition-all">나가기</button>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgrade && (
                <div data-id="zombie-upgrade-overlay" className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
                    <div data-id="zombie-upgrade-modal" className="bg-zinc-950 p-8 rounded-3xl border-4 border-green-500 max-w-sm w-full shadow-2xl">
                        <h2 data-id="zombie-upgrade-title" className="text-3xl text-green-500 font-black text-center mb-4">레벨 업!</h2>
                        <div data-id="zombie-upgrade-options" className="space-y-4">
                            {upgradeOptions.map((opt, i) => (
                                <div data-id={`zombie-upgrade-option-${i}`} key={i}
                                    onClick={() => { opt.action(); setShowUpgrade(false); gameState.current.isPaused = false; }}
                                    className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-green-500 cursor-pointer transition-all"
                                >
                                    <div className="text-xl font-bold text-green-400 mb-1">{opt.title}</div>
                                    <div className="text-xs text-gray-500">{opt.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
