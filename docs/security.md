# Security status

Implemented and covered by tests (`apps/api/tests/integration.test.ts`):
Argon2 hashing; HTTP-only, SameSite=Lax, Secure-in-production session cookie; account lockout; role + active-subscription gates; seller ID always derived from the session;
CSRF origin check on cookie-authenticated writes; NoSQL operator injection rejection; Zod validation on inputs; helmet headers; rate limits; payment verification with the gateway + atomic idempotent activation;
immutable wallet ledger; audit log; JSON request logs without bodies/cookies.

Added in phase 11 (all tested): email OTP verification (6 digits, HMAC-hashed, 10 min, single use, 5 guesses, newest code only) required before buying a plan; password reset by emailed code (generic responses, signs out all sessions);
server-side revocable sessions (list, sign out one/others, logout really invalidates the token); change password; TOTP two-factor with encrypted seed, replay protection, 8 one-time recovery codes.

**Not implemented yet (do not claim otherwise):** SMS/phone OTP (email only; needs a Bangladeshi SMS gateway), email delivery needs `SMTP_URL` in production (without it codes are only printed in dev), trusted-device / "remember me",
2FA enforcement for admins (optional per user today), file-upload malware scanning, CSP tuning for the web app, webhook signature check beyond gateway re-validation, dependency scanning in CI, penetration test.
Set `ENCRYPTION_KEY` (32+ random chars) separately from `JWT_SECRET`; rotating it invalidates enrolled authenticators.
