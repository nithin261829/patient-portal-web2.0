/**
 * Utility to clear all authentication state
 * Use this when tokens are invalid or corrupted
 */
export function clearAuthState() {
  console.log('[ClearAuth] Clearing all auth state...')

  // Clear all storage
  localStorage.clear()
  sessionStorage.clear()

  // Clear specific auth items
  const keysToRemove = [
    'patient-portal-auth',
    'accessToken',
    'refreshToken',
    'idToken',
    'patientId',
    'pendingPatientId',
    'pendingPhoneNumber',
    'pendingPatient',
  ]

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })

  console.log('[ClearAuth] Auth state cleared successfully')
  console.log('[ClearAuth] Redirecting to login...')

  // Redirect to login
  window.location.href = '/login'
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuth = clearAuthState
}
