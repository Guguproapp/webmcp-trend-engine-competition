export const PRIVATE_URL_WARNING_ZH = '此網址可能包含私人存取權限或安全憑證，系統不會保存。請改用不含私人參數的公開網址。';
export const PRIVATE_URL_WARNING_EN = 'This URL may contain private access permissions or security credentials and will not be stored. Please use a public URL without private parameters.';

const SENSITIVE_QUERY_NAMES = new Set([
  'token', 'access_token', 'refresh_token', 'api_key', 'apikey', 'key', 'secret', 'password',
  'credential', 'authorization', 'auth', 'code', 'cookie', 'session', 'session_id', 'signature',
  'sig', 'nonce', 'googleaccessid', 'awsaccesskeyid', 'key_pair_id', 'policy', 'resourcekey',
  'authkey', 'share_token', 'download_token',
]);
const SENSITIVE_DATA_FIELD_NAMES = new Set([
  'token', 'access_token', 'refresh_token', 'api_key', 'apikey', 'secret', 'password', 'credential',
  'authorization', 'auth', 'cookie', 'session', 'session_id', 'signature', 'sig', 'nonce',
]);

export class PublicUrlSafetyError extends Error {
  constructor() {
    super(PRIVATE_URL_WARNING_ZH);
    this.name = 'PublicUrlSafetyError';
  }
}

function normalizedQueryName(value: string): string {
  return value.trim().toLocaleLowerCase('en-US').replace(/[^a-z0-9]/gu, '');
}

export function isSensitiveQueryName(value: string): boolean {
  const lowered = value.trim().toLocaleLowerCase('en-US');
  const canonical = normalizedQueryName(value);
  return lowered.startsWith('x-amz-') || lowered.startsWith('x-goog-') || canonical.startsWith('xamz') || canonical.startsWith('xgoog')
    || [...SENSITIVE_QUERY_NAMES].some((name) => normalizedQueryName(name) === canonical);
}

function isSensitiveDataFieldName(value: string): boolean {
  const lowered = value.trim().toLocaleLowerCase('en-US');
  const canonical = normalizedQueryName(value);
  return lowered.startsWith('x-amz-') || lowered.startsWith('x-goog-') || canonical.startsWith('xamz') || canonical.startsWith('xgoog')
    || [...SENSITIVE_DATA_FIELD_NAMES].some((name) => normalizedQueryName(name) === canonical);
}

export function parsePublicHttpsUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new PublicUrlSafetyError();
  }
  const host = url.hostname.toLocaleLowerCase('en-US').replace(/^\[|\]$/gu, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || !isPublicHostname(host)) throw new PublicUrlSafetyError();
  for (const key of url.searchParams.keys()) if (isSensitiveQueryName(key)) throw new PublicUrlSafetyError();
  return url;
}

function isPublicHostname(host: string): boolean {
  const ipv6 = host.includes(':');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.home.arpa')) return false;
  if (ipv6 && (host === '::' || host === '::1' || host.startsWith('::ffff:') || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb') || host.startsWith('ff') || host.startsWith('2001:db8'))) return false;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u)?.slice(1).map(Number);
  if (!ipv4 || ipv4.some((part) => part > 255)) return !ipv4;
  const [first, second, third] = ipv4;
  return !(first === 0 || first === 10 || first === 127 || first >= 224
    || (first === 100 && second >= 64 && second <= 127) || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 0)
    || (first === 192 && second === 168) || (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100)))
    || (first === 203 && second === 0 && third === 113));
}

export function safePublicHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return parsePublicHttpsUrl(value).toString();
  } catch {
    return null;
  }
}

const URL_CANDIDATE = /https?:\/\/[^\s<>"']+/giu;
const ASSIGNMENT_CANDIDATE = /\b([A-Za-z][A-Za-z0-9_.-]{1,40})\s*[:=]\s*[^\s&;,]+/gu;

export function containsSensitiveText(value: string): boolean {
  if (/\bBearer\s+[^\s,;]+/iu.test(value)) return true;
  if ([...value.matchAll(URL_CANDIDATE)].some(([candidate]) => safePublicHttpsUrl(candidate) === null)) return true;
  return [...value.matchAll(ASSIGNMENT_CANDIDATE)].some((match) => isSensitiveQueryName(match[1]));
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(URL_CANDIDATE, (candidate) => safePublicHttpsUrl(candidate) ?? '[private URL removed]')
    .replace(ASSIGNMENT_CANDIDATE, (match, label: string) => isSensitiveQueryName(label) ? `${label}=[redacted]` : match)
    .replace(/\bBearer\s+[^\s,;]+/giu, 'Bearer [redacted]');
}

export function sanitizeUntrustedPublicData(value: unknown): unknown {
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map(sanitizeUntrustedPublicData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !isSensitiveDataFieldName(key))
    .map(([key, item]) => [key, sanitizeUntrustedPublicData(item)]));
}
