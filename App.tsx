import React, { useState, useEffect } from 'react';
import { getEntries, saveEntry, getUserName, saveUserName, deleteEntryFromStorage, getThemePref, saveThemePref, getNotificationTimes, updateTagFrequency, getNavLabelsEnabled, getOnboardingDone } from './services/storage';
import { Entry, ViewState, Mood, SymptomsData } from './types';
import EntryForm from './components/EntryForm';
import InsightsView from './components/InsightsView';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import DopamineMenu from './components/DopamineMenu';
import ShadowBox from './components/ShadowBox';
import OnboardingScreen from './screens/OnboardingScreen';
import { LayoutGrid, Plus, Brain, Zap, Settings, Sparkles, RefreshCw, BarChart3, Wand2, Calendar } from 'lucide-react';
import { QUICK_TIPS, MOODS } from './constants';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { initializeNotificationsOnAppStart } from './services/notificationService';
import { Preferences } from '@capacitor/preferences';

const GREETING_EMOJIS = [
  '👋', '🌈', '🌞', '🌿', '🌸', '⭐', '🔥', '💫', '🍀', '💄', '🪭', '🌘', '🍹',
  '🧡', '🎈', '🌟', '🍑', '🍉', '🧊', '🌙'
];
const POSITIVE_GREETINGS = [
  'You made it.',
  'You are enough.',
  'You are fantastic.',
  'You matter so much.',
  'Permission to Slow Down',
  'Take it slow.',
  'Pause is okay.',
  'Go easy.',
  'No pressure.',
  'Deep breath.',
  'Just breathe.',
  'You got this.',
  'Small steps.',
  'Just start.',
  'Start small.',
  'Focus on now.',
  'Be here now.',
  'Be kind to you.',
  'Good enough.',
  'Less is more.',
  'Trust yourself.',
  'Let go today.',
  'Reset now.',
  'You made it here.',
  'Glad you showed up.',
  'Proud of you.',
  'Here is plenty.',
  'You matter today.',
  'Showing up counts.',
  'You fit right in.',
  'Go at your pace.',
  'No rush needed.',
  'Take your time.',
  'Soft start today.',
  'Breathe deep now.',
  'Slow is steady.',
  'Be gentle on you.',
  'Small wins count.',
  'Start anywhere.',
  'Tiny steps work.',
  'Trust your flow.',
  'Imperfect is ok.',
  'Messy is allowed.',
  'Good enough wins.',
  'It’s okay to rest.',
  'No guilt today.',
  'Safe to exhale.',
  'Today is new.',
  'Peace is allowed.',
  'One breath now.'
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState<Date>(new Date());

  // Edit State
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined);

  // Widget pre-selected mood (skips mood picker when set)
  const [widgetMood, setWidgetMood] = useState<Mood | undefined>(undefined);

  const [totalEntries, setTotalEntries] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userName, setUserName] = useState('Friend');
  // Changed default state to 'ocean' to match storage default
  const [currentTheme, setCurrentTheme] = useState('ocean');
  const [showNavLabels, setShowNavLabels] = useState(false);

  // Greeting accents
  const [greetingEmoji, setGreetingEmoji] = useState<string>(GREETING_EMOJIS[0]);
  const [greetingLine, setGreetingLine] = useState<string>(POSITIVE_GREETINGS[0]);

  // Random Tip State
  const [tipIndex, setTipIndex] = useState(0);

  // ShadowBox modal state
  const [showShadowBox, setShowShadowBox] = useState<'rage' | 'shake' | null>(null);

  // DopamineMenu expansion state
  const [isDopamineMenuExpanded, setIsDopamineMenuExpanded] = useState(false);

  // Onboarding state
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Initial Data Load & Theme & Notifications
  useEffect(() => {
    const initializeApp = async () => {
      const done = await getOnboardingDone();
      setOnboardingDone(done);

      const loaded = await getEntries();
      setEntries(loaded);
      setTotalEntries(loaded.length);

      const name = await getUserName();
      setUserName(name);

      // Theme check
      const savedTheme = await getThemePref();
      applyTheme(savedTheme);

      if (localStorage.theme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      }

      // Load nav labels preference
      const navLabelsEnabled = await getNavLabelsEnabled();
      setShowNavLabels(navLabelsEnabled);

      // Reinitialize saved notifications on app start
      const savedTimes = await getNotificationTimes();
      // Always initialize notifications (use default 8 AM if none set)
      await initializeNotificationsOnAppStart(savedTimes);

      // Set initial random tip
      setTipIndex(Math.floor(Math.random() * QUICK_TIPS.length));

      // Check for pending mood from widget and open log modal
      const { value: openEntryForm } = await Preferences.get({ key: 'widget_openEntryForm' });
      if (openEntryForm === 'true') {
        console.log('Widget requested opening entry form');
        await Preferences.remove({ key: 'widget_openEntryForm' });
        setShowLogModal(true);
      }
    };

    initializeApp();

    // Listen for app resume to check for widget intents
    const checkWidgetOnResume = async () => {
      const { value: openEntryForm } = await Preferences.get({ key: 'widget_openEntryForm' });
      if (openEntryForm === 'true') {
        await Preferences.remove({ key: 'widget_openEntryForm' });
        setShowLogModal(true);
      }
    };

    // Listen for app resume event
    CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        checkWidgetOnResume();
      }
    });

    // Listen for custom widget event from MainActivity
    const handleWidgetEvent = (e: any) => {
      console.log('Widget event received:', e.detail);
      if (e.detail?.openEntryForm) {
        setShowLogModal(true);
      }
    };
    window.addEventListener('widget-event', handleWidgetEvent as EventListener);

    return () => {
      CapacitorApp.removeAllListeners();
      window.removeEventListener('widget-event', handleWidgetEvent as EventListener);
    };
  }, []);

  // Refresh the greeting whenever we land on home
  useEffect(() => {
    if (view === 'home') {
      setGreetingEmoji(GREETING_EMOJIS[Math.floor(Math.random() * GREETING_EMOJIS.length)]);
      setGreetingLine(POSITIVE_GREETINGS[Math.floor(Math.random() * POSITIVE_GREETINGS.length)]);
    }
  }, [view]);

  // Android back button handling
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (showLogModal) {
        // Close modal if open
        setShowLogModal(false);
        setEditingEntry(undefined);
      } else if (view !== 'home') {
        // Navigate back to home
        setView('home');
      } else {
        // Exit app when on home
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [view, showLogModal]);

  const applyTheme = async (themeId: string) => {
    setCurrentTheme(themeId);
    await saveThemePref(themeId);

    const root = document.documentElement;
    let main, light, dark, text;

    switch (themeId) {
      case 'ocean': // Teal/Sage
        main = '#7598a0';
        light = '#f0f4f5';
        dark = '#5b7a82';
        text = '#FFFFFF';
        break;
      case 'midnight': // Slate
        main = '#3e5669';
        light = '#eef2f5';
        dark = '#2c3e4d';
        text = '#FFFFFF';
        break;
      case 'apricot': // Light Peach
        main = '#fccfb7';
        light = '#fffaf5';
        dark = '#e8a87c';
        text = '#4A4A4A'; // Dark text for contrast
        break;
      case 'rose': // Default
      default:
        main = '#FF6B6B';
        light = '#FFF5F5';
        dark = '#E64A4A';
        text = '#FFFFFF';
        break;
    }

    root.style.setProperty('--brand-main', main);
    root.style.setProperty('--brand-light', light);
    root.style.setProperty('--brand-dark', dark);
    root.style.setProperty('--brand-text', text);

    // Update native status bar color
    try {
      await StatusBar.setBackgroundColor({ color: main });
      // Use light style for dark themes, dark style for light themes
      if (themeId === 'apricot') {
        await StatusBar.setStyle({ style: Style.Dark });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
      }
    } catch (error) {
      // Status bar API not available on web
      console.log('Status bar not available:', error);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleNameChange = async (name: string) => {
    setUserName(name);
    await saveUserName(name);
  };

  const calculateLevel = (count: number) => {
    // Simple leveling system: Level 1 (0-9), Level 2 (10-24), Level 3 (25-49)...
    if (count < 10) return 1;
    if (count < 25) return 2;
    if (count < 50) return 3;
    if (count < 100) return 4;
    return Math.floor(count / 50) + 3; // Level 5+ increments every 50
  };

  const openLogModal = (date?: Date, entry?: Entry) => {
    setLogDate(date || new Date());
    setEditingEntry(entry); // If entry is passed, we are in edit mode
    setShowLogModal(true);
  };

  const handleEntrySubmit = async (
    mood: Mood,
    tags: string[],
    note: string,
    timestamp: number,
    symptoms?: SymptomsData,
    options?: { suppressClose?: boolean; id?: string },
    customMoods?: string[]
  ) => {
    const id = options?.id || editingEntry?.id || crypto.randomUUID();

    const newEntry: Entry = {
      id,
      timestamp: timestamp,
      mood,
      tags,
      note,
      symptoms,
      customMoods
    };

    if (tags.length > 0) {
      await updateTagFrequency(tags);
    }

    const updated = await saveEntry(newEntry);
    setEntries(updated);
    setTotalEntries(updated.length);

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Haptics not available
    }

    if (!options?.suppressClose) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setShowLogModal(false);
      setEditingEntry(undefined);
      setView('home');
    }

    return newEntry;
  };

  const handleDeleteEntry = async (id: string) => {
    // 1. Remove from local storage
    const updated = await deleteEntryFromStorage(id);
    // 2. Update state immediately
    setEntries(updated);
    setTotalEntries(updated.length);

    // Haptic feedback for delete
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Haptics not available
    }

    // 3. Close modal
    setShowLogModal(false);
    setEditingEntry(undefined);
  };

  const handleClearData = () => {
    setEntries([]);
    setTotalEntries(0);
  };

  const cycleTip = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * QUICK_TIPS.length);
    } while (newIndex === tipIndex && QUICK_TIPS.length > 1);
    setTipIndex(newIndex);
  };

  const renderContent = () => {
    if (showLogModal) {
      return (
        <EntryForm
          onSubmit={handleEntrySubmit}
          onCancel={() => { setShowLogModal(false); setEditingEntry(undefined); setWidgetMood(undefined); }}
          initialDate={logDate}
          initialEntry={editingEntry}
          onDelete={handleDeleteEntry}
          preSelectedMood={widgetMood}
        />
      );
    }

    switch (view) {
      case 'home':
        const todaysEntry = entries.find(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
        const currentTip = QUICK_TIPS[tipIndex];

        return (
          <div className={`h-full overflow-y-auto no-scrollbar ${isDopamineMenuExpanded ? 'pb-40' : 'pb-24'}`}>
            <div 
              className="p-6 pt-safe bg-white dark:bg-navy-surface rounded-b-[40px] shadow-sm mb-6 pb-8 transition-colors"
              style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-warmGray dark:text-nearWhite">Hi, {userName}! <span className="align-middle">{greetingEmoji}</span></h1>
                  <p className="text-warmGray-medium dark:text-text-secondary font-medium">{greetingLine}</p>
                </div>
              </div>

              {!todaysEntry ? (
                <button
                  onClick={() => openLogModal()}
                  className="w-full bg-brand text-brand-text p-6 rounded-3xl shadow-xl shadow-brand/20 dark:shadow-none transform transition-transform active:scale-95 flex items-center justify-between group"
                >
                  <div className="text-left">
                    <h3 className="text-xl font-bold">How are you?</h3>
                    <p className="opacity-80 text-sm mt-1">Tap to log your mood</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                    <Plus size={32} />
                  </div>
                </button>
              ) : (
                <DopamineMenu
                  compact={false}
                  onExpandedChange={setIsDopamineMenuExpanded}
                  onOpenShadowBox={(mode) => setShowShadowBox(mode)}
                />
              )}
            </div>

            {/* Tip of the Day Section (Hidden) */}
            {/* <div className="px-4 mt-6">
              <button
                onClick={cycleTip}
                className="w-full bg-white dark:bg-navy-surface p-5 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border relative group hover:-translate-y-0.5 transition-all text-left overflow-hidden"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-warmGray dark:text-nearWhite text-lg flex items-center gap-2">
                      <span className="text-brand">💡</span>
                      {currentTip.title}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warmGray-medium/70 dark:text-warmGray-light/60 bg-brand-light/50 dark:bg-white/5 px-2 py-1 rounded-lg">
                      {currentTip.category}
                    </span>
                  </div>
                  <p className="text-sm text-warmGray-medium dark:text-warmGray-light/70 leading-relaxed pr-8">
                    {currentTip.body}
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 text-warmGray-light/50 dark:text-navy-border group-hover:text-brand/50 transition-colors">
                  <RefreshCw size={14} />
                </div>
              </button>
            </div> */}

            <div className="px-4 mt-6">
              <TimelineView
                entries={entries.slice(0, 5)}
                onEdit={(entry) => openLogModal(undefined, entry)}
                onOpenCalendar={() => setView('calendar')}
              />
            </div>
          </div>
        );
      case 'calendar':
        return (
          <CalendarView entries={entries} onAddEntry={openLogModal} onEditEntry={(entry) => openLogModal(undefined, entry)} totalEntries={totalEntries} />
        );
      case 'insights':
        return (
          <div className="h-full flex flex-col w-full relative">
            <div className="flex-1 min-h-0">
              <InsightsView entries={entries} />
            </div>
          </div>
        );
      case 'settings':
        return (
          <SettingsView
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onClearData={handleClearData}
            userName={userName}
            onNameChange={handleNameChange}
            onThemeChange={applyTheme}
            currentTheme={currentTheme}
          />
        );
    }
  };

  // Show onboarding on first launch (null = still loading, show nothing)
  if (onboardingDone === false) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          // Reload name and theme set during onboarding
          const name = await getUserName();
          setUserName(name);
          const savedTheme = await getThemePref();
          applyTheme(savedTheme);
          setIsDarkMode(localStorage.theme === 'dark');
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-cream dark:bg-navy h-screen shadow-2xl overflow-hidden relative font-sans text-warmGray dark:text-nearWhite transition-colors duration-200">

      {/* Main Content Area */}
      <main className="h-full">
        {renderContent()}
      </main>

      {/* Navigation Bar */}
      {!showLogModal && (
        <nav className={`absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-navy-surface/90 backdrop-blur-lg rounded-3xl shadow-lg border border-warmGray-light dark:border-navy-border px-2 ${showNavLabels ? 'py-3' : 'py-2'} flex justify-between items-center z-50`}>
          <button
            onClick={() => setView('home')}
            className={`${showNavLabels ? 'px-3 py-2' : 'p-3'} rounded-2xl transition-all flex flex-col items-center gap-1 ${view === 'home' ? 'text-brand bg-brand-light dark:bg-navy-surface' : 'text-warmGray-medium dark:text-warmGray-light hover:bg-cream dark:hover:bg-navy'}`}
          >
            <LayoutGrid size={showNavLabels ? 20 : 24} />
            {showNavLabels && <span className="text-[10px] font-bold">Home</span>}
          </button>

          <button
            onClick={() => setView('insights')}
            className={`${showNavLabels ? 'px-3 py-2' : 'p-3'} rounded-2xl transition-all flex flex-col items-center gap-1 ${view === 'insights' ? 'text-brand bg-brand-light dark:bg-navy-surface' : 'text-warmGray-medium dark:text-warmGray-light hover:bg-cream dark:hover:bg-navy'}`}
          >
            <BarChart3 size={showNavLabels ? 20 : 24} />
            {showNavLabels && <span className="text-[10px] font-bold">Insights</span>}
          </button>

          {/* Center Plus Button */}
          <button
            onClick={() => openLogModal()}
            className={`bg-brand text-brand-text p-4 rounded-full shadow-lg shadow-brand/30 dark:shadow-none transform ${showNavLabels ? '-translate-y-8' : '-translate-y-6'} hover:scale-105 transition-transform active:scale-95`}
          >
            <Plus size={32} />
          </button>

          <button
            onClick={() => setView('calendar')}
            className={`${showNavLabels ? 'px-3 py-2' : 'p-3'} rounded-2xl transition-all flex flex-col items-center gap-1 ${view === 'calendar' ? 'text-brand bg-brand-light dark:bg-navy-surface' : 'text-warmGray-medium dark:text-warmGray-light hover:bg-cream dark:hover:bg-navy'}`}
          >
            <Calendar size={showNavLabels ? 20 : 24} />
            {showNavLabels && <span className="text-[10px] font-bold">Calendar</span>}
          </button>

          <button
            onClick={() => setView('settings')}
            className={`${showNavLabels ? 'px-3 py-2' : 'p-3'} rounded-2xl transition-all flex flex-col items-center gap-1 ${view === 'settings' ? 'text-brand bg-brand-light dark:bg-navy-surface' : 'text-warmGray-medium dark:text-warmGray-light hover:bg-cream dark:hover:bg-navy'}`}
          >
            <Settings size={showNavLabels ? 20 : 24} />
            {showNavLabels && <span className="text-[10px] font-bold">Settings</span>}
          </button>
        </nav>
      )}

      {/* ShadowBox Modal */}
      {showShadowBox && (
        <ShadowBox
          onClose={() => setShowShadowBox(null)}
          mode={showShadowBox}
        />
      )}
    </div>
  );
};

export default App;