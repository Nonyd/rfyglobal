# Room For You — rfyglobal.org

Ministry/community platform for Room For You, linked from yadahworld.com's header nav. Built and
maintained by SonsHub Media. Members, events + registration, gallery, blog/study/scripture, prayer &
testimonies, live chat, giving (Paystack/Flutterwave/Payaza), automated special-date emails, admin broadcasts,
YouTube "Past Editions" archive (`/live`).

`doc/*.md` are historical Cursor prompts, not specs. The code and `git log` are the truth.

## Stack

- Next.js 14.2 (App Router), TypeScript, Tailwind, GSAP (+ framer-motion)
- Prisma 5 + PostgreSQL (39 models, `prisma/schema.prisma`; **no `prisma/migrations/`** — schema is applied with `db push`)
- NextAuth v5 beta, credentials provider, JWT sessions (`src/lib/auth.ts`, `trustHost: true`)
- Email: Brevo HTTP API (`src/lib/brevo.ts`), key from DB credentials with `BREVO_API_KEY` env fallback. Not SMTP.
- Unlayer editor (`react-email-editor`) for email templates; Tiptap for blog/CMS rich text
- Upstash Redis for rate limiting (admin login, in middleware)

## Hosting & deploy

- Webuzo VPS 159.198.47.232, app root `/var/www/rfyglobal`, sits beside yadahworld on the same box.
- Ports: Next.js on **3001** (PM2 `rfyglobal`), GitHub webhook on **9002** (PM2 `rfyglobal-webhook`,
  `webhook-server.js`). Apache vhost proxies `/` → 3001 and `/deploy` → 9002. Source: `doc/RFY_Phase27_Deploy_Webuzo.md`.
- Webhook runs the **server-side** `/var/www/rfyglobal/deploy.sh` (reset --hard, pull, `npm install`, build,
  `pm2 restart rfyglobal`), logging to `/var/log/rfyglobal-deploy.log`.
- Stale files in the repo that do NOT describe production: `ecosystem.config.js` (port 3000, cluster),
  `scripts/deploy.sh` and `scripts/setup-webuzo.sh` (run `prisma migrate deploy`), `docs/nginx.conf`,
  `vercel.json`, `.github/workflows/deploy.yml` (deploys to Vercel on every push to main — check it is disabled).
- Apache ModSecurity: `text/plain` server actions allowed box-wide (SecAction 900220); per-site whitelist in
  `/var/webuzo-data/modsecurity/custom/rfyglobal.org.conf`.

## Hard rules

- **No Prisma in middleware.** NextAuth v5 edge-safe split (`auth.config.ts` without DB + `auth.ts` with DB).
  Currently violated, see Known drift.
- `AUTH_TRUST_HOST=true` (also `trustHost: true` in code).
- Secrets (Brevo, payment keys, YouTube) live in DB settings (Admin → Credentials / Integrations, encrypted with
  `CREDENTIALS_ENCRYPTION_KEY`) with `.env` fallback. Don't add env-only secrets.
- `npx tsc --noEmit` + `npm run build` must pass before every commit.
- Never `npm install` / `npm run build` in a shell that has sourced `.env`.
- **Schema changes are a manual server step** (`npx prisma db push` on the VPS), outside the webhook. Never add
  `migrate deploy`/`db push` to the deploy path.
- Media lives on disk **outside the deploy root**, served through an API route, never from `public/`.
  Not true yet either, see Known drift.
- Email templates are Unlayer JSON (`design`) + HTML in `EmailTemplate` (keyed by `key`). Admin → Email Templates
  has preview + test-send: use them before any broadcast or automation change.
- Don't touch `.env*` files or print their values.

## Key code

- Uploads (local disk only): `src/lib/upload-storage.ts` (entry), `upload-local.ts` (disk → `public/uploads/<folder>`),
  `upload-client.ts` (folder types + upload hook). API: `src/app/api/upload`, `api/testimony/upload`.
  `res.cloudinary.com` stays in `next.config` remotePatterns/CSP only so legacy DB URLs still render.
- Automations: `src/app/api/cron/automations/route.ts` → `src/lib/automation-runners/*`. Toggles in
  `AutomationSetting` (key, enabled, config). Admin UI: `/admin/automation`.
- Email templates: defaults `src/lib/email-defaults.ts` (15 keys), lookup `getTemplateHtml/Subject` in `brevo.ts`,
  admin `src/components/admin/email-templates/EmailTemplatesManager.tsx`, API `api/admin/email-templates`.
- Broadcasts: `api/admin/broadcast` (+ `recipients`), `src/lib/broadcast-*.ts`, model `BroadcastMessage`;
  supports groups and individual recipients.
- Homepage: `src/app/(public)/page.tsx` → `src/components/landing/*` (Hero with GSAP, FeaturedEvent,
  GalleryStrip with GSAP ScrollTrigger horizontal scroll, HomeCarousel, PastEditions).
- Gallery: `src/components/gallery/*` (CSS `columns-*` masonry, IntersectionObserver infinite scroll).
- Admin ACL: `src/middleware.ts` route→permission map + `src/lib/permissions.ts`.

## Automations (one daily cron hit)

Crontab on the VPS (verify): `0 7 * * * curl -s "https://rfyglobal.org/api/cron/automations?secret=$CRON_SECRET"`.
Auth is `?secret=` or `Authorization: Bearer`. One request runs every enabled runner, then the YouTube playlist sync:
- `birthday`: matches today's month+day (BIRTHDAY_MONTH/BIRTHDAY_DAY form fields, or a DATE field labelled birth/dob)
- `christmas` on Dec 25, `new_year` on Jan 1, `easter` on the date set in `AutomationSetting('easter').config.easterDate`
- `event_reminder`, `daily_scripture`, `daily_study`
Each uses the DB template by key and falls back to built-in HTML in `src/lib/automation-email-html.ts`.
Dates use server-local `new Date()`, so the VPS timezone decides which day it is.
Separate older endpoints: `api/cron/devotional`, `api/cron/event-reminders` (manual trigger `api/admin/cron/[type]`).

## Known drift (code vs. intended state, as of ac9c83f)

1. Cloudinary upload code is removed. But from `a486844` (Jun 3) until that removal, uploads may have gone to
   Cloudinary, so some DB rows can still hold `res.cloudinary.com` URLs. These need a re-migration with
   `scripts/migrate-cloudinary.mjs` + `update-db-urls.mjs` before the Cloudinary account is closed.
2. Local uploads go to `public/uploads` inside the deploy root and are served statically. There is no API serving route.
3. Middleware imports `@/lib/auth`, which imports `db` (Prisma). There is no edge-safe split.
4. No Neon reference exists in code/config. The local `.env.local` DB host is `localhost`.
5. No birthday-*month* email exists, only birthday-day. There are 15 template keys, not 8.

## Working style

Build → `npx tsc --noEmit` + `npm run build` → summary with HEAD hash → stop and wait for "continue".
List operator (server) steps separately from code changes. Don't commit or push unless asked.
