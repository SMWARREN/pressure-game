#!/bin/bash

# Test Stats API Endpoints
# Usage: ./scripts/test-stats-api.sh [api-url] [test-pattern]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-http://localhost:8000/api.php}"
TEST_PATTERN="${2:-stats-api}"
FRONTEND_URL="${TEST_URL:-http://localhost:3000}"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}📊 Pressure Game - Stats API Tests${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Test Pattern: $TEST_PATTERN"
echo ""

# Check if API is reachable
echo "🔍 Checking API connectivity..."
if curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is reachable${NC}"
else
    echo -e "${RED}❌ API is not reachable at $API_URL${NC}"
    echo "Make sure your API server is running"
    echo ""
    echo "Quick start:"
    echo "  1. Terminal 1: npm run build && npm run preview -- --port 3000"
    echo "  2. Terminal 2: php -S localhost:8000 (in apps/server directory)"
    echo "  3. Terminal 3: VITE_API_URL=http://localhost:8000/api.php npm run test:e2e"
    exit 1
fi

echo ""
echo "🚀 Running tests..."
echo ""

# Run tests with API URL set
VITE_API_URL="$API_URL" TEST_URL="$FRONTEND_URL" npx playwright test "tests/e2e/${TEST_PATTERN}.spec.ts" --reporter=html

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Test run completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📊 Results: Check playwright-report/index.html"
echo ""
echo "To debug failures:"
echo "  VITE_API_URL=$API_URL npm run test:e2e:ui"
