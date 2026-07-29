import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aradar.vibecheck',
  appName: 'Vibecheck: Private Mood Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#7598a0"
    },
    StatusBar: {
      backgroundColor: "#7598a0",
      style: "light"
    }
  }
};

export default config;
