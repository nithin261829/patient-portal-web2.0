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
  operatoryNumber?: string | number
  duration?: number
  notes?: string
}

export interface AppointmentSlot {
  startTime: string
  endTime: string
  operatoryNumber: string | number
  providerNumber?: string | number
  available: boolean
}

export interface AppointmentType {
  appointmentTypeNumber: string | number
  appointmentTypeName: string
  duration?: number
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
  clientId: string
  clinicName: string
  logo?: string
  phone?: string
  address?: Address
  email?: string
  website?: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
