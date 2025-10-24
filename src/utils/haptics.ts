/**
 * Haptic Feedback utilities for iOS/Android
 * Provides tactile feedback for user interactions
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback
 * Works on iOS (via Haptic Engine) and Android (via Vibration API)
 */
export const triggerHaptic = (style: HapticStyle = 'light'): void => {
  // Check if running in browser with Haptic API support (iOS Safari, Chrome on Android)
  if (typeof window === 'undefined') return;

  try {
    // iOS Haptic Engine (Safari on iOS 13+)
    // @ts-ignore - Haptic API not in TypeScript definitions yet
    if (window.navigator?.vibrate) {
      const patterns: Record<HapticStyle, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        selection: 10,
        success: [10, 50, 10],
        warning: [10, 100, 10],
        error: [10, 50, 10, 50, 10],
      };

      window.navigator.vibrate(patterns[style]);
      return;
    }

    // Fallback: Request haptic via postMessage to native app
    window.postMessage(
      {
        type: 'HAPTIC_FEEDBACK',
        style,
      },
      '*'
    );
  } catch (error) {
    // Haptic not supported, silently fail
    console.debug('Haptic feedback not supported:', error);
  }
};

/**
 * Trigger light haptic (for buttons, toggles)
 */
export const hapticLight = () => triggerHaptic('light');

/**
 * Trigger medium haptic (for selections, pickers)
 */
export const hapticMedium = () => triggerHaptic('medium');

/**
 * Trigger heavy haptic (for important actions)
 */
export const hapticHeavy = () => triggerHaptic('heavy');

/**
 * Trigger selection haptic (for picker changes)
 */
export const hapticSelection = () => triggerHaptic('selection');

/**
 * Trigger success haptic (for confirmations)
 */
export const hapticSuccess = () => triggerHaptic('success');

/**
 * Trigger warning haptic
 */
export const hapticWarning = () => triggerHaptic('warning');

/**
 * Trigger error haptic
 */
export const hapticError = () => triggerHaptic('error');
