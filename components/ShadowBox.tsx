import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Zap, Volume2, VolumeX, Flame } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface ShadowBoxProps {
    onClose: () => void;
    mode?: 'rage' | 'shake';
}

const MODES = {
    rage: {
        title: 'Rage Release',
        subtitle: 'Throw punches at the air',
        duration: 30,
        icon: '👊',
        color: 'from-red-500 to-orange-500',
        instruction: 'Punch the air with all your might!',
        intensity: 'high',
    },
    shake: {
        title: 'Shake It Out',
        subtitle: 'Gentle energy regulation',
        duration: 60,
        icon: '🌊',
        color: 'from-blue-500 to-teal-500',
        instruction: 'Shake your arms and legs loosely',
        intensity: 'gentle',
    },
};

const ShadowBox: React.FC<ShadowBoxProps> = ({ onClose, mode: initialMode = 'rage' }) => {
    const [mode, setMode] = useState<'rage' | 'shake'>(initialMode);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(MODES[initialMode].duration);
    const [punchCount, setPunchCount] = useState(0);
    const [hapticEnabled, setHapticEnabled] = useState(true);
    const [showComplete, setShowComplete] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastHapticRef = useRef(0);
    const accelerometerRef = useRef<number | null>(null);

    const currentMode = MODES[mode];

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (accelerometerRef.current !== null) {
                window.removeEventListener('devicemotion', handleMotion as any);
            }
        };
    }, []);

    // Timer logic
    useEffect(() => {
        if (isActive && !isPaused && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, isPaused]);

    // Motion detection for punch counting & haptic feedback
    const handleMotion = useCallback(async (event: DeviceMotionEvent) => {
        if (!isActive || isPaused || !event.acceleration) return;

        const { x, y, z } = event.acceleration;
        const totalAcceleration = Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);

        // Detect significant movement (threshold varies by mode)
        const threshold = mode === 'rage' ? 15 : 8;

        if (totalAcceleration > threshold) {
            const now = Date.now();
            // Debounce - minimum 200ms between counts
            if (now - lastHapticRef.current > 200) {
                lastHapticRef.current = now;
                setPunchCount(prev => prev + 1);

                // Haptic feedback on movement
                if (hapticEnabled) {
                    try {
                        if (mode === 'rage') {
                            await Haptics.impact({ style: ImpactStyle.Heavy });
                        } else {
                            await Haptics.impact({ style: ImpactStyle.Light });
                        }
                    } catch (e) {
                        // Haptics not available
                    }
                }
            }
        }
    }, [isActive, isPaused, mode, hapticEnabled]);

    // Start/stop motion detection
    useEffect(() => {
        if (isActive && !isPaused) {
            window.addEventListener('devicemotion', handleMotion as any);
        } else {
            window.removeEventListener('devicemotion', handleMotion as any);
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotion as any);
        };
    }, [isActive, isPaused, handleMotion]);

    const handleStart = async () => {
        setIsActive(true);
        setIsPaused(false);
        setPunchCount(0);

        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) { }
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(currentMode.duration);
        setPunchCount(0);
        setShowComplete(false);
    };

    const handleComplete = async () => {
        setIsActive(false);
        setShowComplete(true);

        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) { }
    };

    const handleModeSwitch = (newMode: 'rage' | 'shake') => {
        setMode(newMode);
        setTimeLeft(MODES[newMode].duration);
        setIsActive(false);
        setIsPaused(false);
        setPunchCount(0);
        setShowComplete(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = ((currentMode.duration - timeLeft) / currentMode.duration) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
                <X size={24} />
            </button>

            {/* Mode Selector */}
            <div className="flex gap-2 mb-8">
                {(['rage', 'shake'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeSwitch(m)}
                        disabled={isActive}
                        className={`
              px-5 py-3 rounded-2xl font-bold text-sm transition-all
              ${mode === m
                                ? `bg-gradient-to-r ${MODES[m].color} text-white shadow-lg`
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }
              ${isActive ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <span className="mr-2">{MODES[m].icon}</span>
                        {MODES[m].title}
                    </button>
                ))}
            </div>

            {/* Main Display */}
            <div className="relative mb-8">
                {/* Progress Ring */}
                <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${progressPercentage * 2.83} ${283}`}
                        className="transition-all duration-500"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            {mode === 'rage' ? (
                                <>
                                    <stop offset="0%" stopColor="#EF4444" />
                                    <stop offset="100%" stopColor="#F97316" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#14B8A6" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {showComplete ? (
                        <div className="animate-in zoom-in duration-500">
                            <span className="text-6xl mb-2 block">🎉</span>
                            <p className="text-white font-bold text-xl">Great Job!</p>
                            <p className="text-white/70 text-sm mt-1">{punchCount} movements</p>
                        </div>
                    ) : (
                        <>
                            <span className="text-7xl mb-2">{currentMode.icon}</span>
                            <span className="text-5xl font-bold text-white tabular-nums">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive && (
                                <div className="flex items-center gap-2 mt-3 text-white/70">
                                    <Flame size={16} className={`${mode === 'rage' ? 'text-orange-400' : 'text-blue-400'} ${isActive && !isPaused ? 'animate-pulse' : ''}`} />
                                    <span className="text-sm font-bold">{punchCount} moves</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Instruction */}
            <p className={`
        text-center text-lg font-medium mb-8 px-6
        ${isActive && !isPaused ? 'text-white animate-pulse' : 'text-white/70'}
      `}>
                {isActive && !isPaused ? currentMode.instruction : currentMode.subtitle}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {!isActive && !showComplete ? (
                    <button
                        onClick={handleStart}
                        className={`
              px-10 py-4 rounded-full font-bold text-lg text-white
              bg-gradient-to-r ${currentMode.color}
              shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-transform
            `}
                    >
                        <Play size={24} className="inline mr-2 fill-current" />
                        Start
                    </button>
                ) : showComplete ? (
                    <>
                        <button
                            onClick={handleReset}
                            className="px-8 py-4 rounded-full font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <RotateCcw size={20} className="inline mr-2" />
                            Again
                        </button>
                        <button
                            onClick={onClose}
                            className={`
                px-8 py-4 rounded-full font-bold text-white
                bg-gradient-to-r from-green-500 to-emerald-500
                hover:scale-105 active:scale-95 transition-transform
              `}
                        >
                            Done ✓
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handlePause}
                            className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            {isPaused ? <Play size={24} /> : <Pause size={24} />}
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <RotateCcw size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Haptic Toggle */}
            <button
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={`
          absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm
          ${hapticEnabled ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'}
        `}
            >
                {hapticEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                Haptic {hapticEnabled ? 'On' : 'Off'}
            </button>
        </div>
    );
};

export default ShadowBox;
