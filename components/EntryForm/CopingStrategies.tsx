import React from 'react';
import { CopingStrategy } from '../../types';
import { Sparkles } from 'lucide-react';

interface CopingStrategiesProps {
    strategies: CopingStrategy[] | null;
    loading: boolean;
    visible: boolean;
}

const CopingStrategies: React.FC<CopingStrategiesProps> = ({ strategies, loading, visible }) => {
    if (!visible) return null;

    return (
        <div
            id="quick-reset-section"
            className="bg-purple-50 dark:bg-navy-surface p-4 rounded-2xl border border-purple-100 dark:border-navy-border animate-in slide-in-from-top duration-500"
        >
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <h3 className="font-bold text-warmGray dark:text-nearWhite">Coping Strategies</h3>
            </div>

            {loading ? (
                <div className="flex gap-2 text-sm text-purple-400">
                    <span className="animate-pulse">Finding helpers...</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {strategies?.map((s, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-navy p-3 rounded-xl shadow-sm text-sm border border-transparent dark:border-navy-border"
                        >
                            <div className="flex justify-between font-bold text-warmGray dark:text-nearWhite">
                                <span>{s.title}</span>
                                <span className="text-warmGray-medium text-xs">{s.duration}</span>
                            </div>
                            <p className="text-warmGray-medium dark:text-warmGray-light/70 mt-1">{s.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CopingStrategies;
