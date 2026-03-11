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
  const reason = typeof payload.reason === 'string' ? payload.reason : null;
  const shouldWarn =
    event === 'security.pinning.failed' ||
    event === 'security.integrity.blocked_sensitive_action' ||
    (event === 'security.pinning.unavailable' && reason !== 'missing_pinned_hashes');
  const logger = shouldWarn ? console.warn : console.debug;

  logger('[security-event]', event, payload);
}
