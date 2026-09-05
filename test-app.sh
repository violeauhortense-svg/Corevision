#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🧪 COREVISION APP TEST SUITE"
echo "════════════════════════════════════════════════════════════"
echo ""

PASSED=0
FAILED=0

# Test 1: Backend Health
echo "1️⃣  Testing Backend Health..."
if response=$(curl -s http://localhost:3000/health); then
  if echo "$response" | grep -q '"status":"ok"'; then
    echo "   ✅ PASS: Backend is running"
    ((PASSED++))
  else
    echo "   ❌ FAIL: Backend response invalid"
    echo "   Response: $response"
    ((FAILED++))
  fi
else
  echo "   ❌ FAIL: Cannot connect to backend"
  ((FAILED++))
fi
echo ""

# Test 2: PocketBase
echo "2️⃣  Testing PocketBase..."
if response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/api/collections); then
  if [ "$response" != "000" ]; then
    echo "   ✅ PASS: PocketBase is running (HTTP $response)"
    ((PASSED++))
  else
    echo "   ❌ FAIL: PocketBase not responding"
    ((FAILED++))
  fi
else
  echo "   ❌ FAIL: Cannot connect to PocketBase"
  ((FAILED++))
fi
echo ""

# Test 3: Login
echo "3️⃣  Testing Login..."
login_response=$(curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "violeau.hortense@gmail.com",
    "password": "Hvguillote78"
  }')

if echo "$login_response" | grep -q '"success":true'; then
  TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "   ✅ PASS: Login successful"
  echo "   Token: ${TOKEN:0:30}..."
  ((PASSED++))
else
  echo "   ❌ FAIL: Login failed"
  echo "   Response: $(echo "$login_response" | head -c 100)"
  ((FAILED++))
  TOKEN=""
fi
echo ""

# Test 4: Dashboard Metrics
echo "4️⃣  Testing Dashboard Metrics..."
if response=$(curl -s -H "Authorization: Bearer test-token" \
  http://localhost:3000/api/dashboard/metrics); then
  if echo "$response" | grep -q '"metrics"'; then
    echo "   ✅ PASS: Dashboard metrics endpoint working"
    ((PASSED++))
  else
    echo "   ❌ FAIL: Invalid metrics response"
    echo "   Response: $(echo "$response" | head -c 100)"
    ((FAILED++))
  fi
else
  echo "   ❌ FAIL: Cannot reach metrics endpoint"
  ((FAILED++))
fi
echo ""

# Test 5: Dashboard Kanban
echo "5️⃣  Testing Dashboard Kanban..."
if response=$(curl -s -H "Authorization: Bearer test-token" \
  http://localhost:3000/api/dashboard/kanban); then
  if echo "$response" | grep -q '"Prospect"'; then
    echo "   ✅ PASS: Dashboard kanban endpoint working"
    ((PASSED++))
  else
    echo "   ❌ FAIL: Invalid kanban response"
    echo "   Response: $(echo "$response" | head -c 100)"
    ((FAILED++))
  fi
else
  echo "   ❌ FAIL: Cannot reach kanban endpoint"
  ((FAILED++))
fi
echo ""

# Test 6: Vercel Frontend
echo "6️⃣  Testing Vercel Frontend..."
if response=$(curl -s -o /dev/null -w "%{http_code}" https://corevision-main.vercel.app); then
  if [ "$response" = "200" ]; then
    echo "   ✅ PASS: Vercel frontend is online (HTTP $response)"
    ((PASSED++))
  else
    echo "   ⚠️  WARNING: Vercel returned HTTP $response"
    ((FAILED++))
  fi
else
  echo "   ❌ FAIL: Cannot reach Vercel"
  ((FAILED++))
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "  📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED! Your app is ready!"
  echo ""
  echo "Next steps:"
  echo "  1. Open: https://corevision-main.vercel.app"
  echo "  2. Login with:"
  echo "     Email: violeau.hortense@gmail.com"
  echo "     Password: Hvguillote78"
  echo "  3. Explore the dashboard!"
  exit 0
else
  echo "⚠️  SOME TESTS FAILED - Check the errors above"
  exit 1
fi
