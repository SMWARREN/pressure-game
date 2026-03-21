#!/bin/bash
# Pressure Game - Production Stack
# Builds and runs optimized version with production settings

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Pressure Game - Production Build${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check for production environment configuration
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo -e "${RED}❌ Error: .env file not found${NC}"
  echo ""
  echo "Create .env with production settings:"
  echo ""
  echo "  VITE_API_URL=https://your-api-domain.com/api.php"
  echo "  VITE_PERSISTENCE_BACKEND=syncing"
  echo ""
  exit 1
fi

API_URL=$(grep "VITE_API_URL" "$PROJECT_DIR/.env" | cut -d'=' -f2)
if [ -z "$API_URL" ]; then
  echo -e "${RED}❌ Error: VITE_API_URL not configured in .env${NC}"
  exit 1
fi

echo -e "${YELLOW}Building for Production...${NC}"
echo -e "${YELLOW}Backend API: $API_URL${NC}"
echo ""

# Build Web App
echo -e "${YELLOW}Building Web App...${NC}"
cd "$PROJECT_DIR/apps/web"
npm run build > /tmp/web-build.log 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Web build complete${NC}"
else
  echo -e "${RED}❌ Web build failed${NC}"
  tail -20 /tmp/web-build.log
  exit 1
fi

# Build Mobile App (requires EAS account)
echo ""
echo -e "${YELLOW}Mobile App Build...${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo "To build the mobile app for production:"
echo ""
echo -e "${BLUE}1. Authenticate with EAS:${NC}"
echo "   cd apps/mobile && eas login"
echo ""
echo -e "${BLUE}2. Build for iOS:${NC}"
echo "   eas build --platform ios"
echo ""
echo -e "${BLUE}3. Build for Android:${NC}"
echo "   eas build --platform android"
echo ""
echo -e "${BLUE}4. Submit to app stores:${NC}"
echo "   eas submit --platform ios"
echo "   eas submit --platform android"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Web deployment info
echo -e "${YELLOW}Web App Deployment...${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""
echo "Production build ready at:"
echo -e "${BLUE}  apps/web/dist/${NC}"
echo ""
echo "Deploy to your host:"
echo ""
echo -e "${GREEN}Option 1: Vercel${NC}"
echo "  npm install -g vercel"
echo "  vercel deploy --prod"
echo ""
echo -e "${GREEN}Option 2: Netlify${NC}"
echo "  npm install -g netlify-cli"
echo "  netlify deploy --prod --dir=apps/web/dist"
echo ""
echo -e "${GREEN}Option 3: Traditional Host (SCP, FTP, etc.)${NC}"
echo "  scp -r apps/web/dist/* user@host:/var/www/pressure-game/"
echo ""
echo -e "${GREEN}Option 4: Docker${NC}"
echo "  docker build -t pressure-game:latest ."
echo "  docker run -p 80:3000 pressure-game:latest"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Backend deployment info
echo -e "${YELLOW}Backend (PHP) Deployment...${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""
echo "Deploy PHP backend files:"
echo ""
echo "  Required files:"
echo "    - apps/server/api.php"
echo "    - apps/server/.env (with DB credentials)"
echo "    - apps/server/schema.sql (setup database once)"
echo ""
echo "Deploy commands:"
echo "  scp apps/server/api.php user@host:/var/www/pressure-game/api.php"
echo "  scp apps/server/.env user@host:/var/www/pressure-game/.env"
echo ""
echo "Setup database (run once):"
echo "  mysql -u user -p < apps/server/schema.sql"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Environment checklist
echo -e "${YELLOW}Pre-Deployment Checklist:${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${GREEN}Web App:${NC}"
echo "  ✅ Builds without errors"
echo "  ✅ API URL configured: $API_URL"
echo "  ✅ dist/ folder ready for deployment"
echo ""
echo -e "${GREEN}Backend:${NC}"
echo "  ☐ Database configured in .env"
echo "  ☐ MySQL server running"
echo "  ☐ api.php uploaded to server"
echo "  ☐ schema.sql executed"
echo ""
echo -e "${GREEN}Mobile:${NC}"
echo "  ☐ EAS account configured"
echo "  ☐ Build profiles set in eas.json"
echo "  ☐ iOS/Android builds complete"
echo "  ☐ App store credentials ready"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
echo ""

echo -e "${GREEN}🎉 Production Build Complete!${NC}"
echo ""
echo "Web app: ${BLUE}apps/web/dist/${NC}"
echo "Size: $(du -sh "$PROJECT_DIR/apps/web/dist" | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Choose deployment platform"
echo "  2. Configure domain/hosting"
echo "  3. Update VITE_API_URL if needed"
echo "  4. Deploy web app"
echo "  5. Deploy backend API"
echo "  6. Build & submit mobile apps"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
