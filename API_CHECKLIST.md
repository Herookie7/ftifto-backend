# API Setup Checklist

Quick reference checklist for setting up all required APIs.

## ✅ Required APIs (Must Have)

- [ ] **MongoDB**
  - [ ] Account created
  - [ ] Cluster created
  - [ ] Database user created
  - [ ] Network access configured (IP whitelist)
  - [ ] Connection string copied
  - [ ] `MONGO_URI` set in environment

- [ ] **JWT Secret**
  - [ ] Strong secret generated (min 32 characters)
  - [ ] `JWT_SECRET` set in environment

## 🔔 Push Notifications

- [ ] **Firebase Cloud Messaging (FCM)**
  - [ ] Firebase project created
  - [ ] Service account key downloaded
  - [ ] Project ID extracted
  - [ ] Client email extracted
  - [ ] Private key extracted
  - [ ] `FCM_PROJECT_ID` set
  - [ ] `FCM_CLIENT_EMAIL` set
  - [ ] `FCM_PRIVATE_KEY` set (or `FCM_PRIVATE_KEY_BASE64`)

## 🗺️ Google Services

- [ ] **Google Maps API**
  - [ ] Google Cloud project created
  - [ ] Maps JavaScript API enabled
  - [ ] Geocoding API enabled
  - [ ] Distance Matrix API enabled
  - [ ] Places API enabled (optional)
  - [ ] Directions API enabled (optional)
  - [ ] API key created
  - [ ] API key restricted (recommended)
  - [ ] API key stored in MongoDB `configurations.googleApiKey`

- [ ] **Google OAuth**
  - [ ] OAuth consent screen configured
  - [ ] OAuth client created (Web)
  - [ ] Client ID copied
  - [ ] Client secret copied
  - [ ] Redirect URI configured
  - [ ] `OAUTH_GOOGLE_CLIENT_ID` set
  - [ ] `OAUTH_GOOGLE_CLIENT_SECRET` set
  - [ ] `OAUTH_REDIRECT_URI` set
  - [ ] Android client ID created (if needed)
  - [ ] iOS client ID created (if needed)
  - [ ] Client IDs stored in MongoDB

- [ ] **Google Analytics** (Optional)
  - [ ] GA4 property created
  - [ ] Data stream configured
  - [ ] Measurement ID copied
  - [ ] API secret generated
  - [ ] `GA_MEASUREMENT_ID` set
  - [ ] `GA_API_SECRET` set

## 💳 Payment Gateways

- [ ] **Razorpay** (For India)
  - [ ] Razorpay account created
  - [ ] KYC completed
  - [ ] Account activated
  - [ ] Test API keys obtained
  - [ ] Live API keys obtained (for production)
  - [ ] Key ID copied
  - [ ] Key Secret copied
  - [ ] Keys stored in MongoDB `configurations`:
    - [ ] `razorpayKeyId`
    - [ ] `razorpayKeySecret`
    - [ ] `razorpaySandbox` (true/false)
  - [ ] Webhook URL configured
  - [ ] Webhook events selected

- [ ] **Stripe** (For International)
  - [ ] Stripe account created
  - [ ] Test API keys obtained
  - [ ] Live API keys obtained (for production)
  - [ ] Secret key copied
  - [ ] Publishable key copied
  - [ ] `STRIPE_SECRET_KEY` set
  - [ ] Webhook endpoint created
  - [ ] Webhook secret copied
  - [ ] `STRIPE_WEBHOOK_SECRET` set
  - [ ] Keys stored in MongoDB (optional)

## 📱 SMS Services

- [ ] **Fast2SMS** (For India)
  - [ ] Fast2SMS account created
  - [ ] Mobile number verified
  - [ ] API key generated
  - [ ] API key copied
  - [ ] Route selected ('q' for OTPs)
  - [ ] Stored in MongoDB `configurations`:
    - [ ] `fast2smsApiKey`
    - [ ] `fast2smsEnabled` (set to true)
    - [ ] `fast2smsRoute` (set to 'q')

## ☁️ Cloud Storage

- [ ] **AWS S3** (Optional but recommended)
  - [ ] AWS account created
  - [ ] S3 bucket created
  - [ ] Bucket name noted
  - [ ] Region selected
  - [ ] IAM user created for S3 access
  - [ ] Access Key ID copied
  - [ ] Secret Access Key copied
  - [ ] `AWS_S3_BUCKET` set
  - [ ] `AWS_S3_REGION` set
  - [ ] `AWS_S3_ACCESS_KEY_ID` set
  - [ ] `AWS_S3_SECRET_ACCESS_KEY` set
  - [ ] `BACKUP_PREFIX` set (optional)

## 🔄 Caching & Real-time

- [ ] **Redis**
  - [ ] Redis Cloud account created (or Upstash, or self-hosted)
  - [ ] Redis database created
  - [ ] Connection URL copied
  - [ ] `REDIS_URL` set in environment

## 🔐 OAuth Providers

- [ ] **GitHub OAuth** (Optional)
  - [ ] GitHub OAuth app created
  - [ ] Client ID copied
  - [ ] Client secret generated and copied
  - [ ] Callback URL configured
  - [ ] `OAUTH_GITHUB_CLIENT_ID` set
  - [ ] `OAUTH_GITHUB_CLIENT_SECRET` set

## 📊 Monitoring & Logging

- [ ] **Sentry** (Optional)
  - [ ] Sentry account created
  - [ ] Project created (Node.js)
  - [ ] DSN copied
  - [ ] `SENTRY_DSN` set
  - [ ] `SENTRY_TRACES_SAMPLE_RATE` set

- [ ] **Logtail** (Optional)
  - [ ] Logtail account created
  - [ ] Source created
  - [ ] Source token copied
  - [ ] `LOGTAIL_SOURCE_TOKEN` set

- [ ] **Grafana** (Optional)
  - [ ] Grafana Cloud account created (or self-hosted)
  - [ ] API key created
  - [ ] Push URL copied
  - [ ] `GRAFANA_PUSH_URL` set
  - [ ] `GRAFANA_API_KEY` set

- [ ] **Slack Webhook** (Optional)
  - [ ] Slack app created
  - [ ] Incoming webhook configured
  - [ ] Webhook URL copied
  - [ ] `SLACK_WEBHOOK_URL` set

- [ ] **Discord Webhook** (Optional)
  - [ ] Discord webhook created
  - [ ] Webhook URL copied
  - [ ] `DISCORD_WEBHOOK_URL` set

## 🔒 Security & Secrets

- [ ] **AWS Secrets Manager** (Optional, for production)
  - [ ] Secrets Manager enabled
  - [ ] Secret created with all credentials
  - [ ] Secret ARN copied
  - [ ] `USE_SECRETS_MANAGER` set to true
  - [ ] `SECRETS_PROVIDER` set to 'aws'
  - [ ] `AWS_SECRETS_REGION` set
  - [ ] `AWS_SECRETS_IDS` set

## 📝 Environment File

- [ ] `.env` file created
- [ ] All environment variables added
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` created (without sensitive data)

## 🗄️ MongoDB Configuration

Update these in MongoDB `configurations` collection (via GraphQL or direct DB access):

- [ ] `googleApiKey` - Google Maps API key
- [ ] `googleMapLibraries` - Maps libraries (e.g., "places,geometry")
- [ ] `googleColor` - Map color theme
- [ ] `webClientID` - Google OAuth web client ID
- [ ] `androidClientID` - Google OAuth Android client ID
- [ ] `iOSClientID` - Google OAuth iOS client ID
- [ ] `expoClientID` - Google OAuth Expo client ID
- [ ] `razorpayKeyId` - Razorpay Key ID
- [ ] `razorpayKeySecret` - Razorpay Key Secret
- [ ] `razorpaySandbox` - Razorpay sandbox mode (true/false)
- [ ] `fast2smsApiKey` - Fast2SMS API key
- [ ] `fast2smsEnabled` - Enable Fast2SMS (true/false)
- [ ] `fast2smsRoute` - Fast2SMS route ('q', 'd', 't')
- [ ] `publishableKey` - Stripe publishable key (optional)
- [ ] `secretKey` - Stripe secret key (optional, can use env var)
- [ ] `firebaseKey` - Firebase config JSON for mobile apps
- [ ] `authDomain` - Firebase auth domain
- [ ] `projectId` - Firebase project ID
- [ ] `storageBucket` - Firebase storage bucket
- [ ] `msgSenderId` - Firebase messaging sender ID
- [ ] `appId` - Firebase app ID
- [ ] `measurementId` - Google Analytics measurement ID
- [ ] `vapidKey` - VAPID key for web push

## ✅ Verification

- [ ] MongoDB connection tested
- [ ] Firebase push notification tested
- [ ] Google Maps API tested
- [ ] Google OAuth login tested
- [ ] Razorpay payment flow tested (test mode)
- [ ] Stripe payment flow tested (test mode)
- [ ] Fast2SMS OTP sending tested
- [ ] Redis connection tested
- [ ] S3 upload tested (if using)
- [ ] All webhooks configured and tested

## 🚀 Production Checklist

- [ ] All test keys replaced with production keys
- [ ] API keys restricted (IP, domain restrictions)
- [ ] Webhook URLs updated to production domain
- [ ] SSL certificates configured
- [ ] Environment variables set in production environment
- [ ] MongoDB production cluster configured
- [ ] Redis production instance configured
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Security audit completed

---

## Quick Commands

### Test MongoDB Connection
```bash
node -e "require('./src/config/database').connectDatabase().then(() => console.log('Connected!')).catch(console.error)"
```

### Test Fast2SMS
```bash
node test-fast2sms.js
```

### Update Google API Key in MongoDB
```bash
node scripts/updateGoogleApiKey.js YOUR_API_KEY_HERE
```

### Check Configuration
```bash
node scripts/preReleaseCheck.js
```

---

**Note**: Mark items as complete (✅) as you finish setting them up!

