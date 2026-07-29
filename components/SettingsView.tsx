import React, { useState, useEffect } from 'react';
import Button from './Button';
import TagManagerModal from './TagManagerModal';
import MoodManager from './MoodManager';
import { clearData, getAllTags, saveCustomTag, toggleTagHidden, getNotificationTimes, saveNotificationTimes, getNavLabelsEnabled, setNavLabelsEnabled, getTagColorsEnabled, setTagColorsEnabled, getCustomMoods, restoreBackupData } from '../services/storage';
import {
    initializeNotifications,
    scheduleMoodNotifications,
    scheduleMedicationNotification,
    initializeNotificationsOnAppStart,
    registerNotificationActions,
    handleNotificationAction,
    snoozeNotification
} from '../services/notificationService';
import { saveAndShareBackup, isGoogleDriveConfigured, getGoogleAuthUrl } from '../services/driveBackupService';
import { Moon, Sun, Trash2, Shield, User, PenLine, Tag as TagIcon, Plus, X as XIcon, ExternalLink, Bell, Clock, Palette, Download, Upload, FileText, Cloud, LayoutGrid, Pill, Smile, Coffee } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Tag } from '../types';

interface SettingsViewProps {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onClearData: () => void;
    userName: string;
    onNameChange: (name: string) => void;
    onThemeChange: (theme: string) => void;
    currentTheme: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    isDarkMode,
    toggleDarkMode,
    onClearData,
    userName,
    onNameChange,
    onThemeChange,
    currentTheme
}) => {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [navLabelsEnabled, setNavLabelsEnabledState] = useState(false);
    const [tagColorsEnabled, setTagColorsEnabledState] = useState(true);
    const [showTagManager, setShowTagManager] = useState(false);
    const [showMoodManager, setShowMoodManager] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [moodCount, setMoodCount] = useState(0);

    // Notification State
    const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
    const [newTime, setNewTime] = useState('');
    const [medTimes, setMedTimes] = useState<string[]>([]);
    const [newMedTime, setNewMedTime] = useState('');

    const themes = [

        { id: 'ocean', name: 'Ocean', color: '#7598a0' },
        { id: 'rose', name: 'Rose', color: '#FF6B6B' },
        { id: 'apricot', name: 'Apricot', color: '#ebb497ff' },
    ];

    useEffect(() => {
        loadTags();
        loadMoods();
        loadNotifications();
        loadNavLabelsPreference();
        loadTagColorsPreference();
        // Register notification actions and handler
        registerNotificationActions();
        handleNotificationAction(async (actionId, notification) => {
            if (actionId === 'snooze') {
                await snoozeNotification(notification.id, 15);
            } else if (actionId.startsWith('mood-')) {
                const moodValue = parseInt(actionId.replace('mood-', ''));
                await import('../services/notificationService').then(mod => mod.logMoodFromNotification(moodValue));
                await loadNotifications();
            } else if (actionId === 'taken') {
                alert('Medication marked as taken!');
            }
        });
    }, []);

    const loadTags = async () => {
        const tags = await getAllTags();
        setAllTags(tags);
    };

    const loadMoods = async () => {
        const moods = await getCustomMoods();
        setMoodCount(moods.length);
    };

    const loadNotifications = async () => {
        const times = await getNotificationTimes();
        setNotificationTimes(times);
        // Load medication times from storage (comma-separated string)
        const med = localStorage.getItem('medicationTimes') || '';
        setMedTimes(med ? med.split(',') : []);
    };
    const loadNavLabelsPreference = async () => {
        const enabled = await getNavLabelsEnabled();
        setNavLabelsEnabledState(enabled);
    };

    const loadTagColorsPreference = async () => {
        const enabled = await getTagColorsEnabled();
        setTagColorsEnabledState(enabled);
    };

    const handleToggleTagColors = async () => {
        const newValue = !tagColorsEnabled;
        setTagColorsEnabledState(newValue);
        await setTagColorsEnabled(newValue);
    };

    const handleToggleNavLabels = async () => {
        const newValue = !navLabelsEnabled;
        setNavLabelsEnabledState(newValue);
        await setNavLabelsEnabled(newValue);
        // Reload the page to apply changes (nav bar is in App.tsx)
        window.location.reload();
    };

    const handleClear = async () => {
        if (confirm("Are you sure? This will delete all your mood history and cannot be undone.")) {
            await clearData();
            onClearData();
            // Force reload to ensure complete reset of state
            window.location.reload();
        }
    };

    const handleAddTag = async () => {
        if (!newTagInput.trim()) return;
        const newTag: Tag = {
            id: `custom-setting-${crypto.randomUUID()}`,
            label: newTagInput.trim(),
            category: 'custom',
            isHidden: false
        };
        await saveCustomTag(newTag);
        setNewTagInput('');
        await loadTags();
    };

    const handleDeleteTag = async (id: string) => {
        await toggleTagHidden(id, true);
        await loadTags();
    };

    const handleExportJson = async () => {
        try {
            await saveAndShareBackup();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            const success = await restoreBackupData(data);
            if (success) {
                alert('Backup imported successfully! The app will now reload to apply changes.');
                window.location.reload();
            } else {
                alert('Failed to import backup. The file may be corrupted or invalid.');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to read the backup file. Please ensure it is a valid JSON file.');
        } finally {
            // Reset input
            e.target.value = '';
        }
    };

    const handleExportReport = async () => {
        // Mocked function - feature disabled
        alert('Export PDF Report feature is currently disabled.');
    };

    const handleAddTime = async () => {
        if (!newTime) return;
        if (notificationTimes.length >= 6) {
            alert("You can set up to 6 reminders.");
            return;
        }
        if (notificationTimes.includes(newTime)) {
            alert("This time is already set.");
            return;
        }
        const granted = await initializeNotifications();
        if (!granted) {
            alert("Notification permission is required to set reminders.");
            return;
        }
        const updated = [...notificationTimes, newTime].sort();
        setNotificationTimes(updated);
        await saveNotificationTimes(updated);
        await scheduleMoodNotifications(updated);
        setNewTime('');
    };

    const handleDeleteTime = async (time: string) => {
        const updated = notificationTimes.filter(t => t !== time);
        setNotificationTimes(updated);
        await saveNotificationTimes(updated);
        await scheduleMoodNotifications(updated);
    };

    // Medication reminder logic
    const handleAddMedTime = async () => {
        if (!newMedTime) return;
        if (medTimes.length >= 6) {
            alert("You can set up to 6 medication reminders.");
            return;
        }
        if (medTimes.includes(newMedTime)) {
            alert("This time is already set.");
            return;
        }
        // Check notification permission
        const granted = await initializeNotifications();
        if (!granted) {
            alert("Notification permission is required for medication reminders. Please enable it in your device settings.");
            return;
        }
        const updated = [...medTimes, newMedTime].sort();
        setMedTimes(updated);
        localStorage.setItem('medicationTimes', updated.join(','));
        await scheduleMedicationNotification(updated);
        setNewMedTime('');
    };

    const handleDeleteMedTime = async (time: string) => {
        const updated = medTimes.filter(t => t !== time);
        setMedTimes(updated);
        localStorage.setItem('medicationTimes', updated.join(','));
        await scheduleMedicationNotification(updated);
    };

    return (
        // Increased padding bottom to pb-40 to prevent Nav bar overlap
        <div 
            className="h-full overflow-y-auto pb-40 no-scrollbar px-4 pt-safe space-y-6"
            style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}
        >

            <div className="text-center mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-5" />
                <img
                    src="/logo.png"
                    alt="Vibecheck Logo"
                    className="w-28 h-28 mb-2 object-contain"
                />
                <h1 className="text-2xl font-bold text-warmGray-dark dark:text-nearWhite mb-1">Vibecheck</h1>
                <p className="text-sm font-semibold text-brand/80">Private Mood Tracker</p>
            </div>

            {/* Support Open Source / Ko-fi */}
            <section className="bg-amber-500/10 dark:bg-amber-500/15 p-5 rounded-3xl border border-amber-500/30 shadow-sm transition-all hover:border-amber-500/50">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                            <Coffee size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-warmGray dark:text-nearWhite">Support Open Source</h3>
                            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">100% Free, Ad-free & Private</p>
                        </div>
                    </div>
                    <a
                        href="https://ko-fi.com/aradar46"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                        <span>Buy a Coffee</span>
                        <ExternalLink size={13} />
                    </a>
                </div>
            </section>

            {/* Profile */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border space-y-6">
                <div>
                    <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-3">
                        <div className="p-2 rounded-full bg-brand/10 text-brand">
                            <User size={20} />
                        </div>
                        Profile
                    </h3>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light/50 uppercase tracking-wider">Your Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => onNameChange(e.target.value)}
                                className="w-full p-3 pr-10 rounded-xl bg-cream dark:bg-navy border border-transparent dark:border-navy-border text-warmGray dark:text-nearWhite font-semibold focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-warmGray-light"
                                placeholder="Enter your name"
                            />
                            <PenLine className="absolute right-3 top-3.5 w-4 h-4 text-warmGray-medium pointer-events-none" />
                        </div>
                    </div>
                </div>

            </section>

            {/* Combined Appearance Card */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border space-y-8">
                {/* Theme Picker */}
                <div>
                    <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-3">
                        <div className="p-2 rounded-full bg-brand/10 text-brand">
                            <Palette size={20} />
                        </div>
                        App Theme
                    </h3>
                    <div className="flex justify-between gap-2">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onThemeChange(t.id)}
                                className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${currentTheme === t.id ? 'bg-warmGray-light/30 dark:bg-white/10 scale-105' : 'opacity-70 hover:opacity-100'}`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full border-2 border-white dark:border-navy shadow-sm"
                                    style={{ backgroundColor: t.color }}
                                />
                                <span className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-warmGray-light/50 dark:bg-navy-border w-full" />

                {/* Dark Mode Toggle */}
                <div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-navy text-lavender' : 'bg-brand-light text-brand'}`}>
                                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <p className="font-semibold text-warmGray dark:text-nearWhite">Dark Mode</p>
                                <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">Easier on the eyes</p>
                            </div>
                        </div>

                        <button
                            onClick={toggleDarkMode}
                            className={`w-14 h-8 rounded-full transition-colors relative ${isDarkMode ? 'bg-brand' : 'bg-warmGray-light'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-warmGray-light/50 dark:bg-navy-border w-full" />

                {/* Navigation Labels Toggle */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${navLabelsEnabled ? 'bg-brand-light text-brand' : 'bg-warmGray-light/30 text-warmGray-medium'}`}>
                                <LayoutGrid size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-warmGray dark:text-nearWhite">Show Nav Labels</p>
                                <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">Easier to remember icons</p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleNavLabels}
                            className={`w-14 h-8 rounded-full transition-colors relative ${navLabelsEnabled ? 'bg-brand' : 'bg-warmGray-light'}`}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${navLabelsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                <h3 className="font-bold text-warmGray dark:text-nearWhite mb-2 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brand/10 text-brand">
                        <Bell size={20} />
                    </div>
                    Daily Reminders
                </h3>
                <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70 mb-5">
                    Set up gentle reminders for mood check-ins and medication.
                </p>

                <div className="space-y-6">
                    {/* Mood log reminders */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brand" />
                            <h4 className="text-xs font-bold text-warmGray dark:text-nearWhite uppercase tracking-wider">
                                Mood Check-in Times
                            </h4>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="flex-1 p-3 rounded-xl bg-cream dark:bg-navy border border-transparent dark:border-navy-border text-warmGray dark:text-nearWhite font-bold outline-none focus:ring-2 focus:ring-brand"
                            />
                            <button
                                onClick={handleAddTime}
                                className="bg-brand text-brand-text px-4 py-3 rounded-xl font-bold flex items-center gap-1 hover:brightness-105 disabled:opacity-50 transition-all text-sm"
                                disabled={notificationTimes.length >= 6}
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {notificationTimes.length === 0 ? (
                                <p className="text-xs text-warmGray-medium/60 italic">No mood check-in reminders set.</p>
                            ) : (
                                notificationTimes.map(time => (
                                    <div key={time} className="flex items-center gap-2 bg-brand-light dark:bg-white/5 px-3 py-1.5 rounded-xl text-brand font-bold border border-transparent dark:border-navy-border text-xs">
                                        <Clock size={13} />
                                        <span>{time}</span>
                                        <button onClick={() => handleDeleteTime(time)} className="text-brand/70 hover:text-brand ml-1">
                                            <XIcon size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-warmGray-light/40 dark:bg-navy-border w-full" />

                    {/* Medication reminders */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Pill size={16} className="text-blue-600 dark:text-blue-400" />
                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                Medication Reminders
                            </h4>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                value={newMedTime}
                                onChange={e => setNewMedTime(e.target.value)}
                                className="flex-1 p-3 rounded-xl bg-blue-50/60 dark:bg-navy border border-blue-200/60 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleAddMedTime}
                                className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-1 hover:bg-blue-700 disabled:opacity-50 transition-all text-sm"
                                disabled={medTimes.length >= 6}
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {medTimes.length === 0 ? (
                                <p className="text-xs text-blue-700/60 dark:text-blue-400/60 italic">No medication reminders set.</p>
                            ) : (
                                medTimes.map(time => (
                                    <div key={time} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-xs">
                                        <Pill size={13} />
                                        <span>{time}</span>
                                        <button onClick={() => handleDeleteMedTime(time)} className="text-blue-700/70 hover:text-blue-900 dark:hover:text-blue-100 ml-1">
                                            <XIcon size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Tags */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-warmGray dark:text-nearWhite flex items-center gap-2">
                        <TagIcon className="w-5 h-5" /> Tags
                    </h3>
                    <span className="text-xs text-warmGray-medium dark:text-warmGray-light">
                        {`${allTags.length} active`}
                    </span>
                </div>

                <button
                    onClick={() => setShowTagManager(true)}
                    className="w-full flex items-center justify-between gap-3 p-4 bg-cream dark:bg-navy rounded-xl hover:bg-brand-light dark:hover:bg-navy-surface transition-colors border border-warmGray-light/50 dark:border-navy-border group mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-brand/10 text-brand">
                            <TagIcon size={20} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-warmGray dark:text-nearWhite text-sm">Manage Tags</p>
                            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">Add, edit, hide or delete tags</p>
                        </div>
                    </div>
                    <ExternalLink size={16} className="text-warmGray-medium group-hover:text-brand transition-colors" />
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tagColorsEnabled ? 'bg-brand-light text-brand' : 'bg-warmGray-light/30 text-warmGray-medium'}`}>
                            <TagIcon size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-warmGray dark:text-nearWhite">Tag Colors</p>
                            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">Show category colors on tags in log</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleTagColors}
                        className={`w-14 h-8 rounded-full transition-colors relative ${tagColorsEnabled ? 'bg-brand' : 'bg-warmGray-light'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${tagColorsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </section>

            {/* Custom Moods */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-warmGray dark:text-nearWhite flex items-center gap-2">
                        <Smile className="w-5 h-5 text-brand" /> Custom Moods
                    </h3>
                    <span className="text-xs text-warmGray-medium dark:text-warmGray-light">
                        {`${moodCount} added`}
                    </span>
                </div>

                <button
                    onClick={() => setShowMoodManager(true)}
                    className="w-full flex items-center justify-between gap-3 p-4 bg-cream dark:bg-navy rounded-xl hover:bg-brand-light dark:hover:bg-navy-surface transition-colors border border-warmGray-light/50 dark:border-navy-border group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-brand/10 text-brand">
                            <Plus size={20} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-warmGray dark:text-nearWhite text-sm">Manage Custom Moods</p>
                            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">Add specific feelings like "Focused", "Anxious"</p>
                        </div>
                    </div>
                    <ExternalLink size={16} className="text-warmGray-medium group-hover:text-brand transition-colors" />
                </button>
            </section>

            {/* Tag Manager Modal */}
            {
                showTagManager && (
                    <TagManagerModal
                        onClose={() => setShowTagManager(false)}
                        onTagsUpdated={loadTags}
                    />
                )
            }

            {/* Mood Manager Modal */}
            {
                showMoodManager && (
                    <MoodManager
                        onClose={() => { setShowMoodManager(false); loadMoods(); }}
                    />
                )
            }

            {/* Data & Privacy */}
            <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brand/10 text-brand">
                        <Shield size={20} />
                    </div>
                    Data & Privacy
                </h3>

                <div className="space-y-4">
                    <div className="p-4 bg-cream dark:bg-navy rounded-xl text-sm text-warmGray dark:text-nearWhite space-y-1">
                        <p className="font-bold text-brand">🔒 100% Offline & Private</p>
                        <p className="text-xs opacity-90">All your mood history is stored locally on your device. No account required, zero tracking, and no internet connection needed.</p>
                    </div>

                    {/* Export Data as JSON */}
                    <button
                        onClick={handleExportJson}
                        className="w-full flex items-center justify-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                        <Download size={18} /> Export / Share Backup
                    </button>

                    {/* Import Data from JSON */}
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelected}
                    />
                    <button
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-start gap-3 p-4 bg-warmGray-light/30 dark:bg-navy border border-warmGray-light/50 dark:border-navy-border rounded-xl text-sm font-semibold text-warmGray-dark dark:text-nearWhite hover:bg-warmGray-light/50 dark:hover:bg-navy-light transition-colors"
                    >
                        <Upload size={18} /> Import Backup
                    </button>

                    {/* Privacy Policy Modal Trigger */}
                    <button
                        onClick={() => setShowPrivacyModal(true)}
                        className="w-full flex items-center justify-between p-4 bg-warmGray-light/30 dark:bg-navy border border-warmGray-light/50 dark:border-navy-border rounded-xl text-sm font-semibold text-warmGray-dark dark:text-nearWhite hover:bg-warmGray-light/50 dark:hover:bg-navy-light transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-brand" />
                            <span>Privacy Policy</span>
                        </div>
                        <ExternalLink size={16} className="text-warmGray-medium group-hover:text-brand transition-colors" />
                    </button>

                    <Button
                        variant="danger"
                        onClick={handleClear}
                        className="w-full justify-start pl-4"
                        size="md"
                        type="button"
                    >
                        <Trash2 size={18} /> Delete All Data
                    </Button>
                </div>
            </section>

            {/* Offline Privacy Policy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-navy-surface max-w-md w-full p-6 rounded-3xl space-y-4 shadow-xl border border-warmGray-light dark:border-navy-border max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-warmGray dark:text-nearWhite flex items-center gap-2">
                                <Shield className="text-brand" size={20} /> Offline Privacy Promise
                            </h3>
                            <button onClick={() => setShowPrivacyModal(false)} className="p-1 text-warmGray-medium hover:text-warmGray">
                                <XIcon size={20} />
                            </button>
                        </div>
                        <div className="text-xs text-warmGray-dark dark:text-nearWhite space-y-3 leading-relaxed">
                            <p><strong>1. Pure On-Device Storage</strong><br />VibeCheck stores 100% of your entries, tags, and preferences locally on your device using secure local storage.</p>
                            <p><strong>2. No Cloud Servers or Internet Required</strong><br />The app operates completely offline. No mood data, notes, or usage analytics are ever transmitted over the network.</p>
                            <p><strong>3. Complete Ownership</strong><br />You can export your complete data as a JSON file anytime to store in your chosen location, or import a previous backup offline.</p>
                        </div>
                        <button
                            onClick={() => setShowPrivacyModal(false)}
                            className="w-full py-3 bg-brand text-brand-text font-bold rounded-xl"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {/* Offline Support Card */}
            <section className="bg-white dark:bg-navy-surface p-5 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-warmGray dark:text-nearWhite">Private & Offline App</h3>
                        <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">100% Local & Open Source. Built for focus.</p>
                    </div>
                    <div className="bg-brand/10 text-brand px-3 py-1.5 rounded-xl text-xs font-bold">
                        Android FOSS
                    </div>
                </div>
            </section>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-2 pb-12">
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-warmGray-light/40 dark:bg-navy px-2 py-0.5 rounded-full text-warmGray-medium dark:text-warmGray-light font-medium">
                        v1.0.0
                    </span>
                    <p className="text-[10px] text-warmGray-light/50">© 2026 VibeCheck</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;