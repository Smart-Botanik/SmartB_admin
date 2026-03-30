import { parseToken } from './parse'

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseToken(token)
  if (!payload) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Check if token is close to expiring (within 5 minutes)
 */
export const shouldRefreshToken = (token: string): boolean => {
  const payload = parseToken(token)
  if (!payload) return true

  const currentTime = Math.floor(Date.now() / 1000)
  const fiveMinutesFromNow = currentTime + 5 * 60
  return payload.exp < fiveMinutesFromNow
}

/**
 * Check if token is valid (not expired and has proper structure)
 */
export const isTokenValid = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  
  const payload = parseToken(token)
  if (!payload) return false
  
  // Check required JWT fields
  if (!payload.sub || !payload.iat || !payload.exp) return false
  
  return !isTokenExpired(token)
}
