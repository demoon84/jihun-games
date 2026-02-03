import { RANKS, BOARD_PADDING, CELL_SIZE } from '../constants';
import { SFX } from '../audio';

export class Unit {
    constructor(rankKey, typeData, gridPos) {
        this.rankKey = rankKey;
        this.rank = RANKS[rankKey];
        this.typeData = typeData;
        this.gridPos = gridPos;
        this.x = BOARD_PADDING + gridPos.c * CELL_SIZE + CELL_SIZE / 2;
        this.y = BOARD_PADDING + gridPos.r * CELL_SIZE + CELL_SIZE / 2 + 40;
        this.range = (rankKey === 'LEGEND' || rankKey === 'MYTHIC') ? 280 : 210;
        this.cooldown = 0;
        this.fireRate = rankKey === 'MYTHIC' ? 10 : (rankKey === 'LEGEND' ? 18 : 32);
        this.rotation = 0;
    }

    draw(ctx, isSelected, isMergeCandidate) {
        const isMythic = this.rankKey === 'MYTHIC';
        ctx.save(); ctx.translate(this.x, this.y);

        // Base Unit Body
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-22, -24, 8, 48); ctx.fillRect(14, -24, 8, 48);
        ctx.fillStyle = '#334155'; ctx.strokeStyle = this.rank.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(-16, -20, 32, 40, 4); ctx.fill(); ctx.stroke();

        // Turret Head
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = this.rank.color; ctx.lineWidth = 2;
        ctx.beginPath();
        if (isMythic) {
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                const rx = 15 * Math.cos(a), ry = 15 * Math.sin(a);
                i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
            }
        } else {
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
        }
        ctx.fill(); ctx.stroke();

        // Weapon Type Indicator
        ctx.fillStyle = '#475569';
        switch (this.typeData.id) {
            case 'MG': ctx.fillRect(10, -6, 16, 4); ctx.fillRect(10, 2, 16, 4); break;
            case 'RL': ctx.fillRect(5, -3, 22, 6); ctx.fillStyle = this.rank.color; ctx.beginPath(); ctx.arc(28, 0, 4, 0, Math.PI * 2); ctx.fill(); break;
            case 'CN': ctx.fillRect(8, -5, 24, 10); ctx.fillRect(28, -6, 6, 12); break;
            case 'CR': ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(25, -10); ctx.lineTo(25, 10); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); break;
        }
        ctx.restore(); // Restore from rotation
        ctx.restore(); // Restore from translation

        // Selection & Merge Indicators (Global Coordinates)
        if (isSelected) {
            ctx.save();
            ctx.beginPath(); ctx.arc(this.x, this.y, 40, 0, Math.PI * 2);
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke(); // Selection Ring

            ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.05)'; ctx.fill(); // Range Circle

            ctx.fillStyle = 'white'; ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center'; ctx.fillText("SELECT", this.x, this.y - 45);
            ctx.restore();
        }

        if (isMergeCandidate) {
            ctx.save();
            const pulse = (Date.now() % 1000) / 1000;
            const alpha = 0.5 + Math.sin(pulse * Math.PI) * 0.5;

            ctx.beginPath(); ctx.arc(this.x, this.y, 35, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; ctx.lineWidth = 3; ctx.stroke();

            ctx.fillStyle = '#10b981'; ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center'; ctx.fillText("MERGE", this.x, this.y - 40);
            ctx.restore();
        }

        // Rank Name Label
        ctx.fillStyle = this.rank.color; ctx.font = '900 10px Orbitron'; ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center'; ctx.fillText(this.rank.name, this.x, this.y + 35);
    }

    update(state, upgradeLevel) {
        if (this.cooldown > 0) this.cooldown--;
        if (this.cooldown <= 0 && state.enemies.length > 0) {
            const target = this.findTarget(state.enemies);
            if (target) {
                this.shoot(state, target, upgradeLevel);
                this.cooldown = this.fireRate;
                const tTarget = target; // capture
                this.rotation = Math.atan2(tTarget.y - this.y, tTarget.x - this.x);
            }
        }
    }

    findTarget(enemies) {
        const inRange = enemies.filter(e => Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2) <= this.range);
        return inRange.length === 0 ? null : (inRange.find(e => e.isBoss) || inRange[0]);
    }

    shoot(state, target, upgradeLevel) {
        const finalPower = this.rank.power * (1 + (upgradeLevel - 1) * 0.15);
        state.projectiles.push({
            x: this.x + Math.cos(this.rotation) * 20,
            y: this.y + Math.sin(this.rotation) * 20,
            tx: target.x, ty: target.y, target: target,
            power: finalPower, speed: 18, color: this.rank.color, type: this.typeData.id
        });
        SFX.shoot();
    }
}
