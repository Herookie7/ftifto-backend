# Complete API Setup Guide for Ftifto Backend

This document provides detailed instructions on how to obtain and configure all APIs and services required for the Ftifto food delivery backend application.

---

## Table of Contents

1. [MongoDB](#1-mongodb)
2. [Firebase Cloud Messaging (FCM)](#2-firebase-cloud-messaging-fcm)
3. [Google Services](#3-google-services)
   - [Google Maps API](#31-google-maps-api)
   - [Google OAuth](#32-google-oauth)
   - [Google Analytics](#33-google-analytics)
4. [Payment Gateways](#4-payment-gateways)
   - [Razorpay](#41-razorpay)
   - [Stripe](#42-stripe)
5. [SMS Services](#5-sms-services)
   - [Fast2SMS](#51-fast2sms)
6. [AWS Services](#6-aws-services)
   - [AWS S3](#61-aws-s3)
   - [AWS Secrets Manager](#62-aws-secrets-manager-optional)
7. [Redis](#7-redis)
8. [OAuth Providers](#8-oauth-providers)
   - [GitHub OAuth](#81-github-oauth)
9. [Monitoring & Logging](#9-monitoring--logging)
   - [Sentry](#91-sentry)
   - [Logtail](#92-logtail)
   - [Grafana](#93-grafana)
   - [Slack/Discord Webhooks](#94-slackdiscord-webhooks)

---

## 1. MongoDB

### Purpose
Primary database for storing all application data (users, orders, restaurants, etc.)

### How to Get
1. **Sign up for MongoDB Atlas** (Free tier available)
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Cluster**
   - Choose a cloud provider (AWS, Google Cloud, or Azure)
   - Select a region closest to your users
   - Choose "M0 Free" tier for development
   - Click "Create Cluster"

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set user privileges to "Atlas Admin" (or custom role with read/write access)
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `ftifto`)

### Extract Connection String
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### Environment Variable
```bash
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ftifto?retryWrites=true&w=majority
```

### Storage Location
- **Environment Variable**: `MONGO_URI` or `MONGODB_URI`

---

## 2. Firebase Cloud Messaging (FCM)

### Purpose
Push notifications to mobile apps (Android/iOS)

### How to Get
1. **Create Firebase Project**
   - Go to: https://console.firebase.google.com/
   - Click "Add project" or "Create a project"
   - Enter project name (e.g., "Ftifto")
   - Disable Google Analytics (optional) or enable it
   - Click "Create project"

2. **Generate Service Account Key**
   - Go to Project Settings (gear icon) → "Project settings"
   - Click on "Service accounts" tab
   - Click "Generate new private key"
   - A JSON file will be downloaded (keep this secure!)

3. **Extract Required Information from JSON**
   Open the downloaded JSON file and extract:
   ```json
   {
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     ...
   }
   ```

### Extract Keys
- **Project ID**: `project_id` from JSON
- **Client Email**: `client_email` from JSON
- **Private Key**: `private_key` from JSON (keep the `\n` characters or replace with actual newlines)

### Environment Variables
```bash
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**OR** (Base64 encoded version):
```bash
FCM_PRIVATE_KEY_BASE64=<base64-encoded-private-key>
```

### Storage Location
- **Environment Variables**: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` or `FCM_PRIVATE_KEY_BASE64`

### Additional Firebase Config (for Mobile Apps)
These are stored in MongoDB `configurations` collection:
- `firebaseKey` - Firebase config JSON (for mobile apps)
- `authDomain` - Firebase auth domain
- `projectId` - Same as FCM_PROJECT_ID
- `storageBucket` - Firebase Storage bucket
- `msgSenderId` - Firebase messaging sender ID
- `appId` - Firebase app ID
- `measurementId` - Google Analytics measurement ID
- `vapidKey` - VAPID key for web push

**To get these:**
1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Add an app (iOS/Android/Web) if not already added
4. Copy the config values from the SDK setup instructions

---

## 3. Google Services

### 3.1 Google Maps API

### Purpose
Location services, geocoding, distance calculation, map display

### How to Get
1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "Ftifto Maps")
   - Click "Create"

2. **Enable Google Maps APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable these APIs:
     - **Maps JavaScript API** (for web maps)
     - **Geocoding API** (for address conversion)
     - **Distance Matrix API** (for delivery distance calculation)
     - **Places API** (for location search)
     - **Directions API** (for route planning)

3. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - Click "Restrict Key" (recommended for production)
     - Under "API restrictions", select "Restrict key"
     - Select only the Maps APIs you enabled
     - Under "Application restrictions", set restrictions (HTTP referrers, IP addresses, etc.)

### Extract API Key
The API key looks like: `AIzaSyDfxps4qzL3Hp7Y1_mF6uGuj-Z2ScUHNmk`

### Storage Location
- **MongoDB**: `configurations` collection → `googleApiKey` field
- Can be updated via GraphQL mutation: `saveGoogleApiKeyConfiguration`

### Additional Google Maps Config (MongoDB)
- `googleMapLibraries` - Comma-separated list of libraries (e.g., "places,geometry")
- `googleColor` - Custom map color theme

---

### 3.2 Google OAuth

### Purpose
Social login with Google accounts

### How to Get
1. **Create OAuth 2.0 Credentials**
   - Go to Google Cloud Console → "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (or Internal for G Suite)
     - App name: "Ftifto"
     - User support email: Your email
     - Developer contact: Your email
     - Add scopes: `openid`, `email`, `profile`
     - Add test users (for testing)
   - Back to credentials:
     - Application type: "Web application"
     - Name: "Ftifto Backend"
     - Authorized redirect URIs: Add your callback URL
       - Example: `https://yourdomain.com/api/v1/auth/google/callback`
     - Click "Create"
   - Copy **Client ID** and **Client Secret**

### Extract Keys
- **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

### Environment Variables
```bash
OAUTH_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
OAUTH_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback
```

### Storage Location
- **Environment Variables**: `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`

### Additional Google Client IDs (for Mobile Apps - MongoDB)
These are stored in MongoDB `configurations` collection:
- `webClientID` - Web OAuth client ID
- `androidClientID` - Android OAuth client ID
- `iOSClientID` - iOS OAuth client ID
- `expoClientID` - Expo/React Native client ID

**To get these:**
- Create separate OAuth clients for each platform in Google Cloud Console
- Use the same project but different application types (Android, iOS, Web)

---

### 3.3 Google Analytics

### Purpose
Track user events and analytics

### How to Get
1. **Set up Google Analytics 4 (GA4)**
   - Go to: https://analytics.google.com/
   - Create an account and property
   - Set up a data stream (Web, iOS, or Android)

2. **Get Measurement ID and API Secret**
   - Go to Admin → Data Streams → Select your stream
   - Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
   - Go to Admin → Data Streams → Measurement Protocol API secrets
   - Click "Create" to generate an API secret
   - Copy the **API Secret**

### Extract Keys
- **Measurement ID**: `G-XXXXXXXXXX`
- **API Secret**: `xxxxxxxxxxxxxxxxxxxxx`

### Environment Variables
```bash
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Storage Location
- **Environment Variables**: `GA_MEASUREMENT_ID`, `GA_API_SECRET`

---

## 4. Payment Gateways

### 4.1 Razorpay

### Purpose
Payment processing for Indian market (INR)

### How to Get
1. **Sign up for Razorpay**
   - Go to: https://razorpay.com/
   - Click "Sign Up"
   - Create an account (business or individual)

2. **Activate Account**
   - Complete KYC verification
   - Add business details
   - Wait for account activation

3. **Get API Keys**
   - Go to Dashboard → Settings → API Keys
   - You'll see:
     - **Key ID** (starts with `rzp_`)
     - **Key Secret** (click "Reveal" to see it)
   - For testing, use "Test Mode" keys
   - For production, use "Live Mode" keys

### Extract Keys
- **Key ID**: `rzp_test_xxxxxxxxxxxxx` (test) or `rzp_live_xxxxxxxxxxxxx` (live)
- **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxx` (long string)

### Storage Location
- **MongoDB**: `configurations` collection
  - `razorpayKeyId` - Razorpay Key ID
  - `razorpayKeySecret` - Razorpay Key Secret
  - `razorpaySandbox` - Boolean (true for test mode, false for live)
- Can be updated via GraphQL mutation: `saveRazorpayConfiguration`

### Webhook Setup
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/payments/razorpay/webhook`
3. Select events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy the webhook secret (if provided)

---

### 4.2 Stripe

### Purpose
International payment processing (USD, EUR, etc.)

### How to Get
1. **Sign up for Stripe**
   - Go to: https://stripe.com/
   - Click "Sign up"
   - Create an account

2. **Get API Keys**
   - Go to Dashboard → Developers → API keys
   - You'll see:
     - **Publishable key** (starts with `pk_`)
     - **Secret key** (starts with `sk_`, click "Reveal")
   - Toggle "Test mode" for test keys
   - Toggle "Live mode" for production keys

### Extract Keys
- **Secret Key**: `sk_test_xxxxxxxxxxxxx` (test) or `sk_live_xxxxxxxxxxxxx` (live)
- **Publishable Key**: `pk_test_xxxxxxxxxxxxx` (test) or `pk_live_xxxxxxxxxxxxx` (live)

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Storage Location
- **Environment Variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **MongoDB** (optional): `configurations` collection
  - `publishableKey` - Stripe publishable key
  - `secretKey` - Stripe secret key (can be stored here too)
- Can be updated via GraphQL mutation: `saveStripeConfiguration`

### Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/api/v1/payments/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

---

## 5. SMS Services

### 5.1 Fast2SMS

### Purpose
Send OTP and SMS notifications (India only)

### How to Get
1. **Sign up for Fast2SMS**
   - Go to: https://www.fast2sms.com/
   - Click "Sign Up"
   - Create an account
   - Verify your mobile number

2. **Get API Key**
   - Go to Dashboard → API → "Your API Key"
   - Copy the API key (long alphanumeric string)
   - Note: Free tier has limited SMS per day

3. **Configure Route**
   - Routes available:
     - `q` - Quick (for OTPs, fastest)
     - `d` - Promotional (for marketing)
     - `t` - Transactional (for transactions)

### Extract API Key
The API key looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Storage Location
- **MongoDB**: `configurations` collection
  - `fast2smsApiKey` - Fast2SMS API key
  - `fast2smsEnabled` - Boolean (enable/disable SMS)
  - `fast2smsRoute` - Route type ('q', 'd', or 't')

### Important Notes
- Fast2SMS only works with Indian phone numbers (10 digits)
- API key must be trimmed (no spaces)
- Route 'q' (quick) is recommended for OTPs

---

## 6. AWS Services

### 6.1 AWS S3

### Purpose
File storage for backups, images, documents

### How to Get
1. **Create AWS Account**
   - Go to: https://aws.amazon.com/
   - Sign up for an account
   - Complete verification

2. **Create S3 Bucket**
   - Go to AWS Console → S3
   - Click "Create bucket"
   - Enter bucket name (globally unique, e.g., `ftifto-backups-2024`)
   - Select region (e.g., `us-east-1`)
   - Configure settings:
     - Block Public Access: Enable (for security)
     - Versioning: Enable (optional)
   - Click "Create bucket"

3. **Create IAM User for S3 Access**
   - Go to IAM → Users → "Add users"
   - Username: `ftifto-s3-user`
   - Select "Programmatic access"
   - Click "Next: Permissions"
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Click "Next" → "Create user"
   - **IMPORTANT**: Copy the **Access Key ID** and **Secret Access Key** immediately (you won't see the secret again!)

### Extract Keys
- **Access Key ID**: `AKIAIOSFODNN7EXAMPLE`
- **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Bucket Name**: `ftifto-backups-2024`
- **Region**: `us-east-1`

### Environment Variables
```bash
AWS_S3_BUCKET=ftifto-backups-2024
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_ENDPOINT=  # Optional, for custom S3-compatible storage
BACKUP_PREFIX=backups/
```

### Storage Location
- **Environment Variables**: `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_ENDPOINT`

---

### 6.2 AWS Secrets Manager (Optional)

### Purpose
Secure storage of sensitive credentials (alternative to environment variables)

### How to Get
1. **Enable Secrets Manager**
   - Go to AWS Console → Secrets Manager
   - Click "Store a new secret"
   - Select "Other type of secret"
   - Enter key-value pairs for your secrets
   - Click "Next"
   - Secret name: `ftifto-backend-secrets`
   - Click "Next" → "Store"

2. **Get Secret ARN**
   - After creating, copy the ARN (Amazon Resource Name)
   - Format: `arn:aws:secretsmanager:region:account-id:secret:ftifto-backend-secrets-xxxxx`

3. **Configure IAM Permissions**
   - Add `secretsmanager:GetSecretValue` permission to your IAM user/role

### Extract Information
- **Secret ARN**: `arn:aws:secretsmanager:us-east-1:123456789012:secret:ftifto-backend-secrets-xxxxx`
- **Region**: `us-east-1`

### Environment Variables
```bash
USE_SECRETS_MANAGER=true
SECRETS_PROVIDER=aws
AWS_SECRETS_REGION=us-east-1
AWS_SECRETS_IDS=ftifto-backend-secrets
```

### Storage Location
- **Environment Variables**: `USE_SECRETS_MANAGER`, `SECRETS_PROVIDER`, `AWS_SECRETS_REGION`, `AWS_SECRETS_IDS`

---

## 7. Redis

### Purpose
Caching, session storage, real-time features (Socket.IO), maintenance mode

### How to Get

#### Option 1: Redis Cloud (Recommended for Production)
1. **Sign up for Redis Cloud**
   - Go to: https://redis.com/try-free/
   - Create a free account
   - Create a database
   - Copy the connection URL

#### Option 2: Upstash Redis (Serverless)
1. **Sign up for Upstash**
   - Go to: https://upstash.com/
   - Create account
   - Create Redis database
   - Copy the REST URL or Redis URL

#### Option 3: Self-hosted Redis
1. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   ```
2. **Start Redis**
   ```bash
   redis-server
   ```

### Extract Connection URL
- **Redis Cloud**: `redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`
- **Upstash**: `redis://default:password@usw1-xxxxx.upstash.io:6379`
- **Local**: `redis://localhost:6379`

### Environment Variable
```bash
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

### Storage Location
- **Environment Variable**: `REDIS_URL`

---

## 8. OAuth Providers

### 8.1 GitHub OAuth

### Purpose
Social login with GitHub accounts

### How to Get
1. **Create GitHub OAuth App**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: "Ftifto"
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/v1/auth/github/callback`
   - Click "Register application"
   - Copy **Client ID** and generate **Client Secret**

### Extract Keys
- **Client ID**: `Iv1.xxxxxxxxxxxxxxxx`
- **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Environment Variables
```bash
OAUTH_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
OAUTH_GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OAUTH_REDIRECT_URI=https://yourdomain.com/api/v1/auth/github/callback
```

### Storage Location
- **Environment Variables**: `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`

---

## 9. Monitoring & Logging

### 9.1 Sentry

### Purpose
Error tracking and performance monitoring

### How to Get
1. **Sign up for Sentry**
   - Go to: https://sentry.io/signup/
   - Create account
   - Create a project (Node.js)
   - Copy the **DSN** (Data Source Name)

### Extract DSN
- **DSN**: `https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567`

### Environment Variable
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
```

### Storage Location
- **Environment Variable**: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`

---

### 9.2 Logtail

### Purpose
Centralized log management

### How to Get
1. **Sign up for Logtail**
   - Go to: https://logtail.com/
   - Create account
   - Create a source
   - Copy the **Source Token**

### Extract Token
- **Source Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Environment Variable
```bash
LOGTAIL_SOURCE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Storage Location
- **Environment Variable**: `LOGTAIL_SOURCE_TOKEN`

---

### 9.3 Grafana

### Purpose
Metrics visualization and monitoring

### How to Get
1. **Set up Grafana Cloud** (or self-hosted)
   - Go to: https://grafana.com/auth/sign-up/
   - Create account
   - Create a stack
   - Go to "My Account" → "API Keys"
   - Create API key with "MetricsPublisher" role
   - Copy the **API Key**
   - Get **Push URL** from "My Account" → "Details"

### Extract Information
- **Push URL**: `https://prometheus-prod-01-prod-us-central-0.grafana.net/api/prom/push`
- **API Key**: `glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Environment Variables
```bash
GRAFANA_PUSH_URL=https://prometheus-prod-01-prod-us-central-0.grafana.net/api/prom/push
GRAFANA_API_KEY=glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Storage Location
- **Environment Variables**: `GRAFANA_PUSH_URL`, `GRAFANA_API_KEY`

---

### 9.4 Slack/Discord Webhooks

### Purpose
Send alerts and notifications to team channels

### How to Get

#### Slack Webhook
1. **Create Slack App**
   - Go to: https://api.slack.com/apps
   - Create "Incoming Webhooks"
   - Select channel
   - Copy **Webhook URL**

#### Discord Webhook
1. **Create Discord Webhook**
   - Go to Discord channel → Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Copy **Webhook URL**

### Extract URLs
- **Slack**: `https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN`
- **Discord**: `https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN`

### Environment Variables
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Storage Location
- **Environment Variables**: `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`

---

## Summary: Environment Variables Checklist

### Required (Application won't start without these)
```bash
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

### Highly Recommended
```bash
FCM_PROJECT_ID=your-firebase-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
REDIS_URL=redis://...
```

### Optional but Useful
```bash
# Google OAuth
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_REDIRECT_URI=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_S3_BUCKET=...
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...

# Monitoring
SENTRY_DSN=...
LOGTAIL_SOURCE_TOKEN=...
GRAFANA_PUSH_URL=...
GRAFANA_API_KEY=...
SLACK_WEBHOOK_URL=...
DISCORD_WEBHOOK_URL=...

# Analytics
GA_MEASUREMENT_ID=G-...
GA_API_SECRET=...
```

### MongoDB Configuration (Stored in Database)
These are configured via GraphQL mutations or directly in MongoDB:
- `googleApiKey` - Google Maps API key
- `razorpayKeyId` - Razorpay Key ID
- `razorpayKeySecret` - Razorpay Key Secret
- `razorpaySandbox` - Razorpay sandbox mode
- `fast2smsApiKey` - Fast2SMS API key
- `fast2smsEnabled` - Enable/disable Fast2SMS
- `fast2smsRoute` - Fast2SMS route ('q', 'd', 't')
- `stripe` config (publishableKey, secretKey)
- `firebaseKey` - Firebase config JSON for mobile apps
- `webClientID`, `androidClientID`, `iOSClientID` - Google OAuth client IDs

---

## Quick Setup Script

Create a `.env` file in the project root:

```bash
# Copy this template and fill in your values
cp .env.example .env
```

Then edit `.env` with all your API keys and credentials.

---

## Security Best Practices

1. **Never commit `.env` files to Git** - Add `.env` to `.gitignore`
2. **Use environment variables** for sensitive data
3. **Rotate API keys regularly** - Especially if exposed
4. **Use different keys for development and production**
5. **Restrict API keys** - Set IP restrictions, domain restrictions where possible
6. **Use secrets management** - Consider AWS Secrets Manager or HashiCorp Vault for production
7. **Monitor API usage** - Set up alerts for unusual activity
8. **Use least privilege** - Grant minimum required permissions

---

## Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Check username/password encoding

### Firebase Not Working
- Verify private key format (must include `\n` or actual newlines)
- Check service account permissions
- Ensure project ID matches

### Payment Gateway Issues
- Verify you're using correct keys (test vs live)
- Check webhook URLs are accessible
- Verify signature verification

### SMS Not Sending
- Check Fast2SMS account balance
- Verify API key is trimmed (no spaces)
- Check route is set to 'q' for OTPs
- Verify phone number format (10 digits for India)

---

## Support

For issues with specific services:
- **MongoDB**: https://www.mongodb.com/docs/
- **Firebase**: https://firebase.google.com/docs
- **Google Cloud**: https://cloud.google.com/docs
- **Razorpay**: https://razorpay.com/docs/
- **Stripe**: https://stripe.com/docs
- **Fast2SMS**: https://docs.fast2sms.com/

---

**Last Updated**: 2024
**Version**: 1.0

