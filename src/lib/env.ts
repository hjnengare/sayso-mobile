import Constants from 'expo-constants';

const isDevBuild = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

function toBooleanFlag(raw: string | undefined, fallback: boolean) {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim().toLowerCase();
  if (value === '1' || value === 'true' || value === 'yes' || value === 'on') return true;
  if (value === '0' || value === 'false' || value === 'no' || value === 'off') return false;
  return fallback;
}

function toList(raw: string | undefined): string[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeApiBaseUrl(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, '');

  if (trimmed === 'https://sayso.co.za') {
    return 'https://www.sayso.co.za';
  }

  return trimmed;
}

function assertSecureApiBaseUrl(apiBaseUrl: string) {
  if (isDevBuild) return;
  if (apiBaseUrl.startsWith('https://')) return;

  throw new Error(
    '[ENV] EXPO_PUBLIC_API_BASE_URL must use HTTPS in non-development builds.'
  );
}

export const ENV = {
  apiBaseUrl: normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  ),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  apiPinnedKeyHashes: toList(process.env.EXPO_PUBLIC_API_PINNED_KEY_HASHES),
  securityEnforcePinning: toBooleanFlag(process.env.EXPO_PUBLIC_SECURITY_ENFORCE_PINNING, false),
  securityEnforceIntegrity: toBooleanFlag(process.env.EXPO_PUBLIC_SECURITY_ENFORCE_INTEGRITY, false),
  securityAllowEmulator: toBooleanFlag(process.env.EXPO_PUBLIC_SECURITY_ALLOW_EMULATOR, isDevBuild),
  easProjectId:
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    (Constants.expoConfig?.extra as any)?.eas?.projectId ||
    '',
};

assertSecureApiBaseUrl(ENV.apiBaseUrl);

if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
  console.warn('[ENV] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

if (ENV.securityEnforcePinning && ENV.apiPinnedKeyHashes.length === 0) {
  console.warn('[ENV] Pinning enforcement enabled but EXPO_PUBLIC_API_PINNED_KEY_HASHES is empty.');
}
