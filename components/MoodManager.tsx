import React, { useState, useEffect } from 'react';
import { CustomMood } from '../types';
import { getCustomMoods, saveCustomMood, deleteCustomMood } from '../services/storage';
import { X, Plus, Edit2, Check, Trash2 } from 'lucide-react';

interface MoodManagerProps {
    onClose: () => void;
}

const PRESET_COLORS = [
    'bg-slate-100 text-slate-700',
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-800',
    'bg-lime-100 text-lime-700',
    'bg-green-100 text-green-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-purple-100 text-purple-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700',
    'bg-rose-100 text-rose-700',
];

const MoodManager: React.FC<MoodManagerProps> = ({ onClose }) => {
    const [moods, setMoods] = useState<CustomMood[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form inputs
    const [label, setLabel] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [value, setValue] = useState(0);

    useEffect(() => {
        loadMoods();
    }, []);

    const loadMoods = async () => {
        const loaded = await getCustomMoods();
        setMoods(loaded);
    };

    const handleSave = async () => {
        if (!label.trim()) return;

        const newMood: CustomMood = {
            id: editingId || crypto.randomUUID(),
            label: label.trim(),
            color: color,
            value: value,
            isHidden: false
        };

        await saveCustomMood(newMood);
        await loadMoods();
        resetForm();
    };

    const handleEdit = (mood: CustomMood) => {
        setEditingId(mood.id);
        setLabel(mood.label);
        setColor(mood.color);
        setValue(mood.value);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this mood?')) {
            await deleteCustomMood(id);
            await loadMoods();
        }
    };

    const handleHideToggle = async (mood: CustomMood) => {
        await saveCustomMood({ ...mood, isHidden: !mood.isHidden });
        await loadMoods();
    };

    const resetForm = () => {
        setEditingId(null);
        setLabel('');
        setColor(PRESET_COLORS[0]);
        setValue(0);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col animate-in fade-in duration-200">
            <div 
                className="p-4 pt-safe border-b border-warmGray-light/20 flex justify-between items-center bg-white dark:bg-navy-surface shadow-sm"
                style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
            >
                <div>
                    <h3 className="font-bold text-lg text-warmGray dark:text-nearWhite">Manage Custom Moods</h3>
                    <p className="text-[10px] uppercase font-bold text-warmGray-medium tracking-widest opacity-70">Personalize your spectrum</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-warmGray-light/30 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} className="text-warmGray-medium dark:text-warmGray-light" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6 no-scrollbar">

                    {/* Editor Form */}
                    <div className="bg-brand-light/30 dark:bg-white/5 p-4 rounded-2xl border border-brand/10 space-y-4">
                        <h4 className="text-sm font-bold uppercase text-warmGray-medium tracking-wider mb-2">
                            {editingId ? 'Edit Mood' : 'Add New Mood'}
                        </h4>

                        <div>
                            <label className="text-xs font-bold text-warmGray-medium mb-1 block">Label</label>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. In The Zone"
                                className="w-full p-2 rounded-xl border border-warmGray-light dark:border-navy-border bg-white dark:bg-navy text-warmGray dark:text-nearWhite focus:ring-2 focus:ring-brand outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-warmGray-medium mb-2 block">Color</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-brand scale-110 ring-2 ring-brand/30' : 'border-transparent hover:scale-110'} ${c.split(' ')[0]}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-warmGray-medium block">Value (Optional)</label>
                                <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                                    {value === 0 ? 'None' : value}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={value}
                                onChange={e => setValue(parseInt(e.target.value))}
                                className="w-full h-2 bg-warmGray-light/30 rounded-lg appearance-none cursor-pointer accent-brand"
                            />
                            <div className="flex justify-between text-[10px] text-warmGray-medium opacity-60 px-1 mt-1">
                                <span>None</span>
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 rounded-xl bg-warmGray-light dark:bg-navy-border text-warmGray-medium font-bold text-xs"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!label.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand text-brand-text font-bold text-sm shadow-md disabled:opacity-50 disabled:shadow-none"
                            >
                                <Check size={16} /> {editingId ? 'Update' : 'Add Mood'}
                            </button>
                        </div>
                    </div>

                    {/* Mood List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase text-warmGray-medium tracking-wider mb-2">Existing Moods</h4>
                        {moods.length === 0 ? (
                            <p className="text-sm text-center text-warmGray-light italic py-4">No custom moods added yet.</p>
                        ) : (
                            moods.map(mood => (
                                <div key={mood.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${mood.isHidden ? 'bg-warmGray-light/10 border-transparent opacity-60' : 'bg-white dark:bg-navy-surface border-warmGray-light/30 dark:border-navy-border'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${mood.color}`}>
                                            {mood.label}
                                        </div>
                                        {mood.value > 0 && (
                                            <span className="text-[10px] font-bold bg-brand-light dark:bg-white/10 text-brand px-1.5 py-0.5 rounded-md">
                                                Val: {mood.value}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleHideToggle(mood)}
                                            className="p-2 text-warmGray-medium hover:text-brand transition-colors"
                                            title={mood.isHidden ? "Unhide" : "Hide"}
                                        >
                                            {mood.isHidden ? '👁️‍🗨️' : '👁️'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(mood)}
                                            className="p-2 text-warmGray-medium hover:text-brand transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(mood.id)}
                                            className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

            </div>
        </div>
    );
};

export default MoodManager;
