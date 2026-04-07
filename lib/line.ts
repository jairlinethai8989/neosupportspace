import crypto from 'crypto'

/**
 * Verifies the signature of a LINE Messaging API webhook request.
 * See: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verifying-signatures
 */
export const verifyLineSignature = (
  rawBody: string,
  signature: string,
  channelSecret: string
): boolean => {
  // LINE signature uses HMAC-SHA256
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64')

  return hash === signature
}

/**
 * Builds a simple text message object for LINE Messaging API reply.
 */
export const buildReplyMessage = (text: string) => {
  return {
    type: 'text',
    text: text
  }
}

/**
 * Returns the environment-configured LIFF URL for customer portal entrance.
 */
export const getLiffEntryUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${appUrl}/liff`
}
