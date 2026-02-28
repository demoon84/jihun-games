import React, { useEffect, useRef, useState } from 'react';

// --- Game Classes ---
class Leader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 150;
        this.maxHp = 150;
        this.radius = 32;
        this.speed = 4.5;
        this.vx = 0;
        this.vy = 0;
        this.skillGauge = 0;
        this.maxSkillGauge = 100;
    }
    update(state) {
        let prevX = this.x;
        let prevY = this.y;

        if (state.input.active) {
            const dx = state.input.x - this.x;
            const dy = state.input.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
                this.x += this.vx;
                this.y += this.vy;
            } else {
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        this.x = Math.max(this.radius, Math.min(state.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(state.height - this.radius, this.y));
    }
    draw(ctx, state) {
        // Aura
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + 20);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Golden Outer Ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Main body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fill();

        // Crown/Icon in center
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♔', this.x, this.y);

        // HP bar (ROK style)
        const barW = 80;
        ctx.fillStyle = '#374151';
        ctx.fillRect(this.x - barW/2, this.y + this.radius + 15, barW, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(this.x - barW/2, this.y + this.radius + 15, barW * (this.hp / this.maxHp), 8);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barW/2, this.y + this.radius + 15, barW, 8);
    }
}

class Unit {
    constructor(index, type = 'infantry') {
        this.index = index;
        this.type = type; // 'infantry' (shield), 'archer'
        this.x = 0;
        this.y = 0;
        this.radius = type === 'infantry' ? 20 : 16;
        this.hp = type === 'infantry' ? 100 : 50;
        this.attackCooldown = 0;
        this.color = type === 'infantry' ? '#60a5fa' : '#f87171';
    }
    update(state) {
        const leader = state.leader;
        // Formation logic: Shield in front, Archers in back
        let targetX, targetY;
        const spacing = 50;

        if (this.type === 'infantry') {
            // Circle formation around leader
            const angle = (this.index / 4) * Math.PI * 2 + state.frameCount * 0.02;
            targetX = leader.x + Math.cos(angle) * 70;
            targetY = leader.y + Math.sin(angle) * 70;
        } else {
            // Grid formation behind leader based on movement
            const angle = Math.atan2(leader.vy, leader.vx) + Math.PI;
            const row = Math.floor((this.index - 4) / 4) + 1;
            const col = (this.index - 4) % 4 - 1.5;
            
            const offsetX = Math.cos(angle) * (row * 60) + Math.cos(angle + Math.PI/2) * (col * 40);
            const offsetY = Math.sin(angle) * (row * 60) + Math.sin(angle + Math.PI/2) * (col * 40);
            
            // If standing still, archers circle outer rim
            if (Math.abs(leader.vx) < 0.1 && Math.abs(leader.vy) < 0.1) {
                const idleAngle = (this.index / 8) * Math.PI * 2 - state.frameCount * 0.01;
                targetX = leader.x + Math.cos(idleAngle) * 120;
                targetY = leader.y + Math.sin(idleAngle) * 120;
            } else {
                targetX = leader.x + offsetX;
                targetY = leader.y + offsetY;
            }
        }

        this.x += (targetX - this.x) * 0.15;
        this.y += (targetY - this.y) * 0.15;

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            const range = this.type === 'archer' ? state.stats.range * 1.5 : state.stats.range;
            const target = this.findTarget(state, range);
            if (target) {
                this.shoot(state, target);
                this.attackCooldown = Math.floor(60 / (this.type === 'archer' ? state.stats.atkSpd * 1.2 : state.stats.atkSpd));
            }
        }
    }
    findTarget(state, range) {
        let closest = null;
        let closestDist = range;
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
        const dmg = this.type === 'archer' ? state.stats.dmg * 1.4 : state.stats.dmg;
        state.projectiles.push(new Projectile(
            this.x, this.y,
            (dx / dist) * 10, (dy / dist) * 10,
            dmg, state.stats.crit, this.color
        ));
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Simple weapon icon
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'infantry' ? '🛡️' : '🏹', this.x, this.y);
    }
}

class Enemy {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.radius = 22 + Math.random() * 10;
        this.speed = 1.2 + Math.random() * 0.8;
        this.hp = 40 + level * 8;
        this.maxHp = this.hp;
        this.damage = 8 + Math.floor(level/2);
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
                state.leader.skillGauge = Math.min(state.leader.maxSkillGauge, state.leader.skillGauge + 2);
                this.attackCooldown = 60;
                if (state.leader.hp <= 0) onGameOver();
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#14532d';
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Enemy eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(this.x-6, this.y-4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x+6, this.y-4, 3, 0, Math.PI*2); ctx.fill();
    }
}

class Projectile {
    constructor(x, y, vx, vy, dmg, crit, color) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.dmg = dmg; this.crit = crit; this.color = color;
        this.radius = 5; this.life = 100;
    }
    update(state, createParticles, killEnemy) {
        this.x += this.vx; this.y += this.vy; this.life--;
        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const e = state.enemies[i];
            const dx = e.x - this.x, dy = e.y - this.y, dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < e.radius + this.radius) {
                const isCrit = Math.random() < this.crit;
                e.hp -= isCrit ? this.dmg * 2 : this.dmg;
                if (e.hp <= 0) killEnemy(i);
                createParticles(this.x, this.y, isCrit ? '#fbbf24' : this.color, 4);
                this.life = 0; break;
            }
        }
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill();
    }
}

export default function ZombieGame() {
    const canvasRef = useRef(null);
    const loopRef = useRef(null);
    const [isRunning, setIsRunning] = useState(false);
    const [level, setLevel] = useState(1);
    const [exp, setExp] = useState(0);
    const [maxExp, setMaxExp] = useState(100);
    const [skillGauge, setSkillGauge] = useState(0);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState([]);

    const gameState = useRef({
        level: 1, exp: 0, maxExp: 100,
        leader: null, units: [], enemies: [], projectiles: [], particles: [],
        input: { x: 0, y: 0, active: false },
        stats: { dmg: 15, range: 200, atkSpd: 1, crit: 0.05, spawnRate: 100 },
        width: 0, height: 0, frameCount: 0, gameTime: 0, isPaused: false
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const handleGameOver = () => { setIsGameOver(true); setIsRunning(false); };
        const createParticles = (x, y, c, n = 8) => {
            for (let i = 0; i < n; i++)
                gameState.current.particles.push({ x, y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, alpha: 1, color: c, size: Math.random()*3+1 });
        };
        const killEnemy = (idx) => {
            const state = gameState.current;
            createParticles(state.enemies[idx].x, state.enemies[idx].y, '#22c55e');
            state.enemies.splice(idx, 1);
            state.leader.skillGauge = Math.min(state.leader.maxSkillGauge, state.leader.skillGauge + 5);
            gainExp(25);
        };
        const gainExp = (amt) => {
            const state = gameState.current; state.exp += amt;
            if (state.exp >= state.maxExp) {
                state.level++; state.exp = 0; state.maxExp = Math.floor(state.maxExp * 1.35);
                state.isPaused = true; setLevel(state.level); setMaxExp(state.maxExp);
                generateUpgrades();
            }
            setExp(state.exp);
        };
        const generateUpgrades = () => {
            const state = gameState.current;
            const options = [
                { title: '🛡️ 보병 추가', desc: '전열을 방어할 보병을 영입합니다.', action: () => state.units.push(new Unit(state.units.length, 'infantry')) },
                { title: '🏹 궁병 추가', desc: '후방 화력을 지원할 궁병을 영입합니다.', action: () => state.units.push(new Unit(state.units.length, 'archer')) },
                { title: '⚔️ 공격력 증강', desc: '모든 부대의 공격력이 20% 상승합니다.', action: () => state.stats.dmg *= 1.2 },
                { title: '🏹 사거리 확장', desc: '궁병들의 사거리가 크게 증가합니다.', action: () => state.stats.range *= 1.25 },
                { title: '❤️ 군단 정비', desc: '사령관과 부대의 체력을 회복합니다.', action: () => state.leader.hp = Math.min(state.leader.maxHp, state.leader.hp + 50) }
            ];
            setUpgradeOptions(options.sort(() => 0.5 - Math.random()).slice(0, 3));
            setShowUpgrade(true);
        };

        const useSkill = () => {
            const state = gameState.current;
            if (state.leader.skillGauge < state.leader.maxSkillGauge) return;
            state.leader.skillGauge = 0;
            // Fire wave
            createParticles(state.leader.x, state.leader.y, '#fbbf24', 50);
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                const e = state.enemies[i];
                const dx = e.x - state.leader.x, dy = e.y - state.leader.y, dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 400) { e.hp -= 200; if (e.hp <= 0) killEnemy(i); }
            }
        };

        const handleKeyDown = (e) => { if (e.code === 'Space') useSkill(); };
        window.addEventListener('keydown', handleKeyDown);

        const loop = () => {
            const state = gameState.current;
            if (!isRunning || state.isPaused) { if (isRunning) loopRef.current = requestAnimationFrame(loop); return; }

            ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, state.width, state.height);
            
            // Grid
            ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
            for (let x = 0; x < state.width; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.height); ctx.stroke(); }
            for (let y = 0; y < state.height; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke(); }

            state.leader.update(state);
            state.leader.draw(ctx, state);
            setSkillGauge(state.leader.skillGauge);

            if (state.frameCount % state.stats.spawnRate === 0) {
                let x, y, s = Math.floor(Math.random()*4);
                if (s === 0) { x = Math.random()*state.width; y = -50; }
                else if (s === 1) { x = state.width+50; y = Math.random()*state.height; }
                else if (s === 2) { x = Math.random()*state.width; y = state.height+50; }
                else { x = -50; y = Math.random()*state.height; }
                state.enemies.push(new Enemy(x, y, state.level));
            }

            for (let i = state.projectiles.length - 1; i >= 0; i--) {
                state.projectiles[i].update(state, createParticles, killEnemy);
                state.projectiles[i].draw(ctx);
                if (state.projectiles[i].life <= 0) state.projectiles.splice(i, 1);
            }
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                state.enemies[i].update(state, handleGameOver);
                state.enemies[i].draw(ctx);
            }
            state.units.forEach(u => { u.update(state); u.draw(ctx); });
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.03;
                if (p.alpha <= 0) state.particles.splice(i, 1);
                else { ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }
            }

            state.frameCount++;
            loopRef.current = requestAnimationFrame(loop);
        };

        const resize = () => {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            gameState.current.width = canvas.width; gameState.current.height = canvas.height;
        };
        const updateInput = (e) => {
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            gameState.current.input.x = cx; gameState.current.input.y = cy; gameState.current.input.active = true;
        };

        window.addEventListener('resize', resize);
        canvas.addEventListener('mousedown', updateInput);
        canvas.addEventListener('mousemove', (e) => { if (gameState.current.input.active) updateInput(e); });
        canvas.addEventListener('mouseup', () => gameState.current.input.active = false);
        canvas.addEventListener('touchstart', (e) => { updateInput(e); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { updateInput(e); e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchend', () => gameState.current.input.active = false);

        resize();
        if (isRunning) loopRef.current = requestAnimationFrame(loop);
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(loopRef.current);
        };
    }, [isRunning]);

    const handleStart = () => {
        const state = gameState.current;
        state.leader = new Leader(window.innerWidth/2, window.innerHeight/2);
        state.units = [new Unit(0, 'infantry'), new Unit(1, 'infantry'), new Unit(2, 'archer'), new Unit(3, 'archer')];
        state.enemies = []; state.projectiles = []; state.particles = []; state.level = 1; state.exp = 0; state.frameCount = 0;
        setIsGameOver(false); setIsRunning(true); setLevel(1); setExp(0);
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none touch-none">
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* HUD */}
            {isRunning && !isGameOver && (
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-2">
                        <div className="text-3xl font-black text-amber-400 drop-shadow-md">COMMANDER LV.{level}</div>
                        <div className="w-64 h-3 bg-zinc-900 rounded-full border border-zinc-700 overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(exp/maxExp)*100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="relative group pointer-events-auto cursor-pointer" onClick={() => { if(skillGauge >= 100) { /* trigger skill */ } }}>
                            <div className="text-xs text-amber-300 font-bold mb-1 text-center">SKILL (SPACE)</div>
                            <div className="w-20 h-20 rounded-full border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-amber-600/40 transition-all duration-300" style={{ height: `${skillGauge}%` }}></div>
                                <span className="text-3xl z-10">{skillGauge >= 100 ? '🔥' : '⚡'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {!isRunning && !isGameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
                    <h1 className="text-7xl text-amber-500 font-black mb-4 tracking-tighter text-center italic">RISE OF SURVIVORS</h1>
                    <p className="text-zinc-400 mb-10 text-lg text-center font-light">전설의 사령관이 되어 좀비 군단을 정벌하세요.</p>
                    <button onClick={handleStart} className="px-16 py-6 bg-amber-600 hover:bg-amber-500 text-white text-3xl font-black rounded-full shadow-[0_0_40px_rgba(217,119,6,0.5)] transition-all active:scale-95">원정 시작</button>
                </div>
            )}

            {/* Game Over */}
            {isGameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50">
                    <h1 className="text-8xl text-red-600 font-black mb-6">DEFEAT</h1>
                    <button onClick={handleStart} className="px-12 py-4 bg-zinc-800 text-white text-xl font-bold rounded-xl">다시 도전</button>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgrade && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
                    <div className="bg-zinc-950 p-8 rounded-3xl border-4 border-amber-600 max-w-sm w-full shadow-2xl">
                        <h2 className="text-4xl text-amber-500 font-black text-center mb-8 uppercase tracking-widest">Victory!</h2>
                        <div className="space-y-4">
                            {upgradeOptions.map((opt, i) => (
                                <div key={i} onClick={() => { opt.action(); setShowUpgrade(false); gameState.current.isPaused = false; }}
                                    className="p-5 rounded-2xl bg-zinc-900 hover:bg-amber-900/40 border-2 border-zinc-800 hover:border-amber-500 cursor-pointer transition-all group"
                                >
                                    <div className="text-xl font-bold text-amber-400 mb-1 group-hover:text-white">{opt.title}</div>
                                    <div className="text-sm text-zinc-500 group-hover:text-zinc-300">{opt.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
