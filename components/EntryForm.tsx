import React, { useState, useEffect, useRef } from 'react';
import { Mood, Tag, Entry, SymptomsData, Category, CustomMood } from '../types';
import { MOODS, CATEGORY_COLORS } from '../constants';
import Button from './Button';
import { Check, X, Calendar as CalendarIcon, Plus, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllTags, saveCustomTag, getTagFrequency, toggleTagHidden, getCategories, getCustomMoods, getTagColorsEnabled } from '../services/storage';
import Fuse from 'fuse.js';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ORGANIC_MOODS = {
  [Mood.Terrible]: { label: 'Rough', icon: 'sentiment_very_dissatisfied', color: 'text-soft-coral', wash: 'watercolor-wash-red', border: 'border-red-100', ring: 'ring-4 ring-soft-coral/30 border-soft-coral shadow-lg' },
  [Mood.Bad]: { label: 'Not Great', icon: 'sentiment_dissatisfied', color: 'text-soft-orange', wash: 'watercolor-wash-orange', border: 'border-orange-100', ring: 'ring-4 ring-soft-orange/30 border-soft-orange shadow-lg' },
  [Mood.Okay]: { label: "Doin' Okay", icon: 'sentiment_neutral', color: 'text-soft-amber', wash: 'watercolor-wash-yellow', border: 'border-amber-200', ring: 'ring-4 ring-soft-amber/30 border-soft-amber scale-105' },
  [Mood.Good]: { label: 'Pretty Good', icon: 'sentiment_satisfied', color: 'text-soft-mint', wash: 'watercolor-wash-mint', border: 'border-emerald-100', ring: 'ring-4 ring-soft-mint/30 border-soft-mint shadow-lg' },
  [Mood.Great]: { label: 'Feeling Fab', icon: 'sentiment_very_satisfied', color: 'text-soft-teal', wash: 'watercolor-wash-green', border: 'border-teal-100', ring: 'ring-4 ring-soft-teal/30 border-soft-teal shadow-lg' },
};

interface EntryFormProps {
  onSubmit: (
    mood: Mood,
    tags: string[],
    note: string,
    timestamp: number,
    symptoms?: any,
    options?: { suppressClose?: boolean; id?: string },
    customMoods?: string[]
  ) => Promise<Entry | void> | void;
  onCancel: () => void;
  initialDate?: Date;
  initialEntry?: Entry; // For editing
  onDelete?: (id: string) => void; // For deleting while editing
  preSelectedMood?: Mood; // Pre-selected mood from widget (skips mood picker)
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, onCancel, initialDate, initialEntry, onDelete, preSelectedMood }) => {
  // If editing or preSelectedMood from widget, start at step 2 (Details), otherwise step 1 (Mood Picker)
  const [step, setStep] = useState<number>(initialEntry || preSelectedMood ? 2 : 1);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(initialEntry?.mood || preSelectedMood || null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialEntry?.tags || []);
  const [note, setNote] = useState(initialEntry?.note || '');
  const [tagFrequency, setTagFrequency] = useState<Record<string, number>>({});
  const [tagColorsEnabled, setTagColorsEnabled] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);

  // Custom Tag State
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>('other');
  const [showAddTag, setShowAddTag] = useState(false);
  const [allTagsForSearch, setAllTagsForSearch] = useState<Tag[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const fuseRef = useRef<Fuse<Tag> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Custom Moods State
  const [customMoodsList, setCustomMoodsList] = useState<CustomMood[]>([]);
  const [selectedCustomMoods, setSelectedCustomMoods] = useState<string[]>(initialEntry?.customMoods || []);
  const [showCustomMoods, setShowCustomMoods] = useState(false);

  // Initialize Date/Time
  const defaultDate = initialEntry ? new Date(initialEntry.timestamp) : (initialDate || new Date());

  // Helper to format date as YYYY-MM-DD for input
  const formatDateForInput = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  const [entryDate, setEntryDate] = useState<string>(formatDateForInput(defaultDate));
  const [entryTime, setEntryTime] = useState<string>(defaultDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); // HH:MM
  const [showDateTimeEdit, setShowDateTimeEdit] = useState(false); // Toggle date/time edit visibility
  const [showQuickNote, setShowQuickNote] = useState(false); // Toggle Quick Note visibility
  const [savedEntryId, setSavedEntryId] = useState<string | undefined>(initialEntry?.id); // Track saved id to enable delete in create flow

  // Track if we've already saved this entry to avoid double writes (quick save vs full save)
  const hasSavedRef = useRef(false);
  const savedEntryIdRef = useRef<string | undefined>(initialEntry?.id);

  // Lock to prevent double submissions
  const isSubmittingRef = useRef(false);


  useEffect(() => {
    const initTags = async () => {
      // Load Categories first for styling
      const cats = await getCategories();
      setCategories(cats);

      // Load tags (Default + Custom that aren't hidden)
      const all = await getAllTags();
      setAvailableTags(all);
      // build search index with hidden included to de-dup
      const searchable = await getAllTags(true);
      setAllTagsForSearch(searchable);
      fuseRef.current = new Fuse(searchable, { keys: ['label'], threshold: 0.3 });

      // Load tag frequency for smart ordering
      const frequency = await getTagFrequency();
      setTagFrequency(frequency);

      const colorsOn = await getTagColorsEnabled();
      setTagColorsEnabled(colorsOn);

      // Load custom moods
      const cMoods = await getCustomMoods();
      setCustomMoodsList(cMoods.filter(m => !m.isHidden));
    };

    initTags();
  }, [initialEntry, initialDate]);

  useEffect(() => {
    if (!newTagInput.trim()) {
      setTagSuggestions([]);
      return;
    }

    if (fuseRef.current) {
      const results = fuseRef.current.search(newTagInput);
      setTagSuggestions(results.slice(0, 3).map(r => r.item));
    }
  }, [newTagInput]);

  // Handle clicking outside to close Add Tag input if empty
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAddTag && !target.closest('[data-add-tag-section]') && !newTagInput.trim()) {
        setShowAddTag(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddTag, newTagInput]); // Added newTagInput dependency

  // Sort tags by frequency (most used first), then alphabetically
  const getSortedTags = (tags: Tag[]): Tag[] => {
    return [...tags].sort((a, b) => {
      const freqA = tagFrequency[a.id] || 0;
      const freqB = tagFrequency[b.id] || 0;
      if (freqA !== freqB) return freqB - freqA; // Higher frequency first
      return a.label.localeCompare(b.label); // Then alphabetically
    });
  };

  const NEUTRAL_TAG_STYLE = 'bg-warmGray-50 dark:bg-navy-surface text-warmGray dark:text-warmGray-light border-warmGray-light/50 dark:border-navy-border';

  const getCategoryStyles = (category: string) => {
    if (!tagColorsEnabled) return NEUTRAL_TAG_STYLE;
    const cat = categories.find(c => c.id === category);
    if (!cat) return NEUTRAL_TAG_STYLE;
    return CATEGORY_COLORS[cat.colorId] || CATEGORY_COLORS['gray'];
  };

  const handleMoodSelect = async (mood: Mood, customMoodsToInclude: string[] = []) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setSelectedMood(mood);

      try {
        if (Haptics) {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      } catch (err) {
        // Ignore haptics errors
      }

      // Use provided custom moods or current selectedCustomMoods
      const customMoods = customMoodsToInclude.length > 0 ? customMoodsToInclude : selectedCustomMoods;

      if (!hasSavedRef.current) {
        // Create new entry
        const combinedDate = new Date(`${entryDate}T${entryTime}`);
        const saved = await onSubmit(mood, [], '', combinedDate.getTime(), undefined, {
          suppressClose: true,
          id: savedEntryIdRef.current,
        }, customMoods);
        if (saved && typeof saved === 'object' && 'id' in saved) {
          const id = (saved as Entry).id;
          savedEntryIdRef.current = id;
          setSavedEntryId(id);
        }
        hasSavedRef.current = true;
      } else if (savedEntryIdRef.current && customMoods.length > 0) {
        // Update existing entry with custom moods if they were added
        const combinedDate = new Date(`${entryDate}T${entryTime}`);
        await onSubmit(mood, selectedTags, note, combinedDate.getTime(), undefined, {
          suppressClose: true,
          id: savedEntryIdRef.current,
        }, customMoods);
      }

      setStep(2);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleAddNewTag = async () => {
    if (!newTagInput.trim()) return;

    const newTag: Tag = {
      id: `custom-${crypto.randomUUID()}`,
      label: newTagInput.trim(),
      category: newTagCategory,
      isHidden: false
    };

    // Save to storage
    await saveCustomTag(newTag);

    // Update UI - add to available tags if not hidden
    setAvailableTags(prev => [...prev, newTag]);

    // Auto-select
    setSelectedTags(prev => [...prev, newTag.id]);
    setNewTagInput('');
    setShowAddTag(false);
    setTagSuggestions([]);
  };

  const handleTagInputChange = async (val: string) => {
    setNewTagInput(val);
    const fuse = fuseRef.current;
    if (!fuse || !val.trim()) {
      setTagSuggestions([]);
      return;
    }
    const results = fuse.search(val.trim()).slice(0, 5);
    setTagSuggestions(results.map(r => r.item));
  };

  const handleSelectSuggestedTag = async (tag: Tag) => {
    if (tag.isHidden) {
      await toggleTagHidden(tag.id, false);
      // refresh lists
      const visible = await getAllTags();
      setAvailableTags(visible);
      const all = await getAllTags(true);
      setAllTagsForSearch(all);
      fuseRef.current = new Fuse(all, { keys: ['label'], threshold: 0.3 });
    }
    setSelectedTags(prev => prev.includes(tag.id) ? prev : [...prev, tag.id]);
    setNewTagInput('');
    setTagSuggestions([]);
    setShowAddTag(false);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (selectedMood) {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (err) {
          // Ignore haptics errors to avoid blocking save
        }

        const combinedDate = new Date(`${entryDate}T${entryTime}`);
        const saved = await onSubmit(
          selectedMood,
          selectedTags,
          note,
          combinedDate.getTime(),
          undefined,
          { id: savedEntryIdRef.current },
          selectedCustomMoods
        );
        if (saved && typeof saved === 'object' && 'id' in saved) {
          const id = (saved as Entry).id;
          savedEntryIdRef.current = id;
          setSavedEntryId(id);
        }
        onCancel();
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = savedEntryIdRef.current || savedEntryId;
    if (id && onDelete) {
      if (confirm("Are you sure you want to delete this entry?")) {
        onDelete(id);
      }
    }
  }

  const moodConfig = selectedMood ? MOODS.find(m => m.value === selectedMood) : null;
  const organicConfig = selectedMood ? ORGANIC_MOODS[selectedMood] : null;

  // Find primary custom mood (first one selected in step 1)
  const primaryCustomMood = selectedCustomMoods.length > 0
    ? customMoodsList.find(cm => cm.id === selectedCustomMoods[0])
    : null;

  if (step === 1) {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300 relative bg-cream dark:bg-navy">
        <button
          onClick={() => {
            onCancel();
          }}
          className="absolute right-4 p-2 bg-brand-light dark:bg-navy-surface text-warmGray-medium dark:text-warmGray-light rounded-full hover:bg-peach-100 dark:hover:bg-navy-border transition-colors z-50"
          style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center justify-center h-full px-6 py-8"
          style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 2rem))' }}>
          <div className="mb-4">
            <h3 className="text-warmGray dark:text-nearWhite text-2xl font-bold leading-tight text-center font-display">How's the vibe today?</h3>
            <p className="text-warmGray-medium dark:text-warmGray-light/70 text-sm mt-2 text-center">Take a second to listen to your heart and pick the emoji that matches your mood best!</p>
          </div>

          <div className="radial-burst-container flex items-center justify-center mt-4">
            {/* Rough - Mood.Terrible */}
            <button
              onClick={() => handleMoodSelect(Mood.Terrible)}
              className={`absolute top-2 left-2 w-28 h-28 blob-1 watercolor-wash-red border border-red-100 flex flex-col items-center justify-center gap-1 -rotate-12 z-10 active:scale-95 transition-all ${selectedMood === Mood.Terrible ? 'ring-4 ring-soft-coral/30 border-soft-coral shadow-lg' : ''}`}
            >
              <span className="material-symbols-outlined text-soft-coral text-2xl">sentiment_very_dissatisfied</span>
              <span className="text-[9px] font-bold text-soft-coral tracking-wider uppercase">Rough</span>
            </button>

            {/* Feeling Fab - Mood.Great */}
            <button
              onClick={() => handleMoodSelect(Mood.Great)}
              className={`absolute top-2 right-2 w-28 h-28 blob-3 watercolor-wash-green border border-teal-100 flex flex-col items-center justify-center gap-1 rotate-12 z-10 active:scale-95 transition-all ${selectedMood === Mood.Great ? 'ring-4 ring-soft-teal/30 border-soft-teal shadow-lg' : ''}`}
            >
              <span className="material-symbols-outlined text-soft-teal text-2xl">sentiment_very_satisfied</span>
              <span className="text-[9px] font-bold text-soft-teal tracking-wider uppercase">Feeling Fab</span>
            </button>

            {/* Not Great - Mood.Bad */}
            <button
              onClick={() => handleMoodSelect(Mood.Bad)}
              className={`absolute bottom-2 left-2 w-28 h-28 blob-4 watercolor-wash-orange border border-orange-100 flex flex-col items-center justify-center gap-1 rotate-6 z-10 active:scale-95 transition-all ${selectedMood === Mood.Bad ? 'ring-4 ring-soft-orange/30 border-soft-orange shadow-lg' : ''}`}
            >
              <span className="material-symbols-outlined text-soft-orange text-2xl">sentiment_dissatisfied</span>
              <span className="text-[9px] font-bold text-soft-orange tracking-wider uppercase">Not Great</span>
            </button>

            {/* Pretty Good - Mood.Good */}
            <button
              onClick={() => handleMoodSelect(Mood.Good)}
              className={`absolute bottom-2 right-2 w-28 h-28 blob-5 watercolor-wash-mint border border-emerald-100 flex flex-col items-center justify-center gap-1 -rotate-6 z-10 active:scale-95 transition-all ${selectedMood === Mood.Good ? 'ring-4 ring-soft-mint/30 border-soft-mint shadow-lg' : ''}`}
            >
              <span className="material-symbols-outlined text-soft-mint text-2xl">sentiment_satisfied</span>
              <span className="text-[9px] font-bold text-soft-mint tracking-wider uppercase">Pretty Good</span>
            </button>

            {/* Doin' Okay - Mood.Okay */}
            <button
              onClick={() => handleMoodSelect(Mood.Okay)}
              className={`relative w-36 h-36 blob-2 watercolor-wash-yellow border-2 border-amber-200 flex flex-col items-center justify-center gap-1 z-20 shadow-xl shadow-amber-100/50 active:scale-95 transition-all ${selectedMood === Mood.Okay ? 'ring-4 ring-soft-amber/30 border-soft-amber scale-105' : ''}`}
            >
              <span className="material-symbols-outlined text-soft-amber text-5xl">sentiment_neutral</span>
              <span className="text-[11px] font-bold text-soft-amber tracking-widest uppercase mt-1">Doin' Okay</span>
            </button>
          </div>

          {/* Edit date button - moved to appear immediately after mood picker */}
          <button
            onClick={() => setStep(2)}
            className="text-xs text-warmGray-medium dark:text-warmGray-light/70 hover:text-brand dark:hover:text-brand transition-colors flex items-center justify-center gap-1 mt-8"
          >
            <CalendarIcon size={12} /> Edit date/time
          </button>

          {/* Custom Moods (More Feelings) - Step 1 - moved to appear after Edit date/time button */}
          {customMoodsList.length > 0 && (
            <div className="mt-8 w-full max-w-[300px]">
              <button
                onClick={() => setShowCustomMoods(!showCustomMoods)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-warmGray-medium/70 uppercase tracking-widest mb-3 hover:text-brand transition-colors"
              >
                {showCustomMoods ? 'Hide' : 'Other Moods?'} {showCustomMoods ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showCustomMoods && (
                <div className="flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                  {customMoodsList.map(cm => (
                    <button
                      key={cm.id}
                      onClick={() => {
                        const baseMood = cm.value > 0 ? (cm.value as Mood) : Mood.Okay;
                        // Add custom mood to selection first, then pass it to handleMoodSelect.
                        // Use single-select (replace) to match "treat like main mood" behavior.
                        const updatedCustomMoods = [cm.id];
                        setSelectedCustomMoods(updatedCustomMoods);
                        handleMoodSelect(baseMood, updatedCustomMoods);
                      }}
                      className={`
                                      px-4 py-2 rounded-full text-sm font-bold transition-all border shadow-sm
                                      ${cm.color} border-transparent hover:scale-105 active:scale-95 bg-white dark:bg-navy-surface
                                  `}
                    >
                      {cm.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-in slide-in-from-right duration-300 bg-cream dark:bg-navy">
      <div className="sticky top-0 bg-cream/90 dark:bg-navy/90 backdrop-blur-sm z-20 flex items-center justify-between p-4 border-b border-brand-light dark:border-navy-border"
        style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}>
        <button onClick={() => setStep(1)} className="p-2 -ml-2 text-warmGray-medium hover:text-warmGray dark:text-warmGray-light dark:hover:text-nearWhite">
          <span className="text-sm font-bold">← Back</span>
        </button>
        <span className="font-bold text-warmGray dark:text-nearWhite">{initialEntry ? 'Edit Entry' : 'Details'}</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[420px]">
        {/* Date/Time Section - Subtle toggle */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowDateTimeEdit(!showDateTimeEdit)}
            className="text-xs text-warmGray-medium dark:text-warmGray-light/70 hover:text-warmGray hover:dark:text-nearWhite transition-colors flex items-center gap-1.5"
          >
            <CalendarIcon size={12} />
            {new Date(`${entryDate}T${entryTime}`).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })} · {entryTime}
            <Edit size={12} />
          </button>

          {savedEntryId && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-peach-500 hover:text-peach-600 dark:text-peach-300 dark:hover:text-peach-200 rounded-full border border-transparent hover:border-peach-200 dark:hover:border-peach-400"
              aria-label="Delete entry"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Date/Time Inputs - Show only when toggled */}
        {showDateTimeEdit && (
          <div className="flex gap-3 mt-2 animate-in slide-in-from-top-2">
            <div className="flex-[0.65] min-w-0">
              <label className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light/70 uppercase tracking-wider mb-1 block">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-brand-light dark:bg-navy-surface border border-transparent dark:border-navy-border text-warmGray dark:text-nearWhite font-bold focus:ring-2 focus:ring-brand outline-none"
                />
                <CalendarIcon className="absolute left-3 top-3.5 text-warmGray-medium w-4 h-4" />
              </div>
            </div>
            <div className="flex-[0.35] min-w-[140px]">
              <label className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light/70 uppercase tracking-wider mb-1 block">Time</label>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-brand-light dark:bg-navy-surface border border-transparent dark:border-navy-border text-warmGray dark:text-nearWhite font-bold focus:ring-2 focus:ring-brand outline-none"
              />
            </div>
          </div>
        )}

        {/* Mood Selection Summary - Clickable to Change */}
        <button
          onClick={() => setStep(1)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${primaryCustomMood
            ? `${primaryCustomMood.color} bg-opacity-20 hover:bg-opacity-30`
            : `${organicConfig?.border} ${organicConfig?.wash} ${organicConfig?.color} bg-opacity-20 hover:bg-opacity-30`
            }`}
        >
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-4xl ${primaryCustomMood ? primaryCustomMood.color : ''}`}>
              {primaryCustomMood?.icon || organicConfig?.icon}
            </span>
            <div className="text-left">
              <p className={`text-xs font-bold uppercase opacity-60 ${primaryCustomMood ? primaryCustomMood.color : 'text-current'}`}>Current Mood</p>
              <p className={`text-xl font-bold ${primaryCustomMood ? primaryCustomMood.color : 'text-current'}`}>
                {primaryCustomMood?.label || organicConfig?.label}
              </p>
            </div>
          </div>
          <div className={`bg-white/50 dark:bg-black/20 p-2 rounded-full ${primaryCustomMood ? primaryCustomMood.color : 'text-current'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
            </svg>
          </div>
        </button>

        {/* Custom Moods (Step 2) */}
        {customMoodsList.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowCustomMoods(!showCustomMoods)}
              className="flex items-center gap-2 text-[10px] font-bold text-warmGray-medium/50 uppercase tracking-widest mb-2 hover:text-brand transition-colors"
            >
              Other Moods {showCustomMoods ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {showCustomMoods && (
              <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1">
                {customMoodsList.map(cm => {
                  const isSelected = selectedCustomMoods.includes(cm.id);
                  return (
                    <button
                      key={cm.id}
                      onClick={async () => {
                        // Single select: replace previous selection with this one, or deselect if already selected
                        if (isSelected) {
                          setSelectedCustomMoods([]);
                          // Update entry to remove custom mood
                          if (savedEntryIdRef.current && selectedMood) {
                            const combinedDate = new Date(`${entryDate}T${entryTime}`);
                            await onSubmit(selectedMood, selectedTags, note, combinedDate.getTime(), undefined, {
                              suppressClose: true,
                              id: savedEntryIdRef.current,
                            }, []);
                          }
                        } else {
                          setSelectedCustomMoods([cm.id]);
                          // Update the entry with the new custom mood
                          if (savedEntryIdRef.current && selectedMood) {
                            const combinedDate = new Date(`${entryDate}T${entryTime}`);
                            await onSubmit(selectedMood, selectedTags, note, combinedDate.getTime(), undefined, {
                              suppressClose: true,
                              id: savedEntryIdRef.current,
                            }, [cm.id]);
                          }
                        }
                      }}
                      className={`
                                        px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1
                                        ${isSelected
                          ? `${cm.color} bg-white dark:bg-navy-surface border-current ring-1 ring-current scale-105`
                          : 'bg-warmGray-50 dark:bg-navy-surface text-warmGray-medium border-transparent opacity-70 hover:opacity-100 hover:scale-105'}
                                    `}
                    >
                      {isSelected && <Check size={10} strokeWidth={4} />}
                      {cm.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coping Strategies for Bad Moods */}
        {/* Moved to after Log It button */}

        <section>
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-warmGray-medium dark:text-warmGray-light/70 tracking-wider">What's happening?</h3>
          </div>

          {showAddTag && (
            <div data-add-tag-section className="mb-3 bg-brand-light dark:bg-navy-surface p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-brand/10 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-warmGray-medium tracking-wide">Category:</span>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewTagCategory(cat.id)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${newTagCategory === cat.id ? 'border-brand scale-110 shadow-sm ring-1 ring-brand ring-offset-1 dark:ring-offset-navy' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                      } ${CATEGORY_COLORS[cat.colorId]?.split(' ')[0]}`}
                    title={cat.label}
                  />
                ))}
                <span className="text-[10px] font-bold text-brand ml-auto uppercase opacity-70 truncate max-w-[80px]">{categories.find(c => c.id === newTagCategory)?.label || newTagCategory}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  placeholder="Support emoji 😊 Ex: Painting 🎨, Project X 🚀"
                  className="flex-1 p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-brand bg-white dark:bg-navy dark:text-white"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddNewTag} disabled={!newTagInput.trim()}>
                  Add
                </Button>
              </div>
              {tagSuggestions.length > 0 && (
                <div className="mt-2 bg-white dark:bg-navy border border-brand-light dark:border-navy-border rounded-lg shadow-sm divide-y divide-warmGray-light/50 dark:divide-navy-border">
                  {tagSuggestions.map(s => (
                    <button
                      key={s.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand/10 dark:hover:bg-navy-surface flex items-center gap-2"
                      onClick={() => handleSelectSuggestedTag(s)}
                    >
                      <span className="opacity-80">Use existing:</span> <span className="font-semibold">{s.label}</span>
                      {s.isHidden && <span className="ml-auto text-[10px] uppercase tracking-wider text-warmGray-medium">Will unhide</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 justify-start">
            {getSortedTags(availableTags).slice(0, showAllTags ? undefined : 15).map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap shadow-sm flex items-center gap-1
                  ${selectedTags.includes(tag.id)
                    ? 'bg-brand text-brand-text border-brand-dark ring-2 ring-brand-dark ring-offset-1 ring-offset-cream dark:ring-offset-navy scale-105 shadow-md z-10'
                    : `${getCategoryStyles(tag.category)} hover:border-brand hover:scale-105`}
                `}
              >
                {selectedTags.includes(tag.id) && <Check size={12} strokeWidth={4} />}
                {tag.label}
              </button>
            ))}

            {!showAllTags && availableTags.length > 15 && (
              <button
                onClick={() => setShowAllTags(true)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-light dark:bg-navy-surface border border-brand/20 text-brand dark:text-brand-light hover:bg-brand/10 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <ChevronDown size={12} /> + {availableTags.length - 15}
              </button>
            )}

            {showAllTags && availableTags.length > 15 && (
              <button
                onClick={() => setShowAllTags(false)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-light dark:bg-navy-surface border border-brand/20 text-brand dark:text-brand-light hover:bg-brand/10 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <ChevronDown size={12} className="rotate-180" /> Less
              </button>
            )}

            {!showAddTag && (
              <button onClick={() => setShowAddTag(true)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-light dark:bg-navy-surface border border-dashed border-brand/40 text-brand dark:text-brand-light hover:bg-brand/10 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Plus size={12} /> New
              </button>
            )}
          </div>
        </section>

        <section>
          <button
            onClick={() => setShowQuickNote(!showQuickNote)}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity mb-2"
          >
            <h3 className="text-xs font-bold uppercase text-warmGray-medium dark:text-warmGray-light/70 tracking-wider">Note?</h3>
            <ChevronDown size={14} className={`text-warmGray-medium transition-transform ${showQuickNote ? 'rotate-180' : ''}`} />
          </button>

          {showQuickNote && (
            <div className="relative animate-in slide-in-from-top-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Brain dump here..."
                className="w-full p-3 rounded-2xl bg-brand-light dark:bg-navy-surface border-2 border-transparent dark:border-navy-border focus:border-brand focus:ring-0 resize-none h-24 text-sm text-warmGray dark:text-nearWhite transition-colors"
              />
            </div>
          )}
        </section>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 bg-cream dark:bg-navy pt-3 pb-6 space-y-3 border-t border-brand-light/60 dark:border-navy-border z-30"
          style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <Check className="w-5 h-5" />
              <span>Logged: {entryTime}</span>
            </div>
            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70 mt-1">
              Feel free to add more details if you'd like ✨
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1 shadow-xl shadow-brand/20 dark:shadow-none text-sm"
            >
              {initialEntry || savedEntryIdRef.current ? 'Done!' : 'Log It!'} <Check className="w-5 h-5" />
            </Button>
          </div>

          {/* Removed bottom delete button in edit mode to avoid duplication */}
        </div>
      </div>
    </div>
  );
};

export default EntryForm;