#!/usr/bin/env bash
# ============================================
# GRAPH Educational Platform — CI / local check
# ============================================
# Usage: bash scripts/check.sh
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; exit 1; }

echo "=== GRAPH Platform Checks ==="
echo ""

# ---- Frontend build check ----
echo "--- Frontend: npm ci + build ---"
if npm ci --prefix . --no-audit 2>&1 | tail -1; then
  pass "npm ci"
else
  fail "npm ci"
fi

if npm run build --prefix . 2>&1 | tail -3; then
  pass "npm run build"
else
  fail "npm run build"
fi

echo ""

# ---- Backend checks ----
echo "--- Backend: pip install + pytest ---"
cd backend

if pip install -q -r requirements.txt 2>&1 | tail -1; then
  pass "pip install"
else
  fail "pip install"
fi

if python -m pytest tests/ -v --tb=short 2>&1; then
  pass "pytest"
else
  fail "pytest"
fi

cd ..

echo ""
echo "=== All checks passed ==="
