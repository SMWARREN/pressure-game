#!/bin/bash

# SonarQube Clean Cache & Analyze Script
# Restarts SonarQube, generates new token, and runs analysis

set -e

SONAR_URL="http://localhost:9000"
SONAR_ADMIN_USER="admin"
SONAR_ADMIN_PASS="admin"
TOKEN_NAME="scanner-token"

echo "🔄 Checking SonarQube container status..."
if docker ps | grep -q "sonarqube"; then
  echo "📦 SonarQube container found. Restarting to clear cache..."
  docker restart sonarqube
  echo "⏳ Waiting for SonarQube to start (30s)..."
  sleep 30
else
  echo "❌ SonarQube container not running"
  echo "💡 Start it with: npm run sonar:start"
  exit 1
fi

echo "🔑 Checking if SonarQube is responding..."
max_attempts=10
attempts=0
while [ $attempts -lt $max_attempts ]; do
  if curl -s "$SONAR_URL/api/system/status" > /dev/null 2>&1; then
    echo "✅ SonarQube is responding"
    break
  fi
  attempts=$((attempts + 1))
  if [ $attempts -lt $max_attempts ]; then
    echo "⏳ Still waiting... ($attempts/$max_attempts)"
    sleep 5
  fi
done

if [ $attempts -eq $max_attempts ]; then
  echo "❌ SonarQube failed to start"
  exit 1
fi

echo "🆕 Generating new SonarQube token..."
TOKEN_RESPONSE=$(curl -s -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
  -X POST "$SONAR_URL/api/user_tokens/generate" \
  -d "name=$TOKEN_NAME")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to generate token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ New token generated: $TOKEN"

echo "📝 Updating package.json with new token..."
# Use sed to replace the token in package.json
sed -i '' "s/squ_[a-f0-9]\{64\}/$TOKEN/" package.json

if grep -q "$TOKEN" package.json; then
  echo "✅ package.json updated"
else
  echo "❌ Failed to update package.json"
  exit 1
fi

echo "🔍 Running SonarQube analysis..."
npm run sonar:analyze

if [ $? -eq 0 ]; then
  echo "✅ Analysis completed successfully!"
  echo "📊 View dashboard: $SONAR_URL/dashboard?id=pressure-game"
else
  echo "⚠️  Analysis completed with warnings (check quality gate status)"
  echo "📊 View dashboard: $SONAR_URL/dashboard?id=pressure-game"
fi

echo "✨ Done!"
