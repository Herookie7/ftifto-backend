#!/bin/bash

# ============================================
# Test Backend Deployment
# ============================================

DOMAIN="api.tiftoapp.com"
PORT=8001

echo "🧪 Testing Backend Deployment"
echo "=============================="
echo ""

# Test 1: Local connection
echo "1️⃣  Testing local connection (localhost:${PORT})..."
if curl -s -f http://localhost:${PORT}/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running locally"
    curl -s http://localhost:${PORT}/health | head -c 200
    echo ""
else
    echo "   ❌ Backend is not responding locally"
    echo "   Check: pm2 logs ftifto-backend"
fi
echo ""

# Test 2: Public domain
echo "2️⃣  Testing public domain (https://${DOMAIN})..."
if curl -s -f -k https://${DOMAIN}/health > /dev/null 2>&1; then
    echo "   ✅ Backend is accessible via domain"
    curl -s -k https://${DOMAIN}/health | head -c 200
    echo ""
else
    echo "   ⚠️  Backend not accessible via domain"
    echo "   Possible issues:"
    echo "   - DNS not configured yet"
    echo "   - SSL not set up"
    echo "   - Nginx/Apache not configured"
fi
echo ""

# Test 3: GraphQL endpoint
echo "3️⃣  Testing GraphQL endpoint..."
if curl -s -f http://localhost:${PORT}/graphql -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' > /dev/null 2>&1; then
    echo "   ✅ GraphQL is working"
    curl -s http://localhost:${PORT}/graphql -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}' | head -c 200
    echo ""
else
    echo "   ⚠️  GraphQL endpoint not responding"
fi
echo ""

# Test 4: PM2 status
echo "4️⃣  Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    pm2 status | grep ftifto-backend
else
    echo "   ⚠️  PM2 not found"
fi
echo ""

echo "✅ Testing complete!"

