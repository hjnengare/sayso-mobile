# Backend Security Handoff Checklist (for Mobile Hardening)

This checklist aligns backend implementation with the mobile `ApiError` contract and security gating.

## 1) AuthN/AuthZ enforcement

- Enforce bearer auth on all mobile user-write endpoints:
  - `/api/user/*`
  - `/api/onboarding/*`
  - `/api/reviews*`
  - `/api/notifications/*`
  - `/api/contact`
  - RSVP/reminder write endpoints
- Deny by default for all user resources.
- Add ownership checks for every record-level read/write.
- Ensure unauthorized ownership violations return `403`, not `404`.

## 2) Standardized error envelope

Return JSON for all errors:

```json
{
  "error": {
    "code": "STRING_MACHINE_CODE",
    "message": "Safe user-facing summary",
    "requestId": "trace-id"
  }
}
```

Required statuses:

- `401` unauthenticated
- `403` authenticated but forbidden
- `429` rate limited
- `5xx` internal/transient errors

Contract notes:

- Always include `error.code`.
- Keep `error.message` non-sensitive.
- Include request trace ID in body and `x-request-id` header.

## 3) Token/session lifecycle

- Short access-token TTL.
- Refresh token rotation + reuse detection enabled.
- Session revocation endpoint:
  - `POST /api/user/sessions/revoke-all`
- Optional session inventory endpoint:
  - `GET /api/user/sessions`

Acceptance:

- Reused revoked refresh token is rejected.
- Revoke-all invalidates existing sessions within defined SLA.

## 4) Abuse controls

Apply route-specific rate limits and payload limits:

- Login/sign-up/auth callbacks
- Onboarding writes
- Review creation/helpful-vote
- Contact submissions
- Push token registration

Required behavior:

- Return `429` with stable code (for example `RATE_LIMITED`).
- Log limiter key, route, and window metadata.

## 5) Validation and input safety

- Strict schema validation on all write endpoints.
- Reject unknown fields for sensitive mutations.
- Enforce max payload sizes (especially reviews/uploads/contact).
- Sanitize output where user-generated text is rendered downstream.

## 6) Observability and incident readiness

Track security events:

- `auth.login.failed_velocity`
- `auth.refresh.reuse_detected`
- `api.authz.denied`
- `api.rate_limited`
- `api.pinning_mismatch` (if backend receives client signal)

Operational requirements:

- Alert thresholds for spikes in 401/403/429.
- Runbook for token revocation, key rotation, and forced logout.

## 7) Security tests (must be in CI)

- Authz regression tests for ownership boundaries.
- Token lifecycle tests (expiry/rotation/revoke-all).
- Rate limit tests for abuse endpoints.
- Contract tests asserting standardized error envelope.

## 8) Mobile integration dependencies

Backend team should provide:

- Final machine-readable error code list.
- Session revoke-all endpoint availability date.
- Rate-limit policy per endpoint (window, max, retry-after semantics).
- Trace ID propagation format.
