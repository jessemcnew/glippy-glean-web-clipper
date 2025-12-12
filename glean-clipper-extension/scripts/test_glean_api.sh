#!/bin/bash

# Glean Collections API Test Script
# Tests API connectivity and collection access using curl

# Configuration
API_TOKEN="Tl0+Go7VQn3EPQzhhlwq7xNz0zPj+l0xIa2yZJrQaPo="
DOMAIN="linkedin-be.glean.com"
COLLECTION_ID=14191
BASE_URL="https://${DOMAIN}/rest/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================================"
echo "  GLEAN COLLECTIONS API TEST"
echo "============================================================"
echo ""
echo "Configuration:"
echo "  Domain: ${DOMAIN}"
echo "  Collection ID: ${COLLECTION_ID}"
echo "  Token: [HIDDEN]"
echo ""

# Test 1: List Collections
echo "============================================================"
echo "  Test 1: List Collections"
echo "============================================================"
echo "Testing endpoint: ${BASE_URL}/listcollections"
echo ""

response=$(curl -s -w "\n%{http_code}" -X GET \
  "${BASE_URL}/listcollections" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Accept: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS: List Collections (HTTP ${http_code})${NC}"
    echo "Response preview:"
    echo "$body" | head -c 500
    echo ""
    
    # Try to extract collection count using grep
    collection_count=$(echo "$body" | grep -o '"id"' | wc -l | tr -d ' ')
    if [ "$collection_count" -gt 0 ]; then
        echo -e "${GREEN}Found ${collection_count} collection(s)${NC}"
    fi
else
    echo -e "${RED}✗ FAIL: List Collections (HTTP ${http_code})${NC}"
    echo "Response: $body"
fi
echo ""

# Test 2: Check Specific Collection
echo "============================================================"
echo "  Test 2: Check Collection ${COLLECTION_ID}"
echo "============================================================"
echo "Testing endpoint: ${BASE_URL}/getcollection?collectionId=${COLLECTION_ID}"
echo ""

response=$(curl -s -w "\n%{http_code}" -X GET \
  "${BASE_URL}/getcollection?collectionId=${COLLECTION_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Accept: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Collection ${COLLECTION_ID} exists (HTTP ${http_code})${NC}"
    echo "Collection details:"
    echo "$body" | head -c 500
    echo ""
else
    echo -e "${RED}✗ FAIL: Collection ${COLLECTION_ID} not accessible (HTTP ${http_code})${NC}"
    echo "Response: $body"
    echo ""
    echo -e "${YELLOW}Note: You may need to create a new collection or use a different ID${NC}"
fi
echo ""

# Test 3: Test Adding Item to Collection
echo "============================================================"
echo "  Test 3: Add Test Item to Collection ${COLLECTION_ID}"
echo "============================================================"
echo "Testing endpoint: ${BASE_URL}/addcollectionitems"
echo ""

# Create test payload
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEST_URL="https://example.com/test-$(date +%s)"
PAYLOAD=$(cat <<EOF
{
  "collectionId": ${COLLECTION_ID},
  "addedCollectionItemDescriptors": [
    {
      "url": "${TEST_URL}",
      "description": "Test item added via API test script at ${TIMESTAMP}"
    }
  ]
}
EOF
)

echo "Sending test item:"
echo "  URL: ${TEST_URL}"
echo "  Description: Test item added at ${TIMESTAMP}"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
  "${BASE_URL}/addcollectionitems" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${PAYLOAD}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "204" ]; then
    echo -e "${GREEN}✓ PASS: Successfully added item to collection (HTTP ${http_code})${NC}"
    if [ -n "$body" ]; then
        echo "Response: $body"
    else
        echo "Response: Success (empty response is normal)"
    fi
else
    echo -e "${RED}✗ FAIL: Could not add item to collection (HTTP ${http_code})${NC}"
    echo "Response: $body"
    echo ""
    if [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}Error: Permission denied - check token has COLLECTIONS scope${NC}"
    elif [ "$http_code" = "404" ]; then
        echo -e "${YELLOW}Error: Collection not found - check collection ID${NC}"
    elif [ "$http_code" = "400" ]; then
        echo -e "${YELLOW}Error: Bad request - check payload format${NC}"
    fi
fi
echo ""

# Summary
echo "============================================================"
echo "  TEST SUMMARY"
echo "============================================================"
echo ""
echo "If all tests passed:"
echo "  ✓ Your API token is valid"
echo "  ✓ You have COLLECTIONS scope"
echo "  ✓ Collection ${COLLECTION_ID} is accessible"
echo "  ✓ You can add items to the collection"
echo ""
echo "Next steps:"
echo "  1. Reload the Chrome extension (chrome://extensions)"
echo "  2. Configure the extension with:"
echo "     - Domain: app.glean.com"
echo "     - API Token: Your token"
echo "     - Collection ID: ${COLLECTION_ID}"
echo "  3. Test clipping some content"
echo ""