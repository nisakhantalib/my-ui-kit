import type { CapacitorConfig } from '@capacitor/cli';

// Hybrid shell: the Vite build in dist/ is packaged into a native Android (and iOS) app (ADR 0008).
// Build: `npm run build -w bank && npx cap sync android`, then Android Studio or `./gradlew assembleDebug`.
const config: CapacitorConfig = {
  appId: 'sg.orchidbank.demo',
  appName: 'Orchid Bank',
  webDir: 'dist',
  android: {
    // Keep WebView content clear of the status and navigation bars.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
