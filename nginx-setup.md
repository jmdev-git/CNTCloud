# Nginx HTTPS Setup on Port 1101

## Prerequisites
1. OpenSSL installed
2. Nginx extracted to `C:\nginx\`
3. NSSM for Windows service

---

## Step 1: Generate SSL Certificate

```powershell
# Create SSL directory
New-Item -ItemType Directory -Path C:\nginx\ssl -Force

# Generate self-signed certificate (valid 10 years)
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 `
  -keyout C:\nginx\ssl\key.pem `
  -out C:\nginx\ssl\cert.pem `
  -subj "/C=PH/ST=Metro Manila/L=Manila/O=CNT Promo Ads/CN=192.168.50.100" `
  -addext "subjectAltName=IP:192.168.50.100"

# Verify certificates
Get-ChildItem C:\nginx\ssl\
```

---

## Step 2: Create nginx.conf

```powershell
$conf = @'
worker_processes 1;
events { worker_connections 1024; }
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    upstream nextjs_app { 
        server 127.0.0.1:3000; 
    }

    server {
        listen 1101 ssl;
        server_name 192.168.50.100;
        
        ssl_certificate     C:/nginx/ssl/cert.pem;
        ssl_certificate_key C:/nginx/ssl/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;
        
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header Strict-Transport-Security "max-age=31536000" always;
        
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        
        location /_next/static/ {
            proxy_pass http://nextjs_app;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
        
        location /_next/image { 
            proxy_pass http://nextjs_app; 
        }
        
        location /api/ { 
            proxy_pass http://nextjs_app; 
            proxy_buffering off; 
        }
        
        location / { 
            proxy_pass http://nextjs_app; 
        }
    }
}
'@

[System.IO.File]::WriteAllText("C:\nginx\conf\nginx.conf", $conf, [System.Text.UTF8Encoding]::new($false))
```

---

## Step 3: Test nginx configuration

```powershell
cd C:\nginx
.\nginx.exe -t
```

Should show: `configuration file test is successful`

---

## Step 4: Stop FortiClient Apache (if running)

```powershell
Stop-Service FCEMS_Apache -Force -ErrorAction SilentlyContinue
Set-Service FCEMS_Apache -StartupType Manual -ErrorAction SilentlyContinue
```

---

## Step 5: Install nginx as Windows Service

```powershell
cd C:\nginx

# Install service
.\nssm.exe install Nginx C:\nginx\nginx.exe

# Start service
.\nssm.exe start Nginx

# Restart via NSSM
.\nssm.exe restart Nginx

# Set auto-start
Set-Service -Name Nginx -StartupType Automatic

# Verify
Get-Service Nginx
netstat -ano | findstr ":1101"
```

---

## Step 6: Restart Next.js app on port 3000

```powershell
cd C:\CNT_Projects\cntcloudspace

# Restart PM2 with new port
pm2 restart cntloudspace

# Verify
pm2 status
netstat -ano | findstr ":3000"
```

---

## Step 7: Configure Firewall

```powershell
New-NetFirewallRule -DisplayName "Nginx HTTPS 1101" -Direction Inbound -Protocol TCP -LocalPort 1101 -Action Allow
```

---

## Step 8: Install Certificate on Client PCs

**For camera to work without warnings, install certificate on each client PC:**

1. Copy `C:\nginx\ssl\cert.pem` from server
2. Rename to `cert.crt`
3. On each client PC, run as Administrator:

```powershell
Import-Certificate -FilePath "C:\path\to\cert.crt" -CertStoreLocation Cert:\LocalMachine\Root
```

4. Restart browser

---

## Access

- **URL:** `https://192.168.50.100:1101`
- **Camera:** ✅ Works!
- **All features:** ✅ Work!

---

## Troubleshooting

```powershell
# Check nginx logs
Get-Content C:\nginx\logs\error.log -Tail 20

# Check if ports are listening
netstat -ano | findstr ":1101"  # nginx
netstat -ano | findstr ":3000"  # Next.js

# Restart services
Restart-Service Nginx
pm2 restart cntloudspace

# Check PM2 logs
pm2 logs cntloudspace
```
