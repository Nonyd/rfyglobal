/** Production servers must satisfy all keys. Use `SKIP_ENV_VALIDATION=1` only for CI builds that omit secrets. */
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'BREVO_API_KEY',
  'BREVO_FROM_EMAIL',
  'UPLOADTHING_SECRET',
  'UPLOADTHING_APP_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`,
    )
  }
}
