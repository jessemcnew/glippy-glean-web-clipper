#!/bin/bash

# Replace these with your actual values
DOMAIN="linkedin-be.glean.com"
TOKEN="$1"

if [ -z "$1" ]; then
    echo "❌ Please provide your Glean API token as an argument"
    echo "Usage: ./create-datasource.sh YOUR_API_TOKEN"
    exit 1
fi

echo "🔧 Creating CUSTOMWEBCLIPPER datasource for web clipper extension..."
echo "🌐 Domain: $DOMAIN"
echo "🔑 Token: ${TOKEN:0:10}..."
echo ""

RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -X POST "https://${DOMAIN}/api/index/v1/adddatasource" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CUSTOMWEBCLIPPER",
    "displayName": "Custom Web Clipper",
    "datasourceCategory": "PUBLISHED_CONTENT",
    "urlRegex": "^https://.*",
    "objectDefinitions": [
      {
        "name": "WebClip",
        "docCategory": "PUBLISHED_CONTENT"
      }
    ],
    "isUserReferencedByEmail": true
  }')

HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo $RESPONSE | sed "s/HTTP_STATUS:[0-9]*//")

echo "📊 Response Status: $HTTP_STATUS"
echo "📄 Response Body: $BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ SUCCESS! CUSTOMWEBCLIPPER datasource created successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Your web clipper extension should now work!"
    echo "2. Make sure extension is configured to use:"
    echo "   - Domain: $DOMAIN"
    echo "   - API Token: [your current token]"
    echo "   - Datasource: CUSTOMWEBCLIPPER"
    echo "3. Try clipping some web content!"
else
    echo "❌ FAILED to create datasource (HTTP $HTTP_STATUS)"
    echo "💡 This might be because:"
    echo "   - CUSTOMWEBCLIPPER datasource already exists"
    echo "   - Your token doesn't have datasource creation permissions"
    echo "   - You may need to update your token scope in Glean admin"
fi
