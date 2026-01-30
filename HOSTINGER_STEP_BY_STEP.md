# 🚀 Step-by-Step: Deploy Backend on Hostinger (tiftoapp.com)

## Current Setup
- **Domain:** tiftoapp.com
- **Backend URL Target:** api.tiftoapp.com (or backend.tiftoapp.com)
- **Hosting:** Hostinger hPanel

---

## 📍 Step 1: Determine Your Hosting Type

### Option A: Check if you have VPS

1. In Hostinger hPanel, click **"VPS"** in the left sidebar
2. If you see a VPS listed → **You have VPS** (use Option A below)
3. If you see "Upgrade to VPS" → **You have Shared/Business hosting** (use Option B below)

---

## 🖥️ Option A: VPS Hosting (Recommended)

### Step A1: Get VPS Access Details

1. Click **"VPS"** in left sidebar
2. Click on your VPS instance
3. Note down:
   - **IP Address**
   - **Root Password** (or SSH key)
   - **SSH Port** (usually 22)

### Step A2: Connect via SSH

**On Windows:**
- Use **PuTTY** or **Windows Terminal**
- Download from: https://www.putty.org/

**On Mac/Linux:**
- Use Terminal app

**SSH Command:**
```bash
ssh root@your-vps-ip
# or
ssh root@your-vps-ip -p 22
```

Enter your root password when prompted.

### Step A3: Follow Full Deployment Guide

Once connected via SSH, follow the steps in `HOSTINGER_DEPLOYMENT_GUIDE.md` starting from "Step 2: Server Setup"

---

## 🌐 Option B: Business/Cloud Hosting (No VPS)

### Step B1: Access File Manager

1. In Hostinger hPanel, click **"Websites"** in left sidebar
2. Find **"tiftoapp.com"** in the list
3. Click **"Manage"** or **"Dashboard"**
4. Look for **"File Manager"** or **"Files"** option
5. Click to open File Manager

### Step B2: Check Node.js Support

1. In your website dashboard, look for:
   - **"Node.js"** section
   - **"Terminal"** or **"SSH Terminal"** option
   - **"Advanced"** → **"Node.js"**

2. If you see Node.js option:
   - ✅ You can deploy Node.js apps
   - Continue to Step B3

3. If you DON'T see Node.js:
   - ❌ You need to upgrade to VPS or Business hosting with Node.js
   - Contact Hostinger support to enable Node.js

### Step B3: Create Subdomain for API

1. In Hostinger hPanel, click **"Domains"** in left sidebar
2. Click **"Subdomains"** or **"Manage Domains"**
3. Click **"Add Subdomain"** or **"Create Subdomain"**
4. Enter:
   - **Subdomain:** `api`
   - **Domain:** `tiftoapp.com`
   - **Document Root:** `/public_html/api` (or `/api`)
5. Click **"Create"** or **"Add"**

Wait 5-10 minutes for DNS propagation.

### Step B4: Access Terminal/SSH

**Method 1: Hostinger Terminal (if available)**
1. In your website dashboard, find **"Terminal"** or **"SSH Terminal"**
2. Click to open terminal
3. You should see a command prompt

**Method 2: File Manager Terminal**
1. Open **File Manager**
2. Look for **"Terminal"** button or option
3. Click to open terminal

**Method 3: Contact Support**
- If no terminal available, contact Hostinger support to enable SSH access

### Step B5: Navigate to API Directory

In the terminal, run:

```bash
# Navigate to your subdomain directory
cd ~/public_html/api
# or
cd ~/domains/tiftoapp.com/api
# or wherever Hostinger stores your subdomain files
```

### Step B6: Check Node.js Version

```bash
node --version
npm --version
```

**Required:** Node.js 20 or higher

If Node.js is not installed or version is too old:
1. Contact Hostinger support to install/upgrade Node.js
2. Or use Node Version Manager (nvm) if you have access

### Step B7: Clone Your Backend

```bash
# Make sure you're in the api directory
cd ~/public_html/api

# Clone your repository
git clone https://github.com/Herookie7/ftifto-backend.git .

# If git is not available, you may need to:
# 1. Upload files via File Manager, or
# 2. Contact support to install git
```

### Step B8: Install Dependencies

```bash
npm install --production
```

### Step B9: Create .env File

```bash
nano .env
```

Add these lines (press `Ctrl+X`, then `Y`, then `Enter` to save):

```env
MONGO_URI=mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test
JWT_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NODE_ENV=production
PORT=8001
API_BASE_URL=https://api.tiftoapp.com/api/v1
CORS_ORIGINS=https://tiftoapp.com,https://www.tiftoapp.com
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as `JWT_SECRET` value.

### Step B10: Test the Application

```bash
npm start
```

If it starts without errors, press `Ctrl+C` to stop.

### Step B11: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

If you get permission errors:
```bash
# Try with sudo (if available)
sudo npm install -g pm2

# Or install locally
npm install pm2 --save
```

### Step B12: Create PM2 Config

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

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step B13: Create Logs Directory

```bash
mkdir -p logs
```

### Step B14: Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

### Step B15: Configure .htaccess (if using Apache)

If Hostinger uses Apache instead of Nginx, create `.htaccess`:

```bash
nano .htaccess
```

Add:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:8001/$1 [P,L]
```

**Note:** This requires `mod_proxy` and `mod_rewrite` to be enabled. Contact support if it doesn't work.

### Step B16: Configure Node.js in Hostinger Panel

1. Go back to Hostinger hPanel
2. Navigate to your website dashboard
3. Find **"Node.js"** section
4. Configure:
   - **Node.js Version:** 20.x (or latest available)
   - **Application Root:** `/api` (or your subdomain path)
   - **Application Startup File:** `server.js`
   - **Application URL:** `https://api.tiftoapp.com`
   - **Port:** `8001`
5. Click **"Save"** or **"Deploy"**

### Step B17: Setup SSL Certificate

1. In Hostinger hPanel, go to **"Domains"**
2. Click on **"tiftoapp.com"**
3. Find **"SSL"** or **"Security"** section
4. Click **"Install SSL"** or **"Let's Encrypt"**
5. Select **"api.tiftoapp.com"** subdomain
6. Click **"Install"**

Wait a few minutes for SSL to activate.

### Step B18: Test Your Backend

Open browser and test:

```
https://api.tiftoapp.com/health
```

Or use curl in terminal:

```bash
curl https://api.tiftoapp.com/health
```

---

## 🔧 Alternative: Using Hostinger's Node.js App Manager

Some Hostinger plans have a Node.js App Manager:

1. In website dashboard, find **"Node.js Apps"** or **"Applications"**
2. Click **"Create Application"** or **"Add Node.js App"**
3. Fill in:
   - **App Name:** `ftifto-backend`
   - **Node.js Version:** 20.x
   - **App Root:** `/api`
   - **Startup File:** `server.js`
   - **Port:** `8001`
4. Upload your backend files or connect to Git repository
5. Add environment variables (MONGO_URI, JWT_SECRET, etc.)
6. Click **"Deploy"** or **"Start"**

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running: `pm2 status` shows "online"
- [ ] Health endpoint works: `curl https://api.tiftoapp.com/health`
- [ ] GraphQL works: Test with GraphQL query
- [ ] SSL is active: URL shows HTTPS with lock icon
- [ ] MongoDB connection works (check logs)
- [ ] API keys in database are correct (Fast2SMS, etc.)

---

## 🆘 Troubleshooting

### "Node.js not found"
- Contact Hostinger support to enable Node.js
- Or upgrade to VPS hosting

### "Port 8001 already in use"
- Change PORT in `.env` to another port (e.g., 3000, 8080)
- Update Hostinger Node.js config with new port

### "Cannot connect to MongoDB"
- Check MongoDB Atlas Network Access
- Add your Hostinger server IP to whitelist
- Or use `0.0.0.0/0` to allow all IPs (less secure)

### "502 Bad Gateway"
- Check if backend is running: `pm2 status`
- Check logs: `pm2 logs ftifto-backend`
- Verify port matches in Hostinger config

### "Permission denied"
- Contact Hostinger support for file permissions
- Or use `chmod` commands if you have access

---

## 📞 Next Steps

1. **Determine your hosting type** (VPS or Business)
2. **Follow the appropriate option** (A or B above)
3. **Test your backend** at `https://api.tiftoapp.com`
4. **Update your mobile apps** to use the new API URL
5. **Monitor logs** regularly: `pm2 logs ftifto-backend`

---

## 🎯 Quick Commands Reference

```bash
# Check status
pm2 status

# View logs
pm2 logs ftifto-backend

# Restart
pm2 restart ftifto-backend

# Stop
pm2 stop ftifto-backend

# Test health
curl https://api.tiftoapp.com/health
```

---

**Your backend will be available at:** `https://api.tiftoapp.com` 🚀

