import React, { useState, useEffect, useRef } from 'react';
import proverbsData from './proverbs.json';

export default function ProverbGame() {
    const [screen, setScreen] = useState('start'); // start, quiz, result, ranking, warning
    const [mode, setMode] = useState('mixed');

    // Game State
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [timeLeft, setTimeLeft] = useState(60);
    const [maxTime, setMaxTime] = useState(60);
    const [qIndex, setQIndex] = useState(0);
    const [pool, setPool] = useState([]);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState({ show: false, char: '', color: '' });
    const [shuffledOptions, setShuffledOptions] = useState([]);

    // Input
    const [inputVal, setInputVal] = useState('');
    const timerRef = useRef(null);

    // AI Modal
    const [showAI, setShowAI] = useState(false);
    const [aiContent, setAIContent] = useState('');

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const startGame = (selectedMode) => {
        setMode(selectedMode);
        setScore(0);
        setLives(5);
        setHistory([]);

        // Shuffle Pool
        const lv1 = proverbsData.filter(p => p.lv === 1).sort(() => Math.random() - 0.5);
        const lv2 = proverbsData.filter(p => p.lv === 2).sort(() => Math.random() - 0.5);
        const lv3 = proverbsData.filter(p => p.lv === 3).sort(() => Math.random() - 0.5);
        setPool([...lv1, ...lv2, ...lv3]);

        setQIndex(0);
        setInputVal('');
        setScreen('quiz');
        nextQuestion(0, [...lv1, ...lv2, ...lv3], selectedMode);
    };

    const nextQuestion = (idx, currentPool, currentMode = mode) => {
        if (idx >= currentPool.length) {
            // Infinite mode: reshuffle
            currentPool.sort(() => Math.random() - 0.5);
            idx = 0;
        }
        setQIndex(idx);
        const q = currentPool[idx];

        // Determine type
        const isSubjective = (currentMode === 'subjective') || (currentMode === 'mixed' && (idx % 5 < 3)); // 3 subjective, 2 objective cycle? 
        // User code: (qCount - 1) % CYCLE_SIZE < SUB_COUNT (3) -> 0,1,2 Subj, 3,4 Obj
        // Here idx starts at 0.

        const typeIsSubjective = (currentMode === 'subjective') || (currentMode === 'mixed' && (idx % 5 < 3));
        const limit = typeIsSubjective ? 60 : 30;

        setMaxTime(limit);
        setTimeLeft(limit);
        // Shuffle options once when question loads
        if (!typeIsSubjective && q.options) {
            setShuffledOptions([...q.options].sort(() => Math.random() - 0.5));
        }
        setInputVal('');

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 0.1) {
                    handleTimeout(currentPool, idx);
                    return 0;
                }
                return t - 0.1;
            });
        }, 100);
    };

    const handleTimeout = (currentPool, idx) => {
        clearInterval(timerRef.current);
        const q = currentPool[idx];
        showFeedback('❌', 'text-rose-500');

        setHistory(h => [...h, { q: q.q, a: q.a, m: q.m, result: 'TIMEOUT' }]);
        setLives(l => {
            const nl = l - 1;
            if (nl <= 0) setTimeout(() => finishGame(), 500);
            else setTimeout(() => nextQuestion(idx + 1, currentPool), 500);
            return nl;
        });

        // Push wrong to end of pool?
        currentPool.push(q);
    };

    const checkAnswer = (answer) => {
        clearInterval(timerRef.current);
        const q = pool[qIndex];
        const isCorrect = answer.trim() === q.a;

        setHistory(h => [...h, { q: q.q, a: q.a, m: q.m, result: isCorrect ? 'O' : 'X' }]);

        if (isCorrect) {
            const points = (mode === 'objective' || (!isSubjectiveCurrent())) ? 2 : 3;
            setScore(s => s + points);
            showFeedback('⭕', 'text-green-500');
            setTimeout(() => nextQuestion(qIndex + 1, pool), 500);
        } else {
            showFeedback('❌', 'text-rose-500');
            setLives(l => {
                const nl = l - 1;
                if (nl <= 0) setTimeout(() => finishGame(), 500);
                else setTimeout(() => nextQuestion(qIndex + 1, pool), 500);
                return nl;
            });
            pool.push(q);
        }
    };

    const isSubjectiveCurrent = () => {
        if (mode === 'subjective') return true;
        if (mode === 'objective') return false;
        return (qIndex % 5 < 3);
    };

    const showFeedback = (char, color) => {
        setFeedback({ show: true, char, color });
        setTimeout(() => setFeedback({ show: false, char: '', color: '' }), 600);
    };

    const finishGame = () => {
        clearInterval(timerRef.current);
        setScreen('result');
    };

    // AI logic disabled for now or mock
    const requestExplanation = (q, a) => {
        setAIContent(`AI 구루: "${q}" 속담은 "${a}"(이)라는 뜻이 담겨있어요. 예를 들어, 게임을 할 때... (AI 연동 필요)`);
        setShowAI(true);
    };

    const currentQ = pool[qIndex];

    return (
        <div data-id="proverb-container" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 font-sans select-none">

            {/* Game Container */}
            <div data-id="proverb-game" className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden border-4 border-white/50">

                {/* --- Start Screen --- */}
                {screen === 'start' && (
                    <div data-id="proverb-start" className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 data-id="proverb-start-title" className="text-6xl font-black text-indigo-600 mb-2">⚡속담 파워⚡</h1>
                        <p data-id="proverb-start-subtitle" className="text-xl text-indigo-400 font-bold mb-8 italic tracking-widest uppercase">Infinite Challenge</p>

                        <div data-id="proverb-mode-buttons" className="space-y-4 mb-6">
                            <button data-id="proverb-subjective-btn" onClick={() => startGame('subjective')} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-4 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all">
                                ⌨️ 주관식 모드
                                <span data-id="proverb-subjective-desc" className="block text-xs font-normal opacity-90">60초 제한 (3점)</span>
                            </button>
                            <button data-id="proverb-objective-btn" onClick={() => startGame('objective')} className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all">
                                🖱️ 객관식 모드
                                <span data-id="proverb-objective-desc" className="block text-xs font-normal opacity-90">30초 제한 (2점)</span>
                            </button>
                            <button data-id="proverb-mixed-btn" onClick={() => startGame('mixed')} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold py-4 rounded-2xl border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all">
                                🔄 혼합 모드
                                <span data-id="proverb-mixed-desc" className="block text-xs font-normal opacity-90">주관식 6 : 객관식 4 (3점)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Quiz Screen --- */}
                {screen === 'quiz' && currentQ && (
                    <div data-id="proverb-quiz" className="animate-in fade-in duration-300">
                        {/* Timer Bar */}
                        <div data-id="proverb-timer-bar" className="w-full bg-indigo-100 h-5 rounded-full mb-4 overflow-hidden border-2 border-indigo-50">
                            <div
                                data-id="proverb-timer-fill"
                                className={`h-full transition-all duration-100 ease-linear ${timeLeft < 5 ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
                            ></div>
                        </div>

                        {/* Top Stats */}
                        <div data-id="proverb-stats" className="flex justify-between items-center mb-2">
                            <div data-id="proverb-stats-left" className="flex flex-col">
                                <span data-id="proverb-score" className="text-2xl font-bold text-indigo-600 leading-tight">파워: {score}</span>
                                <span data-id="proverb-time" className={`text-xl font-bold font-mono ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>{timeLeft.toFixed(1)}s</span>
                            </div>
                            <div data-id="proverb-stats-right" className="flex flex-col items-end">
                                <div data-id="proverb-lives" className="text-2xl flex gap-1 mb-1">
                                    {"❤️".repeat(lives)}{"🖤".repeat(5 - lives)}
                                </div>
                                <div data-id="proverb-qnum" className="px-3 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-sm">
                                    Q.{qIndex + 1}
                                </div>
                            </div>
                        </div>

                        {/* Question Badge */}
                        <div data-id="proverb-badge-row" className="flex justify-between items-center mb-4">
                            <span data-id="proverb-type-badge" className={`px-4 py-1 rounded-full text-white font-bold text-sm shadow-md uppercase ${isSubjectiveCurrent() ? 'bg-indigo-600' : 'bg-green-600'}`}>
                                {isSubjectiveCurrent() ? '주관식' : '객관식'}
                            </span>
                            <button data-id="proverb-giveup-btn" onClick={() => setScreen('warning')} className="bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-500 text-sm font-bold px-4 py-1.5 rounded-full border border-gray-200">🏳️ 포기</button>
                        </div>

                        {/* Question Card */}
                        <div data-id="proverb-question-card" className="bg-indigo-50/50 rounded-3xl p-6 mb-4 text-center min-h-[160px] flex flex-col items-center justify-center border-4 border-white shadow-inner relative">
                            <h2 data-id="proverb-question-text" className="text-3xl font-bold text-gray-800 break-keep mb-4 leading-relaxed">{currentQ.q}</h2>
                            {isSubjectiveCurrent() && (
                                <div data-id="proverb-hint" className="bg-white/60 px-4 py-1 rounded-xl border border-indigo-100">
                                    <span data-id="proverb-hint-label" className="text-indigo-400 text-lg">💡 힌트: </span>
                                    <span data-id="proverb-hint-value" className="text-indigo-600 text-2xl font-bold tracking-widest">{currentQ.h}</span>
                                </div>
                            )}
                        </div>

                        {/* Inputs */}
                        {isSubjectiveCurrent() ? (
                            <div data-id="proverb-subjective-input" className="space-y-4">
                                <input
                                    data-id="proverb-answer-input"
                                    type="text"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer(inputVal)}
                                    placeholder="정답 입력"
                                    className="w-full p-5 rounded-2xl border-4 border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200 outline-none text-center text-3xl font-bold text-indigo-700 bg-white/80 transition-all placeholder:text-indigo-200"
                                    autoFocus
                                />
                                <button data-id="proverb-submit-btn" onClick={() => checkAnswer(inputVal)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-2xl font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1">에너지 발사! ⚡</button>
                            </div>
                        ) : (
                            <div data-id="proverb-objective-options" className="grid grid-cols-1 gap-3">
                                {shuffledOptions.map((opt, i) => (
                                    <button
                                        data-id={`proverb-option-${i}`}
                                        key={i}
                                        onClick={() => checkAnswer(opt)}
                                        className="bg-white hover:bg-indigo-50 border-4 border-indigo-50 hover:border-indigo-300 text-2xl font-bold py-4 rounded-2xl transition-all text-indigo-700 shadow-sm active:scale-95"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Feedback Overlay --- */}
                {feedback.show && (
                    <div data-id="proverb-feedback" className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <div data-id="proverb-feedback-char" className={`text-[10rem] drop-shadow-2xl animate-bounce ${feedback.color}`}>{feedback.char}</div>
                    </div>
                )}

                {/* --- Warning Modal --- */}
                {screen === 'warning' && (
                    <div data-id="proverb-warning-overlay" className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
                        <div data-id="proverb-warning-modal" className="bg-white rounded-[2rem] p-8 w-full max-w-xs text-center shadow-2xl border-4 border-indigo-100">
                            <div data-id="proverb-warning-icon" className="text-5xl mb-4">🏳️</div>
                            <h3 data-id="proverb-warning-title" className="text-2xl font-bold text-indigo-900 mb-2">도전을 멈출까요?</h3>
                            <button data-id="proverb-warning-confirm" onClick={() => finishGame()} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg mb-3">확인</button>
                            <button data-id="proverb-warning-cancel" onClick={() => setScreen('quiz')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl">취소</button>
                        </div>
                    </div>
                )}


                {/* --- Result Screen --- */}
                {screen === 'result' && (
                    <div data-id="proverb-result" className="text-center overflow-y-auto max-h-[85vh] custom-scroll animate-in slide-in-from-right duration-500">
                        <h2 data-id="proverb-result-title" className="text-5xl font-bold text-indigo-600 mb-4">파워 소진! 🔋</h2>
                        <div data-id="proverb-result-icon" className="text-7xl mb-6">🌩️</div>
                        <p data-id="proverb-result-score" className="text-4xl font-bold text-gray-800 mb-6">최종 파워: {score}</p>

                        <div data-id="proverb-result-history" className="mt-6 mb-8 px-1 text-left">
                            <h3 data-id="proverb-history-title" className="text-2xl font-bold text-indigo-700 mb-4 italic">📝 학습 결과표</h3>
                            <div data-id="proverb-history-table-wrapper" className="rounded-2xl border-2 border-indigo-100 overflow-hidden">
                                <table data-id="proverb-history-table" className="w-full text-left text-sm bg-white">
                                    <thead data-id="proverb-history-thead" className="bg-indigo-100 text-indigo-800 font-bold">
                                        <tr><th data-id="proverb-th-proverb" className="p-3">속담</th><th data-id="proverb-th-result" className="p-3 text-center">결과</th></tr>
                                    </thead>
                                    <tbody data-id="proverb-history-tbody">
                                        {history.map((h, i) => (
                                            <tr data-id={`proverb-history-row-${i}`} key={i} className="border-b border-indigo-50 last:border-0">
                                                <td data-id={`proverb-history-q-${i}`} className="p-3 font-bold text-gray-700">
                                                    {h.q.split('___')[0]} <span className="text-indigo-600 underline decoration-2">{h.a}</span> {h.q.split('___')[1]}
                                                </td>
                                                <td data-id={`proverb-history-r-${i}`} className={`p-3 text-center font-bold text-lg ${h.result === 'O' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {h.result === 'TIMEOUT' ? '⌛' : h.result}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <button data-id="proverb-ai-hint-btn" onClick={() => requestExplanation('예시 속담', '예시 정답')} className="hidden w-full bg-indigo-50 text-indigo-600 py-3 rounded-2xl border border-indigo-200 font-bold mb-4">
                            ✨ AI 힌트 보기 (예시)
                        </button>

                        <button data-id="proverb-retry-btn" onClick={() => setScreen('start')} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-2xl font-bold py-5 rounded-2xl transition-all shadow-xl hover:scale-105 mb-4">
                            다시 도전하기 🔄
                        </button>
                    </div>
                )}

                {/* AI Modal */}
                {showAI && (
                    <div data-id="proverb-ai-overlay" className="fixed inset-0 bg-indigo-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <div data-id="proverb-ai-modal" className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border-4 border-indigo-400">
                            <h3 data-id="proverb-ai-title" className="text-3xl font-bold text-indigo-600 mb-4">✨ AI 구루의 가이드</h3>
                            <p data-id="proverb-ai-content" className="text-xl text-gray-700 leading-relaxed mb-8">{aiContent}</p>
                            <button data-id="proverb-ai-close-btn" onClick={() => setShowAI(false)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg">이해했어요! 👍</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
