import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Stars, Text, Float, MeshWobbleMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Constants
const PITCHER_POS = new THREE.Vector3(0, 1, -20);
const BATTER_POS = new THREE.Vector3(0, 1, 5);
const BALL_START_POS = new THREE.Vector3(0, 1.5, -18);
const STRIKE_ZONE_POS = new THREE.Vector3(0, 1.2, 4);
const BASE_POSITIONS = [
    new THREE.Vector3(0, 0.02, 5),    // Home
    new THREE.Vector3(12, 0.02, -5),  // 1st
    new THREE.Vector3(0, 0.02, -15), // 2nd
    new THREE.Vector3(-12, 0.02, -5), // 3rd
];

// --- Components ---

function BaseballField() {
    return (
        <group>
            {/* Grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[50, 64]} />
                <meshStandardMaterial color="#2d5a27" />
            </mesh>
            {/* Infield Dirt - Diamond shape */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, -5]} receiveShadow>
                <planeGeometry args={[22, 22]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            {/* Pitcher's Mound */}
            <mesh position={[0, 0.1, -15]} receiveShadow>
                <cylinderGeometry args={[2, 2.5, 0.3, 32]} />
                <meshStandardMaterial color="#a67c52" />
            </mesh>
            {/* Bases with Labels */}
            {BASE_POSITIONS.map((pos, i) => (
                <group key={i} position={pos}>
                    <mesh rotation={[-Math.PI / 2, 0, i === 0 ? 0 : Math.PI / 4]}>
                        <planeGeometry args={[0.8, 0.8]} />
                        <meshStandardMaterial color={i === 0 ? "#ffeb3b" : "white"} />
                    </mesh>
                    <Text
                        position={[0, 0.5, 0.8]}
                        rotation={[-Math.PI / 2.5, 0, 0]}
                        fontSize={0.6}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="https://fonts.gstatic.com/s/nanumgothic/v17/PN_oR5W-zW64vlp4w6gLeUhdXHfH.ttf" // Korean font support
                    >
                        {i === 0 ? "홈" : `${i}루`}
                    </Text>
                </group>
            ))}
            {/* Foul Lines */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.015, 5]}>
                <planeGeometry args={[0.1, 100]} />
                <meshStandardMaterial color="white" opacity={0.5} transparent />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.015, 5]}>
                <planeGeometry args={[0.1, 100]} />
                <meshStandardMaterial color="white" opacity={0.5} transparent />
            </mesh>

            {/* Stadium Stands */}
            <group position={[0, 0, -5]}>
                {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const radius = 45;
                    // Only show stands in the outfield/sides
                    if (Math.abs(angle) < Math.PI / 4) return null;
                    
                    return (
                        <group key={i} position={[Math.sin(angle) * radius, 2, Math.cos(angle) * radius]} rotation={[0, angle + Math.PI, 0]}>
                            <mesh castShadow receiveShadow>
                                <boxGeometry args={[20, 5, 5]} />
                                <meshStandardMaterial color="#475569" />
                            </mesh>
                            {/* Steps/Seating area */}
                            <mesh position={[0, 1.5, -1.5]} castShadow receiveShadow>
                                <boxGeometry args={[20, 1, 2]} />
                                <meshStandardMaterial color="#334155" />
                            </mesh>
                            <mesh position={[0, 0.5, -3.5]} castShadow receiveShadow>
                                <boxGeometry args={[20, 1, 2]} />
                                <meshStandardMaterial color="#334155" />
                            </mesh>
                        </group>
                    );
                })}
            </group>

            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
        </group>
    );
}

function BaseballCap({ color, visorColor = "#1e293b", rotation = [0, 0, 0], position = [0, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            {/* Crown of the cap */}
            <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Brim / Visor */}
            <mesh position={[0, 0.05, 0.25]} rotation={[0.1, 0, 0]}>
                <boxGeometry args={[0.35, 0.02, 0.3]} />
                <meshStandardMaterial color={visorColor} />
            </mesh>
        </group>
    );
}

function Pitcher({ isPitching }) {
    const group = useRef();
    useFrame((state) => {
        if (isPitching) {
            group.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.2;
        } else {
            group.current.rotation.x = 0;
        }
    });

    return (
        <group ref={group} position={PITCHER_POS}>
            {/* Simple Stylized Pitcher */}
            <mesh position={[0, 1, 0]} castShadow>
                <capsuleGeometry args={[0.4, 1, 4, 8]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>
            <mesh position={[0, 2.2, 0]} castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            <BaseballCap color="#3b82f6" position={[0, 2.2, 0]} />
        </group>
    );
}

function Fielder({ position, name }) {
    return (
        <group position={position}>
            {/* Simple Stylized Fielder */}
            <mesh position={[0, 1, 0]} castShadow>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="#34d399" />
            </mesh>
            <mesh position={[0, 2.2, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            <BaseballCap color="#065f46" position={[0, 2.2, 0]} />
            {/* Glove */}
            <mesh position={[0.4, 1.2, 0.1]}>
                <boxGeometry args={[0.2, 0.3, 0.1]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
        </group>
    );
}

function Catcher({ position }) {
    return (
        <group position={position} rotation={[0, 0, 0]}>
            {/* Crouching Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.35, 0.4, 4, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Chest Protector */}
            <mesh position={[0, 0.6, -0.15]} castShadow>
                <boxGeometry args={[0.5, 0.6, 0.2]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Head with Helmet */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            {/* Backward Cap / Helmet Brim */}
            <BaseballCap color="#ef4444" position={[0, 1.1, 0]} rotation={[0, Math.PI, 0]} />
            {/* Mask */}
            <mesh position={[0, 1.1, -0.24]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshStandardMaterial color="black" wireframe />
            </mesh>
            {/* Catcher's Mitt (Targeting the ball) */}
            <mesh position={[0.4, 0.8, -0.4]}>
                <sphereGeometry args={[0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#451a03" side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

const FIELDER_POSITIONS = [
    { pos: new THREE.Vector3(10, 0, -3), name: "1루수" },
    { pos: new THREE.Vector3(5, 0, -10), name: "2루수" },
    { pos: new THREE.Vector3(-10, 0, -3), name: "3루수" },
    { pos: new THREE.Vector3(-5, 0, -10), name: "유격수" },
    { pos: new THREE.Vector3(-25, 0, -20), name: "좌익수" },
    { pos: new THREE.Vector3(0, 0, -35), name: "중견수" },
    { pos: new THREE.Vector3(25, 0, -20), name: "우익수" },
    { pos: new THREE.Vector3(0, 0, -15), name: "투수" },
];

function Runner({ isActive, progress, isFirstPerson }) {
    const totalPositions = BASE_POSITIONS.length;
    const currentBaseIdx = Math.floor(progress) % totalPositions;
    const nextBaseIdx = (currentBaseIdx + 1) % totalPositions;
    const lerp = progress % 1;

    const currentPos = BASE_POSITIONS[currentBaseIdx];
    const nextPos = BASE_POSITIONS[nextBaseIdx];
    
    const pos = new THREE.Vector3().lerpVectors(currentPos, nextPos, lerp);
    pos.y = 1;

    // Direction vector for cap orientation
    const dir = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
    const angle = Math.atan2(dir.x, dir.z);

    const { camera } = useThree();

    useFrame(() => {
        if (isActive && isFirstPerson) {
            // First Person View Logic
            const lookAtPos = nextPos.clone().add(new THREE.Vector3(0, 1, 0));
            camera.position.copy(pos).add(new THREE.Vector3(0, 0.5, 0));
            camera.lookAt(lookAtPos);
        }
    });

    // Reset camera when isFirstPerson becomes false
    useEffect(() => {
        if (!isFirstPerson) {
            camera.position.set(0, 5, 12);
            camera.lookAt(0, 1.5, 0);
        }
    }, [isFirstPerson, camera]);

    if (!isActive || (isFirstPerson && isActive)) return null; // Hide mesh in 1st person or if inactive

    return (
        <group position={pos}>
             <mesh castShadow>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            <BaseballCap color="#ef4444" position={[0, 1.2, 0]} rotation={[0, angle, 0]} />
        </group>
    );
}

function Batter({ isSwinging, swingProgress, isRunning }) {
    const batPivotRef = useRef();

    useFrame(() => {
        if (isSwinging && batPivotRef.current) {
            // Swing animation: rotate bat from side to front
            // Start at -Math.PI/2 (right side), swing to Math.PI/2 (front/left)
            const angle = -Math.PI / 2 + swingProgress * Math.PI * 1.2;
            batPivotRef.current.rotation.y = angle;
            // Slight vertical angle during swing
            batPivotRef.current.rotation.x = Math.sin(swingProgress * Math.PI) * 0.2;
        } else if (batPivotRef.current) {
            batPivotRef.current.rotation.y = -Math.PI / 1.5;
            batPivotRef.current.rotation.x = 0.2;
        }
    });

    if (isRunning) return null;

    return (
        <group position={[-0.8, 0, 5]}>
            {/* Simple Stylized Batter Body */}
            <mesh position={[0, 1, 0]} castShadow>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, 2.2, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            {/* Batter faces pitcher (-Z), so cap brim faces -Z (rotated PI) */}
            <BaseballCap color="#ef4444" position={[0, 2.2, 0]} rotation={[0, Math.PI, 0]} />
            
            {/* Bat with Pivot (Rotation from handle) */}
            <group ref={batPivotRef} position={[0.3, 1.2, 0.2]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1]} castShadow>
                    {/* Tapered Bat: handle (0.04), barrel (0.08) */}
                    <cylinderGeometry args={[0.08, 0.04, 2, 12]} />
                    <meshStandardMaterial color="#b45309" />
                </mesh>
                {/* Grip detail */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} castShadow>
                    <cylinderGeometry args={[0.045, 0.045, 0.4, 12]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
            </group>
        </group>
    );
}

function Ball({ active, position, onMiss }) {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (active && meshRef.current) {
            meshRef.current.position.copy(position);
            meshRef.current.rotation.x += delta * 10;
            meshRef.current.rotation.y += delta * 10;

            if (position.z > 10 && active) {
                onMiss();
            }
        }
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef} castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="white" />
            {/* Red stitching effect could be added here */}
        </mesh>
    );
}

export default function BaseballGame() {
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('baseball_player_name') || '');
    const [gameState, setGameState] = useState(localStorage.getItem('baseball_player_name') ? 'MENU' : 'NAME_ENTRY'); 
    const [playerCount, setPlayerCount] = useState(0);
    const [isLobbyReady, setIsLobbyReady] = useState(false);
    const [lobbyTimer, setLobbyTimer] = useState(30); // 30초 대기 시간
    const [wins, setWins] = useState(() => Number(localStorage.getItem('baseball_wins')) || 0);
    const [runs, setRuns] = useState(0); // 실제 점수 (득점)
    const [hits, setHits] = useState(0); // 안타 개수
    const [points, setPoints] = useState(0); // 게임 점수 (기록용)
    const [combo, setCombo] = useState(0);
    const [balls, setBalls] = useState(0);
    const [strikes, setStrikes] = useState(0);
    const [outs, setOuts] = useState(0);
    const [inning, setInning] = useState(1);
    const [inningTop, setInningTop] = useState(true); // true: 플레이어 공격(회초), false: AI 공격(회말)
    const [aiRuns, setAiRuns] = useState(0);
    const [currentBatter, setCurrentBatter] = useState(1); // 1번 ~ 9번 타자 (플레이어)
    const [aiBatter, setAiBatter] = useState(1); // 1번 ~ 9번 타자 (AI)
    const [bases, setBases] = useState([false, false, false]); // [1루, 2루, 3루] 주자 여부
    const [message, setMessage] = useState({ text: '', color: '', visible: false });

    // Internal Game State
    const ballState = useRef({
        active: false,
        pos: BALL_START_POS.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        accel: new THREE.Vector3(0, 0, 0),
        hit: false,
        fielding: false,
        fielderIdx: -1,
        thrown: false,
        targetPos: null
    });

    const gameStateRef = useRef(gameState);
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const [isPitching, setIsPitching] = useState(false);
    const [isSwinging, setIsSwinging] = useState(false);
    const [swingProgress, setSwingProgress] = useState(0);
    const [ballActive, setBallActive] = useState(false);
    const [runnerProgress, setRunnerProgress] = useState(0);
    const [runnerActive, setRunnerActive] = useState(false);
    const [isFirstPerson, setIsFirstPerson] = useState(false);
    const targetBaseRef = useRef(0);

    const showMessage = (text, colorClass) => {
        setMessage({ text, color: colorClass, visible: true });
        setTimeout(() => setMessage(m => ({ ...m, visible: false })), 800);
    };

    const nextBatter = () => {
        setCurrentBatter(prev => (prev % 9) + 1);
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        if (name) {
            setPlayerName(name);
            localStorage.setItem('baseball_player_name', name);
            setGameState('MENU');
        }
    };

    const enterLobby = () => {
        setGameState('LOBBY');
        setPlayerCount(1); // 본인 입장
        setIsLobbyReady(false);
        setLobbyTimer(30);
        setInningTop(true);
    };

    // 로비 인원 모집 및 타이머 시스템
    useEffect(() => {
        let timerId;
        let clockId;

        if (gameState === 'LOBBY') {
            // 인원 모집 시뮬레이션
            if (playerCount < 18) {
                timerId = setTimeout(() => {
                    setPlayerCount(prev => prev + 1);
                }, 100 + Math.random() * 800);
            } else if (playerCount === 18) {
                setIsLobbyReady(true);
                showMessage("18명 전원 합류! 경기 준비 완료", "text-green-400");
            }

            // 30초 타이머 작동 (한 번만 설정)
            if (!clockId && playerCount === 1) { 
                clockId = setInterval(() => {
                    setLobbyTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(clockId);
                            setPlayerCount(18); // 30초 종료 시 부족한 인원을 AI로 즉시 채움
                            setIsLobbyReady(true);
                            showMessage("AI 선수들이 합류했습니다!", "text-blue-400");
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        }

        return () => {
            if (timerId) clearTimeout(timerId);
            if (clockId) clearInterval(clockId);
        };
    }, [gameState, playerCount]);

    const spawnBall = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        setRunnerActive(false);
        setRunnerProgress(0);
        
        // 투수의 인간적인 고민 시간
        const thinkingTime = 500 + Math.random() * 1500;
        
        setTimeout(() => {
            if (gameStateRef.current !== 'PLAYING') return;
            setIsPitching(true);
            
            setTimeout(() => {
                if (gameStateRef.current !== 'PLAYING') return;
                
                ballState.current.active = true;
                ballState.current.pos.copy(BALL_START_POS);
                
                // 스트라이크 확률 대폭 상향 (85%)
                const isStrike = Math.random() > 0.15; 
                
                // 구종 선택
                const pitchType = Math.random();
                let speed;
                
                if (pitchType < 0.5) {
                    // 패스트볼 (직구)
                    speed = 28 + Math.random() * 5;
                    ballState.current.vel.set(0, 0, speed);
                    ballState.current.accel.set(0, -0.5, 0); // 거의 안 떨어짐
                } else if (pitchType < 0.8) {
                    // 커브
                    speed = 18 + Math.random() * 3;
                    ballState.current.vel.set(0, 3 + Math.random() * 1, speed);
                    ballState.current.accel.set(0, -6, 0); // 적당히 떨어짐
                } else {
                    // 체인지업
                    speed = 15 + Math.random() * 2;
                    ballState.current.vel.set(0, 1, speed);
                    ballState.current.accel.set(0, -3, 0);
                }

                // 스트라이크 여부에 따른 정확한 좌표 보정 (도착 지점 기준)
                if (isStrike) {
                    ballState.current.pos.x = (Math.random() - 0.5) * 0.6;
                    ballState.current.pos.y = 1.1 + (Math.random() - 0.5) * 0.4;
                } else {
                    // 볼인 경우 확연하게 빠지도록 설정
                    const side = Math.random() > 0.5 ? 1 : -1;
                    ballState.current.pos.x = side * (1.0 + Math.random() * 0.5);
                    ballState.current.pos.y = 1.2 + (Math.random() - 0.5) * 1.0;
                }

                ballState.current.hit = false;
                setBallActive(true);
                setIsPitching(false);
            }, 800);
        }, thinkingTime);
    };

    const handleOut = (msg) => {
        showMessage(msg || "아웃!", "text-red-600");
        setStrikes(0);
        setBalls(0);
        nextBatter(); 
        setOuts(o => {
            const nextOuts = o + 1;
            if (nextOuts >= 3) {
                // 이닝 종료 시 베이스 초기화
                setBases([false, false, false]);
                if (inningTop) {
                    setInningTop(false);
                    showMessage(`${inning}회초 종료! 공수 교대 (AI 공격)`, "text-yellow-400");
                } else {
                    // 이닝 종료
                    setInning(i => {
                        if (i >= 9) {
                            setGameState('GAMEOVER');
                            if (runs > aiRuns) {
                                setWins(prevWins => {
                                    const nextWins = prevWins + 1;
                                    localStorage.setItem('baseball_wins', nextWins);
                                    return nextWins;
                                });
                            }
                            return i;
                        }
                        setInningTop(true);
                        showMessage(`${i}회말 종료! ${i + 1}회초 시작`, "text-yellow-400");
                        return i + 1;
                    });
                }
                return 0; // 아웃 초기화
            }
            return nextOuts;
        });
    };

    const handleWalk = () => {
        setStrikes(0);
        setBalls(0);
        nextBatter(); 
        
        // 볼넷 진루 로직 (Force Play)
        setBases(prev => {
            const next = [...prev];
            if (!next[0]) { // 1루가 비었으면 1루만 채움
                next[0] = true;
            } else if (!next[1]) { // 1루가 있고 2루가 비었으면 2루까지 채움
                next[1] = true;
            } else if (!next[2]) { // 1, 2루가 있고 3루가 비었으면 3루까지 채움
                next[2] = true;
            } else { // 만루인 경우 득점
                if (inningTop) setRuns(r => r + 1);
                else setAiRuns(r => r + 1);
                showMessage("밀어내기 볼넷! 1점 득점!", "text-yellow-400");
            }
            return next;
        });

        // 애니메이션을 위해 주자 활성화 (단순화하여 1루로 가는 연출만)
        setRunnerActive(true);
        const startTime = Date.now();
        const animateWalk = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 1.0; 
            if (progress < 1) {
                setRunnerProgress(progress);
                requestAnimationFrame(animateWalk);
            } else {
                setRunnerProgress(1);
                setTimeout(() => {
                    setRunnerActive(false);
                    setRunnerProgress(0);
                    spawnBall();
                }, 500);
            }
        };
        animateWalk();
    };

    const handleMiss = () => {
        if (!ballState.current.active || ballState.current.hit) return;
        
        ballState.current.active = false;
        setBallActive(false);
        setCombo(0);

        // 스트라이크 판정 (X: -0.6 ~ 0.6, Y: 0.7 ~ 1.7)
        const isStrikeZone = Math.abs(ballState.current.pos.x) < 0.6 && 
                             ballState.current.pos.y > 0.7 && 
                             ballState.current.pos.y < 1.7;

        if (isStrikeZone) {
            setStrikes(s => {
                const nextStrikes = s + 1;
                if (nextStrikes >= 3) {
                    handleOut("삼진 아웃!");
                    return 0;
                } else {
                    showMessage("스트라이크!", "text-red-500");
                    return nextStrikes;
                }
            });
        } else {
            // 볼 판정
            setBalls(b => {
                const nextBalls = b + 1;
                if (nextBalls >= 4) {
                    showMessage("볼넷! 1루 진루!", "text-green-500");
                    handleWalk();
                    return 0;
                } else {
                    showMessage("볼!", "text-green-400");
                    return nextBalls;
                }
            });
        }
        
        setTimeout(() => {
            if (gameStateRef.current === 'PLAYING' && balls < 4 && strikes < 3) spawnBall();
        }, 1500);
    };

    const handleSwing = () => {
        if (gameState !== 'PLAYING') return;

        // 주자가 활성화된 상태에서 클릭하면 달리기 (플레이어 공격 시)
        if (runnerActive && inningTop) {
            setRunnerProgress(prev => {
                const next = prev + 0.15; // 클릭당 전진 거리
                if (next >= targetBaseRef.current) {
                    return targetBaseRef.current;
                }
                return next;
            });
            return;
        }

        if (isSwinging || !inningTop) return; // AI 공격시에는 플레이어가 스윙 못함

        setIsSwinging(true);
        let p = 0;
        const startTime = Date.now();
        const duration = 300; // 300ms swing

        const animateSwing = () => {
            const now = Date.now();
            const progress = (now - startTime) / duration;
            if (progress < 1) {
                setSwingProgress(progress);
                
                // Hit Detection during swing
                if (ballState.current.active && !ballState.current.hit && progress > 0.4 && progress < 0.6) {
                    const dist = ballState.current.pos.distanceTo(STRIKE_ZONE_POS);
                    const dx = Math.abs(ballState.current.pos.x - STRIKE_ZONE_POS.x);
                    const dy = Math.abs(ballState.current.pos.y - STRIKE_ZONE_POS.y);
                    const dz = Math.abs(ballState.current.pos.z - STRIKE_ZONE_POS.z);

                    if (dz < 1.0 && dx < 0.8 && dy < 0.8) {
                        handleHit(dx, dy);
                    }
                }
                
                requestAnimationFrame(animateSwing);
            } else {
                setIsSwinging(false);
                setSwingProgress(0);
            }
        };
        requestAnimationFrame(animateSwing);
    };

    const handleHit = (dx, dy) => {
        ballState.current.hit = true;
        ballState.current.fielding = false;
        ballState.current.thrown = false;
        
        const totalDist = Math.sqrt(dx*dx + dy*dy);
        
        let hitType = "";
        let pointsValue = 0;
        let color = "";
        const currentCombo = combo + 1;
        setCombo(currentCombo);

        let hitBases = 0; // 몇 루타인지 (1, 2, 3, 4: 홈런)

        if (totalDist < 0.2) {
            hitType = "홈런!!";
            pointsValue = 2000 + (currentCombo * 200);
            color = "text-yellow-400";
            ballState.current.vel.set((Math.random()-0.5)*10, 25, -50);
            hitBases = 4;
        } else if (totalDist < 0.5) {
            hitType = "안타!";
            pointsValue = 500 + (currentCombo * 50);
            color = "text-green-400";
            
            // 타구의 방향 결정
            const hitAngle = (Math.random() - 0.5) * Math.PI; 
            const hitPower = 30 + Math.random() * 20;
            ballState.current.vel.set(Math.sin(hitAngle) * hitPower, 10 + Math.random() * 10, -Math.abs(Math.cos(hitAngle) * hitPower));
            
            hitBases = Math.random() > 0.8 ? 2 : 1;
        } else {
            hitType = "파울!";
            pointsValue = 50;
            color = "text-blue-300";
            const side = Math.random() > 0.5 ? 1 : -1;
            ballState.current.vel.set(side * (25 + Math.random() * 15), 15 + Math.random() * 10, -5 + Math.random() * 10);
            hitBases = 0;
            
            setStrikes(s => (s < 2 ? s + 1 : s));
            setCombo(0);
        }

        setPoints(p => p + pointsValue);
        showMessage(hitType, color);
        
        if (hitBases > 0) {
            setHits(h => h + 1);
            targetBaseRef.current = hitBases;
            
            // 주자 달리기 시퀀스 시작
            setRunnerActive(true);
            if (inningTop) {
                setIsFirstPerson(true);
                showMessage("클릭하여 루를 향해 달리세요!!", "text-blue-400");
            }

            // 수비 플레이 예약
            if (hitBases < 4) {
                setTimeout(() => {
                    if (!ballState.current.hit) return;
                    ballState.current.fielding = true;
                    ballState.current.fielderIdx = Math.floor(Math.random() * FIELDER_POSITIONS.length);
                    
                    setTimeout(() => {
                        if (!ballState.current.hit) return;
                        ballState.current.thrown = true;
                        ballState.current.targetPos = BASE_POSITIONS[hitBases].clone();
                        showMessage(`${FIELDER_POSITIONS[ballState.current.fielderIdx].name}가 공을 잡았습니다!`, "text-blue-400");
                    }, 800);
                }, 1000);
            }

            // 달리기 판정 루프
            let checkInterval = setInterval(() => {
                if (!ballState.current.hit) {
                    clearInterval(checkInterval);
                    return;
                }

                // AI 공격이면 자동으로 달리기 진행
                if (!inningTop) {
                    setRunnerProgress(prev => prev + 0.02);
                }

                setRunnerProgress(currentP => {
                    // 수비 성공 판정: 공이 베이스에 먼저 도착하면 아웃
                    if (ballState.current.thrown && ballState.current.pos.distanceTo(ballState.current.targetPos) < 1.5) {
                        setRunnerActive(false);
                        setIsFirstPerson(false);
                        ballState.current.hit = false;
                        setBallActive(false);
                        handleOut("태그 아웃! 수비 성공!");
                        clearInterval(checkInterval);
                        return 0;
                    }

                    if (currentP >= hitBases) {
                        // 세입 성공
                        clearInterval(checkInterval);
                        setIsFirstPerson(false);
                        
                        setBases(prev => {
                            const next = [false, false, false];
                            let scored = 0;
                            if (hitBases === 1) { 
                                if (prev[2]) scored++;
                                next[2] = prev[1]; next[1] = prev[0]; next[0] = true;
                            } else if (hitBases === 2) {
                                if (prev[2]) scored++; if (prev[1]) scored++;
                                next[2] = prev[0]; next[1] = true;
                            } else if (hitBases === 4) {
                                if (prev[0]) scored++; if (prev[1]) scored++; if (prev[2]) scored++; scored++;
                            }
                            if (scored > 0) {
                                if (inningTop) setRuns(r => r + scored);
                                else setAiRuns(r => r + scored);
                                showMessage(`${scored}점 득점!`, "text-yellow-400");
                            }
                            return next;
                        });

                        setTimeout(() => {
                            setRunnerActive(false);
                            setRunnerProgress(0);
                            setStrikes(0);
                            setBalls(0);
                            ballState.current.hit = false;
                            setBallActive(false);
                            nextBatter();
                            spawnBall();
                        }, 500);
                        return hitBases === 4 ? 4 : hitBases;
                    }
                    return currentP;
                });
            }, 50);
        } else {
            // 파울 등 진루하지 않는 경우
            setTimeout(() => {
                ballState.current.active = false;
                setBallActive(false);
                if (gameStateRef.current === 'PLAYING') spawnBall();
            }, 2000);
        }
    };

    // AI 공격 시뮬레이션
    useEffect(() => {
        if (gameState === 'PLAYING' && !inningTop && !ballActive && !isPitching) {
            // AI가 공격일 때는 투수가 공을 던지고 AI가 랜덤하게 친다.
            const aiTimer = setTimeout(() => {
                spawnBall(); // AI를 향해 투구
                
                // 공이 날아오는 타이밍(약 1초 후)에 AI가 랜덤한 확률로 스윙
                setTimeout(() => {
                    if (gameStateRef.current !== 'PLAYING') return;
                    
                    const aiSwingChance = Math.random();
                    if (aiSwingChance > 0.3) { // 70% 확률로 스윙
                        setIsSwinging(true);
                        
                        // 스윙 애니메이션
                        let p = 0;
                        const animateSwing = () => {
                            p += 0.05;
                            if (p < 1) {
                                setSwingProgress(p);
                                requestAnimationFrame(animateSwing);
                            } else {
                                setIsSwinging(false);
                                setSwingProgress(0);
                            }
                        };
                        requestAnimationFrame(animateSwing);

                        // 히트 판정 (플레이어보다 약간 낮은 정확도)
                        const isHit = Math.random() > 0.4; // 60% 확률로 맞춤
                        if (isHit) {
                            // 가상의 dx, dy를 생성하여 hit 함수 호출
                            const fakeDx = Math.random() * 0.8;
                            const fakeDy = Math.random() * 0.8;
                            handleHit(fakeDx, fakeDy);
                        }
                    }
                }, 1100); 
                
            }, 1500);
            return () => clearTimeout(aiTimer);
        }
    }, [gameState, inningTop, ballActive, isPitching, outs]);

    const startGame = () => {
        setRuns(0);
        setAiRuns(0);
        setHits(0);
        setPoints(0);
        setCombo(0);
        setStrikes(0);
        setBalls(0);
        setOuts(0);
        setInning(1);
        setInningTop(true);
        setCurrentBatter(1);
        setAiBatter(1);
        setBases([false, false, false]);
        setGameState('PLAYING');
        setTimeout(spawnBall, 1000);
    };

    // Logic Update Loop
    useEffect(() => {
        let frame;
        const update = () => {
            if (ballState.current.active) {
                if (!ballState.current.hit) {
                    // 투구 중 물리 엔진 적용 (가속도 -> 속도 -> 위치)
                    ballState.current.vel.addScaledVector(ballState.current.accel, 0.016);
                    ballState.current.pos.addScaledVector(ballState.current.vel, 0.016);
                } else {
                    // 타격 또는 수비 상황 물리
                    if (ballState.current.thrown) {
                        // 수비수의 송구: 베이스로 빠르게 이동
                        const target = ballState.current.targetPos.clone().add(new THREE.Vector3(0, 1, 0));
                        ballState.current.pos.lerp(target, 0.15); 
                    } else if (ballState.current.fielding) {
                        // 수비수가 공을 잡음: 수비수 위치로 끌어당김
                        const fPos = FIELDER_POSITIONS[ballState.current.fielderIdx].pos.clone().add(new THREE.Vector3(0, 1.2, 0));
                        ballState.current.pos.lerp(fPos, 0.2);
                    } else {
                        // 타구 날아가는 중
                        ballState.current.vel.y -= 0.5; // 중력
                        ballState.current.pos.addScaledVector(ballState.current.vel, 0.016);
                        if (ballState.current.pos.y < 0) {
                            ballState.current.pos.y = 0;
                            ballState.current.vel.y *= -0.4; // 바닥에 튕김
                            ballState.current.vel.multiplyScalar(0.95);
                        }
                    }
                }
            }
            frame = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="relative w-full h-screen bg-slate-900 overflow-hidden select-none touch-manipulation" 
             onMouseDown={handleSwing}
             onKeyDown={(e) => { if (e.code === 'Space') handleSwing(); }}
             tabIndex="0">
            
            <Suspense fallback={<div className="text-white flex items-center justify-center h-full">Loading 3D World...</div>}>
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={50} />
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={false} 
                        minPolarAngle={Math.PI/4} 
                        maxPolarAngle={Math.PI/2}
                        target={[0, 1.5, 0]}
                    />
                    
                    <BaseballField />
                    <Pitcher isPitching={isPitching} />
                    <Catcher position={[0, 0, 6]} />
                    <Batter isSwinging={isSwinging} swingProgress={swingProgress} isRunning={runnerActive} />
                    
                    {/* 수비수들 배치 */}
                    {FIELDER_POSITIONS.map((f, i) => (
                        <Fielder key={i} position={f.pos} name={f.name} />
                    ))}

                    {/* 현재 베이스에 있는 주자들 표시 */}
                    {bases[0] && <Runner isActive={true} progress={1} isFirstPerson={false} />}
                    {bases[1] && <Runner isActive={true} progress={2} isFirstPerson={false} />}
                    {bases[2] && <Runner isActive={true} progress={3} isFirstPerson={false} />}
                    
                    <Runner isActive={runnerActive} progress={runnerProgress} isFirstPerson={isFirstPerson} />
                    <Ball active={ballActive} position={ballState.current.pos} onMiss={handleMiss} />
                    
                    <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
                    <Environment preset="park" />
                </Canvas>
            </Suspense>

            {/* UI Overlay */}
            <div className="absolute top-5 left-5 text-white font-bold drop-shadow-lg pointer-events-none">
                <div className="bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/10 w-64">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/20">
                        <div className="text-3xl text-yellow-400">{inning}회{inningTop ? '초' : '말'}</div>
                        <div className={`text-sm px-2 py-0.5 rounded ${inningTop ? 'bg-blue-500/50 text-blue-100' : 'bg-red-500/50 text-red-100'}`}>
                            {inningTop ? currentBatter : aiBatter}번 타자
                        </div>
                    </div>
                    
                    {/* 점수판 */}
                    <div className="flex flex-col gap-1 mb-3 text-lg">
                        <div className={`flex justify-between ${inningTop ? 'text-yellow-300' : 'opacity-70'}`}>
                            <span>{playerName || 'USER'}</span>
                            <span>{runs}</span>
                        </div>
                        <div className={`flex justify-between ${!inningTop ? 'text-yellow-300' : 'opacity-70'}`}>
                            <span>COM</span>
                            <span>{aiRuns}</span>
                        </div>
                        <div className="text-xs opacity-50 mt-2 flex justify-between border-t border-white/20 pt-1">
                            <span>안타: {hits}</span>
                            <span>승수: {wins} {wins >= 9 && "👑"}</span>
                        </div>
                    </div>

                    {/* Bases Diamond UI */}
                    <div className="relative w-12 h-12 mx-auto mb-4 rotate-45 border-2 border-white/20">
                        <div className={`absolute -top-1 -left-1 w-3 h-3 border border-white/40 ${bases[1] ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-800'}`} title="2루" />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 border border-white/40 ${bases[0] ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-800'}`} title="1루" />
                        <div className={`absolute -bottom-1 -left-1 w-3 h-3 border border-white/40 ${bases[2] ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-800'}`} title="3루" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border border-white/40 bg-yellow-400" title="홈" />
                    </div>
                    
                    <div className="space-y-1 border-t border-white/20 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="w-4 text-green-400">B</span>
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${i < balls ? 'bg-green-500' : 'bg-slate-700'}`} />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 text-orange-400">S</span>
                            <div className="flex gap-1">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${i < strikes ? 'bg-orange-500' : 'bg-slate-700'}`} />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 text-red-500">O</span>
                            <div className="flex gap-1">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-full ${i < outs ? 'bg-red-500' : 'bg-slate-700'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-2 text-sm opacity-70">기록 점수: {points}</div>
            </div>

            {/* Message Box */}
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-200 z-10 ${message.visible ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className={`text-7xl font-black ${message.color} drop-shadow-[0_5px_5px_rgba(0,0,0,1)]`}>{message.text}</h2>
            </div>

            {/* Menus */}
            {gameState === 'NAME_ENTRY' && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-30">
                    <h1 className="text-5xl font-black text-yellow-400 mb-12 italic transform -skew-x-12">PLAYER REGISTRATION</h1>
                    <form onSubmit={handleNameSubmit} className="flex flex-col items-center gap-6 w-full max-w-sm">
                        <input 
                            name="name"
                            type="text" 
                            placeholder="선수 이름을 입력하세요"
                            className="w-full bg-slate-800 border-2 border-blue-500 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-center"
                            autoFocus
                            required
                            defaultValue={playerName}
                        />
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-2xl font-bold shadow-xl active:scale-95 transition-transform"
                        >
                            등록 완료
                        </button>
                    </form>
                </div>
            )}

            {gameState === 'MENU' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                    <h1 className="text-6xl mb-4 font-black text-yellow-400 italic transform -skew-x-12">3D 마구마구</h1>
                    <div className="mb-8 text-xl opacity-60">PRO BASEBALL SIMULATOR</div>
                    
                    <p className="text-xl mb-12 text-center px-8 opacity-80 max-w-md">
                        대한민국 최고의 야구 게임에 오신 것을 환영합니다!<br />
                        <span className="text-sm text-red-400 font-bold mt-4 block">※ 실제 경기를 위해 양 팀 18명이 모여야 시작됩니다.</span>
                    </p>

                    <button
                        onClick={(e) => { e.stopPropagation(); enterLobby(); }}
                        className="bg-red-600 hover:bg-red-500 text-white px-16 py-5 rounded-full text-2xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                    >
                        대기실 입장하기
                    </button>
                </div>
            )}

            {gameState === 'LOBBY' && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white z-20 overflow-y-auto py-10">
                    <h2 className="text-4xl font-bold mb-2">선수 대기실</h2>
                    <p className="text-blue-400 mb-2 animate-pulse">다른 선수를 기다리는 중... ({playerCount}/18)</p>
                    <div className="mb-4 text-sm opacity-60">접속 중: <span className="text-yellow-400 font-bold">{playerName}</span></div>
                    {lobbyTimer > 0 && !isLobbyReady && (
                        <p className="text-red-400 text-sm mb-8">
                            {lobbyTimer}초 후 부족한 인원은 AI로 채워집니다.
                        </p>
                    )}
                    {isLobbyReady && <p className="text-green-400 font-bold mb-8">모든 선수가 준비되었습니다!</p>}
                    
                    <div className="grid grid-cols-6 gap-4 mb-12 max-w-2xl w-full px-4">
                        {[...Array(18)].map((_, i) => (
                            <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500 ${i < playerCount ? 'bg-blue-600 border-blue-400 scale-100 opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 scale-90 opacity-40'}`}>
                                <div className="text-2xl mb-1">{i < playerCount ? '👤' : '💤'}</div>
                                <div className="text-[10px] font-bold">{i < playerCount ? `Player ${i+1}` : 'Empty'}</div>
                            </div>
                        ))}
                    </div>

                    <div className="w-full max-w-md bg-slate-800 h-4 rounded-full overflow-hidden mb-10 border border-white/10">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(playerCount / 18) * 100}%` }}
                        />
                    </div>

                    <button
                        disabled={!isLobbyReady}
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className={`px-16 py-5 rounded-full text-2xl font-bold transition-all ${isLobbyReady ? 'bg-green-600 hover:bg-green-500 scale-110 shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-bounce' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
                    >
                        {isLobbyReady ? '플레이볼! 경기 시작' : '인원을 모집 중입니다...'}
                    </button>
                    
                    {!isLobbyReady && (
                        <p className="mt-4 text-sm text-slate-500">양 팀 9명씩 총 18명의 선수가 입장해야 합니다.</p>
                    )}
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                    <h1 className="text-6xl mb-4 font-black text-yellow-400 italic transform -skew-x-12">3D 마구마구</h1>
                    <div className="text-center mb-8 p-8 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
                        <h2 className="text-4xl text-red-500 font-bold mb-4">GAME SET!</h2>
                        <div className="text-2xl mb-4 font-bold flex justify-center gap-8">
                            <div className={runs > aiRuns ? 'text-yellow-400' : 'opacity-50'}>
                                {playerName || 'USER'}<br/>{runs}
                            </div>
                            <div>:</div>
                            <div className={aiRuns > runs ? 'text-yellow-400' : 'opacity-50'}>
                                COM<br/>{aiRuns}
                            </div>
                        </div>
                        <h3 className="text-3xl font-black mb-4">
                            {runs > aiRuns ? <span className="text-blue-400">승리! WIN!</span> : runs < aiRuns ? <span className="text-red-400">패배... LOSE</span> : <span className="text-gray-400">무승부 DRAW</span>}
                        </h3>
                        <p className="text-sm opacity-70">현재 코치 승수: {wins}승 {wins >= 9 && "👑"}</p>
                    </div>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); enterLobby(); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-16 py-5 rounded-full text-2xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                    >
                        다시 대기실로
                    </button>
                </div>
            )}
        </div>
    );
}
