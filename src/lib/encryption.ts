import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== KEY_LENGTH) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  }
  return buf
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const parts = encoded.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted format')
  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(dataB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function maskSecret(value: string): string {
  if (!value || value.length <= 4) return '••••'
  const visible = value.slice(-4)
  const masked = '•'.repeat(Math.min(value.length - 4, 12))
  return `${masked}${visible}`
}
