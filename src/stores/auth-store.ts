import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { AuthToken, Patient, Clinic } from '@/types'
import { environment } from '@/config/environment'

interface AuthState {
  // State
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  patient: Patient | null
  clinic: Clinic | null
  isLoading: boolean
  error: string | null

  // Tenant info (from environment)
  clientId: string
  orgId: string
  tenantId: string

  // Actions
  setToken: (accessToken: string, refreshToken?: string) => void
  setPatient: (patient: Patient) => void
  setClinic: (clinic: Clinic) => void
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateClientConfig: (config: { client_id?: string; org_id?: string }) => void

  // Computed
  getDecodedToken: () => AuthToken | null
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      patient: null,
      clinic: null,
      isLoading: false,
      error: null,

      // Tenant info from environment (will be updated from API config)
      clientId: environment.clientId || environment.tenantId,
      orgId: environment.orgId,
      tenantId: environment.tenantId,

      // Add method to update client config from API
      updateClientConfig: (config: { client_id?: string; org_id?: string }) => {
        set({
          clientId: config.client_id || get().clientId,
          orgId: config.org_id || get().orgId,
        })
      },

      // Actions
      setToken: (accessToken: string, refreshToken?: string) => {
        try {
          jwtDecode<AuthToken>(accessToken) // Validate token
          set({
            accessToken,
            refreshToken: refreshToken || get().refreshToken,
            isAuthenticated: true,
            error: null,
          })

          // Store tokens in sessionStorage for API interceptor
          sessionStorage.setItem('accessToken', accessToken)
          if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken)
          }
        } catch (error) {
          set({ error: 'Invalid token' })
        }
      },

      setPatient: (patient: Patient) => {
        set({ patient })
      },

      setClinic: (clinic: Clinic) => {
        set({ clinic })
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          patient: null,
          clinic: null,
          error: null,
        })

        // Clear sessionStorage
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('refreshToken')
        sessionStorage.removeItem('idToken')
        sessionStorage.removeItem('patientId')
        sessionStorage.removeItem('pendingPatientId')
        sessionStorage.removeItem('pendingPhoneNumber')
        sessionStorage.removeItem('pendingPatient')
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Computed
      getDecodedToken: () => {
        const { accessToken } = get()
        if (!accessToken) return null
        try {
          return jwtDecode<AuthToken>(accessToken)
        } catch {
          return null
        }
      },

      isTokenExpired: () => {
        const decoded = get().getDecodedToken()
        if (!decoded) return true
        // Add 5 minute buffer
        return decoded.exp * 1000 < Date.now() + 5 * 60 * 1000
      },
    }),
    {
      name: 'patient-portal-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        patient: state.patient,
        clinic: state.clinic,
      }),
    }
  )
)
