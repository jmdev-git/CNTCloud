const path = require('path');

// Load .env manually so PM2 service always has all variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'cntcloudspace',
    script: 'server.js',
    cwd: __dirname,           // absolute path — safer than './'
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV:      'production',
      PORT:          '1101',
      HOSTNAME:      '0.0.0.0',
      NEXTAUTH_URL:  process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      MONGO_URI:     process.env.MONGO_URI,
      WEBHOOK_URL:   process.env.WEBHOOK_URL,
    }
  }]
}
