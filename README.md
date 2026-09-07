# Vibecheck: Private Mood Tracker

Vibecheck is a private, local-first, low-friction mood and symptom tracker designed for complete privacy and ease of use.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/O3I6243PUS)

## Screenshots

| Quick Log | Timeline | Insights | Calendar |
|:---:|:---:|:---:|:---:|
| <img src="screenshots/01-quick-log.png" width="200" alt="One-tap mood picker"> | <img src="screenshots/02-timeline-light.png" width="200" alt="Timeline of recent entries"> | <img src="screenshots/05-insights.png" width="200" alt="Mood history chart and activity correlations"> | <img src="screenshots/06-calendar.png" width="200" alt="Monthly calendar with mood dots"> |

| Edit Entry | Dark Mode | Privacy & Data |
|:---:|:---:|:---:|
| <img src="screenshots/04-edit-entry.png" width="200" alt="Entry editor with tags and notes"> | <img src="screenshots/03-timeline-dark.png" width="200" alt="Timeline in dark mode"> | <img src="screenshots/07-privacy-settings.png" width="200" alt="Offline-first data and privacy settings"> |

## Features

- ⚡ **1-Tap Quick Logging**: Log your mood in seconds with minimal friction.
- 📊 **Calendar Heatmap & Insights**: Visualize trends, energy levels, and mood patterns over time.
- 🧘 **Dopamine Menu**: Grounding activities and gentle prompts for executive function and self-regulation.
- 🔒 **100% Offline & Private**: All data remains on your device. No telemetry, no accounts, no ads, no internet required.
- 🔓 **Fully Unlocked & Open Source**: Free of paywalls and subscriptions under the MIT License.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Mobile Runtime**: Capacitor 8 (Android)
- **Styling**: Tailwind CSS / Vanilla CSS
- **Icons**: Lucide React

## Development & Building

### Prerequisites
- Node.js 18+ & npm
- Android SDK & JDK 17+ (for Android APK builds)

### Web Dev Server
```bash
npm install
npm run dev
```

### Typecheck & Test
```bash
npm run typecheck
npm test
```

### Building Android APK (F-Droid)
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```
The output APK will be generated at `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

## License

This project is licensed under the [MIT License](LICENSE).
