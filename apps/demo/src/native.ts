import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatDate, type Booking } from './App';

/**
 * Platform layer. The same React code runs as a website, an installed PWA, and inside the
 * Capacitor Android/iOS shell; only this file knows the difference.
 *
 * Capacitor's Share plugin opens the native share sheet in the app shell and uses the Web Share
 * API in browsers that have it. Everywhere else we copy to the clipboard.
 */

export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
export const isNativeApp = Capacitor.isNativePlatform();

export async function shareBooking(booking: Booking, time: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const text = `Clinic appointment: ${booking.clinic}, ${formatDate(booking.date)} at ${time}.`;
  try {
    if ((await Share.canShare()).value) {
      await Share.share({ title: 'My clinic appointment', text, dialogTitle: 'Share appointment' });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // The user closed the share sheet, or clipboard access was refused.
    return 'cancelled';
  }
}
