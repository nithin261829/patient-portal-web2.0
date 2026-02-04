import { jwtDecode } from 'jwt-decode'

export function debugToken(token: string | null) {
  if (!token) {
    console.log('[Auth Debug] No token available')
    return null
  }

  try {
    const decoded = jwtDecode<any>(token)
    const now = Date.now()
    const exp = decoded.exp * 1000
    const iat = decoded.iat ? decoded.iat * 1000 : null

    const info = {
      valid: exp > now,
      expired: exp <= now,
      expiresIn: Math.floor((exp - now) / 1000 / 60), // minutes
      issuedAt: iat ? new Date(iat).toISOString() : 'unknown',
      expiresAt: new Date(exp).toISOString(),
      now: new Date(now).toISOString(),
      claims: {
        sub: decoded.sub,
        iss: decoded.iss,
        aud: decoded.aud,
        ...decoded,
      },
    }

    console.log('[Auth Debug] Token Info:', info)
    return info
  } catch (error) {
    console.error('[Auth Debug] Failed to decode token:', error)
    return null
  }
}

export function validateTokenFormat(token: string): boolean {
  // JWT should have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    console.error('[Auth Debug] Invalid token format - should have 3 parts, has:', parts.length)
    return false
  }

  // Each part should be base64
  try {
    parts.forEach((part) => {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    })
    return true
  } catch (error) {
    console.error('[Auth Debug] Invalid base64 encoding in token')
    return false
  }
}
