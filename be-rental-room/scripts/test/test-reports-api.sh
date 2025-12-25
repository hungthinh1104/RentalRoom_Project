#!/bin/bash

# Test Reports API with Seeded Data
# Run after: npx prisma db seed

echo "🧪 Testing Reports API with Seeded Vietnamese Data"
echo "=================================================="
echo ""

BASE_URL="http://localhost:3000"

# Test credentials
ADMIN_EMAIL="admin@rentalroom.vn"
LANDLORD_EMAIL="landlord1@example.com"
TENANT_EMAIL="tenant1@example.com"
PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to login and get JWT token
login() {
    local email=$1
    local password=$2
    
    echo "🔐 Logging in as $email..."
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    token=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        echo -e "${RED}❌ Login failed for $email${NC}"
        echo "Response: $response"
        return 1
    else
        echo -e "${GREEN}✅ Login successful${NC}"
        echo "$token"
        return 0
    fi
}

# Function to test an API endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local token=$3
    
    echo ""
    echo "📊 Testing: $name"
    echo "URL: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url" \
        -H "Authorization: Bearer $token")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "Response preview:"
        echo "$body" | jq '.' 2>/dev/null | head -20 || echo "$body" | head -20
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

# ============================================================================
# 1. LOGIN AS ADMIN
# ============================================================================
echo ""
echo "1️⃣  ADMIN LOGIN"
echo "----------------------------------------"
ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$PASSWORD")

if [ $? -eq 0 ] && [ -n "$ADMIN_TOKEN" ]; then
    # Test Admin endpoints
    echo ""
    echo "🔍 Testing Admin Endpoints..."
    
    test_endpoint \
        "Admin Overview Report" \
        "$BASE_URL/reports/admin/overview" \
        "$ADMIN_TOKEN"
    
    test_endpoint \
        "Admin Market Insights" \
        "$BASE_URL/reports/admin/market-insights" \
        "$ADMIN_TOKEN"
fi

# ============================================================================
# 2. LOGIN AS LANDLORD
# ============================================================================
echo ""
echo ""
echo "2️⃣  LANDLORD LOGIN"
echo "----------------------------------------"
LANDLORD_TOKEN=$(login "$LANDLORD_EMAIL" "$PASSWORD")

if [ $? -eq 0 ] && [ -n "$LANDLORD_TOKEN" ]; then
    # Get landlord ID from database
    LANDLORD_ID=$(docker exec -i rental-room-db psql -U rental_user -d rental_room_db -t -c \
        "SELECT id FROM \"user\" WHERE email = '$LANDLORD_EMAIL';")
    LANDLORD_ID=$(echo "$LANDLORD_ID" | xargs) # trim whitespace
    
    echo "Landlord ID: $LANDLORD_ID"
    
    # Test Landlord endpoints
    echo ""
    echo "🔍 Testing Landlord Endpoints..."
    
    test_endpoint \
        "Landlord Revenue Report" \
        "$BASE_URL/reports/landlord/revenue?landlordId=$LANDLORD_ID&startDate=2024-01-01&endDate=2024-12-31" \
        "$LANDLORD_TOKEN"
    
    test_endpoint \
        "Property Performance Report" \
        "$BASE_URL/reports/landlord/property-performance?landlordId=$LANDLORD_ID" \
        "$LANDLORD_TOKEN"
    
    test_endpoint \
        "Tenant Analytics Report" \
        "$BASE_URL/reports/landlord/tenant-analytics?landlordId=$LANDLORD_ID" \
        "$LANDLORD_TOKEN"
fi

# ============================================================================
# 3. LOGIN AS TENANT
# ============================================================================
echo ""
echo ""
echo "3️⃣  TENANT LOGIN"
echo "----------------------------------------"
TENANT_TOKEN=$(login "$TENANT_EMAIL" "$PASSWORD")

if [ $? -eq 0 ] && [ -n "$TENANT_TOKEN" ]; then
    # Get tenant ID from database
    TENANT_ID=$(docker exec -i rental-room-db psql -U rental_user -d rental_room_db -t -c \
        "SELECT id FROM \"user\" WHERE email = '$TENANT_EMAIL';")
    TENANT_ID=$(echo "$TENANT_ID" | xargs) # trim whitespace
    
    echo "Tenant ID: $TENANT_ID"
    
    # Test Tenant endpoints
    echo ""
    echo "🔍 Testing Tenant Endpoints..."
    
    test_endpoint \
        "Tenant Payment History" \
        "$BASE_URL/reports/tenant/payment-history?tenantId=$TENANT_ID&page=1&limit=10" \
        "$TENANT_TOKEN"
    
    test_endpoint \
        "Tenant Expenses Report" \
        "$BASE_URL/reports/tenant/expenses?tenantId=$TENANT_ID&startDate=2024-01-01&endDate=2024-12-31" \
        "$TENANT_TOKEN"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo ""
echo "=================================================="
echo "🎉 Report API Testing Complete!"
echo "=================================================="
echo ""
echo "📝 Summary:"
echo "  - Tested 7 report endpoints"
echo "  - Used Vietnamese seeded data"
echo "  - Admin, Landlord, and Tenant roles"
echo ""
echo "📚 Documentation:"
echo "  - API Docs: http://localhost:3000/api/docs"
echo "  - Report API Reference: /docs/REPORTS_API.md"
echo "  - Seed Script Summary: /docs/SEED_SCRIPT_SUMMARY.md"
echo ""
