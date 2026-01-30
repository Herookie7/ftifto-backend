#!/bin/bash

# ============================================
# Hostinger Backend Setup Script
# ============================================
# This script helps set up your backend on Hostinger VPS
# Run with: bash setup-hostinger.sh

set -e  # Exit on error

echo "🚀 Tifto Backend - Hostinger Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root. Run as your user account.${NC}"
   exit 1
fi

# Step 1: Check Node.js
echo "📦 Step 1: Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
    
    # Check if version is 20+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo -e "${YELLOW}⚠️  Node.js version is less than 20. Please install Node.js 20+.${NC}"
        echo "   Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "   Then: sudo apt-get install -y nodejs"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+ first.${NC}"
    echo "   Run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   Then: sudo apt-get install -y nodejs"
    exit 1
fi

# Step 2: Check npm
echo ""
echo "📦 Step 2: Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Step 3: Check PM2
echo ""
echo "📦 Step 3: Checking PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 installed: $PM2_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found. Installing...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
fi

# Step 4: Check if .env exists
echo ""
echo "📝 Step 4: Checking environment file..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check for required variables
    if grep -q "MONGO_URI=" .env || grep -q "MONGODB_URI=" .env; then
        echo -e "${GREEN}✅ MongoDB URI found in .env${NC}"
    else
        echo -e "${RED}❌ MONGO_URI or MONGODB_URI not found in .env${NC}"
        echo "   Please add your MongoDB connection string to .env"
        exit 1
    fi
    
    if grep -q "JWT_SECRET=" .env; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
        if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-to-random-string" ]; then
            echo -e "${YELLOW}⚠️  JWT_SECRET is not set or using default value${NC}"
            echo "   Please set a strong JWT_SECRET in .env"
            echo "   Generate with: openssl rand -base64 32"
        else
            echo -e "${GREEN}✅ JWT_SECRET found in .env${NC}"
        fi
    else
        echo -e "${RED}❌ JWT_SECRET not found in .env${NC}"
        echo "   Please add JWT_SECRET to .env"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    if [ -f .env.example ]; then
        echo "   Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env and add your MongoDB URI and JWT_SECRET${NC}"
        echo "   Run: nano .env"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Step 5: Install dependencies
echo ""
echo "📦 Step 5: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install --production
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ node_modules exists (skipping install)${NC}"
    echo "   To reinstall, run: npm install --production"
fi

# Step 6: Create logs directory
echo ""
echo "📁 Step 6: Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Step 7: Test MongoDB connection
echo ""
echo "🗄️  Step 7: Testing MongoDB connection..."
if node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGO_URI not found');
  process.exit(1);
}
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('Connected'); process.exit(0); })
  .catch(err => { console.error('Error:', err.message); process.exit(1); });
" 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
else
    echo -e "${RED}❌ MongoDB connection failed${NC}"
    echo "   Please check:"
    echo "   1. MongoDB URI in .env is correct"
    echo "   2. Your server IP is whitelisted in MongoDB Atlas"
    echo "   3. MongoDB Atlas network access allows your IP"
    exit 1
fi

# Step 8: Check PM2 ecosystem file
echo ""
echo "⚙️  Step 8: Checking PM2 configuration..."
if [ -f "ecosystem.config.js" ]; then
    echo -e "${GREEN}✅ ecosystem.config.js exists${NC}"
else
    echo -e "${YELLOW}⚠️  ecosystem.config.js not found. Creating...${NC}"
    cat > ecosystem.config.js << 'EOF'
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
EOF
    echo -e "${GREEN}✅ ecosystem.config.js created${NC}"
fi

# Step 9: Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend with PM2:"
echo "   ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo ""
echo "2. Save PM2 configuration:"
echo "   ${YELLOW}pm2 save${NC}"
echo ""
echo "3. Enable PM2 on system boot:"
echo "   ${YELLOW}pm2 startup${NC}"
echo "   (Then run the command it shows you)"
echo ""
echo "4. Check status:"
echo "   ${YELLOW}pm2 status${NC}"
echo "   ${YELLOW}pm2 logs ftifto-backend${NC}"
echo ""
echo "5. Configure Nginx (see HOSTINGER_DEPLOYMENT_GUIDE.md)"
echo ""
echo "6. Setup SSL certificate:"
echo "   ${YELLOW}sudo certbot --nginx -d api.yourdomain.com${NC}"
echo ""
echo "=========================================="

