import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { environment } from '@/config/environment'

// API Configuration - uses environment config
const API_BASE_URL = environment.apiUrl

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': environment.apiKey,
  },
})

// Anonymous token cache
let anonymousToken: string | null = null
let tokenExpiry: number | null = null

// Endpoints that need anonymous token
const anonymousEndpoints = [
  '/patients/family_lookup',
  '/patients/create',
  '/patients/register',
]

function needsAnonymousToken(url: string): boolean {
  return anonymousEndpoints.some(endpoint => url.includes(endpoint))
}

function isAnonymousTokenValid(): boolean {
  if (!anonymousToken || !tokenExpiry) return false
  // Check if token is still valid (with 5 minute buffer)
  return Date.now() < (tokenExpiry - 5 * 60 * 1000)
}

async function getAnonymousToken(): Promise<string | null> {
  try {
    const { clientId, orgId } = useAuthStore.getState()

    const response = await axios.post(`${API_BASE_URL}/auth/exchange_anon_token`, {
      id_token: 'anonymous',
      org_id: orgId,
      client_id: clientId,
      patient_id: 'anonymous',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': environment.apiKey,
      },
    })

    if (response.data?.access_token) {
      anonymousToken = response.data.access_token
      // Token valid for 1 hour
      tokenExpiry = Date.now() + 60 * 60 * 1000
      return anonymousToken
    }
  } catch (error) {
    console.error('Failed to get anonymous token:', error)
  }
  return null
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || ''

    // Check if this endpoint needs anonymous token
    if (needsAnonymousToken(url)) {
      let token = anonymousToken
      if (!isAnonymousTokenValid()) {
        token = await getAnonymousToken()
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    // For other endpoints, use the regular access token
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState()

      // Check if token is expired and try to refresh
      if (authStore.isTokenExpired()) {
        // For now, just logout. Can implement refresh token logic here
        authStore.logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// API Methods
export const apiService = {
  // Auth
  auth: {
    // Exchange Firebase ID token for access token (after OTP verification)
    exchangeToken: (data: { id_token: string; patient_id: string; client_id: string; org_id: string }) =>
      api.post('/auth/exchange_token', data),

    // Anonymous token for new patient scheduling
    exchangeAnonToken: (data: { id_token: string; patient_id: string; client_id: string; org_id: string }) =>
      api.post('/auth/exchange_anon_token', data),

    refreshToken: (refreshToken: string) =>
      api.post('/auth/refresh_token', { refresh_token: refreshToken }),

    verifyRecaptcha: (token: string) =>
      api.post('/auth/verify_recaptcha', { token }),
  },

  // Patient lookup (before OTP)
  patientLookup: {
    familyLookup: (clientId: string, data: { orgId: string; clientId: string; phoneNumber: string; dob: string }) =>
      api.post(`/${clientId}/patients/family_lookup`, data),
  },

  // Patient
  patient: {
    getProfile: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/profile/${patientId}`),

    updateProfile: (clientId: string, patientId: string, data: Record<string, unknown>) =>
      api.put(`/${clientId}/patients/${patientId}/update`, data),

    register: (clientId: string, data: Record<string, unknown>) =>
      api.post(`/${clientId}/patients/register`, data),

    familyLookup: (clientId: string, phoneNumber: string) =>
      api.post(`/${clientId}/patients/family_lookup`, { phoneNumber }),

    getAppointments: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/appointments`),

    getStatement: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/statement`),

    getAgingBalance: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/aging-balance`),

    getPayments: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/payments`),
  },

  // Appointments
  appointments: {
    getTypes: () =>
      api.post('/appointment/types', {}),

    getSlots: (data: { startDate: string; endDate?: string; operatories: string; lengthInMinutes?: number }) =>
      api.post('/appointment/slots', data),

    book: (data: Record<string, unknown>) =>
      api.post('/appointment/book', data),

    manage: (data: { appointmentNumber: number | string; action: string; appointmentDateTime?: string; operatoryNumber?: number; note?: string }) =>
      api.post('/appointment/manage', data),

    getOperatories: (data?: { appointmentTypeName?: string }) =>
      api.post('/appointment/operatories', data || {}),
  },

  // Forms
  forms: {
    getTemplates: (clientId: string) =>
      api.get(`/${clientId}/forms/templates/all`),

    getTemplate: (clientId: string, templateId: string) =>
      api.get(`/${clientId}/forms/templates/${templateId}`),

    createInstance: (clientId: string, patientId: string, templateId: string) =>
      api.post(`/${clientId}/patients/${patientId}/forms/create/${templateId}`),

    getForm: (clientId: string, patientId: string, formId: string) =>
      api.get(`/${clientId}/patients/${patientId}/forms/${formId}`),

    saveForm: (clientId: string, patientId: string, formId: string, data: Record<string, unknown>) =>
      api.post(`/${clientId}/patients/${patientId}/forms/${formId}/save`, data),

    submitForm: (clientId: string, patientId: string, formId: string, data: Record<string, unknown>) =>
      api.post(`/${clientId}/patients/${patientId}/forms/${formId}/submit`, data),

    getAllForms: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/forms/all`),
  },

  // Payments
  payments: {
    getPublicKey: (clientId: string) =>
      api.get(`/${clientId}/payments/public_key`),

    charge: (clientId: string, data: { patient_id: string; dataDescriptor: string; dataValue: string; amount: number }) =>
      api.post(`/${clientId}/payments/charge`, data),

    isEnabled: (tenantId: string) =>
      api.get(`/payments_enabled/${tenantId}`),
  },

  // Clinic
  clinic: {
    getInfo: (clientId: string) =>
      api.get(`/${clientId}/clinic_info`),

    getConfig: (clientId: string, configName: string) =>
      api.get(`/${clientId}/client_config/${configName}`),
  },

  // Documents
  documents: {
    getAll: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/documents/all`),
  },
}

export default api
