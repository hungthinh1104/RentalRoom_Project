# Auth Module Security Refactoring

## Overview
Comprehensive security improvements to the authentication module to address critical vulnerabilities in token handling, ban enforcement, and password policies.

## Changes Made

### 1. Schema Refactoring (prisma/schema.prisma)

**Before:** Single `verificationCode` and `verificationExpiry` fields used for both:
- Email verification (6-digit codes)
- Password reset (random tokens)

**After:** Separate fields to prevent collision attacks:

```prisma
// Email Verification (OTP-like, short expiry)
emailVerificationCode   String?   @map("email_verification_code")
emailVerificationExpiry DateTime? @map("email_verification_expiry")

// Password Reset (cryptographically strong, unique)
passwordResetToken      String?   @unique @map("password_reset_token")
passwordResetExpiry     DateTime? @map("password_reset_expiry")

// Refresh Token Tracking (stateful revocation)
lastRefreshTokenFamily  String?   @map("last_refresh_token_family")
lastRefreshIssuedAt     DateTime? @map("last_refresh_issued_at")
```

**Benefits:**
- Prevents token reuse attacks (reset token overwrites email code)
- Prevents brute force on verification code
- Enables refresh token rotation and revocation on logout/ban

### 2. Auth Service Improvements (src/modules/auth/auth.service.ts)

#### Password Policy Validation
Added comprehensive password requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Applied to:**
- `register()` - validates during signup
- `resetPassword()` - validates during password reset
- Changes propagated to `users.service.ts` for `changePassword()`

#### Token Generation Security
```typescript
// Old: Math.random() for verification code
const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

// New: Separate strong tokens
private generatePasswordResetToken(): string {
  return crypto.randomBytes(64).toString('hex'); // 128 chars, cryptographically strong
}

private generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Still 6 digits for email OTP
}
```

#### Ban Enforcement
Added ban checks at authentication level:

**validateUser():**
```typescript
if (user.isBanned) {
  throw new UnauthorizedException(
    `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`
  );
}
```

**refreshToken():**
```typescript
if (user.isBanned) {
  throw new UnauthorizedException('Account has been banned');
}
```

#### Refresh Token Rotation & Revocation
```typescript
// Generate unique token family for tracking
const tokenFamily = crypto.randomBytes(16).toString('hex');

// Store family for reuse detection
await this.prisma.user.update({
  where: { id: user.id },
  data: {
    lastRefreshTokenFamily: tokenFamily,
    lastRefreshIssuedAt: new Date(),
  },
});

// On next refresh, validate family matches
if (user.lastRefreshTokenFamily && payload.family !== user.lastRefreshTokenFamily) {
  throw new UnauthorizedException('Token reuse detected. Please login again.');
}
```

#### Token Revocation on Logout
```typescript
async revokeTokenFamily(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      lastRefreshTokenFamily: null,
      lastRefreshIssuedAt: null,
    },
  });
}
```

### 3. JWT Strategy Enhancement (src/modules/auth/strategies/jwt.strategy.ts)

Added ban check in JWT validation:

```typescript
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });

  // ✅ NEW: Check ban status
  if (user.isBanned) {
    throw new UnauthorizedException('Account has been banned');
  }

  return { id: user.id, email: user.email, role: user.role };
}
```

### 4. Auth Controller Updates (src/modules/auth/auth.controller.ts)

#### Enhanced Logout Endpoint
```typescript
@Post('logout')
@Auth() // ✅ NEW: Requires authentication
async logout(
  @CurrentUser() user: any,
  @Res({ passthrough: true }) res: Response,
) {
  // Revoke all tokens by clearing token family
  await this.authService.revokeTokenFamily(user.id);
  
  // Clear cookies
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('access_token', { path: '/' });

  return { message: 'Logged out successfully' };
}
```

**Impact:**
- All refresh tokens issued before logout are invalidated
- User must login again to use protected endpoints
- Works even if attacker has old refresh token

### 5. Users Service Enhancement (src/modules/users/users.service.ts)

Updated `changePassword()` to enforce password policy:

```typescript
async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
  // ... existing verification ...

  // ✅ NEW: Validate new password against policy
  const pwValidation = this.validatePasswordPolicy(changePasswordDto.newPassword);
  if (!pwValidation.valid) {
    throw new BadRequestException({
      message: 'New password does not meet security requirements',
      errors: pwValidation.errors,
    });
  }

  // ... hash and update ...
}
```

## Security Issues Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Email/Reset Token Collision** | Single field reuses token space | Separate fields, unique constraint on reset token |
| **Weak Token Generation** | `Math.random()` for reset | `crypto.randomBytes(64).toString('hex')` (128 chars) |
| **Ban Enforcement** | Ignored at login/refresh | Checked in `validateUser()`, JWT strategy, and `refreshToken()` |
| **Refresh Token Revocation** | Stateless, no logout | Token family tracking, cleared on logout |
| **Token Reuse Attack** | No detection | Family mismatch detection on refresh |
| **Weak Passwords** | Only `minLength: 6` | 8 chars + uppercase + lowercase + number + special char |
| **Password Change** | No policy validation | Enforces same policy as registration |

## Migration Steps

1. **Apply Prisma migration:**
   ```bash
   npx prisma migrate dev --name auth_security_refactor
   ```

2. **Update environment variables** (if needed):
   - Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Consider rotating these values

3. **Test flows:**
   - Register with weak password (should fail with detailed errors)
   - Register with valid password
   - Verify email
   - Login
   - Refresh token
   - Change password
   - Logout (refresh token should be invalidated)
   - Try to use old refresh token (should fail)

4. **Admin actions to test:**
   - Ban user → user cannot login
   - Ban user with active session → existing JWT still works until expiry, but refresh fails
   - Unban user → can login again

## Backwards Compatibility Notes

- **Old verification codes:** Migrated to `emailVerificationCode` column
- **Old password resets:** Will not work (stored in `verificationCode` column, not migrated)
  - Users will need to request new reset link
- **Active sessions:** Will continue to work until access token expires (1 day)
  - After expiry or refresh attempt, new security checks apply

## Future Enhancements

1. **Email Change Flow:** Implement verified email change with confirmation
2. **Two-Factor Authentication (2FA):** Add TOTP or SMS-based 2FA
3. **Device Management:** Track and manage active sessions per device
4. **Login History:** Log all authentication attempts for audit trail
5. **Biometric Authentication:** Support fingerprint/face recognition
6. **Rate Limiting Enhancement:** Per-IP rate limits for brute force protection

## Testing Recommendations

### Unit Tests
- `validatePasswordPolicy()` with various password combinations
- Token generation produces unique values
- Ban state is properly enforced

### Integration Tests
- Full registration flow with password policy validation
- Email verification code is scoped to user (no collision)
- Password reset with new token field
- Refresh token rotation and family validation
- Logout revokes all tokens
- Ban enforcement at all auth levels

### Security Tests
- Attempt to reuse old refresh token (should fail)
- Attempt to use code from different user's verification (should fail)
- Attempt to use expired password reset token (should fail)
- Attempt login as banned user (should fail)
- Brute force on short email codes (should handle gracefully)

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
