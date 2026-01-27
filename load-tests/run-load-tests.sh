#!/bin/bash

# Load Test Runner for RentalRoom System
# Usage: ./run-load-tests.sh [scenario] [environment]
# Example: ./run-load-tests.sh all production

set -e

SCENARIO=${1:-all}
ENV=${2:-local}

# Environment URLs
case $ENV in
  local)
    API_URL="http://localhost:3001"
    ;;
  staging)
    API_URL="https://staging-api.yourapp.com"
    ;;
  production)
    echo "⚠️  Running load tests against PRODUCTION. Are you sure? (yes/no)"
    read -r confirm
    if [ "$confirm" != "yes" ]; then
      echo "Aborted."
      exit 1
    fi
    API_URL="https://api.yourapp.com"
    ;;
  *)
    echo "Unknown environment: $ENV"
    exit 1
    ;;
esac

echo "🚀 Running load tests against: $API_URL"
echo "=================================================="

# Create results directory
mkdir -p ./load-tests/results

# Run scenarios
case $SCENARIO in
  1|login)
    echo "📊 Scenario 1: Login + Dashboard"
    k6 run --out json=./load-tests/results/scenario-1-$(date +%Y%m%d-%H%M%S).json \
      -e API_URL=$API_URL \
      ./load-tests/scenario-1-login-dashboard.js
    ;;
  2|contract)
    echo "📊 Scenario 2: Create Contract"
    k6 run --out json=./load-tests/results/scenario-2-$(date +%Y%m%d-%H%M%S).json \
      -e API_URL=$API_URL \
      ./load-tests/scenario-2-create-contract.js
    ;;
  3|invoice)
    echo "📊 Scenario 3: Invoice Generation"
    k6 run --out json=./load-tests/results/scenario-3-$(date +%Y%m%d-%H%M%S).json \
      -e API_URL=$API_URL \
      ./load-tests/scenario-3-invoice-generation.js
    ;;
  all)
    echo "📊 Running all scenarios"
    $0 1 $ENV
    echo ""
    $0 2 $ENV
    echo ""
    $0 3 $ENV
    ;;
  *)
    echo "Unknown scenario: $SCENARIO"
    echo "Usage: $0 [1|2|3|all] [local|staging|production]"
    exit 1
    ;;
esac

echo ""
echo "✅ Load tests completed!"
echo "Results saved in: ./load-tests/results/"
