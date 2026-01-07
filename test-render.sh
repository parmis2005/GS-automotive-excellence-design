#!/bin/bash

# Render API Test Script
# Ersetze DEINE_RENDER_URL mit deiner tatsächlichen Render URL

RENDER_URL="https://DEINE_RENDER_URL"

echo "🔍 Testing Render Deployment..."
echo "=================================="
echo ""

echo "1️⃣  Health Check:"
echo "-------------------"
curl -s "${RENDER_URL}/health" | jq '.' || curl -s "${RENDER_URL}/health"
echo ""
echo ""

echo "2️⃣  Fetch all vehicles:"
echo "-------------------"
curl -s "${RENDER_URL}/api/vehicles" | jq '.count, .success, .timestamp' || curl -s "${RENDER_URL}/api/vehicles"
echo ""
echo ""

echo "3️⃣  Test with verbose output:"
echo "-------------------"
curl -v "${RENDER_URL}/health"
echo ""
