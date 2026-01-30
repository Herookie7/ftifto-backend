#!/bin/bash

# ============================================
# Get Server Information for DNS Setup
# ============================================
# This script helps you find your server IP and other info

echo "🔍 Gathering Server Information..."
echo ""

# Get public IP
echo "📡 Public IP Address:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
if [ ! -z "$PUBLIC_IP" ]; then
    echo "   ✅ $PUBLIC_IP"
    echo ""
    echo "📋 Use this IP for DNS A record:"
    echo "   Type: A"
    echo "   Name: api"
    echo "   Points to: $PUBLIC_IP"
    echo "   TTL: 14400"
else
    echo "   ❌ Could not detect"
fi
echo ""

# Get hostname
echo "🖥️  Server Hostname:"
HOSTNAME=$(hostname)
echo "   $HOSTNAME"
echo ""

# Get local IPs
echo "🌐 Local IP Addresses:"
if command -v ip &> /dev/null; then
    ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}'
elif command -v ifconfig &> /dev/null; then
    ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}'
fi
echo ""

# Check if backend is running
echo "🚀 Backend Status:"
if command -v pm2 &> /dev/null; then
    pm2 list | grep ftifto-backend || echo "   ⚠️  Backend not running with PM2"
else
    echo "   ⚠️  PM2 not installed"
fi
echo ""

# Check port 8001
echo "🔌 Port 8001 Status:"
if command -v netstat &> /dev/null; then
    netstat -tuln | grep ":8001" && echo "   ✅ Port 8001 is in use" || echo "   ⚠️  Port 8001 is not in use"
elif command -v ss &> /dev/null; then
    ss -tuln | grep ":8001" && echo "   ✅ Port 8001 is in use" || echo "   ⚠️  Port 8001 is not in use"
else
    echo "   ⚠️  Cannot check port status"
fi
echo ""

echo "✅ Information gathered!"

