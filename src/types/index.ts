// Patient Types
export interface Patient {
  patientId: string
  patientNumber: string | number
  firstName: string
  lastName: string
  email?: string
  phoneNumber: string
  dateOfBirth: string
  gender?: string
  address?: Address
  isNewPatient?: boolean
  isRegistered?: boolean
  hasCompletedConsent?: boolean
}

export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

// Appointment Types
export interface Appointment {
  appointmentNumber: string | number
  appointmentDateTime: string
  appointmentStatus: string
  appointmentType?: string
  appointmentTypeName?: string
  providerNumber?: string | number
  providerName?: string
  providerDentist?: string
  providerHygienist?: string
  operatoryNumber?: string | number
  duration?: number
  lengthInMinutes?: number
  notes?: string
  note?: string
  confirmed?: string
  insuranceStatus?: string | null
  summary?: string
  patientNumber?: string
  isNewPatient?: string
  isHygiene?: string
  appointmentTypeNumber?: string | number
  createdTimestamp?: string
}

export interface AppointmentSlot {
  appointmentDateTime: string
  start: Date | string
  end: Date | string
  operatoryNumber: string | number
  operatoryName?: string
  providerNumber?: string | number
  providerName?: string
  available?: boolean
  // Additional fields from API response
  [key: string]: any
}

export interface AppointmentType {
  appointmentTypeNumber: string | number
  appointmentTypeName: string
  lengthInMinutes: number
  duration?: number
  description?: string
  category?: string
  color?: string
}

// Form Types
export interface FormTemplate {
  id: string
  metadata: {
    form_title: string
    description?: string
    mode?: string
  }
  sections: FormSection[]
}

export interface FormSection {
  id: string
  title: string
  fields: FormField[]
}

export interface FormField {
  id: string
  type: string
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
  validation?: Record<string, unknown>
}

export interface FormInstance {
  form_id: string
  template_id: string
  patient_id: string
  client_id: string
  sections: Record<string, Record<string, unknown>>
  status?: 'draft' | 'submitted'
  created_at?: string
  modified_at?: string
}

// Payment Types
export interface Payment {
  paymentNumber: string | number
  amount: number
  paymentDate: string
  paymentType?: string
  paymentMethod?: string
  note?: string
}

export interface AccountBalance {
  totalBalance: number
  aging?: {
    current: number
    over30: number
    over60: number
    over90: number
  }
  // Full aging balance fields (matches backend API)
  Bal_0_30?: number
  Bal_31_60?: number
  Bal_61_90?: number
  BalOver90?: number
  Total?: number
  InsEst?: number  // Insurance Estimate
  EstBal?: number  // Estimated Balance
  PatEstBal?: number  // Patient Estimated Balance (what patient owes)
  Unearned?: number
}

// Insurance Types
export interface Insurance {
  insuranceId?: string
  carrierName: string
  subscriberId?: string
  groupNumber?: string
  isPrimary: boolean
  relationship?: string
  subscriberInfo?: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
}

// Clinical Data Types (matching Angular implementation)
export interface Prescription {
  prescriptionId?: string | number
  medicationName: string
  dosage?: string
  frequency?: string
  prescribedDate?: string
  endDate?: string
  providerName?: string
  instructions?: string
  refills?: number
  status?: 'active' | 'completed' | 'discontinued'
}

export interface TreatmentPlan {
  treatmentPlanId?: string | number
  planName?: string
  description?: string
  startDate?: string
  endDate?: string
  status?: 'active' | 'completed' | 'pending'
  procedures?: TreatmentProcedure[]
  totalCost?: number
  providerName?: string
  notes?: string
}

export interface TreatmentProcedure {
  procedureCode?: string
  procedureName: string
  toothNumber?: string
  surface?: string
  status?: 'planned' | 'in-progress' | 'completed'
  estimatedCost?: number
  completedDate?: string
}

export interface ProcedureHistory {
  procedureId?: string | number
  procedureCode?: string
  procedureName: string
  procedureDate: string
  toothNumber?: string
  surface?: string
  providerName?: string
  cost?: number
  insurancePaid?: number
  patientPaid?: number
  notes?: string
}

// Auth Types
export interface AuthToken {
  sub: string
  patient_id: string
  email?: string
  phone_number: string
  org_id: string
  client_id: string
  first_name: string
  last_name: string
  exp: number
  iat: number
  session_id?: string
}

export interface Clinic {
  id: string
  client_id: string
  displayName: string
  name: string
  logo_url?: string
  phoneNumber?: string
  address?: string
  email?: string
  clinic_website_url?: string
  location?: string
  timezone?: string
  maps_url?: string
  business_type?: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
