// Unit tests for pure helpers. Run: npm test (Node 22+, uses built-in TypeScript type stripping).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { automationToday } from '../src/lib/automation-date.ts'
import { resolveUploadPath, UPLOADS_DIR } from '../src/lib/upload-local.ts'

test('automationToday uses Lagos time, not the server clock', () => {
  // 23:30 UTC on 24 Dec is already 00:30 on 25 Dec in Lagos (UTC+1).
  assert.deepEqual(automationToday(new Date('2026-12-24T23:30:00Z')), {
    year: 2026,
    month: 12,
    day: 25,
    iso: '2026-12-25',
  })
  assert.equal(automationToday(new Date('2027-01-01T00:30:00Z')).iso, '2027-01-01')
  assert.equal(automationToday(new Date('2026-12-31T22:59:00Z')).iso, '2026-12-31')
})

test('resolveUploadPath stays inside the uploads folder', () => {
  assert.equal(resolveUploadPath('gallery/a.jpg'), path.join(UPLOADS_DIR, 'gallery', 'a.jpg'))
  for (const bad of ['../.env', 'gallery/../../.env', '..', '', '.env', 'gallery/.hidden', '/etc/passwd', String.raw`..\..\x`]) {
    const resolved = resolveUploadPath(bad)
    assert.ok(resolved === null || resolved.startsWith(UPLOADS_DIR + path.sep), `escaped with ${bad}`)
  }
  assert.equal(resolveUploadPath('../.env'), null)
  assert.equal(resolveUploadPath('.env'), null)
})
