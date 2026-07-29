#!/usr/bin/env node
// Generates 4 months of realistic daily mood entries for Vibecheck screenshot mockups
// Format exactly matches the real app export from driveBackupService.ts

import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

// Mood values matching the Mood enum
const Mood = { Terrible: 1, Bad: 2, Okay: 3, Good: 4, Great: 5 };

const ALL_TAGS = [
  { id: 'work',           label: '💼 Work/School',    category: 'work',   isHidden: false },
  { id: 'social',         label: '👥 Social',          category: 'social', isHidden: false },
  { id: 'family',         label: '👨‍👩‍👧 Family',         category: 'home',   isHidden: false },
  { id: 'chores',         label: '🧹 Chores',          category: 'home',   isHidden: false },
  { id: 'exercise',       label: '🏃 Exercise',         category: 'health', isHidden: false },
  { id: 'sleep',          label: '😴 Sleep',            category: 'health', isHidden: false },
  { id: 'food',           label: '🍽️ Food',             category: 'health', isHidden: false },
  { id: 'gaming',         label: '🎮 Gaming',           category: 'other',  isHidden: false },
  { id: 'reading',        label: '📖 Reading',          category: 'other',  isHidden: false },
  { id: 'nothing',        label: '🥱 Just Existing',    category: 'other',  isHidden: false },
  { id: 'meds-taken',     label: '💊 Meds Taken',       category: 'health', isHidden: false },
  { id: 'meds-skipped',   label: '❌ Meds Skipped',     category: 'health', isHidden: false },
  { id: 'caffeine-high',  label: '☕ Caffeine',         category: 'health', isHidden: false },
  { id: 'poor-sleep',     label: '💤 Poor Sleep',       category: 'health', isHidden: false },
  { id: 'overstimulated', label: '📢 Overstimulated',   category: 'other',  isHidden: false },
  { id: 'understimulated',label: '🛑 Bored',            category: 'other',  isHidden: false },
  { id: 'cluttered',      label: '🌪️ Cluttered Space',  category: 'home',   isHidden: false },
  { id: 'brain-fog',      label: '🧠 Brain Fog',        category: 'other',  isHidden: false },
  { id: 'hyperfocus',     label: '⚡ Hyperfocus',       category: 'other',  isHidden: false },
  { id: 'time-blindness', label: '⏳ Time Blindness',   category: 'other',  isHidden: false },
];

const tagIds = ALL_TAGS.map(t => t.id);

const notes = [
  "Had a really productive morning, crashed after lunch 😮‍💨",
  "Couldn't focus at all today. Just vibing though.",
  "Really good day! Got a lot done and felt present.",
  "Slept terribly, everything felt harder than usual.",
  "Meds kicked in late but still managed to finish my tasks.",
  "Social stuff drained me more than expected today.",
  "Hyperfocused for 4 hours straight on a side project 🔥",
  "Just a regular day. Nothing special, nothing bad.",
  "Felt anxious most of the day for no clear reason.",
  "Treated myself to a walk outside, helped a lot.",
  "Brain fog all day. Couldn't string two thoughts together.",
  "Really proud of myself today. Small wins add up.",
  "Forgot meds this morning and could definitely feel it.",
  "Cleaned the apartment, felt amazing after.",
  "Had a great conversation with a friend. Needed that.",
  "Rough start but recovered by afternoon.",
  "Quiet day at home, felt safe and rested.",
  "Work deadline stress made everything harder.",
  "Practiced some grounding exercises, they actually helped.",
  "Read for 2 hours. Best decision of the day.",
  "", "", "", "", // some entries have no note
];

// Weighted mood distribution — realistic bell curve
const moodWeights = [
  { mood: Mood.Terrible, weight: 5 },
  { mood: Mood.Bad,      weight: 15 },
  { mood: Mood.Okay,     weight: 30 },
  { mood: Mood.Good,     weight: 35 },
  { mood: Mood.Great,    weight: 15 },
];

function weightedMood() {
  const total = moodWeights.reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * total;
  for (const { mood, weight } of moodWeights) {
    r -= weight;
    if (r <= 0) return mood;
  }
  return Mood.Okay;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickTags(mood) {
  const count = Math.floor(Math.random() * 4);
  const shuffled = [...tagIds].sort(() => 0.5 - Math.random());
  const tags = shuffled.slice(0, count);
  if (mood <= Mood.Bad && Math.random() > 0.4 && !tags.includes('poor-sleep')) tags.push('poor-sleep');
  if (mood >= Mood.Good && Math.random() > 0.5 && !tags.includes('exercise')) tags.push('exercise');
  if (Math.random() > 0.55 && !tags.includes('meds-taken')) tags.push('meds-taken');
  return [...new Set(tags)].slice(0, 5);
}

// Build tag frequency from the entries we'll generate
const tagFrequency = {};

const entries = [];
const now = new Date();
const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const start = new Date(end);
start.setMonth(start.getMonth() - 4);

const current = new Date(start);
while (current <= end) {
  // ~90% of days have an entry
  if (Math.random() > 0.10) {
    const mood = weightedMood();
    const hour = pick([9, 12, 14, 17, 18, 19, 20, 21, 22]);
    const entryDate = new Date(current);
    entryDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    const tags = pickTags(mood);
    tags.forEach(t => { tagFrequency[t] = (tagFrequency[t] || 0) + 1; });
    entries.push({
      id: randomUUID(),
      timestamp: entryDate.getTime(),
      mood,
      tags,
      note: pick(notes),
      customMoods: [],
    });
  }

  // ~15% chance of a second entry (morning check-in)
  if (Math.random() > 0.85) {
    const mood2 = weightedMood();
    const entryDate2 = new Date(current);
    entryDate2.setHours(pick([7, 8, 9, 10, 11]), Math.floor(Math.random() * 60), 0, 0);
    const tags2 = pickTags(mood2);
    tags2.forEach(t => { tagFrequency[t] = (tagFrequency[t] || 0) + 1; });
    entries.push({
      id: randomUUID(),
      timestamp: entryDate2.getTime(),
      mood: mood2,
      tags: tags2,
      note: pick(notes),
      customMoods: [],
    });
  }

  current.setDate(current.getDate() + 1);
}

// Sort newest first (matches app sort order)
entries.sort((a, b) => b.timestamp - a.timestamp);

// Exact format matching driveBackupService.ts collectBackupData()
const backup = {
  version: "1.0",
  exportedAt: new Date().toISOString(),
  entries,
  tags: ALL_TAGS,
  settings: {
    userName: "Alex",
    theme: "rose",
    notificationTimes: [],
    tagFrequency,
  },
};

writeFileSync('mockup_data.json', JSON.stringify(backup, null, 2));
console.log(`✅ Generated ${entries.length} entries`);
console.log(`📅 Range: ${new Date(entries.at(-1).timestamp).toDateString()} → ${new Date(entries[0].timestamp).toDateString()}`);
console.log(`📁 Saved: mockup_data.json`);
