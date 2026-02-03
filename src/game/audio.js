const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;
let bgmInterval = null;

const TRACKS = {
    LOBBY: [220, 0, 165, 0],
    BATTLE: [110, 165, 110, 220],
    BOSS: [55, 110, 55, 165]
};

let bgmStep = 0;

function playTone(freq, type, duration, vol = 0.1, delay = 0) {
    if (isMuted || audioCtx.state === 'suspended') return;
    const startTime = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

export const SFX = {
    summon: () => { playTone(880, 'sine', 0.1, 0.05); },
    merge: () => { playTone(440, 'square', 0.1, 0.1); playTone(880, 'square', 0.2, 0.05, 0.1); },
    upgrade: () => { [440, 660, 880].forEach((f, i) => playTone(f, 'sawtooth', 0.1, 0.03, i * 0.05)); },
    shoot: () => { playTone(2500, 'square', 0.02, 0.003); },
    buy: () => { playTone(1200, 'sine', 0.1, 0.05); },
    error: () => { playTone(150, 'sawtooth', 0.2, 0.1); },
    delete: () => { playTone(300, 'sawtooth', 0.1, 0.05); playTone(100, 'sawtooth', 0.2, 0.1, 0.05); },
    boss: () => { playTone(55, 'sawtooth', 1.0, 0.5); }
};

export const AudioMgr = {
    resume: () => { if (audioCtx.state === 'suspended') audioCtx.resume(); },
    toggleMute: () => { isMuted = !isMuted; return isMuted; },
    isMuted: () => isMuted,
    startBGM: (state) => {
        if (bgmInterval) clearInterval(bgmInterval);
        bgmInterval = setInterval(() => {
            if (isMuted || state.isGameOver) return;
            let track = !state.isStarted ? TRACKS.LOBBY : (state.enemies.some(e => e.isBoss) ? TRACKS.BOSS : TRACKS.BATTLE);
            const freq = track[bgmStep % track.length];
            if (freq > 0) playTone(freq, 'triangle', 0.12, 0.02);
            if (bgmStep % 4 === 0) playTone(40, 'sine', 0.2, 0.05); bgmStep++;
        }, 140);
    }
};
