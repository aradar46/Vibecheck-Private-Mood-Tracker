import React, { useState } from 'react';
import { saveUserName, saveThemePref, saveNotificationTimes, setOnboardingDone } from '../services/storage';
import { initializeNotifications, scheduleMoodNotifications } from '../services/notificationService';
import { StatusBar, Style } from '@capacitor/status-bar';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const THEMES = [
  { id: 'ocean',    name: 'Ocean',    color: '#7598a0' },
  { id: 'midnight', name: 'Midnight', color: '#3e5669' },
  { id: 'apricot',  name: 'Apricot',  color: '#ebb497' },
  { id: 'rose',     name: 'Rose',     color: '#FF6B6B' },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('ocean');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifTime, setNotifTime] = useState('20:00');
  const [skipNotif, setSkipNotif] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────

  const applyThemeNow = (themeId: string, dark: boolean) => {
    const map: Record<string, { main: string; light: string; dark: string; text: string }> = {
      ocean:   { main: '#7598a0', light: '#f0f4f5', dark: '#5b7a82', text: '#FFFFFF' },
      midnight:{ main: '#3e5669', light: '#eef2f5', dark: '#2c3e4d', text: '#FFFFFF' },
      apricot: { main: '#fccfb7', light: '#fffaf5', dark: '#e8a87c', text: '#4A4A4A' },
      rose:    { main: '#FF6B6B', light: '#FFF5F5', dark: '#E64A4A', text: '#FFFFFF' },
    };
    const t = map[themeId] || map.ocean;
    const root = document.documentElement;
    root.style.setProperty('--brand-main', t.main);
    root.style.setProperty('--brand-light', t.light);
    root.style.setProperty('--brand-dark', t.dark);
    root.style.setProperty('--brand-text', t.text);
    if (dark) {
      root.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      root.classList.remove('dark');
      localStorage.theme = 'light';
    }
    try {
      StatusBar.setBackgroundColor({ color: t.main });
      StatusBar.setStyle({ style: themeId === 'apricot' ? Style.Dark : Style.Light });
    } catch { /* web */ }
  };

  // ── step handlers ─────────────────────────────────────────────────────────

  const handleName = () => {
    if (!name.trim()) return;
    saveUserName(name.trim());
    setStep(3);
  };

  const handleAppearance = () => {
    saveThemePref(theme);
    applyThemeNow(theme, isDark);
    setStep(4);
  };

  const handleNotification = async () => {
    if (!skipNotif) {
      const granted = await initializeNotifications();
      if (granted) {
        await saveNotificationTimes([notifTime]);
        await scheduleMoodNotifications([notifTime]);
      }
    }
    await setOnboardingDone();
    onComplete();
  };

  // ── step 1: welcome ───────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col items-center justify-center px-8 animate-in fade-in duration-500">
        <img src="/logo.png" alt="Vibecheck" className="w-28 h-28 mb-8 object-contain drop-shadow-lg" />
        <h1 className="text-4xl font-extrabold text-warmGray dark:text-nearWhite text-center mb-3 font-display">Vibecheck</h1>
        <p className="text-warmGray-medium dark:text-warmGray-light text-center text-base font-medium mb-6 leading-relaxed">
          Your mood. Your way.{'\n'}100% Private & Offline.
        </p>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 px-4 py-2.5 rounded-2xl mb-10">
          <span className="text-green-600 dark:text-green-400 text-lg">🔒</span>
          <p className="text-green-700 dark:text-green-400 text-xs font-bold leading-snug">100% private. Everything stays on your device.<br/>No accounts, no cloud, no tracking — ever.</p>
        </div>
        <button
          onClick={() => setStep(2)}
          className="w-full bg-brand text-brand-text py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 active:scale-95 transition-transform"
        >
          Get started
        </button>
      </div>
    );
  }

  // ── step 2: name ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col justify-center px-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">Step 1 of 3</p>
          <h2 className="text-3xl font-extrabold text-warmGray dark:text-nearWhite font-display">What's your name?</h2>
          <p className="text-warmGray-medium dark:text-warmGray-light mt-2 text-sm">Your name stays on this device only. No accounts, no servers, no data collection — ever.</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleName()}
          placeholder="Your name"
          autoFocus
          className="w-full p-4 rounded-2xl bg-white dark:bg-navy-surface border border-warmGray-light dark:border-navy-border text-warmGray dark:text-nearWhite text-xl font-bold focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-warmGray-light placeholder:font-normal mb-8"
        />
        <button
          onClick={handleName}
          disabled={!name.trim()}
          className="w-full bg-brand text-brand-text py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 active:scale-95 transition-transform disabled:opacity-40"
        >
          Next
        </button>
      </div>
    );
  }

  // ── step 3: appearance ────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col justify-center px-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">Step 2 of 3</p>
          <h2 className="text-3xl font-extrabold text-warmGray dark:text-nearWhite font-display">Make it yours.</h2>
          <p className="text-warmGray-medium dark:text-warmGray-light mt-2 text-sm">Pick a theme and display mode.</p>
        </div>

        {/* Theme swatches */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-warmGray-medium dark:text-warmGray-light mb-4">Color Theme</p>
          <div className="flex gap-4">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); applyThemeNow(t.id, isDark); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl flex-1 transition-all ${theme === t.id ? 'bg-white dark:bg-navy-surface shadow-md ring-2 ring-brand scale-105' : 'opacity-60 hover:opacity-90'}`}
              >
                <div className="w-10 h-10 rounded-full border-2 border-white shadow" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-bold text-warmGray dark:text-warmGray-light">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dark / Light toggle */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-warmGray-medium dark:text-warmGray-light mb-4">Display Mode</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setIsDark(false); applyThemeNow(theme, false); }}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${!isDark ? 'bg-white dark:bg-navy-surface shadow ring-2 ring-brand text-warmGray dark:text-nearWhite' : 'bg-warmGray-light/40 dark:bg-navy-surface/40 text-warmGray-medium dark:text-warmGray-light opacity-60'}`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => { setIsDark(true); applyThemeNow(theme, true); }}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${isDark ? 'bg-navy dark:bg-navy-surface shadow ring-2 ring-brand text-nearWhite' : 'bg-warmGray-light/40 dark:bg-navy-surface/40 text-warmGray-medium dark:text-warmGray-light opacity-60'}`}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <button
          onClick={handleAppearance}
          className="w-full bg-brand text-brand-text py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 active:scale-95 transition-transform"
        >
          Next
        </button>
      </div>
    );
  }

  // ── step 4: notification ──────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-[100] bg-cream dark:bg-navy flex flex-col justify-center px-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">Step 3 of 3</p>
          <h2 className="text-3xl font-extrabold text-warmGray dark:text-nearWhite font-display">Daily check-in?</h2>
          <p className="text-warmGray-medium dark:text-warmGray-light mt-2 text-sm">A gentle nudge helps build the habit. You can change this in Settings anytime.</p>
        </div>

        {!skipNotif && (
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-warmGray-medium dark:text-warmGray-light mb-3">Remind me at</p>
            <input
              type="time"
              value={notifTime}
              onChange={e => setNotifTime(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white dark:bg-navy-surface border border-warmGray-light dark:border-navy-border text-warmGray dark:text-nearWhite text-xl font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>
        )}

        <button
          onClick={handleNotification}
          className="w-full bg-brand text-brand-text py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 active:scale-95 transition-transform mb-3"
        >
          {skipNotif ? 'Continue' : 'Set reminder'}
        </button>
        <button
          onClick={() => setSkipNotif(v => !v)}
          className="w-full text-center py-2 text-sm text-warmGray-medium dark:text-warmGray-light hover:text-brand transition-colors font-medium"
        >
          {skipNotif ? '← Set a reminder instead' : 'No thanks, I\'ll set this later'}
        </button>
      </div>
    );
  }

  return null;
};

export default OnboardingScreen;
