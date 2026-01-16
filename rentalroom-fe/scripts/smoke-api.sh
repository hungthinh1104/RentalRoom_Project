#!/usr/bin/env bash
set -eu -o pipefail
API_BASE=${API_BASE:-http://localhost:3000/api/v1}
COOKIE_JAR=/tmp/fe_smoke_cookies.txt
TMP_RESP=/tmp/fe_smoke_response.json

echo "FE -> BE Smoke Test: $API_BASE"
rm -f "$COOKIE_JAR" "$TMP_RESP"

echo "1) Login (creates HttpOnly refresh cookie + returns access_token)"
curl -s -c "$COOKIE_JAR" -X POST "$API_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke+test@example.com","password":"Password!234"}' -o "$TMP_RESP" || true
HTTP=$(jq -r '.statusCode? // empty' "$TMP_RESP" 2>/dev/null || echo '')
if [ -s "$TMP_RESP" ]; then
  ACCESS_TOKEN=$(jq -r '.access_token // empty' "$TMP_RESP" || echo '')
else
  ACCESS_TOKEN=''
fi
if [ -z "$ACCESS_TOKEN" ]; then
  echo "Login failed or no access token returned. Response:"; cat "$TMP_RESP"; exit 2
fi
echo " -> Access token obtained"

# Helper to call endpoints
call_public() {
  PATH="$1"
  echo "\nCALL (public) $PATH"
  curl -s -i "$API_BASE$PATH" | sed -n '1,80p'
}

call_auth() {
  PATH="$1"
  echo "\nCALL (auth) $PATH with Bearer token"
  curl -s -i -H "Authorization: Bearer $ACCESS_TOKEN" "$API_BASE$PATH" | sed -n '1,80p'
}

call_cookie_refresh() {
  echo "\nCALL refresh using cookie jar (no body)"
  curl -s -b "$COOKIE_JAR" -X POST "$API_BASE/auth/refresh" -H 'Content-Type: application/json' -o "$TMP_RESP" -w "HTTP:%{http_code}\n"
  cat "$TMP_RESP" || true
}

call_cookie_logout() {
  echo "\nCALL logout using cookie jar"
  curl -s -b "$COOKIE_JAR" -X POST "$API_BASE/auth/logout" -H 'Content-Type: application/json' -w "HTTP:%{http_code}\n"
}

# 2) Public endpoints
call_public "/rooms"
call_public "/ai/search/semantic?q=test"

# 3) Protected endpoints
call_auth "/contracts"

# 4) Cookie-only refresh (should work)
call_cookie_refresh

# 5) Logout
call_cookie_logout

echo "\nSmoke test completed. Clean up temporary files."
rm -f "$COOKIE_JAR" "$TMP_RESP"
exit 0
