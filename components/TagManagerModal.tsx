import React, { useState, useEffect, useRef } from 'react';
import { Tag, Category } from '../types';
import { getAllTags, saveCustomTag, updateTagLabel, toggleTagHidden, getCategories, saveCategory, deleteCategory } from '../services/storage';
import { X, Plus, Trash2, Edit2, Check, Search, Eye, EyeOff, Palette, Settings } from 'lucide-react';
import Button from './Button';
import Fuse from 'fuse.js';
import { CATEGORY_COLORS } from '../constants';

interface TagManagerModalProps {
  onClose: () => void;
  onTagsUpdated: () => void;
}

const TagManagerModal: React.FC<TagManagerModalProps> = ({ onClose, onTagsUpdated }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const getCategoryStyles = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return 'bg-warmGray-50 dark:bg-navy-surface text-warmGray dark:text-warmGray-light border-warmGray-light/50 dark:border-navy-border';
    const colorClass = CATEGORY_COLORS[cat.colorId] || CATEGORY_COLORS['gray'];
    return colorClass;
  };

  const [view, setView] = useState<'tags' | 'categories'>('tags');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState('gray');

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>('other');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const fuseRef = useRef<Fuse<Tag> | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatLabel.trim()) return;
    const id = `cat-${crypto.randomUUID()}`;
    await saveCategory({ id, label: newCatLabel.trim(), colorId: newCatColor });
    setNewCatLabel('');
    setNewCatColor('gray');
    await loadCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? Tags using it will revert to default styling until reassigned.')) {
      await deleteCategory(id);
      await loadCategories();
    }
  };

  const loadTags = async () => {
    const tags = await getAllTags(true);
    setAllTags(tags);
    fuseRef.current = new Fuse(tags, { keys: ['label'], threshold: 0.3 });
  };

  const handleAddTag = async () => {
    if (!newTagInput.trim()) return;
    // Fuzzy duplicate check
    const fuse = fuseRef.current;
    const label = newTagInput.trim();
    const existing = fuse ? fuse.search(label) : [];
    if (existing.length > 0) {
      const match = existing[0].item;
      const confirmUse = confirm(`A similar tag exists: "${match.label}". Use existing instead?`);
      if (confirmUse) {
        if (match.isHidden) {
          await toggleTagHidden(match.id, false);
        }
        setSearchQuery(match.label);
        setNewTagInput('');
        setTagSuggestions([]);
        await loadTags();
        onTagsUpdated();
        return;
      }
    }
    const id = `custom-${crypto.randomUUID()}`;
    await saveCustomTag({ id, label, category: newTagCategory, isHidden: false });
    setNewTagInput('');
    setNewTagCategory('other');
    setTagSuggestions([]);
    await loadTags();
    onTagsUpdated();
  };

  const handleNewTagInputChange = (val: string) => {
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
    }
    setSearchQuery(tag.label);
    setNewTagInput('');
    setTagSuggestions([]);
    await loadTags();
    onTagsUpdated();
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Hide this tag? It will remain attached to past entries.')) {
      await toggleTagHidden(tagId, true);
      await loadTags();
      onTagsUpdated();
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagLabel(tag.label);
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editingTagLabel.trim()) return;

    const tag = allTags.find(t => t.id === tagId);
    if (tag) {
      await updateTagLabel(tag.id, editingTagLabel.trim());
      setEditingTagId(null);
      setEditingTagLabel('');
      await loadTags();
      onTagsUpdated();
    }
  };

  const handleToggleVisibility = async (tag: Tag) => {
    await toggleTagHidden(tag.id, !tag.isHidden);
    await loadTags();
    onTagsUpdated();
  };

  const handleUpdateTagCategory = async (tag: Tag, newCatId: string) => {
    // For custom tags, this updates the record. 
    // For default tags, saveCustomTag will create a custom tag with same ID (override)? 
    // Yes, storage logic usually merges custom over default.
    await saveCustomTag({ ...tag, category: newCatId });
    await loadTags();
    onTagsUpdated();
  };

  const filteredTags = allTags.filter(tag =>
    tag.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleTags = filteredTags.filter(t => !t.isHidden);
  const hiddenTags = filteredTags.filter(t => t.isHidden);

  // Group visible tags by category
  const tagsByCategory = visibleTags.reduce((acc, tag) => {
    const categoryId = tag.category || 'other';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // Sort categories by name for consistent display
  const sortedCategoryIds = Object.keys(tagsByCategory).sort((a, b) => {
    const catA = categories.find(c => c.id === a);
    const catB = categories.find(c => c.id === b);
    const nameA = catA?.label || a;
    const nameB = catB?.label || b;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col animate-in fade-in duration-200">
      <div
        className="p-4 border-b border-warmGray-light/20 flex justify-between items-center bg-white dark:bg-navy-surface shadow-sm"
        style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
      >
        <div>
          <h3 className="font-bold text-lg text-warmGray dark:text-nearWhite">Manage Tags</h3>
          <p className="text-[10px] uppercase font-bold text-warmGray-medium tracking-widest opacity-70">Organize your entries</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X size={20} className="text-warmGray-medium dark:text-warmGray-light" />
        </button>
      </div>

      {/* View Switcher */}
      <div className="flex p-1 mx-4 mt-3 bg-warmGray-light/20 dark:bg-navy-surface rounded-xl">
        <button onClick={() => setView('tags')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'tags' ? 'bg-white dark:bg-navy shadow-sm text-brand' : 'text-warmGray-medium hover:text-warmGray'}`}>Tags</button>
        <button onClick={() => setView('categories')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'categories' ? 'bg-white dark:bg-navy shadow-sm text-brand' : 'text-warmGray-medium hover:text-warmGray'}`}>Categories</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">

        {view === 'tags' && (
          <>
            {/* Search & Add */}
            <div className="p-4 space-y-4 border-b border-warmGray-light/50 dark:border-navy-border">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmGray-medium" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border text-warmGray dark:text-nearWhite text-sm focus:ring-2 focus:ring-brand outline-none shadow-sm"
                />
              </div>

              {/* Add New Tag */}
              <div className="bg-white dark:bg-navy-surface p-3 rounded-2xl border border-warmGray-light/50 dark:border-navy-border shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 pt-2 border-b border-warmGray-light/30 dark:border-navy-border overflow-x-auto no-scrollbar">
                  <span className="text-[10px] uppercase font-bold text-warmGray-medium tracking-wide shrink-0">Category:</span>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewTagCategory(cat.id)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${newTagCategory === cat.id ? 'border-brand scale-110 shadow-sm ring-1 ring-brand ring-offset-1 dark:ring-offset-navy' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
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
                    onChange={(e) => handleNewTagInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="New tag name (e.g. 🎨 Painting)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-cream dark:bg-navy border border-transparent focus:bg-white dark:focus:bg-navy-surface focus:border-brand text-warmGray dark:text-nearWhite text-sm outline-none transition-all tags-input"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagInput.trim()}
                    className="bg-brand text-brand-text px-4 py-2 rounded-xl disabled:opacity-50 hover:brightness-110 transition-all flex items-center gap-1.5 font-bold text-sm shadow-md shadow-brand/20"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-navy-surface border border-warmGray-light/50 dark:border-navy-border rounded-xl overflow-hidden shadow-lg z-10">
                    {tagSuggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSuggestedTag(s)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-brand/10 dark:hover:bg-navy transition-colors flex items-center gap-2 border-b border-warmGray-light/20 last:border-0"
                      >
                        <span className="opacity-70 text-xs uppercase font-bold">Use Existing:</span>
                        <span className="font-bold text-brand">{s.label}</span>
                        {s.isHidden && <span className="ml-auto text-[10px] uppercase tracking-wider text-warmGray-medium bg-warmGray-light/30 px-2 py-0.5 rounded-full">Hidden</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Visible Tags Grouped by Category */}
              {visibleTags.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light uppercase tracking-wider mb-3 px-1">
                    Active Tags ({visibleTags.length})
                  </h3>
                  {sortedCategoryIds.map(categoryId => {
                    const categoryTags = tagsByCategory[categoryId];
                    const category = categories.find(c => c.id === categoryId);
                    const categoryName = category?.label || categoryId;
                    const categoryColor = category?.colorId || 'gray';
                    
                    return (
                      <div key={categoryId} className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[categoryColor]?.split(' ')[0]}`}></div>
                          <h4 className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light uppercase tracking-wider">
                            {categoryName} ({categoryTags.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {categoryTags.map(tag => (
                            <div
                              key={tag.id}
                              className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all group ${editingTagId === tag.id
                                ? 'bg-white dark:bg-navy border-brand shadow-md z-10'
                                : `${getCategoryStyles(tag.category)} hover:border-brand/50 hover:shadow-sm`
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {editingTagId === tag.id ? (
                                  <>
                                    <input
                                      type="text"
                                      value={editingTagLabel}
                                      onChange={(e) => setEditingTagLabel(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(tag.id)}
                                      className="flex-1 px-2 py-1 rounded-lg bg-transparent border-b border-warmGray-medium/20 text-warmGray dark:text-nearWhite text-base font-bold outline-none"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleSaveEdit(tag.id)} className="p-2 bg-brand text-brand-text rounded-full hover:brightness-110 shadow-sm"><Check size={14} /></button>
                                      <button onClick={() => { setEditingTagId(null); setEditingTagLabel(''); }} className="p-2 bg-warmGray-light text-warmGray-medium rounded-full hover:bg-warmGray-medium hover:text-white"><X size={14} /></button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={`w-2 h-8 rounded-full ${CATEGORY_COLORS[categoryColor]?.split(' ')[0]}`}></div>
                                    <span className="flex-1 text-sm font-bold opacity-90">
                                      {tag.label}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleStartEdit(tag)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Rename/Edit"><Edit2 size={14} /></button>
                                      <button onClick={() => handleToggleVisibility(tag)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Hide"><EyeOff size={14} /></button>
                                      <button onClick={() => handleDeleteTag(tag.id)} className="p-2 rounded-full hover:bg-red-50 text-red-400 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                  </>
                                )}
                              </div>
                              {editingTagId === tag.id && (
                                <div className="flex items-center gap-2 pt-2 border-t border-warmGray-light/20 overflow-x-auto no-scrollbar">
                                  <span className="text-[10px] font-bold uppercase text-warmGray-medium shrink-0">Change Cat:</span>
                                  {categories.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => handleUpdateTagCategory(tag, c.id)}
                                      className={`w-6 h-6 rounded-full border-2 shrink-0 ${tag.category === c.id ? `border-brand ring-1 ring-brand scale-110` : 'border-transparent hover:scale-110'} ${CATEGORY_COLORS[c.colorId]?.split(' ')[0]}`}
                                      title={c.label}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {hiddenTags.length > 0 && (
                <div className="opacity-70 grayscale-[0.5]">
                  <h3 className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light uppercase tracking-wider mb-3 px-1">Hidden Tags ({hiddenTags.length})</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {hiddenTags.map(tag => (
                      <div key={tag.id} className="flex items-center gap-3 p-3 rounded-2xl bg-warmGray-light/20 dark:bg-navy-surface border border-transparent">
                        <span className="flex-1 text-sm font-medium line-through opacity-60 ml-2">{tag.label}</span>
                        <button onClick={() => handleToggleVisibility(tag)} className="p-2 bg-nearWhite dark:bg-navy rounded-full shadow-sm text-brand"><Eye size={14} /></button>
                        <button onClick={() => handleDeleteTag(tag.id)} className="p-2 bg-nearWhite dark:bg-navy rounded-full shadow-sm text-red-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'categories' && (
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Add Category */}
            <div className="bg-white dark:bg-navy-surface p-4 rounded-2xl border border-warmGray-light/50 dark:border-navy-border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-warmGray dark:text-nearWhite flex items-center gap-2"><Plus size={16} /> Create New Category</h3>
              <div className="space-y-4">
                <input
                  value={newCatLabel}
                  onChange={e => setNewCatLabel(e.target.value)}
                  placeholder="Category Name (e.g. 🎨 Creative)"
                  className="w-full px-3 py-2 rounded-xl bg-cream dark:bg-navy border border-transparent focus:bg-white dark:focus:bg-navy-surface focus:border-brand text-warmGray dark:text-nearWhite text-sm outline-none transition-all"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-warmGray-medium tracking-wide mb-2 block">Choose Color</span>
                  <div className="grid grid-cols-10 gap-2">
                    {Object.keys(CATEGORY_COLORS).map(colorKey => {
                      // Map to more vibrant colors for the picker
                      const colorMap: Record<string, string> = {
                        'red': 'bg-red-500',
                        'rose': 'bg-rose-500',
                        'pink': 'bg-pink-500',
                        'fuchsia': 'bg-fuchsia-500',
                        'purple': 'bg-purple-500',
                        'violet': 'bg-violet-500',
                        'indigo': 'bg-indigo-500',
                        'blue': 'bg-blue-500',
                        'sky': 'bg-sky-500',
                        'cyan': 'bg-cyan-500',
                        'teal': 'bg-teal-500',
                        'emerald': 'bg-emerald-500',
                        'green': 'bg-green-500',
                        'lime': 'bg-lime-500',
                        'yellow': 'bg-yellow-500',
                        'amber': 'bg-amber-500',
                        'orange': 'bg-orange-500',
                        'slate': 'bg-slate-500',
                        'gray': 'bg-gray-500',
                        'stone': 'bg-stone-500',
                      };
                      return (
                        <button
                          key={colorKey}
                          onClick={() => setNewCatColor(colorKey)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${colorMap[colorKey] || 'bg-gray-500'} ${newCatColor === colorKey ? 'border-brand scale-125 shadow-md ring-2 ring-brand ring-offset-2 dark:ring-offset-navy' : 'border-white dark:border-navy shadow-sm hover:scale-110'}`}
                          title={colorKey}
                        />
                      );
                    })}
                  </div>
                </div>
                <Button onClick={handleAddCategory} disabled={!newCatLabel.trim()} className="w-full">Create Category</Button>
              </div>
            </div>

            {/* List Categories */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light uppercase tracking-wider px-1">Your Categories ({categories.length})</h3>
              <div className="grid gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 p-3 bg-white dark:bg-navy-surface rounded-xl border border-warmGray-light/50 dark:border-navy-border shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${CATEGORY_COLORS[cat.colorId]}`}>
                      {cat.label[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-warmGray dark:text-nearWhite">{cat.label}</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat.colorId]?.split(' ')[0]}`}></div>
                        <p className="text-[10px] text-warmGray-medium opacity-70 uppercase tracking-widest">{cat.colorId}</p>
                      </div>
                    </div>
                    {!cat.isDefault && (
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 rounded-lg hover:bg-red-50 text-warmGray-medium hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                    {cat.isDefault && (
                      <span className="text-[10px] font-bold text-warmGray-medium bg-warmGray-light/20 px-2 py-1 rounded-md">Default</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );



};

export default TagManagerModal;
