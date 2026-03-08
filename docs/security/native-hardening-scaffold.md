# Native Hardening Scaffold (iOS + Android)

This repo now includes scaffolding for transport security and runtime integrity checks. Enforcement is controlled by env flags so rollout can be staged safely.

## What is implemented

- App bootstrap security provider: `src/providers/SecurityProvider.tsx`
- TLS pinning bootstrap (optional runtime module): `src/security/nativePinning.ts`
- Runtime integrity snapshot + checks: `src/security/runtimeIntegrity.ts`
- Security telemetry event logger (PII-safe): `src/security/securityTelemetry.ts`
- Transport security Expo config plugin: `plugins/with-transport-security.js`
- Sensitive action guards wired to:
  - Review submission (`write_review`)
  - Account sign-out (`account_action`)

## Required install steps for full pinning/integrity

1. Install pinning library:
   - `npm i react-native-ssl-public-key-pinning`
2. Install jailbreak/root detector (optional but recommended):
   - `npm i jail-monkey`
3. Build native app (EAS/dev client) so native modules are linked.

## Env flags

- `EXPO_PUBLIC_API_PINNED_KEY_HASHES`
- `EXPO_PUBLIC_SECURITY_ENFORCE_PINNING`
- `EXPO_PUBLIC_SECURITY_ENFORCE_INTEGRITY`
- `EXPO_PUBLIC_SECURITY_ALLOW_EMULATOR`

Recommended rollout:

1. Start with both enforce flags `false` and validate telemetry only.
2. Enable pinning enforcement in staging.
3. Enable integrity enforcement for sensitive actions after false-positive review.

## Pin hash generation

Use SPKI SHA-256 hashes for current and backup cert public keys. Keep at least 2 valid hashes to avoid lockout during cert rotation.

## Current behavior

- If enforcement is disabled, missing native modules or hashes do not block app usage.
- If enforcement is enabled, sensitive actions are blocked when checks fail.
