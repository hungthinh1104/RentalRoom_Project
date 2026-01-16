#!/bin/bash

# Project Cleanup Script
# Removes unnecessary files while keeping essential documentation

set -e

echo "🧹 Starting project cleanup..."

# Navigate to project root
cd "$(dirname "$0")"

# Files to delete (old documentation)
OLD_DOCS=(
  "ARCHITECTURE_DIAGRAM.txt"
  "COMPILATION_FIXES_SUMMARY.md"
  "DATABASE_MIGRATION_GUIDE.md"
  "IMPLEMENTATION_STATUS.md"
  "INVOICE_OWNERSHIP_VALIDATION.md"
  "NOTIFICATION_ANALYSIS_SUMMARY.md"
  "NOTIFICATION_BEFORE_AFTER.md"
  "NOTIFICATION_DOCUMENTS_INDEX.md"
  "NOTIFICATION_IMPLEMENTATION_COMPLETE.md"
  "NOTIFICATION_IMPLEMENTATION_GUIDE.md"
  "NOTIFICATION_ISSUES_DETAILED.md"
  "NOTIFICATION_QUICK_START.md"
  "NOTIFICATION_SYSTEM_ANALYSIS.md"
  "NOTIFICATION_SYSTEM_IMPLEMENTATION.md"
  "PAYMENT_ARCHITECTURE_REFACTOR_PLAN.md"
  "PAYMENT_IMPLEMENTATION_SUMMARY.md"
  "PAYMENT_UTILITIES_COMPLETE.md"
  "PHASE_A_COMPLETE.md"
  "PHASE_A_COMPLETION_CHECKLIST.md"
  "QUICK_REFERENCE.md"
  "UTILITIES_DOCUMENTATION_INDEX.md"
  "UTILITIES_FEATURE_GUIDE.md"
  "UTILITIES_FINAL_SUMMARY.md"
  "UTILITIES_IMPLEMENTATION_CHECKLIST.md"
  "UTILITIES_IMPLEMENTATION_SUMMARY.md"
  "UTILITIES_QUICK_START.md"
  "UTILITY_INVOICE_API_EXAMPLES.sh"
  "UTILITY_INVOICE_GENERATION.md"
  "UTILITY_INVOICE_TESTING_GUIDE.md"
  "VERIFICATION_REPORT.md"
)

# Delete old documentation
echo "📄 Removing old documentation files..."
for file in "${OLD_DOCS[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ Deleted: $file"
  fi
done

# Backend cleanup
echo "🔧 Cleaning backend..."
cd rentalroom-be

# Remove debug/test scripts
DEBUG_FILES=(
  "check_user.js"
  "check_user_role.ts"
  "create_contract.js"
  "find_draft_contract.ts"
  "find_users.ts"
  "verify_bank_info.js"
  "test-contracts-debug.ts"
  "azure-deploy.yml"
  "deploy-azure.sh"
)

for file in "${DEBUG_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ Deleted: $file"
  fi
done

# Remove duplicate docker files
if [ -f "docker-compose.yml" ]; then
  rm "docker-compose.yml"
  echo "  ✓ Deleted: docker-compose.yml (duplicate)"
fi

# Remove old env templates
if [ -f ".env.production.template" ]; then
  rm ".env.production.template"
  echo "  ✓ Deleted: .env.production.template (duplicate)"
fi

# Remove old documentation
OLD_BE_DOCS=(
  "ENCRYPTION_SETUP.md"
  "SEPAY_API_KEY_SETUP.md"
  "SEPAY_CONFIGURATION.md"
)

for file in "${OLD_BE_DOCS[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ Deleted: $file"
  fi
done

# Remove coverage folder (can be regenerated)
if [ -d "coverage" ]; then
  rm -rf "coverage"
  echo "  ✓ Deleted: coverage/"
fi

# Remove storage folder if empty
if [ -d "storage" ] && [ -z "$(ls -A storage)" ]; then
  rm -rf "storage"
  echo "  ✓ Deleted: storage/ (empty)"
fi

cd ..

# Root cleanup
echo "🗑️  Cleaning root directory..."

# Remove root node_modules (if exists)
if [ -d "node_modules" ]; then
  rm -rf "node_modules"
  echo "  ✓ Deleted: node_modules/ (root)"
fi

# Remove root package files (not needed)
if [ -f "package.json" ] && [ -f "package-lock.json" ]; then
  rm "package.json" "package-lock.json"
  echo "  ✓ Deleted: package.json, package-lock.json (root)"
fi

# Remove .venv if exists (Python virtual env)
if [ -d ".venv" ]; then
  rm -rf ".venv"
  echo "  ✓ Deleted: .venv/"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📦 Kept essential files:"
echo "  - README.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo "  - deploy-azure.sh (root)"
echo "  - setup-gcloud.sh"
echo "  - docker-compose.yml (root)"
echo "  - .github/workflows/"
echo "  - All source code"
echo ""
echo "🗑️  Removed:"
echo "  - 30+ old documentation files"
echo "  - Debug/test scripts"
echo "  - Duplicate configs"
echo "  - Coverage reports"
echo ""
