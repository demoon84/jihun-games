import { Unit } from './entities/Unit';
import { Enemy } from './entities/Enemy';
import { RANKS, UNIT_TYPES, BOARD_PADDING, CELL_SIZE, GRID_SIZE } from './constants';
import { SFX, AudioMgr } from './audio';

export class GameEngine {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks; // { onStateUpdate, onGameOver }

        // Canvas Setup
        this.canvas.width = (CELL_SIZE * GRID_SIZE) + (BOARD_PADDING * 2);
        this.canvas.height = this.canvas.width + 100;

        this.path = [
            { x: BOARD_PADDING, y: BOARD_PADDING },
            { x: this.canvas.width - BOARD_PADDING, y: BOARD_PADDING },
            { x: this.canvas.width - BOARD_PADDING, y: this.canvas.height - 120 },
            { x: BOARD_PADDING, y: this.canvas.height - 120 },
            { x: BOARD_PADDING, y: BOARD_PADDING + 10 }
        ];

        this.state = {
            gold: 500, skulls: 0, life: 20, wave: 1, units: [], enemies: [], projectiles: [],
            selectedUnit: null, mergeCandidates: [], enemySpawnTimer: 0, waveTimer: 0, upgradeLevel: 1, interestLevel: 0,
            luckBoost: false, isGameOver: false, isStarted: false, usedCodes: [],
            playerName: "", difficulty: "NORMAL", animationTick: 0, killCount: 0,
            bossSpawned: false
        };

        this.loopId = null;
        this.lastTime = 0;
    }

    reset(difficulty = 'NORMAL', playerName = 'Agent') {
        this.state = {
            ...this.state,
            gold: difficulty === 'EASY' ? 500 : (difficulty === 'NORMAL' ? 300 : 100),
            skulls: 0, life: 20, wave: 1, units: [], enemies: [], projectiles: [],
            selectedUnit: null, mergeCandidates: [], enemySpawnTimer: 0, waveTimer: 0, upgradeLevel: 1, interestLevel: 0,
            luckBoost: false, isGameOver: false, isStarted: true,
            playerName, difficulty, animationTick: 0, killCount: 0,
            bossSpawned: false
        };
        this.startLoop();
        AudioMgr.startBGM(this.state);
        this.notifyUpdate();
    }

    startLoop() {
        if (this.loopId) cancelAnimationFrame(this.loopId);
        const loop = (timestamp) => {
            if (this.state.isGameOver) return;
            this.update();
            this.draw();
            this.loopId = requestAnimationFrame(loop);
        };
        this.loopId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.loopId) cancelAnimationFrame(this.loopId);
    }

    update() {
        const s = this.state;
        s.animationTick++;

        // Wave Logic
        if (s.isStarted) {
            s.enemySpawnTimer++;
            // Boss Spawn
            if (s.wave % 10 === 0 && !s.bossSpawned) {
                if (s.enemySpawnTimer > 80) {
                    SFX.boss();
                    s.enemies.push(new Enemy(s.wave, true, s.difficulty, this.canvas.width, this.canvas.height));
                    s.bossSpawned = true;
                    s.enemySpawnTimer = 0;
                }
            } else if (s.wave % 10 !== 0) {
                s.bossSpawned = false;
                if (s.enemySpawnTimer > Math.max(10, 60 - s.wave)) {
                    s.enemies.push(new Enemy(s.wave, false, s.difficulty, this.canvas.width, this.canvas.height));
                    s.enemySpawnTimer = 0;
                }
            }

            s.waveTimer++;
            if (s.waveTimer > 1000) {
                s.wave++;
                s.waveTimer = 0;
                let b = s.difficulty === 'EASY' ? 300 : (s.difficulty === 'NORMAL' ? 200 : 150);
                s.gold += b + (s.interestLevel * 100);
                this.notifyUpdate();
            }
        }

        // Projectiles
        s.projectiles = s.projectiles.filter(p => {
            const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < p.speed) {
                if (s.enemies.includes(p.target)) {
                    p.target.hp -= p.power;
                    if (p.target.hp <= 0) {
                        s.killCount++;
                        let gr = s.difficulty === 'EASY' ? 5 : (s.difficulty === 'NORMAL' ? 2 : 1);
                        s.gold += gr;
                        s.skulls += p.target.isBoss ? 50 : 1;
                        this.notifyUpdate();
                    }
                }
                return false;
            }
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
            return true;
        });

        // Enemies
        s.enemies = s.enemies.filter(enemy => {
            const reached = enemy.update(s.animationTick);
            if (reached) {
                s.life -= enemy.isBoss ? 5 : 1;
                this.notifyUpdate();
                if (s.life <= 0) this.gameOver();
                return false;
            }
            return enemy.hp > 0;
        });

        // Units
        s.units.forEach(u => u.update(s, s.upgradeLevel));
    }

    draw() {
        const ctx = this.ctx;
        const cvs = this.canvas;
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        // Path
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        this.path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Projectiles
        this.state.projectiles.forEach(p => {
            ctx.save(); ctx.translate(p.x, p.y);
            // Calculate rotation only if moving
            const dx = p.tx - p.x, dy = p.ty - p.y;
            ctx.rotate(Math.atan2(dy, dx));
            ctx.fillStyle = p.color; ctx.fillRect(-6, -2, 12, 4); ctx.restore();
        });

        // Entities
        this.state.enemies.forEach(e => e.draw(ctx));
        this.state.units.forEach(u => {
            const isMergeCandidate = this.state.mergeCandidates && this.state.mergeCandidates.includes(u);
            u.draw(ctx, this.state.selectedUnit === u, isMergeCandidate);
        });
    }

    gameOver() {
        this.state.isGameOver = true;
        this.stopLoop();
        this.notifyUpdate();
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.state);
    }

    // --- Actions ---

    handleClick(x, y) {
        // Simple radius check
        const clickedUnit = this.state.units.find(u => Math.abs(u.x - x) < 35 && Math.abs(u.y - y) < 40);
        const currentTime = Date.now();

        if (clickedUnit) {
            // Case 1: Merge Attempt (Clicked a different unit while one is selected)
            if (this.state.selectedUnit && this.state.selectedUnit !== clickedUnit) {
                if (this.state.selectedUnit.rankKey === clickedUnit.rankKey &&
                    this.state.selectedUnit.typeData.id === clickedUnit.typeData.id) {

                    // Valid Merge
                    const ranks = Object.keys(RANKS);
                    const nextRankIdx = ranks.indexOf(clickedUnit.rankKey) + 1;
                    const nextRank = ranks[nextRankIdx];

                    if (nextRank && nextRank !== 'MYTHIC') {
                        // Create new merged unit
                        this.state.units = this.state.units.filter(u => u !== this.state.selectedUnit && u !== clickedUnit);
                        const newUnit = new Unit(nextRank, clickedUnit.typeData, clickedUnit.gridPos);
                        this.state.units.push(newUnit);

                        // Select the new unit
                        this.state.selectedUnit = newUnit;
                        this.updateMergeCandidates(newUnit); // Recalculate for chain merges
                        SFX.merge();
                    } else {
                        // Max rank or invalid, just switch selection
                        this.selectUnit(clickedUnit);
                    }
                } else {
                    // Not mergeable, just switch selection
                    this.selectUnit(clickedUnit);
                }
            }
            // Case 2: Same Unit Toggle off
            else if (this.state.selectedUnit === clickedUnit) {
                this.state.selectedUnit = null;
                this.state.mergeCandidates = [];
            }
            // Case 3: New Selection
            else {
                this.selectUnit(clickedUnit);
            }
        } else {
            // Clicked empty space
            this.state.selectedUnit = null;
            this.state.mergeCandidates = [];
        }
        this.notifyUpdate();
    }

    selectUnit(unit) {
        this.state.selectedUnit = unit;
        this.updateMergeCandidates(unit);
    }

    updateMergeCandidates(unit) {
        if (!unit) {
            this.state.mergeCandidates = [];
            return;
        }
        // Find units with same Rank and Type, but not the unit itself
        this.state.mergeCandidates = this.state.units.filter(u =>
            u !== unit &&
            u.rankKey === unit.rankKey &&
            u.typeData.id === unit.typeData.id
        );
    }

    summonUnit(cost, lucky = false) {
        if (this.state.gold < cost) return false;
        if (this.state.units.length >= 15) return false;

        this.state.gold -= cost;
        SFX.summon();

        const rand = Math.random();
        let selectedRank = 'NORMAL';
        const luckFactor = this.state.luckBoost ? 2.0 : 1.0;

        if (lucky) {
            if (rand <= 0.05 * luckFactor) selectedRank = 'MYTHIC';
            else if (rand <= 0.20 * luckFactor) selectedRank = 'LEGEND';
            else if (rand <= 0.50) selectedRank = 'EPIC';
            else selectedRank = 'RARE';
        } else {
            let cumulative = 0;
            for (const [key, rank] of Object.entries(RANKS)) {
                if (key === 'MYTHIC') continue;
                let prob = rank.prob;
                if (this.state.luckBoost && (key === 'LEGEND' || key === 'EPIC')) prob *= 1.5;
                cumulative += prob;
                if (rand <= cumulative) { selectedRank = key; break; }
            }
        }

        const occupied = this.state.units.map(u => `${u.gridPos.r},${u.gridPos.c}`);
        let r, c;
        do {
            r = Math.floor(Math.random() * 4 + 1);
            c = Math.floor(Math.random() * GRID_SIZE);
        } while (occupied.includes(`${r},${c}`));

        this.state.units.push(new Unit(selectedRank, UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)], { r, c }));
        this.notifyUpdate();
        return true;
    }

    handleUpgrade() {
        const cost = 150;
        if (this.state.skulls < cost) return;
        this.state.skulls -= cost;
        this.state.upgradeLevel++;
        SFX.upgrade();
        this.notifyUpdate();
    }

    sellUnit(unit = null) {
        const target = unit || this.state.selectedUnit;
        if (!target) return;

        const refundGold = Math.floor(target.rank.sell / 2);
        const refundSkulls = Math.floor(target.rank.sell / 4);

        this.state.gold += refundGold;
        this.state.skulls += refundSkulls;
        this.state.units = this.state.units.filter(u => u !== target);

        if (this.state.selectedUnit === target) this.state.selectedUnit = null;
        SFX.delete();
        this.notifyUpdate();
    }

    buyItem(type) {
        if (!this.state.isStarted || this.state.isGameOver) return;
        let cost = type === 'HEAL' ? 150 : (type === 'INTEREST' ? 400 : 800);

        if (this.state.skulls >= cost) {
            this.state.skulls -= cost;
            if (type === 'HEAL') {
                this.state.life = Math.min(40, this.state.life + 5);
            } else if (type === 'INTEREST') {
                this.state.interestLevel++;
            } else if (type === 'LUCK') {
                this.state.luckBoost = true;
            }
            SFX.buy();
            this.notifyUpdate();
            return true;
        }
        return false;
    }

    redeemCode(code) {
        if (this.state.usedCodes.includes(code)) return false;

        const COUPONS = {
            '디펜스_100': { gold: 10000, skulls: 5000, msg: "최종 전설 보급 승인!" }
        };

        if (COUPONS[code]) {
            const r = COUPONS[code];
            this.state.gold += r.gold;
            this.state.skulls += r.skulls;
            this.state.usedCodes.push(code);
            SFX.buy();
            this.notifyUpdate();
            return true;
        }
        return false;
    }

    notifyUpdate() {
        if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate({ ...this.state });
        }
    }
}
