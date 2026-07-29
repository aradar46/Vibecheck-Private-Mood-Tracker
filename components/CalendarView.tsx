import React, { useState, useMemo } from 'react';
import { Entry, Mood } from '../types';
import { MOODS } from '../constants';
import { ChevronLeft, ChevronRight, PlusCircle, Edit2 } from 'lucide-react';

interface CalendarViewProps {
  entries: Entry[];
  onAddEntry: (date: Date) => void;
  onEditEntry: (entry: Entry) => void;
  totalEntries?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onAddEntry, onEditEntry, totalEntries = 0 }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const entriesByDay = useMemo(() => {
    const map: Record<number, Entry[]> = {};
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();

    entries.forEach(e => {
      const d = new Date(e.timestamp);
      if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [entries, currentDate]);

  const getEntriesForDay = (day: number) => {
    return entriesByDay[day] || [];
  };

  const getMonthCheckInCount = () => {
    return entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear();
    }).length;
  };

  const [allCustomMoods, setAllCustomMoods] = useState<any[]>([]);

  React.useEffect(() => {
    const loadCustomMoods = async () => {
      const { getCustomMoods } = await import('../services/storage');
      const moods = await getCustomMoods();
      setAllCustomMoods(moods);
    };
    loadCustomMoods();
  }, [entries]);

  // Render the selected day's details below the calendar
  const renderSelectedDayDetails = () => {
    if (!selectedDay) return null;

    // Get entries for the selected day
    const dayEntries = entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.toDateString() === selectedDay.toDateString();
    });

    return (
      <div className="mt-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 ml-2">
          <h3 className="text-warmGray-medium dark:text-warmGray-light/70 font-bold uppercase text-xs tracking-wider">
            {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <button
            onClick={() => onAddEntry(selectedDay)}
            className="flex items-center gap-1 text-xs font-bold text-brand dark:text-brand-light hover:bg-brand-light dark:hover:bg-navy-surface px-2 py-1 rounded-full transition-colors"
          >
            <PlusCircle size={14} /> Add Entry
          </button>
        </div>

        {dayEntries.length === 0 ? (
          <div className="p-6 bg-brand-light dark:bg-navy-surface rounded-3xl border border-brand/20 dark:border-navy-border text-center text-warmGray-medium dark:text-warmGray-light/50">
            <p>No entries for this day.</p>
          </div>
        ) : (
          dayEntries.map(entry => {
            const moodConfig = MOODS.find(m => m.value === entry.mood);
            const primaryCustomMoodId = entry.customMoods?.[0];
            const primaryCustomMood = primaryCustomMoodId ? allCustomMoods.find(m => m.id === primaryCustomMoodId) : null;

            const displayLabel = primaryCustomMood ? primaryCustomMood.label : moodConfig?.label;
            const displayIcon = primaryCustomMood?.icon || moodConfig?.icon;
            const displayColor = primaryCustomMood ? primaryCustomMood.color : moodConfig?.color;

            return (
              <button
                key={entry.id}
                onClick={() => onEditEntry(entry)}
                className="w-full bg-brand-light dark:bg-navy-surface p-4 rounded-2xl shadow-sm border border-brand/20 dark:border-navy-border flex gap-4 items-start text-left hover:scale-[1.01] transition-transform min-w-0"
              >
                <span className={`material-symbols-outlined text-3xl pt-1 ${displayColor.split(' ')[1]}`}>{displayIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${displayColor.replace('border-2', '')}`}>
                        {displayLabel}
                      </span>
                      <span className="text-xs text-warmGray-medium dark:text-warmGray-light">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Edit2 size={12} className="text-warmGray-light dark:text-warmGray-medium" />
                  </div>
                  {entry.note && <p className="text-warmGray dark:text-nearWhite/90 text-sm italic line-clamp-2 break-words">"{entry.note}"</p>}
                </div>
              </button>
            )
          })
        )}
      </div>
    );
  };

  return (
    <div 
      className="h-full overflow-y-auto pb-40 no-scrollbar px-4 pt-safe"
      style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}
    >
      {totalEntries > 0 && (
        <div className="bg-brand-light dark:bg-white/10 text-brand dark:text-brand-light px-4 py-3 rounded-2xl border border-brand/20 dark:border-brand/20 mb-6 flex items-center gap-3">
          <div className="text-2xl">🌱</div>
          <div>
            <p className="font-bold text-sm">Journey So Far</p>
            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">{totalEntries} total check-ins • Keep flowing!</p>
          </div>
        </div>
      )}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-warmGray dark:text-nearWhite">Calendar</h2>
          <p className="text-warmGray-medium dark:text-warmGray-light/70 text-sm">Your journey at a glance</p>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-navy-surface rounded-2xl p-1.5 shadow-sm border border-warmGray-light/50 dark:border-navy-border">
          <button onClick={prevMonth} className="p-2 hover:bg-cream dark:hover:bg-navy rounded-xl text-warmGray-medium dark:text-warmGray-light transition-colors"><ChevronLeft size={18} /></button>
          <span className="font-bold text-warmGray dark:text-nearWhite w-32 text-center select-none text-sm">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-cream dark:hover:bg-navy rounded-xl text-warmGray-medium dark:text-warmGray-light transition-colors"><ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="bg-white/40 dark:bg-navy-surface/30 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/50 dark:border-navy-border">
        <div className="grid grid-cols-7 mb-4 text-center">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-warmGray-light dark:text-warmGray-light/30 tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-3">
          {/* Padding for first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days */}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dayEntries = getEntriesForDay(day);
            const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === currentDate.getMonth();
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            const hasEntries = dayEntries.length > 0;

            // Determine Mood Color for the specific day
            let moodColor = 'bg-transparent';
            if (hasEntries) {
              const avgMood = dayEntries.reduce((sum, e) => sum + e.mood, 0) / dayEntries.length;
              if (avgMood >= 4.5) moodColor = 'bg-soft-teal';
              else if (avgMood >= 3.5) moodColor = 'bg-soft-mint';
              else if (avgMood >= 2.5) moodColor = 'bg-soft-amber';
              else if (avgMood >= 1.5) moodColor = 'bg-soft-orange';
              else moodColor = 'bg-soft-coral';
            }

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                      ${isSelected ? 'bg-white dark:bg-navy-surface shadow-lg scale-110 z-10 ring-4 ring-brand/10 dark:ring-brand/20' : 'hover:bg-white/50 dark:hover:bg-white/5'}
                      ${isToday && !isSelected ? 'ring-2 ring-brand/30 dark:ring-brand/50' : ''}
                    `}
              >
                <span className={`text-sm font-medium ${isSelected ? 'text-brand font-bold' : 'text-warmGray-dark dark:text-nearWhite'} ${!hasEntries && !isSelected ? 'opacity-40' : ''}`}>
                  {day}
                </span>

                {/* Mood Dot Indicator */}
                {hasEntries && (
                  <div className={`w-2 h-2 rounded-full mt-1 ${moodColor} shadow-sm ${isSelected ? 'scale-125' : ''}`} />
                )}
                {/* Today Dot (if no entries yet) */}
                {isToday && !hasEntries && (
                  <div className="w-1 h-1 rounded-full mt-1 bg-brand opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {renderSelectedDayDetails()}

    </div>
  );
};

export default React.memo(CalendarView);