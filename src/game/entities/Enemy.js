import { BOARD_PADDING, CELL_SIZE, GRID_SIZE } from '../constants';

const PATH_POINTS = (canvasWidth, canvasHeight) => [
    { x: BOARD_PADDING, y: BOARD_PADDING },
    { x: canvasWidth - BOARD_PADDING, y: BOARD_PADDING },
    { x: canvasWidth - BOARD_PADDING, y: canvasHeight - 120 },
    { x: BOARD_PADDING, y: canvasHeight - 120 },
    { x: BOARD_PADDING, y: BOARD_PADDING + 10 }
];

export class Enemy {
    constructor(wave, isBoss = false, difficulty, canvasWidth, canvasHeight, animationTick) {
        this.isBoss = isBoss;
        this.path = PATH_POINTS(canvasWidth, canvasHeight);
        let hpFactor = 130;
        if (difficulty === 'EASY') hpFactor = 75; else if (difficulty === 'NORMAL') hpFactor = 100;
        const hpMultiplier = isBoss ? 13 : (1 + Math.floor(wave / 5) * 0.75);
        this.maxHp = (70 + (wave * hpFactor)) * hpMultiplier;
        this.hp = this.maxHp;
        this.speed = isBoss ? 0.45 : Math.min(3.8, 1.6 + (wave * 0.04));
        this.pathIndex = 0;
        this.x = this.path[0].x; this.y = this.path[0].y;
        this.radius = 14;
        this.bob = 0;
    }

    update(animationTick) {
        const target = this.path[this.pathIndex + 1];
        if (!target) return true;
        const dx = target.x - this.x, dy = target.y - this.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.speed) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length - 1) return true;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        this.bob = Math.sin(animationTick * 0.2) * 2;
        return false;
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y + this.bob);
        const scale = this.isBoss ? 1.8 : 1.0; ctx.scale(scale, scale);
        ctx.fillStyle = '#fecaca'; ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.isBoss ? '#ef4444' : '#3f6212'; ctx.beginPath(); ctx.arc(0, -14, 6, Math.PI, 0); ctx.fill();
        ctx.fillStyle = this.isBoss ? '#7f1d1d' : '#365314'; ctx.fillRect(-5, -7, 10, 12);
        ctx.strokeStyle = this.isBoss ? '#7f1d1d' : '#365314'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-9, 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, -5); ctx.lineTo(9, 2); ctx.stroke();
        const legMove = Math.sin(Date.now() * 0.01) * 3; // Simplified animation tick reference
        ctx.fillStyle = '#1a2e05'; ctx.fillRect(-4, 5, 3, 6 + legMove); ctx.fillRect(1, 5, 3, 6 - legMove);
        ctx.fillStyle = '#1e293b'; ctx.fillRect(4, -2, 12, 3);
        ctx.restore();
        const barWidth = this.isBoss ? 60 : 30; ctx.fillStyle = '#020617'; ctx.fillRect(this.x - barWidth / 2, this.y - 25, barWidth, 4);
        ctx.fillStyle = this.isBoss ? '#ef4444' : '#10b981'; ctx.fillRect(this.x - barWidth / 2, this.y - 25, barWidth * (this.hp / this.maxHp), 4);
    }
}
