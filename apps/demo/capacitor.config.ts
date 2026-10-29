import type { CapacitorConfig } from '@capacitor/cli';

// Hybrid shell: the Vite build in dist/ is packaged into a native Android (and iOS) app.
// Build: `npm run build && npx cap sync android`, then open in Android Studio or run Gradle.
const config: CapacitorConfig = {
  appId: 'sg.clinicbook.demo',
  appName: 'ClinicBook SG',
  webDir: 'dist',
  android: {
    // Keep WebView content from drawing under the status / navigation bars.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
