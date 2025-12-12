#!/bin/bash

echo "🔍 Testing Glean API Connection..."
echo ""

# Check if API token is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your Glean API token as an argument"
    echo "Usage: ./test-glean.sh YOUR_API_TOKEN"
    echo ""
    echo "Example: ./test-glean.sh glean_oauth_abcdef123456..."
    exit 1
fi

API_TOKEN="$1"
DOMAIN="linkedin-be.glean.com"

echo "🌐 Testing connection to: https://$DOMAIN"
echo "🔑 Using token: ${API_TOKEN:0:10}..."
echo ""

echo "📊 Getting document count (this shows all available datasources)..."
curl -s -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     "https://$DOMAIN/api/index/v1/getdocumentcount" | \
     python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ SUCCESS! Available datasources:')
    print()
    if 'datasourceDocumentCounts' in data:
        for ds in data['datasourceDocumentCounts']:
            print(f\"  📁 {ds['datasource']}: {ds['count']:,} documents\")
    else:
        print('Raw response:', json.dumps(data, indent=2))
except json.JSONDecodeError as e:
    print('❌ ERROR: Invalid JSON response')
    print('Raw response:', sys.stdin.read())
except Exception as e:
    print('❌ ERROR:', str(e))
"

echo ""
echo "🔍 Testing specific datasource configs..."
echo ""

# Test common webclipper datasource names
for DS_NAME in "WEBCLIPPER" "WEBCLIPS" "CUSTOMWEBCLIPPER" "Global" "Indiscovery"; do
    echo "Testing $DS_NAME..."
    RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"datasource\": \"$DS_NAME\"}" \
        "https://$DOMAIN/api/index/v1/getdatasourceconfig")
    
    HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    BODY=$(echo $RESPONSE | sed "s/HTTP_STATUS:[0-9]*//")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "  ✅ $DS_NAME exists and is accessible!"
    elif [ "$HTTP_STATUS" = "400" ]; then
        echo "  ❌ $DS_NAME does not exist"
    else
        echo "  ❓ $DS_NAME returned HTTP $HTTP_STATUS"
    fi
done

echo ""
echo "🎯 Summary: Run this script with your API token to see which datasources are available!"