import { Platform } from 'react-native';
import { ENV } from '../lib/env';
import { recordSecurityEvent } from './securityTelemetry';

type SslPinningModule = {
  initializeSslPinning?: (config: {
    [domain: string]: {
      includeSubdomains?: boolean;
      publicKeyHashes: string[];
    };
  }) => Promise<void>;
};

export type PinningState =
  | { status: 'enabled' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

function loadSslPinningModule(): SslPinningModule | null {
  const runtimeRequire = (globalThis as { require?: (id: string) => unknown }).require;
  if (!runtimeRequire) return null;
  try {
    return runtimeRequire('react-native-ssl-public-key-pinning') as SslPinningModule;
  } catch {
    return null;
  }
}

function getApiDomain(): string | null {
  try {
    const url = new URL(ENV.apiBaseUrl);
    return url.hostname;
  } catch {
    return null;
  }
}

export async function initializeCertificatePinning(): Promise<PinningState> {
  if (Platform.OS === 'web') {
    return { status: 'skipped', reason: 'web_platform' };
  }

  const apiDomain = getApiDomain();
  if (!apiDomain) {
    return { status: 'skipped', reason: 'invalid_api_domain' };
  }

  if (ENV.apiPinnedKeyHashes.length === 0) {
    const reason = 'missing_pinned_hashes';
    recordSecurityEvent('security.pinning.unavailable', { reason });
    if (ENV.securityEnforcePinning) {
      return { status: 'failed', reason };
    }
    return { status: 'skipped', reason };
  }

  const pinningModule = loadSslPinningModule();
  if (!pinningModule?.initializeSslPinning) {
    const reason = 'pinning_module_unavailable';
    recordSecurityEvent('security.pinning.unavailable', { reason });
    if (ENV.securityEnforcePinning) {
      return { status: 'failed', reason };
    }
    return { status: 'skipped', reason };
  }

  try {
    await pinningModule.initializeSslPinning({
      [apiDomain]: {
        includeSubdomains: true,
        publicKeyHashes: ENV.apiPinnedKeyHashes,
      },
    });

    recordSecurityEvent('security.pinning.enabled', { domain: apiDomain });
    return { status: 'enabled' };
  } catch {
    const reason = 'pinning_init_failed';
    recordSecurityEvent('security.pinning.failed', { domain: apiDomain, reason });
    return { status: 'failed', reason };
  }
}
