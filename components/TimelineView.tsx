import React, { useState, useEffect, useMemo } from 'react';
import { Entry } from '../types';
import { MOODS } from '../constants';
import { getAllTags, getCustomMoods } from '../services/storage';
import { Edit2, Filter } from 'lucide-react';
import type { Tag, CustomMood } from '../types';

interface TimelineViewProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onOpenCalendar?: () => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, onEdit, onOpenCalendar }) => {
  // Filter UI state
  const [showFilter, setShowFilter] = useState(false);
  const [filterMood, setFilterMood] = useState<number[]>([]);
  const [filterTag, setFilterTag] = useState<string[]>([]);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCustomMoods, setAllCustomMoods] = useState<CustomMood[]>([]);

  const sortedEntries = useMemo(() => {
    const filtered = entries.filter(e => {
      if (filterMood.length > 0 && !filterMood.includes(e.mood)) return false;
      if (filterTag.length > 0 && !e.tags.some(t => filterTag.includes(t))) return false;
      if (filterKeyword && !(e.note?.toLowerCase().includes(filterKeyword.toLowerCase()) || e.tags.some(tid => allTags.find(t => t.id === tid)?.label.toLowerCase().includes(filterKeyword.toLowerCase())))) return false;
      if (filterDateFrom && e.timestamp < new Date(filterDateFrom).setHours(0, 0, 0, 0)) return false;
      if (filterDateTo && e.timestamp > new Date(filterDateTo).setHours(23, 59, 59, 999)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, filterMood, filterTag, filterKeyword, filterDateFrom, filterDateTo, allTags]);

  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags();
      setAllTags(tags);
      const moods = await getCustomMoods();
      setAllCustomMoods(moods);
    };
    loadTags();
  }, [entries]);

  return (
    <div className="h-full overflow-y-auto pb-24 no-scrollbar px-4 pt-6">
      <div className="flex items-center justify-between mb-6 gap-2">
        <h2 className="text-xl font-semibold text-warmGray-medium dark:text-warmGray-light">Timeline</h2>
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={() => setShowFilter(f => !f)}
            className={`p-2 rounded-xl ${showFilter ? 'bg-brand-light dark:bg-navy' : ''} text-brand hover:bg-brand-light dark:hover:bg-navy transition-colors`}
            aria-label="Show filters"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Subtle filter bar, shown only if toggled */}
      {showFilter && (
        <div className="mb-4 p-3 rounded-2xl bg-white/80 dark:bg-navy-surface/80 border border-warmGray-light/40 dark:border-navy-border flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light/70 mr-2">Filter:</span>
          {/* Mood multi-select */}
          <div className="relative group">
            <button type="button" className="text-xs px-2 py-1 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite flex items-center gap-1" tabIndex={0}>
              {filterMood.length === 0 ? 'Mood' : (
                <div className="flex gap-1">
                  {filterMood.map(val => {
                    const m = MOODS.find(mood => mood.value === val);
                    return <span key={val} className="material-symbols-outlined text-[16px]">{m?.icon}</span>;
                  })}
                </div>
              )}
              <span className="ml-1">▼</span>
            </button>
            <div className="absolute left-0 mt-1 z-20 bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border rounded-lg shadow-lg p-2 min-w-[120px] hidden group-focus-within:block group-hover:block">
              {MOODS.map(m => (
                <label key={m.value} className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterMood.includes(m.value)}
                    onChange={e => {
                      setFilterMood(fm => e.target.checked ? [...fm, m.value] : fm.filter(v => v !== m.value));
                    }}
                  />
                  <span className={`material-symbols-outlined text-[18px] ${m.color.split(' ')[1]}`}>{m.icon}</span>
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Tag multi-select */}
          <div className="relative group">
            <button type="button" className="text-xs px-2 py-1 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite flex items-center gap-1" tabIndex={0}>
              {filterTag.length === 0 ? 'Tag' : filterTag.map(val => allTags.find(t => t.id === val)?.label).filter(Boolean).join(', ')}
              <span className="ml-1">▼</span>
            </button>
            <div className="absolute left-0 mt-1 z-20 bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border rounded-lg shadow-lg p-2 min-w-[120px] max-h-48 overflow-y-auto hidden group-focus-within:block group-hover:block">
              {allTags.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterTag.includes(t.id)}
                    onChange={e => {
                      setFilterTag(ft => e.target.checked ? [...ft, t.id] : ft.filter(v => v !== t.id));
                    }}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Date range */}
          <input
            type="date"
            className="text-xs px-2 py-1 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            placeholder="From"
            style={{ minWidth: 110 }}
          />
          <input
            type="date"
            className="text-xs px-2 py-1 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            placeholder="To"
            style={{ minWidth: 110 }}
          />
          {/* Keyword search */}
          <input
            type="text"
            className="text-xs px-2 py-1 rounded-lg border border-warmGray-light/50 dark:border-navy-border bg-cream dark:bg-navy text-warmGray dark:text-nearWhite"
            value={filterKeyword}
            onChange={e => setFilterKeyword(e.target.value)}
            placeholder="Keyword..."
            style={{ minWidth: 120 }}
          />
          {/* Clear button */}
          <button
            className="text-xs px-2 py-1 rounded-lg bg-warmGray-light/40 dark:bg-navy-border text-warmGray dark:text-warmGray-light ml-2"
            onClick={() => { setFilterMood([]); setFilterTag([]); setFilterKeyword(''); setFilterDateFrom(''); setFilterDateTo(''); }}
          >Clear</button>
        </div>
      )}

      <div className="space-y-4 relative min-h-[200px]">
        {/* Simple vertical line connector */}
        {sortedEntries.length > 0 && (
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-warmGray-light dark:bg-navy-border z-0"></div>
        )}

        {sortedEntries.map((entry) => {
          const date = new Date(entry.timestamp);

          // RENDER REGULAR MOOD ENTRY
          const moodConfig = MOODS.find(m => m.value === entry.mood);

          // Determine if we have a primary custom mood to display as main label
          const primaryCustomMoodId = entry.customMoods?.[0];
          const primaryCustomMood = primaryCustomMoodId ? allCustomMoods.find(m => m.id === primaryCustomMoodId) : null;

          const displayLabel = primaryCustomMood ? primaryCustomMood.label : moodConfig?.label;
          const displayIcon = primaryCustomMood?.icon || moodConfig?.icon;
          const displayColor = primaryCustomMood ? primaryCustomMood.color : moodConfig?.color;

          return (
            <div key={entry.id} className="relative z-10 flex gap-4 group">
              {/* Square Date for Entries */}
              <div className="flex flex-col items-center w-16 pt-2 bg-brand-light dark:bg-navy-surface rounded-xl h-fit pb-2 border border-brand/20 dark:border-navy-border">
                <span className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light/70 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-xl font-bold text-warmGray dark:text-nearWhite">{date.getDate()}</span>
                <span className="text-xs text-warmGray-medium dark:text-warmGray-light/70">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Card - Clickable to Edit */}
              <button
                onClick={() => onEdit(entry)}
                className="flex-1 bg-brand-light dark:bg-navy-surface p-4 rounded-2xl shadow-sm border border-brand/20 dark:border-navy-border transition-all hover:shadow-md hover:scale-[1.01] text-left w-full min-w-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${displayColor} bg-opacity-20`}>
                    <span className="material-symbols-outlined text-[18px]">{displayIcon}</span>
                    <span>{displayLabel}</span>
                  </div>
                  {entry.customMoods && entry.customMoods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.customMoods.filter(id => id !== primaryCustomMood?.id).map(cmId => {
                        const cm = allCustomMoods.find(m => m.id === cmId);
                        if (!cm) return null;
                        return (
                          <span key={cm.id} className={`text-[10px] px-1.5 py-0.5 rounded-lg border ${cm.color.replace('text-', 'border-').replace('bg-', 'text-')} bg-transparent opacity-80`}>
                            {cm.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <span className="text-warmGray-light dark:text-warmGray-medium">
                    <Edit2 size={14} />
                  </span>
                </div>

                {entry.note && (
                  <p className="text-warmGray dark:text-nearWhite/90 mb-3 text-sm italic border-l-2 border-lavender dark:border-lavender/50 pl-3 py-1 line-clamp-3 break-words">
                    "{entry.note}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {entry.tags.map(tId => {
                    const t = allTags.find(tag => tag.id === tId);
                    return t ? (
                      <span key={tId} className="text-xs px-2 py-1 bg-white dark:bg-navy text-warmGray-medium dark:text-warmGray-light rounded-lg border border-warmGray-light/50 dark:border-navy-border">
                        #{t.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TimelineView);