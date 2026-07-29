import React, { useState, useMemo, useEffect } from 'react';
import { Entry } from '../types';
import { getAllTags } from '../services/storage';
import { Zap, Brain, Moon, Coffee, Pill, AlertCircle, CircleHelp, Filter } from 'lucide-react';
import { MOODS } from '../constants';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface InsightsViewProps {
    entries: Entry[];
}


const InsightsView: React.FC<InsightsViewProps> = ({ entries }) => {
    const [allTags, setAllTags] = useState<any[]>([]);

    // --- FILTER STATE (Pro Mode) ---
    const [showFilter, setShowFilter] = useState(false);
    const [filterMood, setFilterMood] = useState<number[]>([]);
    const [filterTag, setFilterTag] = useState<string[]>([]);
    const [filterKeyword, setFilterKeyword] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');

    // Filter Logic
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            if (filterMood.length > 0 && !filterMood.includes(e.mood)) return false;
            // Check tags (if any selected, entry must have at least one of them? OR match all? Usually 'some' for flexible filtering)
            if (filterTag.length > 0 && !e.tags.some(t => filterTag.includes(t))) return false;

            if (filterKeyword) {
                const lowerKeyword = filterKeyword.toLowerCase();
                const matchesNote = e.note?.toLowerCase().includes(lowerKeyword);
                const matchesTag = e.tags.some(tid => allTags.find(t => t.id === tid)?.label.toLowerCase().includes(lowerKeyword));
                if (!matchesNote && !matchesTag) return false;
            }

            if (filterDateFrom && e.timestamp < new Date(filterDateFrom).setHours(0, 0, 0, 0)) return false;
            if (filterDateTo && e.timestamp > new Date(filterDateTo).setHours(23, 59, 59, 999)) return false;
            return true;
        });
    }, [entries, filterMood, filterTag, filterKeyword, filterDateFrom, filterDateTo, allTags]);

    const realEntries = filteredEntries;

    // Load tags
    useEffect(() => {
        const loadData = async () => {
            const tags = await getAllTags();
            setAllTags(tags);
        };
        loadData();
    }, []);

    // --- DATA PREP ---

    // 1. Mood Trend (Dynamic Range respecting Pro Filter)
    const trendData = useMemo(() => {
        let startMs = Date.now() - 14 * 24 * 60 * 60 * 1000; // Default 2 weeks
        let endMs = Date.now();
        let label = 'Mood History (Last 2 Weeks)';

        if (filterDateFrom) {
            startMs = new Date(filterDateFrom).setHours(0, 0, 0, 0);
            if (filterDateTo) {
                endMs = new Date(filterDateTo).setHours(23, 59, 59, 999);
                label = `Mood History (${new Date(startMs).toLocaleDateString()} - ${new Date(endMs).toLocaleDateString()})`;
            } else {
                label = `Mood History (Since ${new Date(startMs).toLocaleDateString()})`;
            }
        } else if (filterDateTo) {
            // Only To date? Weird but handle it
            endMs = new Date(filterDateTo).setHours(23, 59, 59, 999);
            startMs = endMs - 14 * 24 * 60 * 60 * 1000; // 2 weeks before To
            label = 'Mood History';
        }

        // Filter filteredEntries (which already match tags/mood) by this specific time range
        // Note: RealEntries is *already* filtered by date if filterDateFrom/To are set.
        // But if they are NOT set, realEntries is ALL history, so we must slice it to the default 2 weeks here.
        let data = realEntries
            .filter(e => e.timestamp >= startMs && e.timestamp <= endMs)
            .sort((a, b) => a.timestamp - b.timestamp);

        // Agregation Logic
        const daysDiff = (endMs - startMs) / (1000 * 60 * 60 * 24);

        if (daysDiff > 5) {
            // Aggregate by Day
            const dailyMap: Record<string, { total: number, count: number, timestamp: number, fullDate: string, medsSkipped: boolean }> = {};

            data.forEach(e => {
                const dayKey = new Date(e.timestamp).toLocaleDateString();
                if (!dailyMap[dayKey]) {
                    dailyMap[dayKey] = {
                        total: 0,
                        count: 0,
                        timestamp: new Date(e.timestamp).setHours(12, 0, 0, 0), // Mid-day for sorting
                        fullDate: dayKey,
                        medsSkipped: false,
                    };
                }
                dailyMap[dayKey].total += e.mood;
                dailyMap[dayKey].count++;
                if (e.tags?.includes('meds-skipped')) dailyMap[dayKey].medsSkipped = true;
            });

            data = Object.values(dailyMap).map(d => ({
                timestamp: d.timestamp,
                mood: parseFloat((d.total / d.count).toFixed(1)),
                date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: d.fullDate,
                medsSkipped: d.medsSkipped,
            })).sort((a, b) => a.timestamp - b.timestamp);
        } else {
            // Keep raw entries
            data = data.map(e => ({
                timestamp: e.timestamp,
                mood: e.mood,
                date: new Date(e.timestamp).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', hour: 'numeric' }),
                fullDate: new Date(e.timestamp).toLocaleString(),
                medsSkipped: e.tags?.includes('meds-skipped') || false,
            }));
        }

        return { label, data };
    }, [realEntries, filterDateFrom, filterDateTo]);

    // 2. Activities (Tags) Correlation
    const tagStats = useMemo(() => {
        const stats: Record<string, { total: number, count: number }> = {};

        realEntries.forEach(e => {
            e.tags?.forEach(tId => {
                if (!stats[tId]) stats[tId] = { total: 0, count: 0 };
                stats[tId].total += e.mood;
                stats[tId].count += 1;
            });
        });

        return Object.entries(stats)
            .map(([id, data]) => {
                const tagDef = allTags.find(t => t.id === id);
                return {
                    id,
                    label: tagDef ? tagDef.label : id,
                    avg: data.total / data.count,
                    count: data.count
                };
            })
            .filter(t => t.count >= 2) // Only show tags used at least twice
            .sort((a, b) => b.avg - a.avg); // Best to Worst
    }, [realEntries, allTags]);

    // 3. Tags Heatmap (replacing symptoms)
    const heatmapData = useMemo(() => {
        const tagDistributions: Record<string, { label: string, distribution: Record<number, number> & { total: number } }> = {};

        realEntries.forEach(e => {
            e.tags?.forEach(tId => {
                if (!tagDistributions[tId]) {
                    const tagDef = allTags.find(t => t.id === tId);
                    tagDistributions[tId] = {
                        label: tagDef ? tagDef.label : tId,
                        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 }
                    };
                }
                tagDistributions[tId].distribution[e.mood as 1 | 2 | 3 | 4 | 5]++;
                tagDistributions[tId].distribution.total++;
            });
        });

        return Object.entries(tagDistributions)
            .map(([id, data]) => ({
                key: id,
                label: data.label,
                distribution: data.distribution
            }))
            .filter(t => t.distribution.total >= 2) // Only show tags used at least twice
            .sort((a, b) => b.distribution.total - a.distribution.total); // Sort by descending usage
    }, [realEntries, allTags]);

    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [heatmapPage, setHeatmapPage] = useState(0);
    const itemsPerPage = 4;
    const heatmapPages = Math.ceil(heatmapData.length / itemsPerPage);
    const paginatedHeatmap = heatmapData.slice(heatmapPage * itemsPerPage, (heatmapPage + 1) * itemsPerPage);

    const [openHelp, setOpenHelp] = useState<string | null>(null);

    // 4. Time of Day
    const timeOfDayData = useMemo(() => {
        const buckets = {
            'Morning': { total: 0, count: 0, order: 1 },   // 5 - 11
            'Afternoon': { total: 0, count: 0, order: 2 }, // 11 - 17
            'Evening': { total: 0, count: 0, order: 3 },   // 17 - 22
            'Night': { total: 0, count: 0, order: 4 },     // 22 - 5
        };

        realEntries.forEach(e => {
            const hour = new Date(e.timestamp).getHours();
            let bucket = 'Night';
            if (hour >= 5 && hour < 11) bucket = 'Morning';
            else if (hour >= 11 && hour < 17) bucket = 'Afternoon';
            else if (hour >= 17 && hour < 22) bucket = 'Evening';

            buckets[bucket as keyof typeof buckets].total += e.mood;
            buckets[bucket as keyof typeof buckets].count++;
        });

        return Object.entries(buckets)
            .map(([name, data]) => ({
                name,
                avg: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
                count: data.count,
                order: data.order
            }))
            .sort((a, b) => a.order - b.order);
    }, [realEntries]);


    // 5. Weekly Pattern (Mon-Sun)
    const weeklyData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const stats: Record<string, { total: number, count: number, index: number }> = {};

        days.forEach((day, index) => {
            stats[day] = { total: 0, count: 0, index };
        });

        realEntries.forEach(e => {
            const date = new Date(e.timestamp);
            const dayName = days[date.getDay()];
            stats[dayName].total += e.mood;
            stats[dayName].count++;
        });

        // Rotate so Monday is first
        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return orderedDays.map(day => ({
            name: day,
            avg: stats[day].count > 0 ? parseFloat((stats[day].total / stats[day].count).toFixed(1)) : 0,
            count: stats[day].count
        }));
    }, [realEntries]);

    // 6. Wellness Factors (Sleep & Meds)
    const wellnessData = useMemo(() => {
        const sleepStats = {
            'good': { total: 0, count: 0 },
            'ok': { total: 0, count: 0 },
            'bad': { total: 0, count: 0 },
        };
        const medStats = {
            'Taken': { total: 0, count: 0 },
            'Skipped': { total: 0, count: 0 },
        };

        realEntries.forEach(e => {
            // Sleep
            if (e.symptoms?.sleep && sleepStats[e.symptoms.sleep]) {
                sleepStats[e.symptoms.sleep].total += e.mood;
                sleepStats[e.symptoms.sleep].count++;
            }
            // Meds
            if (e.symptoms?.tookMedication !== undefined) {
                const key = e.symptoms.tookMedication ? 'Taken' : 'Skipped';
                medStats[key].total += e.mood;
                medStats[key].count++;
            }
        });

        const data = [
            { name: 'Good Sleep', avg: sleepStats.good.count ? sleepStats.good.total / sleepStats.good.count : 0, count: sleepStats.good.count, category: 'Sleep' },
            { name: 'OK Sleep', avg: sleepStats.ok.count ? sleepStats.ok.total / sleepStats.ok.count : 0, count: sleepStats.ok.count, category: 'Sleep' },
            { name: 'Bad Sleep', avg: sleepStats.bad.count ? sleepStats.bad.total / sleepStats.bad.count : 0, count: sleepStats.bad.count, category: 'Sleep' },
            { name: 'Meds Taken', avg: medStats.Taken.count ? medStats.Taken.total / medStats.Taken.count : 0, count: medStats.Taken.count, category: 'Meds' },
            { name: 'Meds Skipped', avg: medStats.Skipped.count ? medStats.Skipped.total / medStats.Skipped.count : 0, count: medStats.Skipped.count, category: 'Meds' },
        ].filter(d => d.count > 0);

        return data;
    }, [realEntries]);


    // --- HELPER COMPONENTS ---

    const MoodEmoji = ({ value }: { value: number }) => {
        let icon = 'sentiment_very_dissatisfied';
        if (value >= 4.5) icon = 'sentiment_very_satisfied';
        else if (value >= 3.5) icon = 'sentiment_satisfied';
        else if (value >= 2.5) icon = 'sentiment_neutral';
        else if (value >= 1.5) icon = 'sentiment_dissatisfied';

        return <span className="material-symbols-outlined text-base align-middle">{icon}</span>;
    };

    const getMoodColor = (mood: number) => {
        if (mood >= 4.5) return '#4fd1c5'; // Soft Teal
        if (mood >= 3.5) return '#95D5B2'; // Soft Mint
        if (mood >= 2.5) return '#f6ad55'; // Soft Amber
        if (mood >= 1.5) return '#FBA988'; // Soft Orange
        return '#fc8181'; // Soft Coral
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-navy p-3 rounded-xl shadow-lg border border-brand/20 dark:border-navy-border text-xs z-50">
                    <p className="font-bold text-warmGray dark:text-nearWhite mb-1">{label}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-brand">Mood: {payload[0].value}</span>
                    </div>
                    {data.medsSkipped && (
                        <p className="text-red-500 font-bold mt-1">⚠️ Meds Skipped</p>
                    )}
                </div>
            );
        }
        return null;
    };


    return (
        <div 
            className="h-full overflow-y-auto pb-40 no-scrollbar space-y-6 px-4 pt-safe"
            style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}
        >

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-warmGray dark:text-nearWhite">Insights</h2>
                    <p className="text-warmGray-medium dark:text-warmGray-light/70">Connecting the dots 🕵️‍♀️</p>
                </div>
                <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`p-2 rounded-xl transition-all ${showFilter ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white dark:bg-navy-surface text-warmGray-medium dark:text-warmGray-light border border-warmGray-light/50 dark:border-navy-border hover:border-brand/50'}`}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} />
                        {showFilter && <span className="text-xs font-bold">Pro Filter</span>}
                    </div>
                </button>
            </div>

            {/* PRO FILTER PANEL */}
            {showFilter && (
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-navy-surface/80 border border-warmGray-light/40 dark:border-navy-border flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand uppercase tracking-wider">Active Filters</span>
                        {(filterMood.length > 0 || filterTag.length > 0 || filterKeyword || filterDateFrom || filterDateTo) && (
                            <button
                                onClick={() => { setFilterMood([]); setFilterTag([]); setFilterKeyword(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                                className="text-[10px] text-red-500 hover:underline font-bold"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Mood multi-select */}
                        <div className="relative group z-30">
                            <button type="button" className="text-xs px-3 py-2 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite flex items-center gap-1 hover:border-brand/50 transition-colors">
                                {filterMood.length === 0 ? 'Mood' : (
                                    <div className="flex gap-1">
                                        {filterMood.map(val => {
                                            const m = MOODS.find(mood => mood.value === val);
                                            return <span key={val} className="material-symbols-outlined text-[16px]">{m?.icon}</span>;
                                        })}
                                    </div>
                                )}
                                <span className="ml-1 opacity-50">▼</span>
                            </button>
                            <div className="absolute left-0 mt-1 bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border rounded-xl shadow-xl p-2 min-w-[140px] hidden group-focus-within:block group-hover:block">
                                {MOODS.map(m => (
                                    <label key={m.value} className="flex items-center gap-2 text-xs py-1.5 px-1 hover:bg-cream dark:hover:bg-navy rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filterMood.includes(m.value)}
                                            onChange={e => {
                                                setFilterMood(fm => e.target.checked ? [...fm, m.value] : fm.filter(v => v !== m.value));
                                            }}
                                            className="rounded border-warmGray-light text-brand focus:ring-brand"
                                        />
                                        <span className={`material-symbols-outlined text-[18px] ${m.color.split(' ')[1]}`}>{m.icon}</span>
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Tag multi-select */}
                        <div className="relative group z-20">
                            <button type="button" className="text-xs px-3 py-2 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite flex items-center gap-1 hover:border-brand/50 transition-colors">
                                {filterTag.length === 0 ? 'Tags' : `${filterTag.length} selected`}
                                <span className="ml-1 opacity-50">▼</span>
                            </button>
                            <div className="absolute left-0 mt-1 bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border rounded-xl shadow-xl p-2 min-w-[160px] max-h-56 overflow-y-auto hidden group-focus-within:block group-hover:block">
                                {allTags.map(t => (
                                    <label key={t.id} className="flex items-center gap-2 text-xs py-1.5 px-1 hover:bg-cream dark:hover:bg-navy rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filterTag.includes(t.id)}
                                            onChange={e => {
                                                setFilterTag(ft => e.target.checked ? [...ft, t.id] : ft.filter(v => v !== t.id));
                                            }}
                                            className="rounded border-warmGray-light text-brand focus:ring-brand"
                                        />
                                        <span className="truncate max-w-[120px]">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="flex gap-1">
                            <input
                                type="date"
                                className="text-xs px-2 py-2 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite focus:border-brand outline-none"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                            />
                            <span className="text-warmGray-medium self-center">-</span>
                            <input
                                type="date"
                                className="text-xs px-2 py-2 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite focus:border-brand outline-none"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                            />
                        </div>

                        {/* Keyword */}
                        <input
                            type="text"
                            className="text-xs px-3 py-2 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite focus:border-brand outline-none min-w-[120px]"
                            value={filterKeyword}
                            onChange={e => setFilterKeyword(e.target.value)}
                            placeholder="Search notes..."
                        />
                    </div>
                </div>
            )}

            {/* MOOD OVER TIME (single instance, placed before Cycle & Mood) */}
            <section>
                <div className="flex items-center justify-between mb-2 ml-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">{trendData.label}</h3>
                    </div>
                    <button
                        aria-label="What is this?"
                        onClick={() => setOpenHelp(openHelp === 'trend' ? null : 'trend')}
                        className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                    >
                        <CircleHelp size={16} />
                    </button>
                </div>
                {
                    openHelp === 'trend' && (
                        <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                            Shows your mood over the selected time period. Look for rises, dips, and patterns around your routine.
                        </p>
                    )
                }
                <div className="bg-white dark:bg-navy-surface p-4 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border h-48 min-w-0" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis domain={[1, 5]} hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FF6B6B', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="var(--brand-main)"
                                strokeWidth={3}
                                dot={({ cx, cy, payload }: any) => (
                                    <g>
                                        {/* Main mood dot */}
                                        <circle cx={cx} cy={cy} r={4} fill={getMoodColor(payload.mood)} stroke="white" strokeWidth={2} />
                                        {/* Red outer ring for meds skipped */}
                                        {payload.medsSkipped && (
                                            <>
                                                <circle cx={cx} cy={cy} r={8} fill="none" stroke="#EF4444" strokeWidth={2} opacity={0.8} />
                                                <circle cx={cx} cy={cy - 14} r={3} fill="#EF4444" />
                                                <text x={cx} y={cy - 11} textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">!</text>
                                            </>
                                        )}
                                    </g>
                                )}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section >

            {/* 3. ACTIVITIES & MOOD */}
            <section>
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">Activities & Mood</h3>
                    <button
                        aria-label="What is this?"
                        onClick={() => setOpenHelp(openHelp === 'activities' ? null : 'activities')}
                        className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                    >
                        <CircleHelp size={16} />
                    </button>
                </div>
                {openHelp === 'activities' && (
                    <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                        Based on your tags, this compares average mood. Use the top group to plan more; prune or rethink the bottom group.
                    </p>
                )}
                <div className="bg-white dark:bg-navy-surface p-5 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                    {tagStats.length === 0 ? (
                        <p className="text-xs text-center text-warmGray-medium">Log more tags to see what helps!</p>
                    ) : (
                        <div className="space-y-3">
                            {/* Top 3 Best */}
                            <div>
                                <p className="text-[10px] font-bold text-warmGray-medium dark:text-warmGray-light/50 uppercase tracking-wider mb-2">Feels Good</p>
                                <div className="flex flex-wrap gap-2">
                                    {tagStats.slice(0, 3).map(tag => (
                                        <div key={tag.id} className="flex items-center gap-2 bg-green-50/80 dark:bg-green-900/10 pl-2 pr-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30">
                                            <div className="text-soft-mint dark:text-soft-mint flex"><MoodEmoji value={tag.avg} /></div>
                                            <span className="text-xs font-bold text-soft-mint">{tag.label}</span>
                                            <span className="text-[10px] text-warmGray-medium opacity-60">({tag.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-warmGray-light/30 dark:bg-navy-border w-full my-2" />

                            {/* Bottom 3 Worst */}
                            <div>
                                <p className="text-[10px] font-bold text-warmGray-medium dark:text-warmGray-light/50 uppercase tracking-wider mb-2">Feels Rough</p>
                                <div className="flex flex-wrap gap-2">
                                    {tagStats.slice().reverse().slice(0, 3).map(tag => (
                                        <div key={tag.id} className="flex items-center gap-2 bg-red-50/80 dark:bg-red-900/10 pl-2 pr-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
                                            <div className="text-soft-coral dark:text-soft-coral flex"><MoodEmoji value={tag.avg} /></div>
                                            <span className="text-xs font-bold text-soft-coral">{tag.label}</span>
                                            <span className="text-[10px] text-warmGray-medium opacity-60">({tag.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 5. TAGS HEATMAP */}
            <section>
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">Tags & Mood Heatmap</h3>
                    <button
                        aria-label="What is this?"
                        onClick={() => setOpenHelp(openHelp === 'heatmap' ? null : 'heatmap')}
                        className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                    >
                        <CircleHelp size={16} />
                    </button>
                </div>
                {openHelp === 'heatmap' && (
                    <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                        Rows are tags sorted by usage; darker squares mean more entries at that mood. Tap a row to see a quick takeaway.
                    </p>
                )}
                <div className="bg-white dark:bg-navy-surface p-5 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                    <div className="flex justify-between mb-2 px-1">
                        <span className="text-[10px] uppercase font-bold text-warmGray-medium w-20">Tag</span>
                        <div className="flex flex-1 justify-between px-2">
                            {[1, 2, 3, 4, 5].map(m => (
                                <span key={m} className={`text-xs opacity-50 ${m <= 2 ? 'text-soft-coral' : m >= 4 ? 'text-soft-teal' : 'text-soft-amber'}`}><MoodEmoji value={m} /></span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {paginatedHeatmap.map((row) => (
                            <button
                                key={row.key}
                                onClick={() => setSelectedTag(row.key === selectedTag ? null : row.key)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${selectedTag === row.key ? 'bg-brand-light dark:bg-white/5 ring-1 ring-brand' : 'hover:bg-cream dark:hover:bg-navy'}`}
                            >
                                <div className="flex items-center gap-2 w-20 text-xs font-bold text-warmGray dark:text-nearWhite truncate">
                                    <span className="truncate">{row.label}</span>
                                </div>

                                <div className="flex flex-1 justify-between px-2 gap-1">
                                    {[1, 2, 3, 4, 5].map((moodVal) => {
                                        const count = row.distribution[moodVal as 1 | 2 | 3 | 4 | 5];
                                        const opacity = row.distribution.total > 0 ? (count / row.distribution.total) : 0;
                                        const finalOpacity = count > 0 ? Math.max(0.15, opacity) : 0.05;

                                        return (
                                            <div
                                                key={moodVal}
                                                className="h-6 flex-1 rounded-md transition-all"
                                                style={{
                                                    backgroundColor: getMoodColor(moodVal),
                                                    opacity: finalOpacity
                                                }}
                                                title={`${count} entries`}
                                            />
                                        )
                                    })}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {heatmapPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-4 text-sm text-warmGray-medium dark:text-warmGray-light/70">
                            <button
                                onClick={() => setHeatmapPage(Math.max(0, heatmapPage - 1))}
                                disabled={heatmapPage === 0}
                                className="px-3 py-1.5 rounded-lg bg-cream dark:bg-navy hover:bg-brand-light dark:hover:bg-navy-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                &lt;
                            </button>
                            <span className="text-xs font-semibold">
                                {heatmapPage + 1} / {heatmapPages}
                            </span>
                            <button
                                onClick={() => setHeatmapPage(Math.min(heatmapPages - 1, heatmapPage + 1))}
                                disabled={heatmapPage === heatmapPages - 1}
                                className="px-3 py-1.5 rounded-lg bg-cream dark:bg-navy hover:bg-brand-light dark:hover:bg-navy-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                &gt;
                            </button>
                        </div>
                    )}

                    {/* Dynamic Text Insight */}
                    {selectedTag && (
                        <div className="mt-4 p-3 bg-brand-light/50 dark:bg-white/5 rounded-xl border border-brand/10 dark:border-white/10 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <AlertCircle size={14} className="text-brand shrink-0 mt-0.5" />
                                <p className="text-xs text-warmGray dark:text-nearWhite">
                                    {(() => {
                                        const data = heatmapData.find(d => d.key === selectedTag);
                                        if (!data || data.distribution.total === 0) return "No data recorded for this tag yet.";

                                        const badCount = data.distribution[1] + data.distribution[2];
                                        const goodCount = data.distribution[4] + data.distribution[5];
                                        const total = data.distribution.total;
                                        const badPct = Math.round((badCount / total) * 100);
                                        const goodPct = Math.round((goodCount / total) * 100);

                                        if (badPct > 50) return `When you log "${data.label}", you feel Rough/Meh ${badPct}% of the time.`;
                                        if (goodPct > 50) return `When you log "${data.label}", you feel Good/Great ${goodPct}% of the time.`;
                                        return `Your mood is varied when you log "${data.label}".`;
                                    })()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 6. TIME OF DAY */}
            <section>
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">Time of Day Pattern</h3>
                    <button
                        aria-label="What is this?"
                        onClick={() => setOpenHelp(openHelp === 'timeofday' ? null : 'timeofday')}
                        className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                    >
                        <CircleHelp size={16} />
                    </button>
                </div>
                {openHelp === 'timeofday' && (
                    <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                        Average mood by time buckets. Schedule tough tasks in your best period and protect low periods.
                    </p>
                )}
                <div className="bg-white dark:bg-navy-surface p-4 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border min-w-0" style={{ minWidth: 0 }}>
                    <div className="h-40 min-w-0" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeOfDayData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 5]} hide />
                                <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload, label }: any) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-navy p-2 rounded-lg shadow border border-brand/20 text-xs font-bold">
                                                {label}: {payload[0].value} avg
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                                    {timeOfDayData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getMoodColor(entry.avg)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Text Summary below chart */}
                    <div className="grid grid-cols-4 gap-0 mt-2">
                        {timeOfDayData.map(t => (
                            <div key={t.name} className="text-center">
                                {t.count > 0 ? (
                                    <span className="text-[10px] text-warmGray-medium font-medium">
                                        {t.avg >= 4 ? 'Best' : t.avg <= 2.5 ? 'Rough' : 'Okay'}
                                    </span>
                                ) : <span className="text-[10px] text-gray-300">-</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. WEEKLY PATTERN */}
            <section>
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">Weekly Pattern</h3>
                    <button
                        aria-label="What is this?"
                        onClick={() => setOpenHelp(openHelp === 'weekly' ? null : 'weekly')}
                        className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                    >
                        <CircleHelp size={16} />
                    </button>
                </div>
                {openHelp === 'weekly' && (
                    <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                        Your average mood by day of the week. Helps separate "Monday blues" from real patterns.
                    </p>
                )}
                <div className="bg-white dark:bg-navy-surface p-4 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border h-48 min-w-0" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload, label }: any) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-navy p-2 rounded-lg shadow border border-brand/20 text-xs font-bold">
                                            {label}: {payload[0].value} avg ({payload[0].payload.count} entries)
                                        </div>
                                    )
                                }
                                return null;
                            }} />
                            <Bar dataKey="avg" radius={[6, 6, 6, 6]} barSize={20}>
                                {weeklyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getMoodColor(entry.avg)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* 8. WELLNESS IMPACT */}
            {
                wellnessData.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-2 ml-1">
                            <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite">Wellness Impact</h3>
                            <button
                                aria-label="What is this?"
                                onClick={() => setOpenHelp(openHelp === 'wellness' ? null : 'wellness')}
                                className="p-1 text-warmGray-medium hover:text-brand dark:text-warmGray-light/70 dark:hover:text-brand rounded"
                            >
                                <CircleHelp size={16} />
                            </button>
                        </div>
                        {openHelp === 'wellness' && (
                            <p className="text-[11px] text-warmGray-medium dark:text-warmGray-light/70 mb-2 ml-1">
                                How sleep and medication affect your mood average.
                            </p>
                        )}
                        <div className="bg-white dark:bg-navy-surface p-5 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border space-y-3">
                            {wellnessData.map((item) => (
                                <div key={item.name} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-warmGray dark:text-nearWhite flex items-center gap-2">
                                            {item.category === 'Sleep' ? <Moon size={12} className="text-brand" /> : <Pill size={12} className="text-brand" />}
                                            {item.name}
                                        </span>
                                        <span className="font-bold">{item.avg.toFixed(1)} <span className="opacity-50 font-normal">avg</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-brand-light/30 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(item.avg / 5) * 100}%`,
                                                backgroundColor: getMoodColor(item.avg)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }
        </div >
    );
};

export default InsightsView;
