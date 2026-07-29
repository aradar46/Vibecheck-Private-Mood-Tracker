export enum Mood {
  Terrible = 1,
  Bad = 2,
  Okay = 3,
  Good = 4,
  Great = 5,
}

export interface Category {
  id: string; // e.g., 'work', 'custom-123'
  label: string;
  colorId: string; // Key into CATEGORY_COLORS
  isDefault?: boolean; // If true, cannot be deleted (maybe renamed/recolored?)
}

export interface Tag {
  id: string;
  label: string;
  category: string; // Maps to Category.id
  color?: string; // Optional custom hex color (legacy or specific override)
  isHidden?: boolean; // If true, it won't show up in the selection list next time
}

export interface Entry {
  id: string;
  timestamp: number; // Unix timestamp
  mood: Mood;
  tags: string[]; // Tag IDs
  note: string;
  symptoms?: SymptomsData; // Tracked symptoms
  customMoods?: string[]; // IDs of CustomMoods
}

export interface SymptomsData {
  tookMedication?: boolean;
  medicationTime?: string; // HH:MM format
  sleep?: 'bad' | 'ok' | 'good'; // 😴😐😊
  energy?: number; // 1-5 dots
  focus?: number; // 1-5 dots 🧠
  coffeeCount?: number; // 0, 1, 2, or 3+
}

export interface Symptom {
  id: string;
  label: string;
  icon: string;
  category: 'medication' | 'sleep' | 'energy' | 'focus' | 'caffeine';
  isHidden?: boolean; // User can hide symptoms they don't track
}

export interface CopingStrategy {
  title: string;
  description: string;
  duration: string; // e.g., "2 min"
}

export type ViewState = 'home' | 'calendar' | 'insights' | 'settings';

export interface CustomMood {
  id: string;
  label: string;
  icon?: string; // Material Symbol name
  color: string; // Tailwind color class or Hex
  value: number; // 0-5. 0 = descriptive only.
  isHidden?: boolean;
}

export const PRESET_CUSTOM_MOOD_COLORS = [
  'bg-slate-100 text-slate-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-yellow-100 text-yellow-800',
  'bg-lime-100 text-lime-700',
  'bg-green-100 text-green-700',
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-sky-100 text-sky-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-purple-100 text-purple-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-pink-100 text-pink-700',
  'bg-rose-100 text-rose-700',
];