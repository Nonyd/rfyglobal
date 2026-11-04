// Read-only smoke checks against a running site. Sends no emails and changes no data.
// Usage: npm run smoke -- https://rfyglobal.org   (default: http://localhost:3000)
// Run after every deploy; exits 1 if any check fails.

const BASE = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:3000').replace(/\/$/, '')

const checks = [
  ['homepage renders', 'GET', '/', [200], (body) => body.includes('Room For You')],
  ['events page renders', 'GET', '/events', [200]],
  ['gallery page renders', 'GET', '/gallery', [200]],
  ['default share image is served', 'GET', '/images/og-default.jpg', [200]],
  ['admin redirects to login', 'GET', '/admin', [302, 303, 307, 308]],
  ['admin API needs a session', 'GET', '/api/admin/users', [401]],
  ['upload needs a session', 'POST', '/api/upload', [401], null, { body: '{}' }],
  ['cron needs the secret', 'GET', '/api/cron/automations', [401]],
  ['cron rejects "Bearer undefined"', 'GET', '/api/cron/devotional', [401], null, {
    headers: { authorization: 'Bearer undefined' },
  }],
  ['uploads route blocks path traversal', 'GET', '/uploads/%2e%2e/%2e%2e/.env', [400, 403, 404]],
  ['missing upload is a 404', 'GET', '/uploads/gallery/does-not-exist.jpg', [404]],
  ['Paystack webhook rejects a bad signature', 'POST', '/api/webhooks/paystack', [400, 401, 503], null, {
    headers: { 'x-paystack-signature': 'invalid' },
    body: '{}',
  }],
]

let failed = 0
for (const [name, method, path, okStatuses, bodyCheck, init = {}] of checks) {
  try {
    const res = await fetch(BASE + path, {
      method,
      redirect: 'manual',
      headers: { 'content-type': 'application/json', ...init.headers },
      body: init.body,
    })
    const body = bodyCheck ? await res.text() : ''
    const ok = okStatuses.includes(res.status) && (!bodyCheck || bodyCheck(body))
    if (!ok) failed++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} (${method} ${path} → ${res.status})`)
  } catch (e) {
    failed++
    console.log(`FAIL ${name} (${method} ${path} → ${e.message})`)
  }
}

console.log(failed ? `\n${failed} check(s) failed against ${BASE}` : `\nAll ${checks.length} checks passed against ${BASE}`)
process.exit(failed ? 1 : 0)
