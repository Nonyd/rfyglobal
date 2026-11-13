// Unit tests for pure helpers. Run: npm test (Node 22+, uses built-in TypeScript type stripping).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { automationToday } from '../src/lib/automation-date.ts'
import { resolveUploadPath, UPLOADS_DIR } from '../src/lib/upload-local.ts'
import { audioSlug, audioExtension, isAcceptedAudio, isValidUploadId, titleFromFileName } from '../src/lib/audio-media.ts'

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

test('audio media helpers: slugs, types and upload ids', () => {
  assert.equal(audioSlug('Sunday Service: Grace & Truth!', 'ab12cd34'), 'sunday-service-grace-truth-ab12cd34')
  assert.equal(audioSlug('Ẹ̀mí Mímọ́', 'x1'), 'emi-mimo-x1')
  assert.equal(audioSlug('!!!', 'x1'), 'x1')
  assert.ok(audioSlug('a'.repeat(200), 'x1').length <= 63)
  assert.equal(audioExtension('Worship.MP3'), '.mp3')
  assert.equal(audioExtension('no-extension'), '')
  assert.ok(isAcceptedAudio('voice.opus') && isAcceptedAudio('take.FLAC') && isAcceptedAudio('memo.m4a'))
  assert.ok(isAcceptedAudio('sermon.mpeg') && isAcceptedAudio('Service.MPG') && isAcceptedAudio('clip.mpga') && isAcceptedAudio('old.mp2'))
  assert.ok(!isAcceptedAudio('virus.exe') && !isAcceptedAudio('photo.jpg') && !isAcceptedAudio('page.html'))
  assert.equal(titleFromFileName('2026_11_sunday-service.mp3'), '2026 11 sunday service')
  assert.ok(isValidUploadId('0123456789abcdef0123456789abcdef'))
  assert.ok(!isValidUploadId('../../etc') && !isValidUploadId('short') && !isValidUploadId('ABCDEF0123456789ABCD'))
})
