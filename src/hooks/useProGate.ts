import { router } from 'expo-router';
import { useRevenueCat } from './useRevenueCat';

/**
 * useProGate — checks subscription status and provides a gated action helper.
 *
 * Usage:
 *   const { isPro, requirePro } = useProGate();
 *   // In a press handler:
 *   requirePro(() => doProAction());
 */
export function useProGate() {
  const { isPro, isLoading } = useRevenueCat();

  function requirePro(action: () => void) {
    if (isPro) {
      action();
    } else {
      router.push('/paywall');
    }
  }

  return { isPro, isLoading, requirePro };
}
