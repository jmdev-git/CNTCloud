# Next.js + Nginx + Self-Signed SSL — Deployment Notes
### Windows Server 2019 | Internal LAN Deployment

---

## Overview

This setup runs a Next.js app behind Nginx as a reverse proxy with a self-signed SSL certificate.
HTTPS is required so browser features like **camera access (getUserMedia)** work on LAN IPs —
browsers only allow camera access on secure contexts (HTTPS or localhost).

```
Client Browser
     │
     │  HTTPS :443
     ▼
  Nginx  (C:\nginx)
     │
     │  HTTP :1101 (internal only)
     ▼
  Next.js  (PM2 / NSSM)
     │
     ▼
  MongoDB  :27017
```

---

## Tools Required

| Tool    | Purpose                        | Download |
|---------|--------------------------------|----------|
| Nginx   | Reverse proxy + SSL termination | https://nginx.org/en/download.html → Stable Windows zip |
| OpenSSL | Generate self-signed cert       | https://slproweb.com/products/Win32OpenSSL.html → Win64 Light |
| NSSM    | Run Nginx as a Windows service  | https://nssm.cc/download → Featured pre-release |
| Node.js | Run Next.js                     | https://nodejs.org |
| PM2     | Keep Next.js alive as a service | `npm install -g pm2` |

---

## Folder Structure on Server

```
C:\nginx\
  ├── conf\
  │     └── nginx.conf        ← your config goes here
  ├── ssl\
  │     ├── cert.pem          ← public certificate
  │     └── key.pem           ← private key (never share)
  ├── logs\
  └── nginx.exe

C:\your-project\              ← Next.js project root
  ├── .env
  ├── nginx.conf              ← reference copy (deploy from here)
  ├── next.config.ts
  ├── server.js
  └── ecosystem.config.js
```

---

## Step 1 — Generate the Self-Signed Certificate

Open PowerShell as Administrator on the server:

```powershell
# Create ssl folder
New-Item -ItemType Directory -Path C:\nginx\ssl

# Go to OpenSSL bin
cd "C:\Program Files\OpenSSL-Win64\bin"

# Generate key + cert (valid 10 years)
.\openssl.exe req -x509 -nodes -days 3650 -newkey rsa:2048 `
  -keyout C:\nginx\ssl\key.pem `
  -out    C:\nginx\ssl\cert.pem `
  -subj "/C=PH/ST=Metro Manila/L=Manila/O=YourCompany/CN=192.168.50.100" `
  -addext "subjectAltName=IP:192.168.50.100"
```

> **Why `-addext subjectAltName`?**
> Modern browsers (Chrome, Edge) reject certificates that don't have a Subject Alternative Name
> even if the Common Name (CN) matches. Always include it.

> **For a hostname instead of IP** (e.g. `cloudspace.local`):
> Change `-subj` CN and `-addext` to:
> `-addext "subjectAltName=DNS:cloudspace.local"`

---

## Step 2 — Nginx Config

Copy `nginx.conf` from the project root to `C:\nginx\conf\nginx.conf`.

Key sections explained:

```nginx
# Redirect HTTP → HTTPS (port 80 → 443)
server {
    listen 80;
    server_name 192.168.50.100;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl;
    server_name 192.168.50.100;

    ssl_certificate     C:/nginx/ssl/cert.pem;   # public cert
    ssl_certificate_key C:/nginx/ssl/key.pem;    # private key

    ssl_protocols TLSv1.2 TLSv1.3;              # disable old TLS
    ssl_ciphers   HIGH:!aNULL:!MD5;

    proxy_set_header X-Forwarded-Proto https;    # tells Next.js it's HTTPS
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;   # WebSocket support
    proxy_set_header Connection "upgrade";

    location / {
        proxy_pass http://127.0.0.1:1101;        # forward to Next.js
    }
}
```

**Test config before applying:**
```powershell
C:\nginx\nginx.exe -t
```

**Reload after changes (no downtime):**
```powershell
C:\nginx\nginx.exe -s reload
```

---

## Step 3 — Install Nginx as a Windows Service (NSSM)

```powershell
cd C:\nssm\win64
.\nssm.exe install Nginx
```

In the NSSM GUI that opens:
- **Path:** `C:\nginx\nginx.exe`
- **Startup directory:** `C:\nginx`
- **Service name:** `Nginx`

Then start it:
```powershell
.\nssm.exe start Nginx
```

To remove later:
```powershell
.\nssm.exe remove Nginx confirm
```

---

## Step 4 — Next.js Project Config

### `.env`
```env
NEXTAUTH_URL=https://192.168.50.100    # must match your server IP/hostname
NEXTAUTH_SECRET=<random 32 char string>
```

> **Rule:** `NEXTAUTH_URL` must always match the URL users type in the browser.
> If you change IP or add a hostname, update this.

### `next.config.ts`
```ts
// Required when behind a reverse proxy
async headers() {
  return [{
    source: "/:path*",
    headers: [{ key: "X-Forwarded-Proto", value: "https" }],
  }];
},

// Add your server IP/hostname here for Next.js Image component
remotePatterns: [
  { protocol: "https", hostname: "192.168.50.100" },
]
```

> **Rule:** Every hostname that serves images must be listed in `remotePatterns`.
> Protocol must match what the browser uses (https here).

---

## Step 5 — Run Next.js with PM2

```bash
# Install PM2 globally (once)
npm install -g pm2

# In your project folder
npm run build

# Start using ecosystem config
pm2 start ecosystem.config.js

# Save so it survives reboots
pm2 save

# Set PM2 to auto-start on Windows boot
pm2 startup
# Follow the command it prints
```

**Useful PM2 commands:**
```bash
pm2 list                    # see running apps
pm2 logs cntloudspace       # view logs
pm2 restart cntloudspace    # restart app
pm2 stop cntloudspace       # stop app
```

---

## Step 6 — Trust the Certificate on Client Machines

This is **required** for the camera/QR scanner to work. Browsers block `getUserMedia`
on untrusted HTTPS the same as on HTTP.

**Manual (per machine):**
1. Copy `C:\nginx\ssl\cert.pem` to the client, rename to `cert.crt`
2. Double-click → Install Certificate
3. Store location: **Local Machine**
4. Store: **Trusted Root Certification Authorities**
5. Finish

**PowerShell (run as admin on each client):**
```powershell
Import-Certificate -FilePath "C:\path\to\cert.crt" `
  -CertStoreLocation Cert:\LocalMachine\Root
```

**Group Policy (domain environments — push to all machines at once):**
```
Computer Configuration
  → Windows Settings
    → Security Settings
      → Public Key Policies
        → Trusted Root Certification Authorities
          → Import cert.crt
```

---

## Step 7 — Open Firewall Ports

```powershell
New-NetFirewallRule -DisplayName "Nginx HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Nginx HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
```

---

## Checklist — Before Going Live

- [ ] `cert.pem` and `key.pem` exist at `C:\nginx\ssl\`
- [ ] `nginx.conf` copied to `C:\nginx\conf\nginx.conf`
- [ ] `nginx -t` passes with no errors
- [ ] Nginx service running (`Get-Service Nginx`)
- [ ] `npm run build` completed successfully
- [ ] PM2 app running (`pm2 list`)
- [ ] `.env` `NEXTAUTH_URL` starts with `https://`
- [ ] Cert trusted on all client machines
- [ ] Ports 80 and 443 open in Windows Firewall
- [ ] Camera/QR scanner tested in browser

---

## Applying to a Future Project — Quick Reference

### Things to change per project:

| Item | Where | What to update |
|------|-------|----------------|
| Server IP / hostname | `nginx.conf` → `server_name` | Your new server IP |
| Server IP / hostname | `nginx.conf` → `ssl_certificate` SAN | Match the IP/hostname |
| App port | `nginx.conf` → `upstream` + `server.js` | Your app's port |
| App port | `ecosystem.config.js` → `PORT` | Same port |
| NEXTAUTH_URL | `.env` | `https://your-new-ip` |
| Image hostnames | `next.config.ts` → `remotePatterns` | Add any image sources |
| Cert CN | OpenSSL `-subj` | Your new IP or hostname |
| Cert SAN | OpenSSL `-addext` | Your new IP or hostname |

### Reusable cert generation command (just change the IP):
```powershell
.\openssl.exe req -x509 -nodes -days 3650 -newkey rsa:2048 `
  -keyout C:\nginx\ssl\key.pem `
  -out    C:\nginx\ssl\cert.pem `
  -subj "/C=PH/ST=Metro Manila/L=Manila/O=YourOrg/CN=YOUR_IP_HERE" `
  -addext "subjectAltName=IP:YOUR_IP_HERE"
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Browser shows "Not Secure" / cert warning | Cert not trusted on client | Install cert to Trusted Root (Step 6) |
| Camera not working | Cert not trusted → not a secure context | Same as above |
| `502 Bad Gateway` | Next.js not running | `pm2 list` → restart if stopped |
| `nginx -t` fails | Config syntax error | Check `nginx.conf` for typos |
| NextAuth redirect loop | `NEXTAUTH_URL` mismatch | Must match exact URL in browser |
| Images broken | Missing `remotePatterns` entry | Add hostname to `next.config.ts` |
| Port 443 refused | Firewall blocking | Run Step 7 firewall commands |
| Nginx won't start | Port 80/443 in use | Check IIS or other services using those ports |

> **IIS conflict:** Windows Server often has IIS running on port 80.
> Stop it: `Stop-Service W3SVC` or disable it in Server Manager before starting Nginx.

---

*Generated for: CNT Promo Ads — CloudSpace Project*
*Stack: Next.js 16 · MongoDB · Nginx 1.30 · Windows Server 2019*
