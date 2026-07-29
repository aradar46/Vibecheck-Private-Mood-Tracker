import React from 'react';
import { Mood } from '../../types';
import { MOODS } from '../../constants';
import { X, Calendar as CalendarIcon } from 'lucide-react';

interface MoodPickerProps {
    selectedMood: Mood | null;
    onMoodSelect: (mood: Mood) => void;
    onCancel: () => void;
    onEditDateTime: () => void;
}

const MoodPicker: React.FC<MoodPickerProps> = ({
    selectedMood,
    onMoodSelect,
    onCancel,
    onEditDateTime,
}) => {
    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300 relative bg-cream dark:bg-navy">
            <button
                onClick={onCancel}
                className="absolute top-4 right-4 p-2 bg-brand-light dark:bg-navy-surface text-warmGray-medium dark:text-warmGray-light rounded-full hover:bg-peach-100 dark:hover:bg-navy-border transition-colors z-50"
            >
                <X size={24} />
            </button>

            <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                <h2 className="text-2xl font-bold text-center text-warmGray dark:text-nearWhite mb-2">
                    How are you feeling?
                </h2>

                {/* Edit date button */}
                <button
                    onClick={onEditDateTime}
                    className="text-xs text-warmGray-medium dark:text-warmGray-light/70 hover:text-brand dark:hover:text-brand transition-colors flex items-center justify-center gap-1 mb-4"
                >
                    <CalendarIcon size={12} /> Edit date/time
                </button>

                <div className="w-full max-w-md space-y-1.5 mb-4">
                    {MOODS.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => onMoodSelect(m.value)}
                            className={`
                w-full relative flex items-center justify-start p-2.5 rounded-xl transition-all duration-200
                ${selectedMood === m.value ? 'ring-4 ring-brand/30 scale-105 z-10' : 'hover:scale-102 hover:bg-brand-light dark:hover:bg-navy-surface'}
                ${m.color}
                bg-opacity-20 border-2 border-transparent hover:border-current
              `}
                        >
                            <span className="text-3xl mr-2 filter drop-shadow-sm">{m.emoji}</span>
                            <span className="text-base font-bold">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MoodPicker;
