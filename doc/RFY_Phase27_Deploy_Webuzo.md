# ROOM FOR YOU — Phase 27

## Deploy rfyglobal.org to Webuzo VPS

---

## CONTEXT

Deploying `rfyglobal.org` to the same Webuzo VPS as `yadahworld.com`.

- **Server:** `159.198.47.232`
- **Method:** PM2 (Next.js) + Apache reverse proxy + GitHub webhook auto-deploy
- **Pattern:** Identical to the yadahworld.com deployment, with different ports/branch

This is an SSH terminal runbook — run all commands on the server as `root` unless stated otherwise.

### Port / branch summary (do not collide with yadahworld)

| Service              | yadahworld.com | rfyglobal.org |
| -------------------- | -------------- | ------------- |
| Next.js (PM2)        | 3000           | **3001**      |
| GitHub webhook (PM2) | 9001           | **9002**      |
| Git branch           | `master`       | **`main`**    |

---

## STEP 1 — SSH into the server

```bash
ssh root@159.198.47.232
```

---

## STEP 2 — Clone the repo

```bash
cd /var/www
git clone https://github.com/Nonyd/rfyglobal.git rfyglobal
cd rfyglobal
```

If the repo is private, use a GitHub Personal Access Token (PAT) as the password — not your GitHub password.

Confirm the branch is `main`:

```bash
git branch --show-current
```

Expected output: `main`. If it prints anything else, stop and reconcile before continuing — every later step assumes `main`.

---

## STEP 3 — Create the `.env` file

```bash
nano /var/www/rfyglobal/.env
```

Use the exact same values as your Vercel environment variables. The full list of keys (matching `.env.example` in the repo) is:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_3LNKIy5vtUTm@ep-quiet-forest-abnm8j10-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth — NEXTAUTH_URL must be the live domain
NEXTAUTH_SECRET="<paste-from-vercel>"
NEXTAUTH_URL="https://rfyglobal.org"

# Admin (seed / env fallback)
ADMIN_EMAIL="<paste-from-vercel>"
ADMIN_PASSWORD="<paste-from-vercel>"

# Credentials encryption (32-byte hex; generate locally with: openssl rand -hex 32)
CREDENTIALS_ENCRYPTION_KEY="<paste-from-vercel>"

# Cloudinary
CLOUDINARY_CLOUD_NAME="<paste-from-vercel>"
CLOUDINARY_API_KEY="<paste-from-vercel>"
CLOUDINARY_API_SECRET="<paste-from-vercel>"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="<paste-from-vercel>"

# Upstash Redis (required at runtime — app boots fail without these)
UPSTASH_REDIS_REST_URL="<paste-from-vercel>"
UPSTASH_REDIS_REST_TOKEN="<paste-from-vercel>"

# App
NEXT_PUBLIC_APP_URL="https://rfyglobal.org"

# Cron
CRON_SECRET="<paste-from-vercel>"

# Brevo (env fallback; live values can also be set via Admin → Credentials)
BREVO_API_KEY="<paste-from-vercel>"
BREVO_FROM_EMAIL="noreply@rfyglobal.org"
BREVO_FROM_NAME="Room For You"

# Payment providers (env fallback; preferred path is Admin → Credentials, encrypted in DB)
PAYSTACK_SECRET_KEY="<paste-from-vercel-or-leave-empty>"
PAYSTACK_WEBHOOK_SECRET="<paste-from-vercel-or-leave-empty>"
FLUTTERWAVE_SECRET_KEY="<paste-from-vercel-or-leave-empty>"
FLUTTERWAVE_WEBHOOK_SECRET="<paste-from-vercel-or-leave-empty>"
PAYAZA_SECRET_KEY="<paste-from-vercel-or-leave-empty>"
PAYAZA_WEBHOOK_SECRET="<paste-from-vercel-or-leave-empty>"

# Optional
# NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Save with `Ctrl+X → Y → Enter`.

> **Required at runtime:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `CREDENTIALS_ENCRYPTION_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. The app validates these on first DB import and will throw on boot if any are missing (see `src/lib/env.ts`).
>
> **Important:** `NEXTAUTH_URL` must be `https://rfyglobal.org` exactly — not the Vercel URL.

---

## STEP 4 — Install dependencies and build

```bash
cd /var/www/rfyglobal
npm install
npm run build
```

This will take 2–5 minutes. Wait for exit code `0`.

`next build` runs Prisma queries during static generation, so `DATABASE_URL` in `.env` must be reachable from the server. With Neon (remote), this works. If the build fails with `Can't reach database server at localhost:5432`, that means `.env` was not loaded — check the file is at `/var/www/rfyglobal/.env`, has the Neon URL, and re-run.

If the build crashes with `Missing required environment variables: …`, fill those keys in `.env` (see Step 3) and re-run. As an absolute last resort for an emergency build with secrets unset, you can bypass the runtime validator at build-time only:

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

The app will still validate env at boot under PM2, so any missing key will surface in `pm2 logs rfyglobal` immediately.

---

## STEP 5 — Start the app with PM2 (port 3001)

> yadahworld.com already occupies port 3000, so we start rfyglobal directly on **3001** — don't bind 3000 even briefly.

```bash
cd /var/www/rfyglobal
PORT=3001 pm2 start npm --name "rfyglobal" -- start
pm2 save
```

Verify it's running on 3001:

```bash
pm2 list
sleep 3 && curl -I http://localhost:3001
```

You should see `rfyglobal` in `pm2 list` with status `online`, and the curl should return `HTTP/1.1 200` (or a redirect).

If this is the first PM2 service on the box (or you're not sure it's set up to auto-start on reboot), enable the systemd unit once:

```bash
pm2 startup systemd -u root --hp /root
# Run the command pm2 prints (it usually exits with instructions)
pm2 save
```

If yadahworld.com is already running on PM2, `pm2 startup` is already configured — skip it.

---

## STEP 6 — Apache port-80 vhost (HTTP only, for cert issuance)

We need DNS-resolvable HTTP access so certbot can complete the ACME http-01 challenge. We'll add the HTTPS vhost **after** the cert exists.

Make sure DNS for `rfyglobal.org` and `www.rfyglobal.org` points to `159.198.47.232` (A records). Verify:

```bash
dig +short rfyglobal.org
dig +short www.rfyglobal.org
```

Both should return `159.198.47.232`. If not, fix DNS first and wait for propagation.

Create the port-80 vhost:

```bash
cat > /var/webuzo-data/apache2/custom/domains/rfyglobal.org.conf << 'EOF'
<VirtualHost *:80>
    ServerName rfyglobal.org
    ServerAlias www.rfyglobal.org

    DocumentRoot /var/www/rfyglobal/public

    # Allow ACME http-01 challenge
    Alias /.well-known/acme-challenge/ /var/www/html/.well-known/acme-challenge/
    <Directory "/var/www/html/.well-known/acme-challenge/">
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    # Temporarily proxy everything else to the app while we issue the cert
    ProxyPreserveHost On
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/

    ErrorLog /var/log/apache2/rfyglobal.org-error.log
    CustomLog /var/log/apache2/rfyglobal.org-access.log combined
</VirtualHost>
EOF
```

Reload Apache:

```bash
/usr/local/apps/apache2/bin/apachectl configtest && \
/usr/local/apps/apache2/bin/apachectl restart
```

Sanity-check:

```bash
curl -I http://rfyglobal.org
```

Should return `200` (or a Next.js redirect).

---

## STEP 7 — Issue the SSL certificate

If certbot is not installed:

```bash
apt install certbot python3-certbot-apache -y
```

Issue the cert. Use `--webroot` so certbot doesn't rewrite our custom vhost:

```bash
certbot certonly --webroot \
  -w /var/www/html \
  -d rfyglobal.org \
  -d www.rfyglobal.org \
  --agree-tos -m admin@rfyglobal.org -n
```

Confirm the cert files exist:

```bash
ls -l /etc/letsencrypt/live/rfyglobal.org/
```

You should see `fullchain.pem` and `privkey.pem`.

If certbot fails, the most common cause is DNS not yet propagated to `159.198.47.232`. Wait 10–15 minutes and retry.

---

## STEP 8 — Replace the vhost with the full HTTP→HTTPS + reverse-proxy config

Now overwrite the Step 6 vhost with the production config (HTTP redirect + HTTPS reverse proxy + webhook proxy). The webhook `ProxyPass /deploy` **must come before** the catch-all `ProxyPass /`.

```bash
cat > /var/webuzo-data/apache2/custom/domains/rfyglobal.org.conf << 'EOF'
<VirtualHost *:80>
    ServerName rfyglobal.org
    ServerAlias www.rfyglobal.org

    # Keep ACME challenge reachable for cert renewals
    Alias /.well-known/acme-challenge/ /var/www/html/.well-known/acme-challenge/
    <Directory "/var/www/html/.well-known/acme-challenge/">
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    # Everything else: redirect to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
    RewriteRule ^/?(.*)$ https://rfyglobal.org/$1 [R=301,L]

    ErrorLog /var/log/apache2/rfyglobal.org-error.log
    CustomLog /var/log/apache2/rfyglobal.org-access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName rfyglobal.org
    ServerAlias www.rfyglobal.org

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/rfyglobal.org/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/rfyglobal.org/privkey.pem

    ProxyPreserveHost On
    ProxyRequests Off

    # Webhook — MUST come before the catch-all
    ProxyPass        /deploy http://127.0.0.1:9002/deploy
    ProxyPassReverse /deploy http://127.0.0.1:9002/deploy

    # App — catch-all
    ProxyPass        / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port  "443"

    ErrorLog /var/log/apache2/rfyglobal.org-error.log
    CustomLog /var/log/apache2/rfyglobal.org-access.log combined
</VirtualHost>
EOF
```

Restart Apache:

```bash
/usr/local/apps/apache2/bin/apachectl configtest && \
/usr/local/apps/apache2/bin/apachectl restart
```

Test:

```bash
curl -I https://rfyglobal.org
curl -I http://rfyglobal.org          # should 301 → https
curl -I https://www.rfyglobal.org     # should resolve via SAN
```

`https://rfyglobal.org` should return `HTTP/2 200`.

---

## STEP 9 — Create the deploy script and webhook server

Deploy script:

```bash
cat > /var/www/rfyglobal/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "=== RFY Deploy $(date) ==="
cd /var/www/rfyglobal

echo "Pulling latest code..."
git reset --hard HEAD
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building..."
npm run build

echo "Restarting PM2..."
pm2 restart rfyglobal

echo "=== Deploy complete ==="
EOF

chmod +x /var/www/rfyglobal/deploy.sh
```

Webhook server (port **9002**):

```bash
cat > /var/www/rfyglobal/webhook-server.js << 'EOF'
const http = require('http')
const crypto = require('crypto')
const { exec } = require('child_process')

const SECRET = 'rfyglobal-deploy-2026'
const PORT = 9002

function verifySignature(payload, signature) {
  if (!signature) return false
  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(payload)
  const digest = 'sha256=' + hmac.digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  let body = ''
  req.on('data', (chunk) => {
    body += chunk.toString()
  })
  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256']

    if (!verifySignature(body, signature)) {
      console.log('Invalid signature')
      res.writeHead(401)
      res.end('Unauthorized')
      return
    }

    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      payload = {}
    }

    if (payload.ref && payload.ref !== 'refs/heads/main') {
      res.writeHead(200)
      res.end('Ignored (not main branch)')
      return
    }

    console.log('Deploy triggered!')
    res.writeHead(200)
    res.end('Deploying...')

    exec('/var/www/rfyglobal/deploy.sh >> /var/log/rfyglobal-deploy.log 2>&1', (err) => {
      if (err) console.error('Deploy error:', err)
      else console.log('Deploy complete')
    })
  })
})

server.listen(PORT, () => {
  console.log(`RFY webhook server running on port ${PORT}`)
})
EOF
```

Start under PM2:

```bash
cd /var/www/rfyglobal
pm2 start webhook-server.js --name "rfyglobal-webhook"
pm2 save
```

Verify both processes:

```bash
pm2 list
```

You should see:

- `rfyglobal` — online (port 3001)
- `rfyglobal-webhook` — online (port 9002)

Sanity-check the webhook locally:

```bash
curl -i http://127.0.0.1:9002/deploy   # expect 404 (GET)
curl -i -X POST http://127.0.0.1:9002/deploy   # expect 401 (no signature)
```

---

## STEP 10 — ModSecurity whitelist (do this BEFORE adding the GitHub webhook)

ModSecurity will likely 403 the GitHub `POST /deploy` payload (large body, unusual headers) and may flag legitimate admin API traffic. Whitelist both before testing.

```bash
cat >> /var/webuzo-data/modsecurity/custom/rfyglobal.org.conf << 'EOF'
# Whitelist admin API and deploy endpoint
<LocationMatch "^/api/admin">
    SecRuleRemoveById 920420 949110 941100 941160
</LocationMatch>
<Location "/deploy">
    SecRuleEngine Off
</Location>
EOF
```

If `/var/webuzo-data/modsecurity/custom/rfyglobal.org.conf` doesn't exist on this server, fall back to the global custom conf:

```bash
cat >> /etc/modsecurity/custom.conf << 'EOF'
<LocationMatch "^/api/admin">
    SecRuleRemoveById 920420 949110 941100 941160
</LocationMatch>
<Location "/deploy">
    SecRuleEngine Off
</Location>
EOF
```

Restart Apache:

```bash
/usr/local/apps/apache2/bin/apachectl configtest && \
/usr/local/apps/apache2/bin/apachectl restart
```

---

## STEP 11 — Add the GitHub webhook

Go to **GitHub → `rfyglobal` repo → Settings → Webhooks → Add webhook**:

- **Payload URL:** `https://rfyglobal.org/deploy`
- **Content type:** `application/json`
- **Secret:** `rfyglobal-deploy-2026`
- **Which events:** Just the `push` event
- Click **Add webhook**

GitHub will send a ping immediately. Open **Recent Deliveries** — should show `200 OK`. If you see `401`, the secret on the server (`webhook-server.js`) and on GitHub don't match. If you see `403`, ModSecurity is still blocking — re-check Step 10.

---

## STEP 12 — Test auto-deploy

From your local machine, push any small change to `main`:

```bash
git commit --allow-empty -m "Test auto-deploy"
git push origin main
```

On the server, watch the deploy log:

```bash
tail -f /var/log/rfyglobal-deploy.log
```

You should see the deploy steps run to completion. `Ctrl+C` to exit `tail`.

---

## STEP 13 — Verify everything

```bash
# PM2 processes
pm2 list

# App responding
curl -I https://rfyglobal.org

# Webhook reachable (expect 401 — POST without signature is correctly rejected)
curl -i -X POST https://rfyglobal.org/deploy

# Recent deploy log
tail -50 /var/log/rfyglobal-deploy.log

# Apache error log
tail -50 /var/log/apache2/rfyglobal.org-error.log

# App logs (last few lines, useful for env-validation crashes)
pm2 logs rfyglobal --lines 50 --nostream
```

---

## COMPLETION CHECKLIST

- [ ] DNS for `rfyglobal.org` and `www.rfyglobal.org` points to `159.198.47.232`
- [ ] Repo cloned to `/var/www/rfyglobal` (branch `main`)
- [ ] `.env` populated with all production values (every key required at runtime — see Step 3 callout)
- [ ] `npm install && npm run build` succeeds
- [ ] PM2 `rfyglobal` running on port 3001
- [ ] `pm2 startup` configured (only needed once per server)
- [ ] PM2 `rfyglobal-webhook` running on port 9002
- [ ] Apache port-80 vhost issued ACME challenge successfully
- [ ] SSL certificate issued via certbot (`certonly --webroot`)
- [ ] Apache vhost replaced with full HTTP→HTTPS + reverse-proxy config
- [ ] `https://rfyglobal.org` returns `200`
- [ ] `http://rfyglobal.org` 301-redirects to `https://rfyglobal.org`
- [ ] `https://www.rfyglobal.org` resolves (cert covers both)
- [ ] ModSecurity whitelist added for `/api/admin` and `/deploy`
- [ ] GitHub webhook configured and ping returns `200`
- [ ] Test push triggers auto-deploy and `pm2 restart rfyglobal` runs cleanly
- [ ] `pm2 save` run to persist processes across reboots

---

## NOTES

- **Port 3001** — yadahworld.com uses port 3000, so rfyglobal must use 3001 to avoid conflict.
- **Port 9002** — yadahworld.com webhook uses 9001, so rfyglobal webhook uses 9002.
- **Branch is `main`** — rfyglobal uses `main` (not `master` like yadahworld.com). The deploy script and webhook both filter on `refs/heads/main`.
- **`NEXTAUTH_URL`** must be `https://rfyglobal.org` exactly — critical for NextAuth on the live domain.
- **Env validation crashes on boot** — if `pm2 logs rfyglobal` shows `Missing required environment variables: …`, fill those keys in `.env` and `pm2 restart rfyglobal`.
- **Cert renewal** — certbot installs a systemd timer automatically. The Step 8 vhost keeps `/.well-known/acme-challenge/` reachable on port 80 so renewals continue to work without manual intervention.
- **If `pm2 list` shows `rfyglobal` as `errored`**, run `pm2 logs rfyglobal --lines 100` to see the boot error.
