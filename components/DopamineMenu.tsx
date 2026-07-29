import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Shuffle, Zap, Battery, Star, Clock, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface DopamineItem {
    id: string;
    title: string;
    description: string;
    energyCost: 'low' | 'medium' | 'high';
    rewardType: 'immediate' | 'delayed';
    duration: string;
    category: 'quick' | 'deep';
    emoji: string;
}

const DOPAMINE_ITEMS: DopamineItem[] = [
    // Quick Wins (Low Effort, Immediate Reward)
    { id: 'water', title: 'Drink Water', description: 'Hydrate your brain', energyCost: 'low', rewardType: 'immediate', duration: '30s', category: 'quick', emoji: '💧' },
    { id: 'stretch', title: 'Quick Stretch', description: 'Roll your shoulders, stretch your neck', energyCost: 'low', rewardType: 'immediate', duration: '1m', category: 'quick', emoji: '🧘' },
    { id: 'snack', title: 'Healthy Snack', description: 'Fuel your focus', energyCost: 'low', rewardType: 'immediate', duration: '2m', category: 'quick', emoji: '🍎' },
    { id: 'music', title: 'Play Favorite Song', description: 'Instant mood boost', energyCost: 'low', rewardType: 'immediate', duration: '3m', category: 'quick', emoji: '🎵' },
    { id: 'tidy', title: 'Tidy One Thing', description: 'Clear one surface', energyCost: 'low', rewardType: 'immediate', duration: '2m', category: 'quick', emoji: '✨' },
    { id: 'sunshine', title: 'Step Into Sun', description: 'Natural dopamine hit', energyCost: 'low', rewardType: 'immediate', duration: '1m', category: 'quick', emoji: '☀️' },
    { id: 'dance', title: 'Dance Break', description: 'Shake it out!', energyCost: 'medium', rewardType: 'immediate', duration: '2m', category: 'quick', emoji: '💃' },
    { id: 'joke', title: 'Watch Funny Video', description: 'Laughter is medicine', energyCost: 'low', rewardType: 'immediate', duration: '3m', category: 'quick', emoji: '😂' },

    // Deep Wins (More Effort, Longer Reward)
    { id: 'walk', title: 'Short Walk', description: 'Outside if possible', energyCost: 'medium', rewardType: 'delayed', duration: '10m', category: 'deep', emoji: '🚶' },
    { id: 'shower', title: 'Shower Reset', description: 'Full body refresh', energyCost: 'high', rewardType: 'delayed', duration: '10m', category: 'deep', emoji: '🚿' },
    { id: 'journal', title: 'Brain Dump', description: 'Write 3 thoughts', energyCost: 'medium', rewardType: 'delayed', duration: '5m', category: 'deep', emoji: '📝' },
    { id: 'friend', title: 'Text a Friend', description: 'Connection matters', energyCost: 'medium', rewardType: 'delayed', duration: '5m', category: 'deep', emoji: '💬' },
    { id: 'breathing', title: 'Box Breathing', description: '4-4-4-4 for calm', energyCost: 'low', rewardType: 'delayed', duration: '4m', category: 'deep', emoji: '🌬️' },
    { id: 'nap', title: 'Power Nap', description: '20min rest (not more!)', energyCost: 'high', rewardType: 'delayed', duration: '20m', category: 'deep', emoji: '😴' },
    { id: 'create', title: 'Create Something', description: 'Doodle, build, cook', energyCost: 'high', rewardType: 'delayed', duration: '15m', category: 'deep', emoji: '🎨' },
    { id: 'nature', title: 'Nature Time', description: 'Touch grass literally', energyCost: 'medium', rewardType: 'delayed', duration: '10m', category: 'deep', emoji: '🌿' },
];

interface DopamineMenuProps {
    onClose?: () => void;
    compact?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
}

const DopamineMenu: React.FC<DopamineMenuProps> = ({ onClose, compact = false, onExpandedChange, onOpenShadowBox }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'quick' | 'deep'>('all');
    const [spinResult, setSpinResult] = useState<DopamineItem | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showItemsGrid, setShowItemsGrid] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const confettiRef = useRef<HTMLCanvasElement | null>(null);

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'all') return DOPAMINE_ITEMS;
        return DOPAMINE_ITEMS.filter(item => item.category === selectedCategory);
    }, [selectedCategory]);

    const displayItems = showAll ? filteredItems : filteredItems.slice(0, 6);

    useEffect(() => {
        if (onExpandedChange) {
            onExpandedChange(isOpen);
        }
    }, [isOpen, onExpandedChange]);

    // Reset grid when closing
    useEffect(() => {
        if (!isOpen) {
            // Optional: reset internal state if desired when closing
        }
    }, [isOpen]);

    const handleSpinWheel = async () => {
        // Just spin, don't toggle grid visibility logic like before since we are already inside expanded view
        if (!isSpinning) {
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (e) { }

            setIsSpinning(true);
            setSpinResult(null);
            setShowResult(false);
            // Hide grid while spinning if desired, or keep it.
            // Let's hide items grid temporarily to focus on result?
            // Actually, previous logic used showItemsGrid to toggle between "Hide Options" and "Pick For Me".
            // Let's simplify: Button always spins.

            setShowItemsGrid(false); // Hide manual list to show spinner result clearly

            // Animate through items quickly
            const spins = 12 + Math.floor(Math.random() * 8);
            let currentIndex = 0;

            for (let i = 0; i < spins; i++) {
                await new Promise(resolve => setTimeout(resolve, 50 + i * 15));
                currentIndex = (currentIndex + 1) % filteredItems.length;
                setSpinResult(filteredItems[currentIndex]);
            }

            // Final haptic
            try {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            } catch (e) { }

            setIsSpinning(false);
            setShowResult(true);
            return;
        }
    };

    const triggerConfetti = () => {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const confetti: Array<{
            x: number;
            y: number;
            r: number;
            d: number;
            color: string;
            tilt: number;
            tiltAngleIncrement: number;
            tiltAngle: number;
        }> = [];

        for (let i = 0; i < 50; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * confetti.length + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: Math.random() * 0.07 + 0.05,
                tiltAngle: 0
            });
        }

        let animationFrame: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetti.forEach((c, i) => {
                ctx.beginPath();
                ctx.lineWidth = c.r / 2;
                ctx.strokeStyle = c.color;
                ctx.moveTo(c.x + c.tilt + c.r, c.y);
                ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
                ctx.stroke();

                c.tiltAngle += c.tiltAngleIncrement;
                c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
                c.tilt = Math.sin(c.tiltAngle - i) * 15;

                if (c.y > canvas.height) {
                    confetti[i] = {
                        x: Math.random() * canvas.width,
                        y: -20,
                        r: c.r,
                        d: c.d,
                        color: c.color,
                        tilt: Math.floor(Math.random() * 10) - 10,
                        tiltAngleIncrement: c.tiltAngleIncrement,
                        tiltAngle: 0
                    };
                }
            });

            animationFrame = requestAnimationFrame(animate);

            if (confetti.every(c => c.y > canvas.height + 100)) {
                cancelAnimationFrame(animationFrame);
                document.body.removeChild(canvas);
            }
        };

        animate();

        // Clean up after 3 seconds
        setTimeout(() => {
            if (document.body.contains(canvas)) {
                cancelAnimationFrame(animationFrame);
                document.body.removeChild(canvas);
            }
        }, 3000);
    };

    const handleComplete = () => {
        setIsCompleted(true);
        triggerConfetti();
        try {
            Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) { }

        // Auto-close menu after confetti animation
        setTimeout(() => {
            setIsOpen(false);
            setSpinResult(null); // Reset result
            setIsCompleted(false); // Reset checkbox
        }, 3500);
    };

    // Reset completed state when result changes
    useEffect(() => {
        if (spinResult) {
            setIsCompleted(false);
        }
    }, [spinResult]);

    const getEnergyCostColor = (cost: string) => {
        switch (cost) {
            case 'low': return 'bg-sage/30 text-sage-dark dark:text-sage';
            case 'medium': return 'bg-lavender/30 text-lavender-dark dark:text-lavender';
            case 'high': return 'bg-peach-100 text-peach-600 dark:text-peach-300';
            default: return 'bg-warmGray-light/30 text-warmGray-medium';
        }
    };

    const getRewardTypeIcon = (type: string) => {
        return type === 'immediate' ? <Zap size={12} className="fill-current" /> : <Clock size={12} />;
    };

    return (
        <div className={`
             w-full transition-all duration-300
             ${isOpen
                ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50/50 dark:from-navy dark:via-navy-surface dark:to-navy shadow-xl shadow-purple-500/10 dark:shadow-none'
                : 'bg-gradient-to-br from-purple-100/90 via-white to-pink-100/90 dark:from-purple-900/40 dark:via-navy-surface dark:to-navy hover:-translate-y-0.5 hover:shadow-purple-500/20 shadow-lg shadow-brand/20 dark:shadow-none border-purple-200/50'
            }
             p-5 rounded-3xl border-2 border-brand/40 dark:border-brand/30 relative overflow-hidden group
        `}>
            {/* Header / Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left flex flex-col gap-2 focus:outline-none"
            >
                <div className="flex items-start justify-between w-full">
                    <h3 className="font-bold text-brand dark:text-brand-light text-lg flex items-center gap-2">
                        <div className="p-1.5 bg-brand/10 rounded-lg animate-pulse-slow">
                            <Sparkles size={18} className="text-brand dark:text-brand-light" />
                        </div>
                        Dopamine Menu
                    </h3>
                    <span className={`flex items-center justify-center text-white ${isOpen ? 'bg-brand p-2 rounded-lg' : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-purple-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider'}`}>
                        {isOpen ? <X size={14} /> : 'Boost 🚀'}
                    </span>
                </div>
                <p className="text-sm text-warmGray dark:text-nearWhite/90 leading-relaxed pr-8">
                    Decision paralysis? Find a quick mood boost or deep rest reset.
                </p>

                {/* Chevron Indicator */}
                <div className="absolute bottom-5 right-5 text-warmGray-light/50 dark:text-navy-border group-hover:text-brand/50 transition-colors">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>

            {/* Expanded Content */}
            {isOpen && (
                <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">

                    {/* Quick Release Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onOpenShadowBox?.('rage')}
                            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <span>👊</span> Rage Release
                        </button>
                        <button
                            onClick={() => onOpenShadowBox?.('shake')}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white p-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            <span>🌊</span> Shake It Out
                        </button>
                    </div>

                    <div className="h-px bg-brand/10 dark:bg-white/5 my-4" />

                    {/* Spin The Wheel Button */}
                    <button
                        onClick={handleSpinWheel}
                        disabled={isSpinning}
                        className={`
                            w-full p-4 rounded-2xl font-bold text-white transition-all
                            ${isSpinning
                                ? 'bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse'
                                : showResult && spinResult
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20 dark:shadow-none active:scale-98'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20 dark:shadow-none active:scale-98'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Shuffle size={20} className={isSpinning ? 'animate-spin' : ''} />
                            <span>
                                {isSpinning
                                    ? 'Picking...'
                                    : '🎲 Pick For Me!'}
                            </span>
                        </div>
                    </button>

                    {/* Spin Result */}
                    {spinResult && !isSpinning && showResult && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 animate-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{spinResult.emoji}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-warmGray dark:text-nearWhite">{spinResult.title}</h4>
                                        <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">{spinResult.duration}</span>
                                    </div>
                                    <p className="text-sm text-warmGray-medium dark:text-warmGray-light/70 mb-2">{spinResult.description}</p>
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getEnergyCostColor(spinResult.energyCost)}`}>
                                            <Battery size={10} className="inline mr-1" />
                                            {spinResult.energyCost} energy
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                            {getRewardTypeIcon(spinResult.rewardType)}
                                            <span className="ml-1">{spinResult.rewardType}</span>
                                        </span>
                                    </div>
                                </div>
                                <label className="relative cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={handleComplete}
                                        className="sr-only"
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                                        ? 'bg-green-500 text-white scale-110 shadow-lg'
                                        : 'bg-purple-500 text-white hover:bg-purple-600'
                                        }`}>
                                        {isCompleted ? (
                                            <Check size={20} className="fill-current" />
                                        ) : (
                                            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Toggle to show List */}
                    <button
                        onClick={() => setShowItemsGrid(!showItemsGrid)}
                        className="w-full text-center text-xs font-bold text-warmGray-medium dark:text-warmGray-light/60 hover:text-brand transition-colors mb-3 flex items-center justify-center gap-1"
                    >
                        {showItemsGrid ? 'Hide Menu' : 'Or Browse Menu'}
                        {showItemsGrid ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Category Filter, Items Grid, and Show More - Toggleable */}
                    {showItemsGrid && (
                        <>
                            {/* Category Filter */}
                            <div className="flex gap-2 mb-4">
                                {[
                                    { id: 'all', label: 'All', icon: Star },
                                    { id: 'quick', label: 'Quick Wins', icon: Zap },
                                    { id: 'deep', label: 'Deep Wins', icon: Battery },
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id as 'all' | 'quick' | 'deep')}
                                        className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                  ${selectedCategory === cat.id
                                                ? 'bg-brand text-brand-text'
                                                : 'bg-cream dark:bg-navy text-warmGray-medium dark:text-warmGray-light hover:bg-brand-light dark:hover:bg-navy-surface'
                                            }
                `}
                                    >
                                        <cat.icon size={12} />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {displayItems.map(item => (
                                    <button
                                        key={item.id}
                                        className="p-3 bg-cream dark:bg-navy rounded-xl text-left hover:bg-brand-light dark:hover:bg-navy-surface transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-brand/20 dark:hover:border-navy-border"
                                    >
                                        <div className="flex items-start gap-2 mb-1">
                                            <span className="text-xl">{item.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-warmGray dark:text-nearWhite truncate">{item.title}</h4>
                                                <p className="text-[10px] text-warmGray-medium dark:text-warmGray-light/70 line-clamp-1">{item.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getEnergyCostColor(item.energyCost)}`}>
                                                {item.energyCost}
                                            </span>
                                            <span className="text-[9px] text-warmGray-medium">{item.duration}</span>
                                            {item.rewardType === 'immediate' && <Zap size={10} className="text-amber-500 fill-current" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Show More/Less */}
                            {filteredItems.length > 6 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="w-full mt-3 py-2 text-xs font-bold text-brand dark:text-brand-light hover:text-brand/80 transition-colors flex items-center justify-center gap-1"
                                >
                                    {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {showAll ? 'Show Less' : `Show ${filteredItems.length - 6} More`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DopamineMenu;
