export type SecurityEventName =
  | 'security.pinning.enabled'
  | 'security.pinning.unavailable'
  | 'security.pinning.failed'
  | 'security.integrity.checked'
  | 'security.integrity.blocked_sensitive_action';

export function recordSecurityEvent(
  event: SecurityEventName,
  details: Record<string, string | number | boolean | null | undefined> = {}
) {
  const payload = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined)
  );

  // Keep telemetry non-sensitive by design (no PII/tokens/request bodies).
  console.warn('[security-event]', event, payload);
}
