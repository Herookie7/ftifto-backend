# Hostinger Backend Deployment Guide

## 📋 Overview

This guide will help you deploy your Tifto backend API on Hostinger. Your backend uses:
- **Node.js** (v20+ required)
- **Express.js** with GraphQL
- **MongoDB Atlas** (cloud database)
- **Configuration stored in MongoDB** (API keys like Fast2SMS, Stripe, Razorpay are in database, not env vars)

## 🎯 Prerequisites

1. ✅ Hostinger account with VPS or Business/Cloud hosting (Node.js support required)
2. ✅ Domain name already configured on Hostinger
3. ✅ MongoDB Atlas account (you already have: `mongodb+srv://sunarthy7_db_user:...@tifto-test.unnzzmz.mongodb.net/test`)
4. ✅ SSH access to your Hostinger server
5. ✅ Git installed on server

## 📦 Step 1: Choose Hosting Type

### Option A: VPS Hosting (Recommended)
- Full control, better performance
- Can install Node.js, PM2, Nginx
- Best for production

### Option B: Business/Cloud Hosting
- Managed hosting with Node.js support
- Easier setup but less control
- Check if Node.js 20+ is available

**This guide assumes VPS hosting. Adjust for Business hosting if needed.**

---

## 🚀 Step 2: Server Setup

### 2.1 Connect via SSH

```bash
ssh your-username@your-server-ip
# or
ssh your-username@your-domain.com
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js 20+

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

PM2 will keep your backend running 24/7 and restart it if it crashes.

### 2.5 Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📥 Step 3: Deploy Your Backend

### 3.1 Create Application Directory

```bash
# Create directory for your app
sudo mkdir -p /var/www/your-domain.com/api
sudo chown -R $USER:$USER /var/www/your-domain.com/api
cd /var/www/your-domain.com/api
```

### 3.2 Clone Your Repository

```bash
# Clone your backend repository
git clone https://github.com/Herookie7/ftifto-backend.git .

# Or if using SSH
# git clone git@github.com:Herookie7/ftifto-backend.git .
```

### 3.3 Install Dependencies

```bash
cd /var/www/your-domain.com/api
npm install --production
```

### 3.4 Create Environment File

```bash
nano .env
```

Add the following (replace with your actual values):

```env
# Required - MongoDB Connection
MONGO_URI=mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test

# Required - JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Optional - Server Configuration
NODE_ENV=production
PORT=8001

# Optional - CORS (allow your frontend domain)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Optional - API Base URL (your backend URL)
API_BASE_URL=https://api.your-domain.com/api/v1

# Optional - Other services (if you use them)
# FCM_PROJECT_ID=
# FCM_CLIENT_EMAIL=
# FCM_PRIVATE_KEY=
# STRIPE_SECRET_KEY=
# SENTRY_DSN=
```

**Important Notes:**
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Replace `your-domain.com` with your actual domain
- Most API keys (Fast2SMS, Razorpay, Stripe) are stored in MongoDB Configuration collection, not here

Save and exit (Ctrl+X, then Y, then Enter)

### 3.5 Test the Application

```bash
# Test if it starts correctly
npm start
```

Press Ctrl+C to stop. If it starts without errors, you're good!

---

## ⚙️ Step 4: Configure PM2

### 4.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'ftifto-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

### 4.2 Create Logs Directory

```bash
mkdir -p logs
```

### 4.3 Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

The last command will show you a command to run. Copy and run it to enable PM2 on system boot.

### 4.4 Verify PM2 Status

```bash
pm2 status
pm2 logs ftifto-backend
```

---

## 🌐 Step 5: Configure Nginx (Reverse Proxy)

### 5.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/your-domain-api
```

Add (replace `your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name api.your-domain.com;  # or subdomain.your-domain.com

    # Logs
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;

    # Increase timeouts for long-running requests
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support (for GraphQL subscriptions)
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8001/health;
        access_log off;
    }
}
```

### 5.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/your-domain-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔒 Step 6: Setup SSL Certificate (HTTPS)

### 6.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Get SSL Certificate

```bash
sudo certbot --nginx -d api.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 6.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

---

## 🔧 Step 7: Configure Domain DNS

### 7.1 Add Subdomain Record

In your Hostinger DNS settings (or domain registrar), add:

**Type:** A Record  
**Name:** api (or subdomain of your choice)  
**Value:** Your server IP address  
**TTL:** 3600

Or if using CNAME:

**Type:** CNAME  
**Name:** api  
**Value:** your-server-hostname.hostingermysql.com  
**TTL:** 3600

### 7.2 Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours. Check with:

```bash
nslookup api.your-domain.com
```

---

## 🗄️ Step 8: Verify MongoDB Connection

Your backend connects to MongoDB Atlas. Ensure:

1. **MongoDB Atlas IP Whitelist**: Add your Hostinger server IP to MongoDB Atlas Network Access
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (allow all) OR your specific server IP

2. **Test Connection**:

```bash
cd /var/www/your-domain.com/api
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Error:', err.message));
"
```

---

## 📝 Step 9: Verify API Keys in Database

Since your API keys are stored in MongoDB (not environment variables), verify they're set:

```bash
# Connect to MongoDB and check configuration
node -e "
const mongoose = require('mongoose');
const Configuration = require('./src/models/Configuration');

mongoose.connect('mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test')
  .then(async () => {
    const config = await Configuration.getConfiguration();
    console.log('Fast2SMS Enabled:', config.fast2smsEnabled);
    console.log('Fast2SMS API Key exists:', !!config.fast2smsApiKey);
    console.log('Fast2SMS Route:', config.fast2smsRoute);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
"
```

---

## ✅ Step 10: Test Your Deployment

### 10.1 Check Backend Health

```bash
curl http://localhost:8001/health
# or
curl https://api.your-domain.com/health
```

### 10.2 Check PM2 Status

```bash
pm2 status
pm2 logs ftifto-backend --lines 50
```

### 10.3 Test API Endpoint

```bash
curl https://api.your-domain.com/api/v1/health
```

### 10.4 Test GraphQL

```bash
curl -X POST https://api.your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## 🔄 Step 11: Update Deployment Script

Create a script for easy updates:

```bash
nano /var/www/your-domain.com/api/deploy.sh
```

Add:

```bash
#!/bin/bash
cd /var/www/your-domain.com/api
git pull origin main
npm install --production
pm2 restart ftifto-backend
echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

Usage:

```bash
./deploy.sh
```

---

## 🛠️ Useful Commands

### PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs ftifto-backend       # View logs
pm2 restart ftifto-backend    # Restart app
pm2 stop ftifto-backend       # Stop app
pm2 delete ftifto-backend     # Remove from PM2
pm2 monit                     # Monitor resources
```

### Nginx Commands

```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload Nginx
sudo systemctl restart nginx  # Restart Nginx
sudo systemctl status nginx   # Check status
```

### View Logs

```bash
# PM2 logs
pm2 logs ftifto-backend

# Nginx logs
sudo tail -f /var/log/nginx/api-access.log
sudo tail -f /var/log/nginx/api-error.log

# Application logs (if configured)
tail -f /var/www/your-domain.com/api/logs/*.log
```

---

## 🔍 Troubleshooting

### Backend Not Starting

1. Check PM2 logs: `pm2 logs ftifto-backend`
2. Check environment variables: `cat .env`
3. Test MongoDB connection (see Step 8)
4. Check port availability: `sudo netstat -tulpn | grep 8001`

### 502 Bad Gateway

1. Check if backend is running: `pm2 status`
2. Check Nginx error log: `sudo tail -f /var/log/nginx/api-error.log`
3. Verify backend is listening: `curl http://localhost:8001/health`

### SSL Certificate Issues

1. Check certificate: `sudo certbot certificates`
2. Renew manually: `sudo certbot renew`
3. Check Nginx config: `sudo nginx -t`

### MongoDB Connection Issues

1. Check MongoDB Atlas Network Access (whitelist your server IP)
2. Verify connection string in `.env`
3. Test connection (see Step 8)

### API Keys Not Working

Remember: API keys (Fast2SMS, Razorpay, Stripe) are stored in MongoDB Configuration collection, not in `.env` file. Update them via:
- Admin panel (if you have one)
- MongoDB directly
- Your configuration scripts

---

## 📊 Monitoring & Maintenance

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/pm2
```

Add:

```
/var/www/your-domain.com/api/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
}
```

### Monitor Resources

```bash
# CPU and Memory usage
pm2 monit

# System resources
htop
# or
top
```

### Regular Backups

Your MongoDB is on Atlas (cloud), so backups are handled there. But you can also:

1. Backup application code: Already in Git
2. Backup environment file: Keep `.env` secure and backed up
3. Database backups: Configure in MongoDB Atlas

---

## 🎯 Final Checklist

- [ ] Node.js 20+ installed
- [ ] PM2 installed and configured
- [ ] Backend code deployed
- [ ] `.env` file created with MONGO_URI and JWT_SECRET
- [ ] PM2 running backend
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (HTTPS)
- [ ] DNS configured (api.your-domain.com)
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Backend accessible via HTTPS
- [ ] Health endpoint working
- [ ] GraphQL endpoint working
- [ ] API keys verified in MongoDB

---

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs ftifto-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/api-error.log`
3. Verify environment variables
4. Test MongoDB connection
5. Check Hostinger server resources (CPU, RAM, disk)

---

## 🚀 Next Steps

After deployment:

1. Update your mobile apps to use: `https://api.your-domain.com`
2. Update CORS settings if needed
3. Monitor logs regularly
4. Set up monitoring/alerting (optional)
5. Configure automated backups
6. Set up CI/CD for easier deployments (optional)

---

**Your backend should now be live at: `https://api.your-domain.com`** 🎉

