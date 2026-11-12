// GitHub push webhook for rfyglobal.org (PM2 app `rfyglobal-webhook`, port 9002).
// Apache proxies https://rfyglobal.org/deploy → 127.0.0.1:9002/deploy (see docs/apache-vhost.conf).
// The secret comes from DEPLOY_WEBHOOK_SECRET (set in ecosystem.config.js env on the server, never in git)
// and must match the secret on the GitHub webhook.
const http = require('http')
const crypto = require('crypto')
const { execFile } = require('child_process')

const SECRET = process.env.DEPLOY_WEBHOOK_SECRET
const PORT = Number(process.env.DEPLOY_WEBHOOK_PORT || 9002)
const DEPLOY_SCRIPT = '/home/sonshubco/rfyglobal.org/scripts/deploy.sh'
const LOG_FILE = '/var/log/rfyglobal-deploy.log'

if (!SECRET) {
  console.error('DEPLOY_WEBHOOK_SECRET is not set — refusing to start')
  process.exit(1)
}

function verifySignature(payload, signature) {
  if (typeof signature !== 'string') return false
  const digest = 'sha256=' + crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  const a = Buffer.from(digest)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

let deploying = false
let queued = false

function deploy() {
  if (deploying) {
    queued = true
    return
  }
  deploying = true
  console.log(`[${new Date().toISOString()}] Deploy triggered`)
  execFile('bash', ['-c', `bash ${DEPLOY_SCRIPT} >> ${LOG_FILE} 2>&1`], (err) => {
    console.log(`[${new Date().toISOString()}] Deploy ${err ? 'FAILED (see ' + LOG_FILE + ')' : 'complete'}`)
    deploying = false
    if (queued) {
      queued = false
      deploy()
    }
  })
}

http
  .createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/deploy') {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const body = Buffer.concat(chunks)
      if (!verifySignature(body, req.headers['x-hub-signature-256'])) {
        console.log('Invalid signature')
        res.writeHead(401)
        res.end('Unauthorized')
        return
      }

      let payload = {}
      try {
        payload = JSON.parse(body.toString('utf8'))
      } catch {
        /* ping events etc. */
      }

      if (payload.ref !== 'refs/heads/main') {
        res.writeHead(200)
        res.end('Ignored (not a push to main)')
        return
      }

      res.writeHead(202)
      res.end('Deploying...')
      deploy()
    })
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`RFY webhook server on 127.0.0.1:${PORT}`)
  })
