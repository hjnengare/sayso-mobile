import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ENV } from '../lib/env';
import { initializeCertificatePinning, type PinningState } from '../security/nativePinning';
import {
  getRuntimeIntegritySnapshot,
  type RuntimeIntegritySnapshot,
} from '../security/runtimeIntegrity';
import { recordSecurityEvent } from '../security/securityTelemetry';

type SensitiveAction = 'write_review' | 'account_action';

type SecurityContextValue = {
  pinning: PinningState | null;
  integrity: RuntimeIntegritySnapshot | null;
  isReady: boolean;
  guardSensitiveAction: (action: SensitiveAction) => { allowed: boolean; reason?: string };
};

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [pinning, setPinning] = useState<PinningState | null>(null);
  const [integrity, setIntegrity] = useState<RuntimeIntegritySnapshot | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const [pinningState, integrityState] = await Promise.all([
        initializeCertificatePinning(),
        getRuntimeIntegritySnapshot(),
      ]);

      if (!active) return;
      setPinning(pinningState);
      setIntegrity(integrityState);
    };

    init().catch(() => {
      if (!active) return;
      setPinning({ status: 'failed', reason: 'security_bootstrap_failed' });
      setIntegrity(null);
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SecurityContextValue>(
    () => ({
      pinning,
      integrity,
      isReady: pinning !== null,
      guardSensitiveAction: (action) => {
        if (ENV.securityEnforcePinning && pinning?.status === 'failed') {
          recordSecurityEvent('security.integrity.blocked_sensitive_action', {
            action,
            reason: 'pinning_failed',
          });
          return { allowed: false, reason: 'Secure connection requirements were not met.' };
        }

        if (ENV.securityEnforceIntegrity && integrity?.compromised) {
          recordSecurityEvent('security.integrity.blocked_sensitive_action', {
            action,
            reason: integrity.reasons.join(',') || 'integrity_failed',
          });
          return {
            allowed: false,
            reason:
              'This action is blocked because your device failed runtime security checks.',
          };
        }

        return { allowed: true };
      },
    }),
    [pinning, integrity]
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}
