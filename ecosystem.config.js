// PM2 apps on the Webuzo VPS (app root /var/www/rfyglobal). yadahworld uses 3000/9001 on the same box.
// Apply on the server with:  pm2 startOrReload ecosystem.config.js --update-env && pm2 save
// Secrets are NOT stored here: set DEPLOY_WEBHOOK_SECRET in the shell before the command above
// (pm2 saves it), and keep app secrets in /var/www/rfyglobal/.env.
module.exports = {
  apps: [
    {
      name: 'rfyglobal',
      cwd: '/var/www/rfyglobal',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      // Single process: the cron route's in-memory "already running" guard and the ISR cache assume it.
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
    },
    {
      name: 'rfyglobal-webhook',
      cwd: '/var/www/rfyglobal',
      script: 'scripts/webhook-server.js',
      env: {
        DEPLOY_WEBHOOK_PORT: 9002,
        DEPLOY_WEBHOOK_SECRET: process.env.DEPLOY_WEBHOOK_SECRET,
      },
    },
  ],
}
