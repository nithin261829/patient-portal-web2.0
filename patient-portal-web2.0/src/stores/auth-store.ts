import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { AuthToken, Patient, Clinic } from '@/types'
import { environment } from '@/config/environment'

interface AuthState {
  // State
  accessToken: string | null
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
  setToken: (token: string) => void
  setPatient: (patient: Patient) => void
  setClinic: (clinic: Clinic) => void
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void

  // Computed
  getDecodedToken: () => AuthToken | null
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      isAuthenticated: false,
      patient: null,
      clinic: null,
      isLoading: false,
      error: null,

      // Tenant info from environment (read-only, set once)
      clientId: environment.clientId,
      orgId: environment.orgId,
      tenantId: environment.tenantId,

      // Actions
      setToken: (token: string) => {
        try {
          jwtDecode<AuthToken>(token) // Validate token
          set({
            accessToken: token,
            isAuthenticated: true,
            error: null,
          })
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
          isAuthenticated: false,
          patient: null,
          clinic: null,
          error: null,
        })
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
        isAuthenticated: state.isAuthenticated,
        patient: state.patient,
        clinic: state.clinic,
      }),
    }
  )
)
