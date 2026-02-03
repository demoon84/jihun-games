import React from 'react';
import { Link } from 'react-router-dom';

const games = [
    {
        id: 'defense',
        name: '디펜스 기갑 탱크',
        desc: '전략적인 배치와 합성을 통해 몰려오는 적들을 막아내세요.',
        color: 'bg-slate-800',
        icon: '🛡️',
        path: '/defense'
    },
    {
        id: 'zombie',
        name: '수비대: 좀비 습격',
        desc: '끊임없이 몰려오는 좀비 무리로부터 생존하십시오.',
        color: 'bg-green-900',
        icon: '🧟',
        path: '/zombie'
    },
    {
        id: 'baseball',
        name: '마구마구갓',
        desc: '타이밍을 맞춰 홈런을 날리세요! 리듬과 야구의 만남.',
        color: 'bg-blue-900',
        icon: '⚾',
        path: '/baseball'
    },
    {
        id: 'proverb',
        name: '속담 파워',
        desc: '무한 난이도 속담 퀴즈! 당신의 어휘력을 테스트하세요.',
        color: 'bg-indigo-900',
        icon: '⚡',
        path: '/proverb'
    }
];

export default function Home() {
    return (
        <div data-id="home-container" className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center overflow-y-auto">
            <header data-id="home-header" className="mb-12 text-center animate-in fade-in slide-in-from-top-8 duration-700">
                <h1 data-id="home-title" className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 mb-4 drop-shadow-2xl">
                    JIHUN GAMES
                </h1>

            </header>

            <div data-id="game-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl w-full">
                {games.map((game) => (
                    <Link
                        to={game.path}
                        key={game.id}
                        data-id={`game-card-${game.id}`}
                        className={`group relative overflow-hidden rounded-3xl p-8 ${game.color} border-4 border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
                    >
                        <div data-id={`game-bg-icon-${game.id}`} className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl transform rotate-12 translate-x-4 -translate-y-4 select-none">
                            {game.icon}
                        </div>

                        <div data-id={`game-content-${game.id}`} className="relative z-10">
                            <div data-id={`game-icon-${game.id}`} className="text-6xl mb-6">{game.icon}</div>
                            <h2 data-id={`game-name-${game.id}`} className="text-3xl font-black mb-3 italic uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">
                                {game.name}
                            </h2>
                            <p data-id={`game-desc-${game.id}`} className="text-slate-300 font-bold leading-relaxed">
                                {game.desc}
                            </p>
                        </div>

                        <div data-id={`game-overlay-${game.id}`} className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </Link>
                ))}
            </div>

        </div>
    );
}
