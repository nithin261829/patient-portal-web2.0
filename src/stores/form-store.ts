// Form Store - Manages dynamic form state
import { create } from 'zustand';

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: Record<string, any>;
  defaultValue?: any;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  metadata?: Record<string, any>;
}

interface FormState {
  // Current form
  currentTemplate: FormTemplate | null;
  formData: Record<string, any>;

  // Form instance
  formInstanceId: string | null;

  // UI state
  currentSectionIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;

  // Actions
  setCurrentTemplate: (template: FormTemplate) => void;
  setFormData: (data: Record<string, any>) => void;
  updateFieldValue: (fieldId: string, value: any) => void;
  setFormInstanceId: (id: string) => void;
  setCurrentSectionIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;

  // Computed
  getCurrentSection: () => FormSection | null;
  isFirstSection: () => boolean;
  isLastSection: () => boolean;
  getProgress: () => number;
}

const initialState = {
  currentTemplate: null,
  formData: {},
  formInstanceId: null,
  currentSectionIndex: 0,
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
};

export const useFormStore = create<FormState>((set, get) => ({
  ...initialState,

  setCurrentTemplate: (template) => set({
    currentTemplate: template,
    currentSectionIndex: 0,
    formData: {},
  }),

  setFormData: (data) => set({ formData: data }),

  updateFieldValue: (fieldId, value) => set((state) => ({
    formData: { ...state.formData, [fieldId]: value }
  })),

  setFormInstanceId: (id) => set({ formInstanceId: id }),
  setCurrentSectionIndex: (index) => set({ currentSectionIndex: index }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  resetForm: () => set(initialState),

  getCurrentSection: () => {
    const { currentTemplate, currentSectionIndex } = get();
    if (!currentTemplate) return null;
    return currentTemplate.sections[currentSectionIndex] || null;
  },

  isFirstSection: () => get().currentSectionIndex === 0,

  isLastSection: () => {
    const { currentTemplate, currentSectionIndex } = get();
    if (!currentTemplate) return false;
    return currentSectionIndex === currentTemplate.sections.length - 1;
  },

  getProgress: () => {
    const { currentTemplate, currentSectionIndex } = get();
    if (!currentTemplate || currentTemplate.sections.length === 0) return 0;
    return ((currentSectionIndex + 1) / currentTemplate.sections.length) * 100;
  },
}));

// Selector hooks
export const useCurrentSection = () => useFormStore((s) => s.getCurrentSection());
export const useFormProgress = () => useFormStore((s) => s.getProgress());
