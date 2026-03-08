import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../lib/env';
import { recordSecurityEvent } from './securityTelemetry';

type JailMonkeyModule = {
  isJailBroken?: () => boolean;
  isOnExternalStorage?: () => boolean;
  isDebuggedMode?: () => boolean;
  hookDetected?: () => boolean;
  canMockLocation?: () => boolean;
};

export type RuntimeIntegritySnapshot = {
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  isPhysicalDevice: boolean;
  isEmulator: boolean;
  isJailBroken: boolean | null;
  isDebugged: boolean | null;
  compromised: boolean;
  reasons: string[];
};

function loadJailMonkey(): JailMonkeyModule | null {
  const runtimeRequire = (globalThis as { require?: (id: string) => unknown }).require;
  if (!runtimeRequire) return null;
  try {
    return runtimeRequire('jail-monkey') as JailMonkeyModule;
  } catch {
    return null;
  }
}

export async function getRuntimeIntegritySnapshot(): Promise<RuntimeIntegritySnapshot> {
  if (Platform.OS === 'web') {
    return {
      platform: 'web',
      isPhysicalDevice: true,
      isEmulator: false,
      isJailBroken: null,
      isDebugged: null,
      compromised: false,
      reasons: [],
    };
  }

  const reasons: string[] = [];
  const jailMonkey = loadJailMonkey();
  const isPhysicalDevice = Device.isDevice;
  const isEmulator = !isPhysicalDevice;

  const rootedExperimental = (Device as unknown as { isRootedExperimental?: boolean | null }).isRootedExperimental;
  const isJailBroken = Boolean(
    rootedExperimental ||
      jailMonkey?.isJailBroken?.() ||
      jailMonkey?.hookDetected?.() ||
      jailMonkey?.isOnExternalStorage?.()
  );
  const isDebugged = jailMonkey?.isDebuggedMode?.() ?? null;

  if (isEmulator && !ENV.securityAllowEmulator) {
    reasons.push('emulator_not_allowed');
  }
  if (isJailBroken) {
    reasons.push('jailbreak_or_root_detected');
  }
  if (isDebugged) {
    reasons.push('debugger_detected');
  }

  const compromised = reasons.length > 0;

  recordSecurityEvent('security.integrity.checked', {
    platform: Platform.OS,
    compromised,
    reasons: reasons.join(',') || 'none',
  });

  return {
    platform: Platform.OS,
    isPhysicalDevice,
    isEmulator,
    isJailBroken: jailMonkey || rootedExperimental != null ? isJailBroken : null,
    isDebugged,
    compromised,
    reasons,
  };
}
