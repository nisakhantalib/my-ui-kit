import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Platform layer. The same React code runs as a website, an installed PWA, and inside the
 * Capacitor Android/iOS shell; only this file knows the difference (ADR 0008).
 *
 * Capacitor's Share plugin opens the native share sheet in the app shell and uses the Web Share
 * API in browsers that have it. Everywhere else we copy to the clipboard.
 */

export const isNativeApp = Capacitor.isNativePlatform();

export async function shareText(title: string, text: string): Promise<'shared' | 'copied' | 'cancelled'> {
  try {
    if ((await Share.canShare()).value) {
      await Share.share({ title, text, dialogTitle: title });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // The user closed the share sheet, or clipboard access was refused.
    return 'cancelled';
  }
}
