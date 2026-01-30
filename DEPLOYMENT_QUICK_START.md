# 🚀 Quick Start - Hostinger Deployment

## Prerequisites Checklist

- [ ] Hostinger VPS or Business hosting with Node.js support
- [ ] SSH access to your server
- [ ] Domain name configured on Hostinger
- [ ] MongoDB Atlas account (you have: `mongodb+srv://sunarthy7_db_user:...@tifto-test.unnzzmz.mongodb.net/test`)

---

## ⚡ Quick Setup (5 Steps)

### 1. Connect to Server

```bash
ssh your-username@your-server-ip
```

### 2. Install Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 3. Deploy Backend

```bash
# Create directory
sudo mkdir -p /var/www/your-domain.com/api
sudo chown -R $USER:$USER /var/www/your-domain.com/api
cd /var/www/your-domain.com/api

# Clone repository
git clone https://github.com/Herookie7/ftifto-backend.git .

# Run setup script
bash setup-hostinger.sh

# Create .env file
nano .env
```

**Add to .env:**
```env
MONGO_URI=mongodb+srv://sunarthy7_db_user:kJ2fIdihzJfT3NGP@tifto-test.unnzzmz.mongodb.net/test
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=8001
API_BASE_URL=https://api.your-domain.com/api/v1
CORS_ORIGINS=https://your-domain.com
```

### 4. Start Backend

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions it shows
```

### 5. Configure Nginx & SSL

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config (see full guide)
sudo nano /etc/nginx/sites-available/your-domain-api

# Enable site
sudo ln -s /etc/nginx/sites-available/your-domain-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d api.your-domain.com
```

---

## 🔑 Important Notes

### API Keys Location

**Most API keys are stored in MongoDB, NOT in .env file:**
- ✅ Fast2SMS API key → MongoDB `configurations` collection
- ✅ Razorpay keys → MongoDB `configurations` collection  
- ✅ Stripe keys → MongoDB `configurations` collection
- ✅ Google API keys → MongoDB `configurations` collection

**Only these are in .env:**
- ✅ `MONGO_URI` (required)
- ✅ `JWT_SECRET` (required)
- ✅ Other optional env vars (FCM, Sentry, etc.)

### MongoDB Atlas Setup

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow all) OR your Hostinger server IP
3. Verify connection works

---

## 📋 Useful Commands

```bash
# PM2
pm2 status
pm2 logs ftifto-backend
pm2 restart ftifto-backend

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# View logs
pm2 logs ftifto-backend --lines 50
sudo tail -f /var/log/nginx/api-error.log
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `pm2 logs ftifto-backend` |
| 502 Bad Gateway | Verify backend is running: `pm2 status` |
| MongoDB connection failed | Check Atlas IP whitelist |
| Port already in use | Change PORT in .env or kill process using port |

---

## 📚 Full Documentation

See `HOSTINGER_DEPLOYMENT_GUIDE.md` for complete step-by-step guide.

---

## ✅ Verification

After deployment, test:

```bash
# Health check
curl https://api.your-domain.com/health

# GraphQL
curl -X POST https://api.your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

**Your backend URL:** `https://api.your-domain.com`

