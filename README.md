## Port Configuration

This application is configured to run on **port 1101** instead of the default port 3000.

### How the Port is Configured

The port configuration is set in multiple places to ensure consistency:

#### 1. **package.json Scripts**
```json
{
  "scripts": {
    "dev": "next dev -p 1101",
    "start": "next start -p 1101 -H 0.0.0.0"
  }
}
```
- `dev`: Runs development server on port 1101
- `start`: Runs production server on port 1101 and binds to all network interfaces (0.0.0.0)

#### 2. **Environment Variables (.env)**
```env
NEXTAUTH_URL=http://192.168.50.100:1101
```
- This ensures NextAuth and other services use the correct URL

#### 3. **PM2 Configuration (ecosystem.config.js)**
```javascript
module.exports = {
  apps: [{
    name: 'CNTCloud',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: '1101',
      HOSTNAME: '0.0.0.0'
    }
  }]
}
```

#### 4. **Server Wrapper (server.js)**
A custom Node.js wrapper script that ensures the Next.js server starts with the correct port:
```javascript
const server = spawn('node', [nextBin, 'start', '-p', '1101', '-H', '0.0.0.0'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '1101',
    HOSTNAME: '0.0.0.0'
  }
});
```

### Changing the Port

To change the application port to a different value (e.g., 3000):

1. **Update package.json**:
   ```json
   "dev": "next dev -p 3000",
   "start": "next start -p 3000 -H 0.0.0.0"
   ```

2. **Update .env**:
   ```env
   NEXTAUTH_URL=http://192.168.50.100:3000
   ```

3. **Update ecosystem.config.js**:
   ```javascript
   env: {
     PORT: '3000'
   }
   ```

4. **Update server.js**:
   ```javascript
   spawn('node', [nextBin, 'start', '-p', '3000', '-H', '0.0.0.0'])
   ```

### Windows Firewall Configuration

When deploying to Windows Server, you need to allow the port through the firewall:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "CNT CloudSpace Port 1101" -Direction Inbound -LocalPort 1101 -Protocol TCP -Action Allow
```

## Deployment on Windows Server 2019

### Prerequisites
- Node.js LTS installed
- PM2 installed globally: `npm install -g pm2`

### Deployment Steps

1. **Copy project files** to the server (e.g., `C:\inetpub\CNTCloudspace`)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the production version**:
   ```bash
   npm run build
   ```

4. **Configure Windows Firewall**:
   ```powershell
   New-NetFirewallRule -DisplayName "CNT CloudSpace Port 1101" -Direction Inbound -LocalPort 1101 -Protocol TCP -Action Allow
   ```

5. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Verify it's running**:
   ```bash
   pm2 status
   pm2 logs CNTCloud
   ```

7. **Access the application**:
   - From server: `http://localhost:1101`
   - From network: `http://192.168.50.100:1101`

### Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs CNTCloud

# Restart application
pm2 restart CNTCloud

# Stop application
pm2 stop CNTCloud

# Delete from PM2
pm2 delete CNTCloud

# Monitor resources
pm2 monit
```

### Alternative: Run Without PM2

If you prefer to run without PM2:

```bash
# Using the batch file
.\start-server.bat

# Or directly
node server.js
```