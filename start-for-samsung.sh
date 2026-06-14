#!/bin/bash

echo ""
echo "========================================"
echo "  Glosetrenings-app - Start for Samsung"
echo "========================================"
echo ""

# Finn Windows IP
WINDOWS_IP=$(powershell.exe -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {\$_.InterfaceAlias -like '*Wi-Fi*' -or \$_.InterfaceAlias -like '*Ethernet*'} | Where-Object {\$_.IPAddress -notlike '169.254.*'} | Select-Object -First 1 -ExpandProperty IPAddress" 2>/dev/null | tr -d '\r\n')

if [ -z "$WINDOWS_IP" ]; then
    WINDOWS_IP="172.25.16.1"
    echo "⚠️  Kunne ikke finne Windows IP automatisk"
    echo "   Bruker default: $WINDOWS_IP"
else
    echo "✅ Windows IP: $WINDOWS_IP"
fi

echo ""
echo "📦 Bygger PWA..."
npm run build:pwa

echo ""
echo "🚀 Starter serverne..."
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:4173"
echo ""
echo "========================================"
echo "  📱 Samsung-pad URL:"
echo "  http://$WINDOWS_IP:4173"
echo "========================================"
echo ""
echo "Trykk Ctrl+C for å stoppe"
echo ""

# Start backend i bakgrunnen
node server.js &
BACKEND_PID=$!

# Vent litt
sleep 3

# Start frontend med host binding til 0.0.0.0 (tilgjengelig utenfra)
npx vite preview --host 0.0.0.0 --port 4173

# Cleanup
kill $BACKEND_PID 2>/dev/null
