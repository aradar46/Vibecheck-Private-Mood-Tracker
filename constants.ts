import { Mood, Tag, Symptom } from './types.ts';


export const MOODS = [
  // Rough/Meh -> Soft Coral
  {
    value: Mood.Terrible,
    emoji: '😢',
    icon: 'sentiment_very_dissatisfied',
    label: 'Rough',
    color: 'bg-red-50 text-soft-coral border-red-100 dark:bg-red-900/10 dark:text-soft-coral dark:border-red-900/30'
  },
  // Not Great -> Soft Orange
  {
    value: Mood.Bad,
    emoji: '😕',
    icon: 'sentiment_dissatisfied',
    label: 'Not Great',
    color: 'bg-orange-50 text-soft-orange border-orange-100 dark:bg-orange-900/10 dark:text-soft-orange dark:border-orange-900/30'
  },
  // Okay -> Soft Amber
  {
    value: Mood.Okay,
    emoji: '😐',
    icon: 'sentiment_neutral',
    label: "Doin' Okay",
    color: 'bg-amber-50 text-soft-amber border-amber-100 dark:bg-amber-900/10 dark:text-soft-amber dark:border-amber-900/30'
  },
  // Good -> Soft Mint
  {
    value: Mood.Good,
    emoji: '🙂',
    icon: 'sentiment_satisfied',
    label: 'Pretty Good',
    color: 'bg-green-50 text-soft-mint border-green-100 dark:bg-green-900/10 dark:text-soft-mint dark:border-green-900/30'
  },
  // Great -> Soft Teal
  {
    value: Mood.Great,
    emoji: '🤩',
    icon: 'sentiment_very_satisfied',
    label: 'Feeling Fab',
    color: 'bg-teal-50 text-soft-teal border-teal-100 dark:bg-teal-900/10 dark:text-soft-teal dark:border-teal-900/30'
  },
];

export const DEFAULT_TAGS: Tag[] = [
  // General
  { id: 'work', label: '💼 Work/School', category: 'work' },
  { id: 'social', label: '👥 Social', category: 'social' },
  { id: 'family', label: '👨‍👩‍👧 Family', category: 'home' },
  { id: 'chores', label: '🧹 Chores', category: 'home' },
  { id: 'exercise', label: '🏃 Exercise', category: 'health' },
  { id: 'sleep', label: '😴 Sleep', category: 'health' },
  { id: 'food', label: '🍽️ Food', category: 'health' },
  { id: 'gaming', label: '🎮 Gaming', category: 'other' },
  { id: 'reading', label: '📖 Reading', category: 'other' },
  { id: 'nothing', label: '🥱 Just Existing', category: 'other' },

  // Medication & Biology
  { id: 'meds-taken', label: '💊 Meds Taken', category: 'health' },
  { id: 'meds-skipped', label: '❌ Meds Skipped', category: 'health' },
  { id: 'caffeine-high', label: '☕ Caffeine', category: 'health' },
  { id: 'poor-sleep', label: '💤 Poor Sleep', category: 'health' },

  // Sensory & Environment
  { id: 'overstimulated', label: '📢 Overstimulated', category: 'other' },
  { id: 'understimulated', label: '🛑 Bored', category: 'other' },
  { id: 'cluttered', label: '🌪️ Cluttered Space', category: 'home' },

  // Emotional & Cognitive
  { id: 'brain-fog', label: '🧠 Brain Fog', category: 'other' },
  { id: 'hyperfocus', label: '⚡ Hyperfocus', category: 'other' },
  { id: 'time-blindness', label: '⏳ Time Blindness', category: 'other' },
];


export const QUICK_TIPS = [
  // --- Quick Reset (Physical) ---
  { title: "Cold Water Shock", body: "Splash your face with ice-cold water to instantly trigger your body's calming reflex.", category: "Quick Reset" },
  { title: "Shake It Off", body: "Stand up and vigorously shake your hands and feet for 10 seconds. Reset your nervous system.", category: "Quick Reset" },
  { title: "The Sigh", body: "Take a double inhale through your nose, then a long sigh out through your mouth.", category: "Quick Reset" },
  { title: "Clench & Release", body: "Squeeze all your muscles tight for 5 seconds, then release them all at once.", category: "Quick Reset" },
  { title: "Palm Rub", body: "Rub your palms together rapidly until warm, then cup them over your closed eyes.", category: "Quick Reset" },
  { title: "Ear Massage", body: "Gently massage your earlobes. It stimulates the vagus nerve to lower anxiety.", category: "Quick Reset" },
  { title: "Look Up", body: "Look up at the ceiling or sky. It’s hard to maintain a stress posture while looking up.", category: "Quick Reset" },
  { title: "Cold Wrists", body: "Run cold water over your wrists for 30 seconds to cool down your blood flow.", category: "Quick Reset" },
  { title: "Humming", body: "Hum a low tone for one minute. The vibration calms the vagus nerve.", category: "Quick Reset" },
  { title: "Jaw Drop", body: "Open your mouth wide, stretch your jaw, and let it hang loose.", category: "Quick Reset" },
  { title: "Shoulder Drop", body: "Pull your shoulders up to your ears, hold, and drop them forcefully.", category: "Quick Reset" },
  { title: "Tactile Snap", body: "Snap your fingers rhythmically for 20 seconds to bring focus back to your hands.", category: "Quick Reset" },
  { title: "Barefoot Grounding", body: "Take off your socks and feel the floor texture with your feet.", category: "Quick Reset" },
  { title: "Lemon Bite", body: "Imagine biting into a sour lemon. It distracts the brain instantly.", category: "Quick Reset" },
  { title: "Change Rooms", body: "Walk through a doorway. The 'doorway effect' helps reset short-term memory loops.", category: "Quick Reset" },
  { title: "Object Weight", body: "Pick up a heavy object and focus entirely on its weight.", category: "Quick Reset" },
  { title: "Deep Squat", body: "Hold a deep squat for 15 seconds to ground your energy.", category: "Quick Reset" },
  { title: "Ice Cube", body: "Hold an ice cube in your hand until it melts. Focus on the sensation.", category: "Quick Reset" },
  { title: "Butterfly Tap", body: "Cross arms over chest and alternate tapping shoulders rhythmically.", category: "Quick Reset" },
  { title: "Wall Push", body: "Push against a wall with all your might for 10 seconds to release tension.", category: "Quick Reset" },

  // --- Energy & Dopamine ---
  { title: "Energy Burst", body: "Perform thirty seconds of high-intensity jumping jacks to release pent-up dopamine.", category: "Energy" },
  { title: "Dance Break", body: "Play your favorite upbeat song and dance like nobody is watching for 1 minute.", category: "Energy" },
  { title: "Power Pose", body: "Stand like a superhero (hands on hips) for 2 minutes to boost confidence.", category: "Energy" },
  { title: "Sunlight Seek", body: "Step into direct sunlight or look out a bright window for 60 seconds.", category: "Energy" },
  { title: "Loud Vocalization", body: "If safe, shout or make a loud noise to release pent-up energy.", category: "Energy" },
  { title: "Fast Walk", body: "Walk rapidly around the room or block for 2 minutes.", category: "Energy" },
  { title: "Stair Climb", body: "Run up and down a flight of stairs once.", category: "Energy" },
  { title: "Shadow Box", body: "Throw punches at the air for 30 seconds to channel aggression.", category: "Energy" },
  { title: "Stretch Up", body: "Reach for the sky as high as you can, standing on tiptoes.", category: "Energy" },
  { title: "Novelty Seek", body: "Look at something bright red or orange to stimulate alertness.", category: "Energy" },
  { title: "Texture Touch", body: "Run your hands over a rough texture to wake up your senses.", category: "Energy" },
  { title: "Scent Jolt", body: "Smell strong coffee, peppermint, or citrus.", category: "Energy" },
  { title: "Balance Act", body: "Stand on one leg for as long as you can.", category: "Energy" },
  { title: "Spin", body: "Spin around 3 times in one direction, then 3 in the other.", category: "Energy" },
  { title: "Drumming", body: "Drum on your desk or legs rhythmically for 30 seconds.", category: "Energy" },
  { title: "Singing", body: "Sing a chorus of a song you love out loud.", category: "Energy" },
  { title: "Mirror High-Five", body: "High-five yourself in the mirror. It sounds silly but it works.", category: "Energy" },
  { title: "Joke Finder", body: "Read one dad joke immediately.", category: "Energy" },
  { title: "Pet Time", body: "Play with a pet for 2 minutes if available.", category: "Energy" },
  { title: "Clean One Thing", body: "Throw away one piece of trash immediately.", category: "Energy" },

  // --- Calm & Grounding ---
  { title: "Box Breathing", body: "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat.", category: "Calm" },
  { title: "External Focus", body: "Find and name five blue objects in your immediate environment.", category: "Focus" },
  { title: "5-4-3-2-1", body: "5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.", category: "Grounding" },
  { title: "Feet on Floor", body: "Press your feet firmly into the ground. Feel the earth supporting you.", category: "Grounding" },
  { title: "Texture Hunt", body: "Find something soft, something hard, and something cold nearby.", category: "Grounding" },
  { title: "Listen Close", body: "Close your eyes and identify the most distant sound you can hear.", category: "Grounding" },
  { title: "Listen Near", body: "Close your eyes and identify the closest sound (breath, computer fan).", category: "Grounding" },
  { title: "Color Count", body: "Count how many red things are in the room right now.", category: "Grounding" },
  { title: "Temperature Check", body: "Notice specifically which parts of your body feel warm vs cold.", category: "Grounding" },
  { title: "Gravity Check", body: "Notice the weight of your body pressing into the chair.", category: "Grounding" },
  { title: "Sound Bath", body: "Put on noise-canceling headphones with silence or rain sounds.", category: "Calm" },
  { title: "Tracing", body: "Trace the outline of your hand with your finger slowly.", category: "Calm" },
  { title: "Object Study", body: "Pick an object. Describe its texture, weight, and color in detail.", category: "Focus" },
  { title: "Spell It Backwards", body: "Spell your name backwards slowly.", category: "Focus" },
  { title: "Math Problem", body: "What is 100 minus 7? Keep subtracting 7.", category: "Focus" },
  { title: "Category Game", body: "Name 5 types of fruit. Go.", category: "Focus" },
  { title: "Alphabet Game", body: "Find objects in the room starting with A, B, C...", category: "Focus" },
  { title: "Body Scan", body: "Scan from toes to head. Where is the tension?", category: "Calm" },
  { title: "Slow Blink", body: "Blink in slow motion 10 times.", category: "Calm" },
  { title: "Hand Warmth", body: "Imagine holding a warm cup of cocoa.", category: "Calm" },

  // --- Gratitude & Perspective ---
  { title: "Micro-Gratitude", body: "Find one tiny thing right now that isn't annoying.", category: "Gratitude" },
  { title: "The Reverse Gap", body: "Don't look at how far to go. Look at how far you've come today.", category: "Perspective" },
  { title: "Comfort Scan", body: "What is the most comfortable thing touching you right now?", category: "Gratitude" },
  { title: "Good News", body: "Recall the last time you laughed genuinely.", category: "Gratitude" },
  { title: "Basic Needs", body: "Are you fed? Are you safe? Acknowledge these basics.", category: "Perspective" },
  { title: "Future Self", body: "What is one small favor you can do for your future self right now?", category: "Perspective" },
  { title: "Past Win", body: "Remember a time you overcame a difficult day.", category: "Perspective" },
  { title: "Person Check", body: "Who is one person you are glad exists?", category: "Gratitude" },
  { title: "Sensory Joy", body: "What is your favorite smell? Imagine it vividly.", category: "Gratitude" },
  { title: "Tech Thanks", body: "Appreciate that you have access to the world's knowledge right now.", category: "Gratitude" },
  { title: "Body Thanks", body: "Thank your lungs for breathing without you asking.", category: "Gratitude" },
  { title: "Nature Check", body: "Can you see a tree or plant? Acknowledge its life.", category: "Perspective" },
  { title: "Temporary State", body: "Remember: This feeling is weather, not the sky. It will pass.", category: "Perspective" },
  { title: "Skill Check", body: "What is one thing you are good at?", category: "Gratitude" },
  { title: "Meal Memory", body: "Recall the best meal you had recently.", category: "Gratitude" },
  { title: "Music Memory", body: "Play a song in your head that makes you smile.", category: "Gratitude" },
  { title: "Kindness Recall", body: "When was the last time someone was kind to you?", category: "Gratitude" },
  { title: "Kindness Plan", body: "Who could you send a nice text to right now?", category: "Gratitude" },
  { title: "Problem Swap", body: "Would you trade your problems for a stranger's? Probably not.", category: "Perspective" },
  { title: "Enough", body: "You have done enough for this exact moment.", category: "Perspective" },

  // --- Affirmations ---
  { title: "I Am Enough", body: "I do not need to be more productive to be worthy of rest.", category: "Affirmation" },
  { title: "Flow, Not Force", body: "If I'm stuck, I can step away. I don't need to force the river.", category: "Affirmation" },
  { title: "One Thing", body: "I can do anything, but I can't do everything. Just pick one thing.", category: "Affirmation" },
  { title: "Brain Wi-Fi", body: "My brain works differently, not incorrectly.", category: "Affirmation" },
  { title: "Progress", body: "Stumbling is part of the dance.", category: "Affirmation" },
  { title: "No Comparison", body: "My timeline is not their timeline.", category: "Affirmation" },
  { title: "Permission", body: "I give myself permission to do a bad job first.", category: "Affirmation" },
  { title: "Reset", body: "I can restart my day at any time. 4 PM is a new morning.", category: "Affirmation" },
  { title: "Self-Compassion", body: "I am doing the best I can with the spoons I have.", category: "Affirmation" },
  { title: "Focus", body: "Where my attention goes, energy flows.", category: "Affirmation" },
  { title: "Breathe", body: "My breath is my anchor.", category: "Affirmation" },
  { title: "Values", body: "I am defined by who I am, not what I produce.", category: "Affirmation" },
  { title: "Safety", body: "I am safe in this moment.", category: "Affirmation" },
  { title: "Control", body: "I let go of what I cannot control.", category: "Affirmation" },
  { title: "Growth", body: "I am learning and growing every day.", category: "Affirmation" },
  { title: "Strength", body: "I have survived 100% of my bad days.", category: "Affirmation" },
  { title: "Kindness", body: "I speak to myself with kindness.", category: "Affirmation" },
  { title: "Space", body: "I am allowed to take up space.", category: "Affirmation" },
  { title: "Feelings", body: "My feelings are valid, even the messy ones.", category: "Affirmation" },
  { title: "Present", body: "I am here, right now.", category: "Affirmation" }
];

export const MOCK_ENTRIES_KEY = 'vibecheck_entries';

export const CATEGORY_COLORS: Record<string, string> = {
  // Reds / Pinks
  'red': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50',
  'rose': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50',
  'pink': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700/50',
  'fuchsia': 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-700/50',

  // Purples
  'purple': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
  'violet': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/50',
  'indigo': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50',

  // Blues
  'blue': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
  'sky': 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50',
  'cyan': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/50',
  'teal': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/50',

  // Greens
  'emerald': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
  'green': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50',
  'lime': 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-700/50',

  // Yellows / Oranges
  'yellow': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50',
  'amber': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
  'orange': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',

  // Grays
  'slate': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/50',
  'gray': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/50',
  'stone': 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700/50',
};

export const DEFAULT_CATEGORIES: any[] = [
  { id: 'work', label: 'Work', colorId: 'blue', isDefault: true },
  { id: 'social', label: 'Social', colorId: 'purple', isDefault: true },
  { id: 'home', label: 'Home', colorId: 'orange', isDefault: true },
  { id: 'health', label: 'Health', colorId: 'emerald', isDefault: true },
  { id: 'other', label: 'Other', colorId: 'gray', isDefault: true },
];
