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

// Endpoints that need anonymous token (matching Angular interceptor)
const anonymousEndpoints = [
  '/patients/family_lookup',
  '/patients/create',
  '/patients/register',
  '/forms/templates',
  '/kiosk/activate-device',
  '/kiosk/verify-pin',
]

// Patient form endpoints need anonymous token
const anonymousFormEndpoints = [
  '/forms/create',
  '/forms/save',
  '/forms/submit',
]

// Patient endpoints that require real user authentication
const requiresUserAuth = [
  '/appointments',
  '/statement',
  '/aging-balance',
  '/payments',
  '/prescriptions',
  '/treatment-plans',
  '/procedures',
  '/insurance',
  '/documents',
  '/patients/profile',
]

function needsAnonymousToken(url: string): boolean {
  // First, check if this is a user-authenticated endpoint - these NEVER use anonymous token
  if (requiresUserAuth.some(endpoint => url.includes(endpoint))) {
    return false
  }

  // Check if this is a general anonymous endpoint
  if (anonymousEndpoints.some(endpoint => url.includes(endpoint))) {
    return true
  }

  // Check if this is an anonymous form endpoint
  if (anonymousFormEndpoints.some(endpoint => url.includes(endpoint))) {
    return true
  }

  // Default: use real user auth
  return false
}

function isAnonymousTokenValid(): boolean {
  if (!anonymousToken || !tokenExpiry) return false
  // Check if token is still valid (with 5 minute buffer)
  return Date.now() < (tokenExpiry - 5 * 60 * 1000)
}

async function getAnonymousToken(): Promise<string | null> {
  try {
    const { clientId, orgId, orgTenantId } = useAuthStore.getState()

    // Construct tenant-specific API URL (matching Angular behavior)
    let apiUrl = environment.apiUrl

    // Try app state first
    let tenant = orgTenantId

    // Fallback to hostname extraction (same as Angular)
    if (!tenant) {
      const hostname = window.location.hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        tenant = hostname.split('.')[0]
      }
    }

    // Apply tenant subdomain if available (same as Angular)
    if (tenant && apiUrl.startsWith('https://')) {
      apiUrl = apiUrl.replace('https://', `https://${tenant}.`)
    }

    console.log('[AnonymousAuth] Getting anonymous token for:', {
      clientId: clientId || environment.clientId,
      orgId: orgId || environment.orgId,
      apiUrl
    })

    const response = await axios.post(`${apiUrl}/auth/exchange_anon_token`, {
      id_token: 'anonymous',
      org_id: orgId || environment.orgId,
      client_id: clientId || environment.clientId,
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
      console.log('[AnonymousAuth] Token obtained successfully')
      return anonymousToken
    }
    console.warn('[AnonymousAuth] No access_token in response:', response.data)
  } catch (error) {
    console.error('[AnonymousAuth] Failed to get token:', error)
  }
  return null
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || ''

    // Check if this endpoint needs anonymous token
    if (needsAnonymousToken(url)) {
      console.log('[API] Using anonymous token for:', url)
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
    const authStore = useAuthStore.getState()
    const { accessToken, isTokenExpired, getDecodedToken } = authStore

    if (accessToken) {
      // Check if token is expired
      if (isTokenExpired()) {
        console.warn('[API] Access token is expired for:', url)
        const decoded = getDecodedToken()
        if (decoded) {
          console.warn('[API] Token details:', {
            exp: new Date(decoded.exp * 1000).toISOString(),
            now: new Date().toISOString(),
            expired: decoded.exp * 1000 < Date.now(),
          })
        }
      } else {
        console.log('[API] Using user access token for:', url)
      }
      config.headers.Authorization = `Bearer ${accessToken}`
    } else {
      console.warn('[API] No access token available for:', url)
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
    const originalRequest = error.config as any

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      const authStore = useAuthStore.getState()
      const { accessToken, refreshToken, isTokenExpired } = authStore

      console.error('[API] 401 Error:', {
        url: originalRequest?.url,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isExpired: isTokenExpired(),
        error: error.response?.data,
      })

      // Debug the token
      if (accessToken) {
        try {
          const { debugToken } = await import('@/utils/auth-debug')
          debugToken(accessToken)
        } catch (e) {
          console.error('[API] Error debugging token:', e)
        }
      }

      // Check if we have a refresh token and the access token is expired
      if (refreshToken && isTokenExpired()) {
        originalRequest._retry = true

        try {
          console.log('[API] Attempting token refresh...')
          const response = await api.post('/auth/refresh_token', {
            refresh_token: refreshToken,
          })

          if (response.data?.access_token) {
            // Update tokens in store
            authStore.setToken(response.data.access_token, response.data.refresh_token)

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
            console.log('[API] Token refreshed successfully, retrying request')
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError)
          // Refresh failed, logout user
          authStore.logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token or already retried, logout
        console.log('[API] No refresh token available or retry failed, logging out')
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

    // Clinical data endpoints (matching Angular implementation)
    getPrescriptions: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/prescriptions`),

    getTreatmentPlans: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/treatment-plans`),

    getProcedureHistory: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/procedures`),

    getInsurance: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/insurance`),
  },

  // Appointments
  appointments: {
    getTypes: () =>
      api.post('/appointment/types', {}),

    // Get appointment types by treatment description (agentic search)
    getTypesByDescription: (data: { treatmentRequest: string; procedureCode?: string | null; isPlannedTreatment?: boolean }) =>
      api.post('/appointment/types', data),

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
      api.get(`/${clientId}/patients/${patientId}/documents`),

    upload: (clientId: string, patientId: string, formData: FormData) => {
      // Don't set Content-Type - browser handles it for FormData
      return api.post(`/${clientId}/patients/${patientId}/upload-documents`, formData, {
        headers: {
          'Content-Type': undefined, // Let browser set it
        },
      })
    },

    download: (clientId: string, patientId: string, documentId: string) =>
      api.get(`/${clientId}/patients/${patientId}/download-documents/${documentId}`, {
        responseType: 'blob',
      }),
  },

  // Insurance
  insurance: {
    submit: (clientId: string, patientId: string, data: Record<string, unknown>) =>
      api.post(`/${clientId}/patients/${patientId}/insurance/submit`, data),

    get: (clientId: string, patientId: string) =>
      api.get(`/${clientId}/patients/${patientId}/insurance`),
  },
}

export default api
