# Auth Module - Quick Reference

## Database Schema Changes

### User Model - New Fields

```prisma
// Email Verification (separate from password reset)
emailVerificationCode   String?   @map("email_verification_code")
emailVerificationExpiry DateTime? @map("email_verification_expiry")

// Password Reset (strong cryptographic token)
passwordResetToken      String?   @unique @map("password_reset_token")
passwordResetExpiry     DateTime? @map("password_reset_expiry")

// Refresh Token Rotation (for stateful revocation)
lastRefreshTokenFamily  String?   @map("last_refresh_token_family")
lastRefreshIssuedAt     DateTime? @map("last_refresh_issued_at")
```

### Old Fields (still present, no longer used for auth)
```prisma
// DEPRECATED - migrated to emailVerificationCode
verificationCode        String?   @map("verification_code")
verificationExpiry      DateTime? @map("verification_expiry")
```

---

## Service Methods - Key Changes

### AuthService

#### New Methods
```typescript
private generatePasswordResetToken(): string
  // Returns 128-char hex string from crypto.randomBytes(64)
  
private generateVerificationCode(): string
  // Returns 6-digit code from Math.random()
  
private validatePasswordPolicy(password: string): { valid: boolean; errors: string[] }
  // Validates: 8+ chars, uppercase, lowercase, number, special char
  
async revokeTokenFamily(userId: string): Promise<void>
  // Clears lastRefreshTokenFamily to invalidate all tokens
```

#### Modified Methods
```typescript
async register(registerDto): Promise<{ message: string }>
  // ✅ Now validates password policy
  
async validateUser(email, password)
  // ✅ Now checks if user is banned
  
async refreshToken(refreshToken): Promise<{ access_token: string }>
  // ✅ Now validates token family
  // ✅ Now checks if user is banned
  // ✅ Now detects token reuse attacks
  
async verifyEmail(code): Promise<{ message: string }>
  // ✅ Now uses emailVerificationCode field
  
async resendVerification(email): Promise<{ message: string }>
  // ✅ Now uses emailVerificationCode field
  
async forgotPassword(email): Promise<{ message: string }>
  // ✅ Now uses passwordResetToken field (128 chars, unique)
  
async resetPassword(token, newPassword): Promise<{ message: string }>
  // ✅ Now uses passwordResetToken field
  // ✅ Now validates password policy
```

---

## API Endpoints

### POST /auth/register
**Changes:** Now validates password strength
```json
{
  "email": "user@example.com",
  "password": "Test123!@#",  // Must be 8+ chars with uppercase, lowercase, number, special
  "fullName": "John Doe",
  "phone": "0901234567",
  "role": "TENANT"  // or LANDLORD
}
```

### POST /auth/verify
**Changes:** Uses new emailVerificationCode field
```json
{
  "code": "123456"  // 6-digit code from email
}
```

### POST /auth/login
**Changes:** Now checks if user is banned
```json
{
  "email": "user@example.com",
  "password": "Test123!@#"
}
```

### POST /auth/refresh
**Changes:** Validates token family, checks ban status
```json
{
  "refresh_token": "token_from_cookie_or_body"
}
```
**Errors:**
- "Token reuse detected" - token family mismatch (security alert)
- "Account has been banned" - user was banned
- "Refresh token has expired" - token is stale

### POST /auth/logout
**Changes:** NOW REQUIRES AUTHENTICATION (was public before)
```
Headers: Authorization: Bearer {access_token}
```
**Effect:** Revokes all refresh tokens by clearing token family

### PATCH /auth/me/change-password
**Changes:** Now validates password policy
```json
{
  "currentPassword": "Test123!@#",
  "newPassword": "NewPass456!@"  // Must meet policy
}
```

### POST /auth/forgot-password
**Changes:** Uses strong password reset token
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
**Changes:** Uses new passwordResetToken, validates new password
```json
{
  "token": "abc123def456...",  // 128-char reset token
  "newPassword": "NewPass456!@"  // Must meet policy
}
```

---

## Password Policy

### Requirements
```
✓ At least 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special character (!@#$%^&*()_+-=[]{}; ':"|,.<>/?`)
```

### Valid Examples
```
✅ MyPassword123!
✅ SecurePass@2024
✅ Complex#Pwd456
```

### Invalid Examples
```
❌ Short123!      (too short)
❌ nouppercase1!  (no uppercase)
❌ NOLOWERCASE1!  (no lowercase)
❌ NoNumbers!     (no number)
❌ NoSpecial123   (no special char)
```

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Password does not meet security requirements",
  "error": {
    "message": "Password does not meet security requirements",
    "errors": [
      "Password must contain at least 1 uppercase letter",
      "Password must contain at least 1 special character (!@#$%^&*)"
    ]
  }
}
```

---

## Security Flows

### Login → Use Protected Endpoint → Logout

```
1. POST /auth/login
   └─→ Returns: { access_token, user }
   └─→ Sets: refresh_token cookie (7 days)

2. GET /protected
   └─→ Uses: access_token from Authorization header or cookie
   └─→ JWT Strategy validates:
       ✓ Token signature
       ✓ Token not expired (1 day)
       ✓ User exists in DB
       ✓ User is NOT banned ← NEW
   └─→ Request proceeds

3. (After 1 day, access token expires)

4. POST /auth/refresh
   └─→ Uses: refresh_token from body or cookie
   └─→ AuthService validates:
       ✓ Token signature
       ✓ Token not expired (7 days)
       ✓ User exists in DB
       ✓ User is NOT banned ← NEW
       ✓ Token family matches stored family ← NEW
   └─→ Returns: new { access_token }

5. POST /auth/logout
   └─→ Requires: Authorization header with access_token ← NEW
   └─→ Clears: lastRefreshTokenFamily in DB
   └─→ Effect: All old refresh_tokens become invalid ← NEW

6. POST /auth/refresh (with old token)
   └─→ Fails: "Token reuse detected" ← NEW
   └─→ User must login again
```

### Email Verification

```
1. POST /auth/register
   └─→ Creates user with emailVerificationCode (6 digits)
   └─→ Sends: verification email
   └─→ emailVerified = false (cannot login yet)

2. User clicks link with code

3. POST /auth/verify?code=123456
   └─→ Finds user by emailVerificationCode
   └─→ Validates: code matches AND not expired (24 hours)
   └─→ Sets: emailVerified = true
   └─→ Clears: emailVerificationCode, emailVerificationExpiry
   └─→ User can now login

4. POST /auth/resend-verification
   └─→ Generates new emailVerificationCode
   └─→ Extends expiry to 24 hours from now
   └─→ Sends new email
```

### Password Reset

```
1. POST /auth/forgot-password
   └─→ Generates: passwordResetToken (128 chars, unique)
   └─→ Sets: passwordResetExpiry to 1 hour from now
   └─→ Sends: reset link to email
   └─→ Returns: generic "if email exists" message (no enumeration)

2. User clicks link with token

3. POST /auth/reset-password
   └─→ Validates: passwordResetToken matches AND not expired
   └─→ Validates: newPassword meets policy
   └─→ Sets: new passwordHash
   └─→ Clears: passwordResetToken, passwordResetExpiry
   └─→ Returns: "Password reset successfully"
   └─→ User can login with new password
```

### Ban Management

```
1. Admin: POST /users/:id/ban
   └─→ Sets: isBanned = true, bannedAt, bannedReason, bannedBy

2. Banned user tries to login
   └─→ POST /auth/login
   └─→ Fails: UnauthorizedException "Account is banned"

3. Banned user with active session
   └─→ access_token still works (valid until expiry)
   └─→ POST /auth/refresh
   └─→ Fails: "Account has been banned" ← NEW
   └─→ Cannot get new access token

4. JWT validation on protected route
   └─→ Checks: isBanned status ← NEW
   └─→ Fails: "Account has been banned"

5. Admin: POST /users/:id/unban
   └─→ Sets: isBanned = false, clears banned fields
   └─→ User can login again
```

---

## Migration Checklist

- [ ] Backup database
- [ ] Run: `npx prisma migrate deploy`
- [ ] Verify: `npx prisma generate`
- [ ] Restart: Backend service
- [ ] Test: All flows in Testing Checklist
- [ ] Check: No "Token reuse" warnings in logs
- [ ] Monitor: Next 24 hours for issues

---

## Troubleshooting

### "Token reuse detected" in production
**Cause:** Legitimate device sharing or session stealing attempt
**Action:** 
1. Check user activity logs
2. Ask user to logout from all devices
3. User logs in again

### "Invalid verification code" after 24 hours
**Cause:** Code expired
**Action:** Send verification email with new code

### Users locked out after ban
**Cause:** Active sessions trying to refresh
**Action:** 
1. Unban user, or
2. User clears cookies and logs in again (if unbanned)

### Password policy error on register
**Cause:** Password doesn't meet requirements
**Action:** Show user the error messages from response and let them create stronger password

---

## Environment Variables

```bash
# Keep existing
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# New (optional, generated automatically)
# No new env vars required - uses existing ones
```

---

## Performance Impact

| Operation | Before | After | Impact |
|-----------|--------|-------|--------|
| Register | No policy check | Validate policy | ~1ms (regex) |
| Login | No ban check | 1 DB lookup | ~5ms |
| JWT Validate | No ban check | 1 DB lookup | ~5ms |
| Refresh | No validation | Token family check | ~5ms |
| Logout | No-op | Clear token family | ~5ms |

**Overall:** <10ms additional latency per auth operation

---

**Last Updated:** Jan 18, 2026
**Version:** 1.0 - Auth Security Refactor
