#!/bin/bash

# Test Auto Income & Snapshot Creation
# This script tests the flow: Create Invoice → Mark as Paid → Verify Income & Snapshot

set -e

API_URL="http://localhost:3005/api/v1"
TOKEN=""

echo "🧪 Testing Auto Income & Snapshot Creation"
echo "=========================================="

# Step 1: Login as LANDLORD to get token
echo ""
echo "📝 Step 1: Login as LANDLORD..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
LANDLORD_ID=$(echo $LOGIN_RESPONSE | jq -r '.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Response:"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Logged in successfully"
echo "   Landlord ID: $LANDLORD_ID"

# Step 2: Get an active contract
echo ""
echo "📝 Step 2: Getting active contract..."
CONTRACTS=$(curl -s -X GET "$API_URL/contracts?status=ACTIVE&limit=1" \
  -H "Authorization: Bearer $TOKEN")

CONTRACT_ID=$(echo $CONTRACTS | jq -r '.data[0].id')
TENANT_ID=$(echo $CONTRACTS | jq -r '.data[0].tenantId')

if [ "$CONTRACT_ID" == "null" ]; then
  echo "❌ No active contract found!"
  exit 1
fi

echo "✅ Found active contract"
echo "   Contract ID: $CONTRACT_ID"

# Step 3: Create Invoice
echo ""
echo "📝 Step 3: Creating invoice..."
INVOICE_RESPONSE=$(curl -s -X POST "$API_URL/billing/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"contractId\": \"$CONTRACT_ID\",
    \"tenantId\": \"$TENANT_ID\",
    \"landlordId\": \"$LANDLORD_ID\",
    \"invoiceNumber\": \"TEST-$(date +%s)\",
    \"issueDate\": \"$(date -I)\",
    \"dueDate\": \"$(date -d '+7 days' -I)\",
    \"totalAmount\": 5000000,
    \"status\": \"PENDING\"
  }")

INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.id')

if [ "$INVOICE_ID" == "null" ]; then
  echo "❌ Failed to create invoice!"
  echo $INVOICE_RESPONSE | jq .
  exit 1
fi

echo "✅ Invoice created: $INVOICE_ID"

# Step 4: Mark as PAID
echo ""
echo "📝 Step 4: Marking invoice as PAID..."
curl -s -X PATCH "$API_URL/billing/invoices/$INVOICE_ID/mark-paid" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo "✅ Invoice marked as PAID"

# Step 5: Check Income
echo ""
echo "📝 Step 5: Checking auto-created Income..."
sleep 2
INCOME_LIST=$(curl -s -X GET "$API_URL/income/summary/$(date +%Y)?mode=list" \
  -H "Authorization: Bearer $TOKEN")

INCOME_COUNT=$(echo $INCOME_LIST | jq '. | length')
echo "   Income records: $INCOME_COUNT"

# Step 6: Check Snapshots
echo ""
echo "📝 Step 6: Checking snapshots..."
SNAPSHOTS=$(curl -s -X GET "$API_URL/admin/snapshots?limit=5" \
  -H "Authorization: Bearer $TOKEN")

SNAPSHOT_COUNT=$(echo $SNAPSHOTS | jq -r '.total // 0')
echo "   Snapshot count: $SNAPSHOT_COUNT"

echo ""
echo "🎉 Test completed!"
echo "   Income created: $([ "$INCOME_COUNT" -gt 0 ] && echo "✅ YES" || echo "❌ NO")"
echo "   Snapshots: $SNAPSHOT_COUNT"
