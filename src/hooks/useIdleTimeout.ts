// Idle Timeout Hook - Detects user inactivity
import { useEffect, useCallback } from 'react';
import { useKioskStore } from '@/stores/kiosk-store';

export function useIdleTimeout(onIdle: () => void, timeoutMinutes: number = 5) {
  const { updateActivity, setIdle, lastActivityTime } = useKioskStore();

  const handleActivity = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  useEffect(() => {
    // Events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check for idle every second
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (timeSinceActivity >= timeoutMs) {
        setIdle(true);
        onIdle();
      }
    }, 1000);

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(interval);
    };
  }, [handleActivity, lastActivityTime, onIdle, setIdle, timeoutMinutes]);
}
