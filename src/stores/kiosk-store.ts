// Kiosk Store - Manages kiosk mode state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KioskDevice {
  deviceId: string;
  deviceName: string;
  location: string;
  isActive: boolean;
  lastActivity?: string;
}

interface KioskState {
  // Kiosk mode
  isKioskMode: boolean;
  kioskDevice: KioskDevice | null;
  kioskPin: string | null;

  // Idle timeout
  lastActivityTime: number;
  idleTimeoutMinutes: number;
  isIdle: boolean;

  // Check-in session
  checkInPatientId: string | null;
  checkInStartTime: number | null;

  // Actions
  enableKioskMode: (device: KioskDevice, pin: string) => void;
  disableKioskMode: () => void;
  updateActivity: () => void;
  setIdle: (idle: boolean) => void;
  startCheckIn: (patientId: string) => void;
  endCheckIn: () => void;
  resetKiosk: () => void;
}

const IDLE_TIMEOUT_MINUTES = 5;

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      // Initial state
      isKioskMode: false,
      kioskDevice: null,
      kioskPin: null,
      lastActivityTime: Date.now(),
      idleTimeoutMinutes: IDLE_TIMEOUT_MINUTES,
      isIdle: false,
      checkInPatientId: null,
      checkInStartTime: null,

      // Enable kiosk mode
      enableKioskMode: (device, pin) => {
        set({
          isKioskMode: true,
          kioskDevice: device,
          kioskPin: pin,
          lastActivityTime: Date.now(),
          isIdle: false,
        });
      },

      // Disable kiosk mode
      disableKioskMode: () => {
        set({
          isKioskMode: false,
          kioskDevice: null,
          kioskPin: null,
          checkInPatientId: null,
          checkInStartTime: null,
        });
      },

      // Update last activity time
      updateActivity: () => {
        set({
          lastActivityTime: Date.now(),
          isIdle: false,
        });
      },

      // Set idle state
      setIdle: (idle) => {
        set({ isIdle: idle });
      },

      // Start check-in session
      startCheckIn: (patientId) => {
        set({
          checkInPatientId: patientId,
          checkInStartTime: Date.now(),
          lastActivityTime: Date.now(),
          isIdle: false,
        });
      },

      // End check-in session
      endCheckIn: () => {
        set({
          checkInPatientId: null,
          checkInStartTime: null,
        });
      },

      // Reset kiosk to home screen
      resetKiosk: () => {
        set({
          checkInPatientId: null,
          checkInStartTime: null,
          lastActivityTime: Date.now(),
          isIdle: false,
        });
      },
    }),
    {
      name: 'kiosk-storage',
      partialize: (state) => ({
        isKioskMode: state.isKioskMode,
        kioskDevice: state.kioskDevice,
        kioskPin: state.kioskPin,
        idleTimeoutMinutes: state.idleTimeoutMinutes,
      }),
    }
  )
);
