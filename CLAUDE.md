# Room For You — rfyglobal.org

Ministry/community platform for Room For You, linked from yadahworld.com's header nav. Built and
maintained by SonsHub Media. Members, events + registration, gallery, blog/study/scripture, prayer &
testimonies, live chat, giving (Paystack/Flutterwave/Payaza), automated special-date emails, admin broadcasts,
YouTube "Past Editions" archive (`/live`).

`doc/*.md` are historical Cursor prompts, not specs. The code and `git log` are the truth.

## Stack

- Next.js 14.2 (App Router), TypeScript, Tailwind, GSAP (+ framer-motion)
- Prisma 5 + PostgreSQL (39 models, `prisma/schema.prisma`; **no `prisma/migrations/`** — schema is applied with `db push`)
- NextAuth v5 beta, credentials provider, JWT sessions. Edge-safe split: `src/lib/auth.config.ts` (no DB, used by
  middleware) + `src/lib/auth.ts` (adds credentials provider + DB role lookup). `trustHost: true`.
- Email: Brevo HTTP API (`src/lib/brevo.ts`), key from DB credentials with `BREVO_API_KEY` env fallback. Not SMTP.
- Unlayer editor (`react-email-editor`) for email templates; Tiptap for blog/CMS rich text
- Upstash Redis for rate limiting (admin login, in middleware)

## Hosting & deploy

- Webuzo VPS 159.198.47.232 (SSH host `sonshub-vps`, root), app root `/home/sonshubco/rfyglobal.org` (owner
  `sonshubco`), sits beside yadahworld on the same box. Apache proxy rules: `/var/webuzo-data/apache2/custom/domains/rfyglobal.org.conf`.
- Cloudflare → Apache (`docs/apache-vhost.conf`) → Next.js on **3001** (PM2 `rfyglobal`) and the GitHub webhook
  on **9002** (PM2 `rfyglobal-webhook`). Both apps are defined in `ecosystem.config.js` (single fork process).
- Push to main → `scripts/webhook-server.js` (secret from `DEPLOY_WEBHOOK_SECRET`) → `scripts/deploy.sh`: reset to
  origin/main, `npm install`, build, `pm2 restart`. Self-restoring: on failure it puts back the previous commit and
  `.next`. Log: `/var/log/rfyglobal-deploy.log`. No Vercel; `.github/workflows/ci.yml` only checks (tsc, lint, tests).
- After a deploy: `npm run smoke -- https://rfyglobal.org` (read-only checks, `scripts/smoke.mjs`).
- Apache ModSecurity: `text/plain` server actions allowed box-wide (SecAction 900220); per-site whitelist in
  `/var/webuzo-data/modsecurity/custom/rfyglobal.org.conf`.

## Hard rules

- **No Prisma in middleware.** Middleware imports only `auth.config.ts`, never `@/lib/auth` or `@/lib/db`.
- `AUTH_TRUST_HOST=true` (also `trustHost: true` in code).
- Secrets (Brevo, payment keys, YouTube) live in DB settings (Admin → Credentials / Integrations, encrypted with
  `CREDENTIALS_ENCRYPTION_KEY`) with `.env` fallback. Don't add env-only secrets.
- `npx tsc --noEmit` + `npm test` + `npm run build` must pass before every commit.
- Never `npm install` / `npm run build` in a shell that has sourced `.env`.
- **Schema changes are a manual server step** (`npx prisma db push` on the VPS), outside the webhook. Never add
  `migrate deploy`/`db push` to the deploy path.
- Media lives in `UPLOAD_DIR` **outside the deploy root**, served by `src/app/uploads/[...path]/route.ts` at the
  `/uploads/...` URLs stored in the DB. Never write uploads into `public/`.
- Uploaded images go through `next/image` optimization (only SVGs bypass it); never ship raw camera JPEGs.
- Public content must stay visible without JS: scroll reveals are gated on `html.reveal-ready`, and the hero
  animates motion only, never opacity from 0 on text or CTAs.
- Email templates are Unlayer JSON (`design`) + HTML in `EmailTemplate` (keyed by `key`). Admin → Email Templates
  has preview + test-send: use them before any broadcast or automation change.
- Don't touch `.env*` files or print their values.

## Key code

- Uploads (local disk only): `src/lib/upload-storage.ts` (entry), `upload-local.ts` (disk → `$UPLOAD_DIR/<folder>`,
  falls back to `public/uploads` when unset; `resolveUploadPath` blocks traversal), `upload-client.ts` (folder types +
  upload hook). API: `src/app/api/upload`, `api/testimony/upload`. Serving: `src/app/uploads/[...path]/route.ts`.
  `res.cloudinary.com` stays in `next.config` remotePatterns/CSP only so legacy DB URLs still render.
- Automations: `src/app/api/cron/automations/route.ts` → `src/lib/automation-runners/*`. Toggles in
  `AutomationSetting` (key, enabled, config). Admin UI: `/admin/automation`.
- Email templates: defaults `src/lib/email-defaults.ts` (15 keys), lookup `getTemplateHtml/Subject` in `brevo.ts`,
  admin `src/components/admin/email-templates/EmailTemplatesManager.tsx`, API `api/admin/email-templates`.
- Broadcasts: `api/admin/broadcast` (+ `recipients`), `src/lib/broadcast-*.ts`, model `BroadcastMessage`;
  supports groups and individual recipients.
- Homepage: `src/app/(public)/page.tsx` (ISR, `revalidate = 60`) → `src/components/landing/*` (Hero with GSAP,
  FeaturedEvent or `NextGatheringNotice` when no event is upcoming,
  GalleryStrip with GSAP ScrollTrigger horizontal scroll, HomeCarousel, PastEditions).
- Gallery: `src/components/gallery/*` (CSS `columns-*` masonry, IntersectionObserver infinite scroll).
- Admin ACL: `src/middleware.ts` route→permission map + `src/lib/permissions.ts`.

## Automations (one daily cron hit)

Crontab on the VPS (verify): `0 7 * * * curl -s "https://rfyglobal.org/api/cron/automations?secret=$CRON_SECRET"`.
Auth is `?secret=` or `Authorization: Bearer`. The request returns 202 at once and runs in the background (results in
`pm2 logs rfyglobal`; `&wait=1` runs inline). It runs every enabled runner, then the YouTube playlist sync:
- `birthday`: matches today's month+day (BIRTHDAY_MONTH/BIRTHDAY_DAY form fields, or a DATE field labelled birth/dob)
- `christmas` on Dec 25, `new_year` on Jan 1, `easter` on the date set in `AutomationSetting('easter').config.easterDate`
- `event_reminder`, `daily_scripture`, `daily_study`
Each uses the DB template by key and falls back to built-in HTML in `src/lib/automation-email-html.ts`.
Calendar dates use Africa/Lagos (`src/lib/automation-date.ts`), not the VPS clock. Birthday and the three holiday
runners record `lastRunOn` in their `AutomationSetting.config`, so a second hit the same day sends nothing.
Separate older endpoints: `api/cron/devotional`, `api/cron/event-reminders` (manual trigger `api/admin/cron/[type]`).

## Known open items

1. From `a486844` (Jun 3) until Cloudinary was removed, uploads may have gone to Cloudinary, so some DB rows can
   still hold `res.cloudinary.com` URLs. Re-migrate with `scripts/migrate-cloudinary.mjs` + `update-db-urls.mjs`
   before closing the Cloudinary account.
2. Production must set `UPLOAD_DIR` and move `public/uploads` there; until then the fallback keeps working.
3. No birthday-*month* email exists, only birthday-day. There are 15 template keys, not 8.
4. Tests are thin: `tests/unit.test.mjs` (pure helpers) + `scripts/smoke.mjs` (live HTTP checks). No DB tests.

## Working style

Build → `npx tsc --noEmit` + `npm run build` → summary with HEAD hash → stop and wait for "continue".
List operator (server) steps separately from code changes. Don't commit or push unless asked.
Before starting any feature, re-read the Hard rules above and say if the request conflicts with one; past work
silently reversed earlier decisions (e.g. Cloudinary came back in `a486844` after the move to local storage).
