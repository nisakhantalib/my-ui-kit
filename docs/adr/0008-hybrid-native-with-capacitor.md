# 0008. Native apps through a Capacitor shell, not a React Native rewrite

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Product wants the banking app in the Play Store and App Store as well as on the web, with native capabilities (the share sheet, later push notifications and biometrics). The team is a web team, and the accessible components in this library are DOM components.

## Options considered

| Option | Reuses this library | Native feel | Team skills | Cost |
|---|---|---|---|---|
| **PWA only** | ✓ | Installable, offline; no store listing on iOS | ✓ | Lowest |
| **Capacitor shell around the PWA** | ✓ (same build) | Native APIs through plugins; store listing | ✓ | Low |
| React Native | ✗ (needs RN primitives; only tokens carry over) | Best | New skills | High: a second UI codebase |

## Decision

Ship as a **PWA first**, and wrap the same build in **Capacitor 8** for the stores.

- `apps/bank/capacitor.config.ts`; the Android project lives in `apps/bank/android/`, and CI builds a debug APK on every push.
- Platform differences are isolated in `apps/bank/src/native.ts`. Today: `shareText()` (receipts) uses `@capacitor/share`, which opens the native share sheet in the app and the Web Share API in browsers, and falls back to the clipboard. Components never import Capacitor.
- Library CSS respects `env(safe-area-inset-*)` (for example the toast stack), so content clears notches and home bars in the shell and in installed PWAs.
- `tokens.ts` exists so a future React Native surface could share the palette, should one ever be justified.

## Consequences

- One codebase, one set of accessible components, three channels (web, PWA, Android/iOS).
- WebView accessibility is the platform's own (TalkBack, VoiceOver), so the manual screen-reader pass covers the installed app too.
- iOS builds need macOS. `npx cap add ios` is a documented follow-up, not done in CI yet.
