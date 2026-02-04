// Appointment Store - Manages appointment scheduling state
import { create } from 'zustand';

export interface AppointmentSlot {
  appointmentDateTime: string;
  operatoryNumber: number;
  operatoryName?: string;
  providerNumber?: string | number;
  providerName?: string;
  lengthInMinutes: number;
  // Additional fields from API
  start?: Date | string;
  end?: Date | string;
  [key: string]: any;
}

export interface AppointmentType {
  appointmentTypeNumber: number;
  appointmentTypeName: string;
  lengthInMinutes: number;
  pattern?: string;
  category?: string;
  description?: string;
}

export interface Operatory {
  operatoryNumber: number;
  operatoryName: string;
  providerNumber: string | number;
  providerDentist?: string;
  providerHygienist?: string;
  isHygiene?: string;
  abbrev?: string;
}

interface AppointmentState {
  // Scheduling flow state
  selectedType: AppointmentType | null;
  selectedDate: Date | null;
  selectedSlot: AppointmentSlot | null;
  selectedOperatory: Operatory | null;

  // Available data
  appointmentTypes: AppointmentType[];
  operatories: Operatory[];
  availableSlots: AppointmentSlot[];

  // Loading states
  isLoadingTypes: boolean;
  isLoadingOperatories: boolean;
  isLoadingSlots: boolean;
  isBooking: boolean;

  // Actions
  setSelectedType: (type: AppointmentType | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedSlot: (slot: AppointmentSlot | null) => void;
  setSelectedOperatory: (operatory: Operatory | null) => void;

  setAppointmentTypes: (types: AppointmentType[]) => void;
  setOperatories: (operatories: Operatory[]) => void;
  setAvailableSlots: (slots: AppointmentSlot[]) => void;

  setLoadingTypes: (loading: boolean) => void;
  setLoadingOperatories: (loading: boolean) => void;
  setLoadingSlots: (loading: boolean) => void;
  setBooking: (booking: boolean) => void;

  resetFlow: () => void;
  reset: () => void;
}

const initialState = {
  selectedType: null,
  selectedDate: null,
  selectedSlot: null,
  selectedOperatory: null,
  appointmentTypes: [],
  operatories: [],
  availableSlots: [],
  isLoadingTypes: false,
  isLoadingOperatories: false,
  isLoadingSlots: false,
  isBooking: false,
};

export const useAppointmentStore = create<AppointmentState>((set) => ({
  ...initialState,

  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setSelectedOperatory: (operatory) => set({ selectedOperatory: operatory }),

  setAppointmentTypes: (types) => set({ appointmentTypes: types }),
  setOperatories: (operatories) => set({ operatories }),
  setAvailableSlots: (slots) => set({ availableSlots: slots }),

  setLoadingTypes: (loading) => set({ isLoadingTypes: loading }),
  setLoadingOperatories: (loading) => set({ isLoadingOperatories: loading }),
  setLoadingSlots: (loading) => set({ isLoadingSlots: loading }),
  setBooking: (booking) => set({ isBooking: booking }),

  // Reset only the flow state, keep types/operatories cached
  resetFlow: () => set({
    selectedType: null,
    selectedDate: null,
    selectedSlot: null,
    selectedOperatory: null,
    availableSlots: [],
  }),

  // Full reset
  reset: () => set(initialState),
}));

// Selector hooks
export const useSelectedType = () => useAppointmentStore((s) => s.selectedType);
export const useSelectedDate = () => useAppointmentStore((s) => s.selectedDate);
export const useSelectedSlot = () => useAppointmentStore((s) => s.selectedSlot);
export const useAvailableSlots = () => useAppointmentStore((s) => s.availableSlots);
