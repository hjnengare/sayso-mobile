import { ENV } from './env';
import { getOrCreateAnonymousId } from './anonymousClient';
import { supabase } from './supabase';

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_GET_RETRY_COUNT = 1;
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

type ApiErrorPayload = {
  code?: string;
  message?: string;
  error?: string;
  requestId?: string;
  request_id?: string;
};

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  retriable: boolean;
  details: unknown;

  constructor({
    status,
    code,
    message,
    requestId,
    retriable,
    details,
  }: {
    status: number;
    code: string;
    message: string;
    requestId?: string | null;
    retriable?: boolean;
    details?: unknown;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId ?? null;
    this.retriable = Boolean(retriable);
    this.details = details;
  }
}

type ApiFetchInit = RequestInit & {
  timeoutMs?: number;
  retryCount?: number;
  includeAnonymousIdOnMissingAuth?: boolean;
};

function getSafeStatusMessage(status: number, fallback = 'Request failed') {
  if (status === 0) return 'Network request failed. Check your connection and try again.';
  if (status === 400) return 'The request could not be processed. Please try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 408) return 'The request timed out. Please try again.';
  if (status === 429) return 'Too many requests. Please wait and try again.';
  if (status >= 500) return 'Server error. Please try again in a moment.';
  return fallback;
}

function isJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('application/json');
}

async function readResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  if (!isJsonResponse(response)) {
    const text = await response.text().catch(() => '');
    return text || null;
  }
  return response.json().catch(() => null);
}

function extractErrorPayload(payload: unknown): ApiErrorPayload {
  if (!payload || typeof payload !== 'object') return {};
  const candidate = payload as Record<string, unknown>;
  const nestedError = candidate.error;
  if (nestedError && typeof nestedError === 'object' && !Array.isArray(nestedError)) {
    return nestedError as ApiErrorPayload;
  }
  return candidate as ApiErrorPayload;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retriable;
  }
  return false;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isFormDataBody(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function buildAuthHeaders(
  headers: Headers,
  includeAnonymousIdOnMissingAuth?: boolean
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
    return;
  }

  if (includeAnonymousIdOnMissingAuth) {
    const anonId = await getOrCreateAnonymousId();
    headers.set('x-anonymous-id', anonId);
  }
}

async function requestOnce<T>(path: string, init: ApiFetchInit): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    includeAnonymousIdOnMissingAuth = false,
    retryCount: _ignoredRetryCount,
    ...requestInit
  } = init;
  void _ignoredRetryCount;

  const method = (requestInit.method || 'GET').toUpperCase();
  const headers = new Headers(requestInit.headers || {});
  await buildAuthHeaders(headers, includeAnonymousIdOnMissingAuth);

  if (requestInit.body && !headers.has('Content-Type') && !isFormDataBody(requestInit.body)) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = requestInit.signal;

  const abortFromExternal = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternal();
    } else {
      externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    }
  }

  try {
    const response = await fetch(`${ENV.apiBaseUrl}${path}`, {
      ...requestInit,
      method,
      headers,
      signal: controller.signal,
    });

    const payload = await readResponsePayload(response);
    if (!response.ok) {
      const envelope = extractErrorPayload(payload);
      const status = response.status;
      const code = String(envelope.code || `HTTP_${status}`);
      const message = getSafeStatusMessage(status);

      throw new ApiError({
        status,
        code,
        message,
        requestId:
          typeof envelope.requestId === 'string'
            ? envelope.requestId
            : typeof envelope.request_id === 'string'
              ? envelope.request_id
              : response.headers.get('x-request-id'),
        retriable: RETRYABLE_STATUS_CODES.has(status) && method === 'GET',
        details: payload,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const timedOut = controller.signal.aborted && !externalSignal?.aborted;
    throw new ApiError({
      status: timedOut ? 408 : 0,
      code: timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
      message: getSafeStatusMessage(timedOut ? 408 : 0),
      retriable: method === 'GET',
      details: null,
    });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortFromExternal);
    }
  }
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const maxRetries = method === 'GET' ? Math.max(0, init.retryCount ?? DEFAULT_GET_RETRY_COUNT) : 0;

  let attempt = 0;
  while (true) {
    try {
      return await requestOnce<T>(path, init);
    } catch (error) {
      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }
      attempt += 1;
      await delay(250 * 2 ** (attempt - 1));
    }
  }
}
