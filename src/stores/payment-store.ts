// Payment Store - Manages payment state
import { create } from 'zustand';

export interface PaymentMethod {
  type: 'card' | 'ach';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  nameOnCard?: string;
  zipCode?: string;
}

interface PaymentState {
  amount: number;
  paymentMethod: PaymentMethod | null;
  isProcessing: boolean;

  setAmount: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

const initialState = {
  amount: 0,
  paymentMethod: null,
  isProcessing: false,
};

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,

  setAmount: (amount) => set({ amount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  reset: () => set(initialState),
}));
