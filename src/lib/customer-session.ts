import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'neo_customer_session'
const CUSTOMER_SESSION_SECRET = process.env.CUSTOMER_SESSION_SECRET

const secret = new TextEncoder().encode(
  CUSTOMER_SESSION_SECRET || 'fallback-secret-for-development-only-replace-this'
)

export type CustomerSessionPayload = {
  lineUserId: string
  customerId: string
  hospitalId: string
}

/**
 * Signs a payload and sets it as an HTTP-only cookie.
 * Expiry: 30 days.
 */
export const issueCustomerSession = async (payload: CustomerSessionPayload) => {
  const cookieStore = await cookies()
  
  // Sign the JWT with a 30-day expiration
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  // Set as HTTP-only secure cookie
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  })

  return jwt
}

/**
 * Reads and verifies the customer session from cookies.
 * Returns null if the session is invalid or missing.
 */
export const readCustomerSession = async (): Promise<CustomerSessionPayload | null> => {
  const cookieStore = await cookies()
  const jwt = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!jwt) return null

  try {
    const { payload } = await jwtVerify(jwt, secret)
    return payload as CustomerSessionPayload
  } catch (err) {
    console.error('Failed to verify customer session:', err)
    return null
  }
}

/**
 * Clears the customer session cookie.
 */
export const clearCustomerSession = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
