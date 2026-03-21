#!/bin/bash
# Pressure Game - Full Stack Development Server
# Starts Web + Mobile + Backend services

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Setup .env.local for development
cat > "$PROJECT_DIR/apps/web/.env.local" << 'ENVEOF'
VITE_API_URL=http://localhost:8000/api.php
VITE_PERSISTENCE_BACKEND=syncing
ENVEOF

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Pressure Game - Full Stack Development Server${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "vite|expo|php -S" 2>/dev/null || true
sleep 1

# Start PHP Backend Server
echo -e "${YELLOW}Starting Backend (PHP)...${NC}"
cd "$PROJECT_DIR/apps/server"
php -S localhost:8000 router.php > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend${NC} running on ${BLUE}localhost:8000${NC} (PID: $BACKEND_PID)"

# Start Web Server
echo -e "${YELLOW}Starting Web (Vite)...${NC}"
cd "$PROJECT_DIR/apps/web"
npm run dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo -e "${GREEN}✅ Web${NC} running on ${BLUE}localhost:3000${NC} (PID: $WEB_PID)"

# Start Mobile Server
echo -e "${YELLOW}Starting Mobile (Expo)...${NC}"
cd "$PROJECT_DIR/apps/mobile"
npx expo start --localhost > /tmp/mobile.log 2>&1 &
MOBILE_PID=$!
echo -e "${GREEN}✅ Mobile${NC} running via Expo (PID: $MOBILE_PID)"

sleep 3

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 FULL STACK READY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🌐 WEB:${NC}      ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}📱 MOBILE:${NC}   Press 'i' for iOS | Scan QR for Expo Go"
echo -e "${GREEN}🔌 BACKEND:${NC}  ${BLUE}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Process IDs:${NC}"
echo "  Backend: $BACKEND_PID"
echo "  Web:     $WEB_PID"
echo "  Mobile:  $MOBILE_PID"
echo ""
echo -e "${YELLOW}View Logs:${NC}"
echo "  Backend: tail -f /tmp/backend.log"
echo "  Web:     tail -f /tmp/web.log"
echo "  Mobile:  tail -f /tmp/mobile.log"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Features:${NC}"
echo "  ✅ Game saves to backend database"
echo "  ✅ Leaderboards sync server-side"
echo "  ✅ Achievements tracked globally"
echo "  ✅ Replays stored on backend"
echo "  ✅ User stats persisted"
echo ""
echo -e "${YELLOW}Keyboard Shortcuts (Mobile):${NC}"
echo "  i - Launch iOS Simulator"
echo "  a - Launch Android Emulator"
echo "  w - Open in web browser"
echo "  r - Reload app"
echo "  m - Toggle menu"
echo "  q - Quit"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Keep script running
wait
