#!/bin/bash

# Cleanup test data for the same user that tests used
# Usage: ./scripts/cleanup-tests.sh [api-url]

API_URL="${1:-https://mildfun.com/pressure/api.php}"

# Read test user ID from file created during tests
if [ -f ".test-user-id" ]; then
  USER_ID=$(cat .test-user-id)
  echo "🧹 Cleaning up test data for user: $USER_ID"
else
  echo "❌ Error: .test-user-id file not found"
  echo "   Run tests first: npm run test:e2e"
  exit 1
fi

echo "   API: $API_URL"
echo ""

response=$(curl -s -X DELETE "$API_URL/api/debug/cleanup/$USER_ID")

echo "$response" | jq .

echo ""
echo "✅ Cleanup complete!"
