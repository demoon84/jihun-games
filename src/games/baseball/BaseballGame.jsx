import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Stars, Text, Float, MeshWobbleMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Constants
const PITCHER_POS = new THREE.Vector3(0, 1, -20);
const BATTER_POS = new THREE.Vector3(0, 1, 5);
const BALL_START_POS = new THREE.Vector3(0, 1.5, -18);
const STRIKE_ZONE_POS = new THREE.Vector3(0, 1.2, 4);

// --- Components ---

function BaseballField() {
    return (
        <group>
            {/* Grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[50, 64]} />
                <meshStandardMaterial color="#2d5a27" />
            </mesh>
            {/* Infield Dirt */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, -5]} receiveShadow>
                <planeGeometry args={[25, 25]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            {/* Pitcher's Mound */}
            <mesh position={[0, 0.1, -18]} receiveShadow>
                <cylinderGeometry args={[2, 2.5, 0.3, 32]} />
                <meshStandardMaterial color="#a67c52" />
            </mesh>
            {/* Home Plate */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial color="white" />
            </mesh>
            {/* Foul Lines */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.015, 5]}>
                <planeGeometry args={[0.1, 100]} />
                <meshStandardMaterial color="white" opacity={0.5} transparent />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.015, 5]}>
                <planeGeometry args={[0.1, 100]} />
                <meshStandardMaterial color="white" opacity={0.5} transparent />
            </mesh>
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
        </group>
    );
}

function Batter({ isSwinging, swingProgress }) {
    const batRef = useRef();

    useFrame(() => {
        if (isSwinging) {
            // Swing animation: rotate bat from side to front
            const angle = -Math.PI / 2 + swingProgress * Math.PI;
            batRef.current.rotation.y = angle;
            batRef.current.position.x = Math.sin(angle) * 1.5;
            batRef.current.position.z = 5 + Math.cos(angle) * 1.5;
        } else {
            batRef.current.rotation.y = -Math.PI / 2;
            batRef.current.position.set(1.5, 1.2, 5);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Simple Stylized Batter */}
            <mesh position={[-1, 1, 5]} castShadow>
                <capsuleGeometry args={[0.4, 1, 4, 8]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[-1, 2.2, 5]} castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
            
            {/* Bat */}
            <mesh ref={batRef} position={[1.5, 1.2, 5]} rotation={[0, -Math.PI / 2, Math.PI / 4]} castShadow>
                <cylinderGeometry args={[0.05, 0.1, 2, 8]} />
                <meshStandardMaterial color="#92400e" />
            </mesh>
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
    const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [outs, setOuts] = useState(0);
    const [message, setMessage] = useState({ text: '', color: '', visible: false });

    // Internal Game State
    const ballState = useRef({
        active: false,
        pos: BALL_START_POS.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        hit: false
    });

    const [isPitching, setIsPitching] = useState(false);
    const [isSwinging, setIsSwinging] = useState(false);
    const [swingProgress, setSwingProgress] = useState(0);
    const [ballActive, setBallActive] = useState(false);

    const showMessage = (text, colorClass) => {
        setMessage({ text, color: colorClass, visible: true });
        setTimeout(() => setMessage(m => ({ ...m, visible: false })), 800);
    };

    const spawnBall = () => {
        if (gameState !== 'PLAYING') return;
        setIsPitching(true);
        
        setTimeout(() => {
            ballState.current.active = true;
            ballState.current.pos.copy(BALL_START_POS);
            ballState.current.pos.x = (Math.random() - 0.5) * 1.5; // Random horizontal
            ballState.current.pos.y = 1.2 + (Math.random() - 0.5) * 0.5; // Random height
            
            const speed = 15 + Math.random() * 10;
            ballState.current.vel.set(0, 0, speed);
            ballState.current.hit = false;
            setBallActive(true);
            setIsPitching(false);
        }, 800);
    };

    const handleMiss = () => {
        if (!ballState.current.active || ballState.current.hit) return;
        
        ballState.current.active = false;
        setBallActive(false);
        setOuts(o => {
            const next = o + 1;
            if (next >= 3) {
                setGameState('GAMEOVER');
                return next;
            }
            return next;
        });
        setCombo(0);
        showMessage("스트라이크!", "text-red-500");
        
        if (outs < 2) {
            setTimeout(spawnBall, 1500);
        }
    };

    const handleSwing = () => {
        if (gameState !== 'PLAYING' || isSwinging) return;

        setIsSwinging(true);
        let progress = 0;
        const startTime = Date.now();
        const duration = 300; // 300ms swing

        const animateSwing = () => {
            const now = Date.now();
            const p = (now - startTime) / duration;
            if (p < 1) {
                setSwingProgress(p);
                
                // Hit Detection during swing
                if (ballState.current.active && !ballState.current.hit && p > 0.4 && p < 0.6) {
                    const dist = ballState.current.pos.distanceTo(STRIKE_ZONE_POS);
                    // Check horizontal and vertical distance specifically
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
        const totalDist = Math.sqrt(dx*dx + dy*dy);
        
        let hitType = "";
        let points = 0;
        let color = "";
        const currentCombo = combo + 1;
        setCombo(currentCombo);

        if (totalDist < 0.2) {
            hitType = "홈런!!";
            points = 1000 + (currentCombo * 100);
            color = "text-yellow-400";
            ballState.current.vel.set((Math.random()-0.5)*10, 15, -40);
        } else if (totalDist < 0.5) {
            hitType = "안타!";
            points = 500 + (currentCombo * 50);
            color = "text-green-400";
            ballState.current.vel.set((Math.random()-0.5)*20, 5, -30);
        } else {
            hitType = "파울?";
            points = 100;
            color = "text-blue-300";
            ballState.current.vel.set((Math.random()-0.5)*30, 10, -10);
        }

        setScore(s => s + points);
        showMessage(hitType, color);
        
        setTimeout(() => {
            ballState.current.active = false;
            setBallActive(false);
            setTimeout(spawnBall, 1500);
        }, 2000);
    };

    const startGame = () => {
        setScore(0);
        setCombo(0);
        setOuts(0);
        setGameState('PLAYING');
        setTimeout(spawnBall, 1000);
    };

    // Logic Update Loop
    useEffect(() => {
        let frame;
        const update = () => {
            if (ballState.current.active) {
                ballState.current.pos.addScaledVector(ballState.current.vel, 0.016);
                // Gravity if hit
                if (ballState.current.hit) {
                    ballState.current.vel.y -= 0.5;
                    if (ballState.current.pos.y < 0) {
                        ballState.current.pos.y = 0;
                        ballState.current.vel.multiplyScalar(0.5); // Bounce
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
                    <Batter isSwinging={isSwinging} swingProgress={swingProgress} />
                    <Ball active={ballActive} position={ballState.current.pos} onMiss={handleMiss} />
                    
                    <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
                    <Environment preset="park" />
                </Canvas>
            </Suspense>

            {/* UI Overlay */}
            <div className="absolute top-5 left-5 text-white font-bold drop-shadow-lg pointer-events-none">
                <div className="text-2xl">점수: {score}</div>
                <div className="text-xl text-yellow-400">콤보: {combo}</div>
                <div className="text-lg text-red-400">아웃: {outs} / 3</div>
            </div>

            {/* Message Box */}
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-200 z-10 ${message.visible ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className={`text-7xl font-black ${message.color} drop-shadow-[0_5px_5px_rgba(0,0,0,1)]`}>{message.text}</h2>
            </div>

            {/* Menus */}
            {gameState !== 'PLAYING' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                    <h1 className="text-6xl mb-8 font-black text-yellow-400 italic transform -skew-x-12">3D 마구마구</h1>
                    {gameState === 'GAMEOVER' && (
                        <div className="text-center mb-8 animate-pulse">
                            <h2 className="text-4xl text-red-500 font-bold mb-2">GAME OVER</h2>
                            <p className="text-xl">최종 점수: {score}</p>
                        </div>
                    )}
                    <p className="text-xl mb-12 text-center px-8 opacity-80">투수가 던지는 공을 타이밍에 맞춰<br />클릭하여 배트를 휘두르세요!</p>

                    <button
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-full text-2xl font-bold transition-transform active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                    >
                        {gameState === 'MENU' ? '게임 시작' : '다시 시작'}
                    </button>
                </div>
            )}
        </div>
    );
}
