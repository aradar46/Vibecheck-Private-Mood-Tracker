import React, { useState, useRef, useEffect } from 'react';
import { Tag } from '../../types';
import { Plus, ChevronDown } from 'lucide-react';
import { getAllTags, saveCustomTag, toggleTagHidden, getTagFrequency } from '../../services/storage';
import Button from '../Button';
import Fuse from 'fuse.js';

interface TagSelectorProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagsChange }) => {
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [tagFrequency, setTagFrequency] = useState<Record<string, number>>({});
    const [showAllTags, setShowAllTags] = useState(false);
    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
    const [allTagsForSearch, setAllTagsForSearch] = useState<Tag[]>([]);
    const fuseRef = useRef<Fuse<Tag> | null>(null);

    useEffect(() => {
        const loadTags = async () => {
            const [tags, searchable, frequency] = await Promise.all([
                getAllTags(),
                getAllTags(true),
                getTagFrequency(),
            ]);
            setAvailableTags(tags);
            setAllTagsForSearch(searchable);
            setTagFrequency(frequency);
            fuseRef.current = new Fuse(searchable, { keys: ['label'], threshold: 0.3 });
        };
        loadTags();
    }, []);

    // Close add tag section when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showAddTag) {
                const target = event.target as HTMLElement;
                if (!target.closest('[data-add-tag-section]')) {
                    setShowAddTag(false);
                    setNewTagInput('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showAddTag]);

    const toggleTag = (tagId: string) => {
        onTagsChange(
            selectedTags.includes(tagId)
                ? selectedTags.filter(id => id !== tagId)
                : [...selectedTags, tagId]
        );
    };

    const handleAddNewTag = async () => {
        if (!newTagInput.trim()) return;

        const newTag: Tag = {
            id: `custom-${crypto.randomUUID()}`,
            label: newTagInput.trim(),
            category: 'custom',
            isHidden: false,
        };

        await saveCustomTag(newTag);
        setAvailableTags(prev => [...prev, newTag]);
        onTagsChange([...selectedTags, newTag.id]);
        setNewTagInput('');
        setShowAddTag(false);
        setTagSuggestions([]);
    };

    const handleTagInputChange = (val: string) => {
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
            const visible = await getAllTags();
            setAvailableTags(visible);
            const all = await getAllTags(true);
            setAllTagsForSearch(all);
            fuseRef.current = new Fuse(all, { keys: ['label'], threshold: 0.3 });
        }
        onTagsChange(selectedTags.includes(tag.id) ? selectedTags : [...selectedTags, tag.id]);
        setNewTagInput('');
        setTagSuggestions([]);
        setShowAddTag(false);
    };

    // Sort tags by frequency
    const getSortedTags = (tags: Tag[]): Tag[] => {
        return [...tags].sort((a, b) => {
            const freqA = tagFrequency[a.id] || 0;
            const freqB = tagFrequency[b.id] || 0;
            if (freqA !== freqB) return freqB - freqA;
            return a.label.localeCompare(b.label);
        });
    };

    return (
        <section>
            <div className="mb-2">
                <h3 className="text-xs font-bold uppercase text-warmGray-medium dark:text-warmGray-light/70 tracking-wider">
                    What's happening?
                </h3>
            </div>

            {showAddTag && (
                <div
                    data-add-tag-section
                    className="mb-3 bg-brand-light dark:bg-navy-surface p-3 rounded-xl animate-in fade-in slide-in-from-top-2"
                >
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
                            {tagSuggestions.map((s) => (
                                <button
                                    key={s.id}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand/10 dark:hover:bg-navy-surface flex items-center gap-2"
                                    onClick={() => handleSelectSuggestedTag(s)}
                                >
                                    <span className="opacity-80">Use existing:</span>{' '}
                                    <span className="font-semibold">{s.label}</span>
                                    {s.isHidden && (
                                        <span className="ml-auto text-[10px] uppercase tracking-wider text-warmGray-medium">
                                            Will unhide
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-wrap gap-1.5">
                {getSortedTags(availableTags)
                    .slice(0, showAllTags ? undefined : 20)
                    .map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`
                px-2 py-1 rounded-lg text-xs transition-colors border-2 whitespace-nowrap
                ${selectedTags.includes(tag.id)
                                    ? 'bg-brand text-brand-text border-brand'
                                    : 'bg-white dark:bg-navy text-warmGray dark:text-nearWhite border-brand-light dark:border-navy-border hover:border-brand'
                                }
              `}
                        >
                            {tag.label}
                        </button>
                    ))}

                {!showAllTags && availableTags.length > 5 && (
                    <button
                        onClick={() => setShowAllTags(true)}
                        className="px-2 py-1 text-xs font-semibold text-brand hover:text-brand/80 dark:text-brand dark:hover:text-brand/80 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                        <ChevronDown size={12} /> + {availableTags.length - 5}
                    </button>
                )}

                {showAllTags && availableTags.length > 5 && (
                    <button
                        onClick={() => setShowAllTags(false)}
                        className="px-2 py-1 text-xs font-semibold text-brand hover:text-brand/80 dark:text-brand dark:hover:text-brand/80 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                        <ChevronDown size={12} className="rotate-180" /> Less
                    </button>
                )}

                {!showAddTag && (
                    <button
                        onClick={() => setShowAddTag(true)}
                        className="px-2 py-1 text-xs font-semibold text-brand flex items-center gap-1 hover:text-brand/80 transition-colors whitespace-nowrap"
                    >
                        <Plus size={12} /> Add
                    </button>
                )}
            </div>
        </section>
    );
};

export default TagSelector;
