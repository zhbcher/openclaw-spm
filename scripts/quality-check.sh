#!/bin/bash
set -e
echo "=== SPM Quality Check ==="

if [ ! -f package.json ]; then echo "No package.json found"; exit 0; fi

# Type check
if grep -q '"type-check"' package.json; then npm run type-check 2>/dev/null && echo "✓ Type check" || echo "✗ Type check"; fi

# Lint
if grep -q '"lint"' package.json; then npm run lint 2>/dev/null && echo "✓ Lint" || echo "✗ Lint"; fi

# Tests
if grep -q '"test"' package.json; then npm test 2>/dev/null && echo "✓ Tests" || echo "✗ Tests"; fi

# Secrets check
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" --include="*.ts" --include="*.js" src/ 2>/dev/null | grep -v "node_modules" && echo "⚠ Secrets found!" || echo "✓ No secrets"

echo "=== Done ==="
