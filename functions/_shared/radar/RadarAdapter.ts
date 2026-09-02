const STABLE_RADAR_API_BASE_URL = 'https://asia-trend-radar.gugupro-app.workers.dev/api/v1';

export const RADAR_MARKETS = ['TW', 'HK', 'MO', 'JP', 'KR', 'SG', 'MY', 'TH', 'ID', 'VN', 'PH', 'IN', 'US', 'GB', 'AU', 'CN'] as const;
export const RADAR_TYPES = ['search_rising', 'video_viral', 'dual', 'news_rising'] as const;
export const RADAR_SORTS = ['rank', 'freshness', 'growth'] as const;
export type RadarMarket = (typeof RADAR_MARKETS)[number];
export type RadarTrendType = (typeof RADAR_TYPES)[number];
export type RadarSort = (typeof RADAR_SORTS)[number];

export interface RadarQuery {
  market?: RadarMarket;
  category?: string;
  type?: RadarTrendType;
  hours?: number;
  minConfidence?: number;
  source?: string;
  sort?: RadarSort;
  limit?: number;
}

export interface RadarRankingItem {
  topicId: string;
  rank: number;
  originalTitle: string;
  traditionalTitle: string | null;
  marketCode: RadarMarket;
  categoryId: string;
  trendType: RadarTrendType;
  searchHeat: number | null;
  searchGrowth: number | null;
  videoHeat: number | null;
  videoGrowth: number | null;
  newsGrowth: number | null;
  resonance: number;
  freshness: number;
  confidence: number;
  sourceNames: string[];
  sourceUrl: string;
  publishedAt: string | null;
  acquiredAt: string;
  delayed: boolean;
}

export type RadarSourceStatus = 'success' | 'empty' | 'failed' | 'delayed' | 'waiting_credentials' | 'disabled';

export interface RadarSourceHealth {
  sourceCode: string;
  sourceName: string;
  status: RadarSourceStatus;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastRecordCount: number;
  message: string;
  sourceTrack: 'official' | 'public_signal';
  sourceFamily: string;
  fallbackFor: string | null;
}

export interface RadarMarketItem {
  code: RadarMarket;
  nameZh: string;
  group: 'asia' | 'leading' | 'restricted';
  enabled: boolean;
  newsOnly: boolean;
}

export interface RadarCategoryItem { id: string; nameZh: string; }

export interface RadarAdapterEnvironment {
  RADAR_API_BASE_URL?: string;
  RADAR_PROGRAM_API_TOKEN?: string;
}

export interface RadarAdapterResult<T> {
  data: T;
  acquiredAt: string | null;
  delayed: boolean;
  actualCount: number;
  requestedAt: string;
}

interface RadarUpstreamEnvelope<T> {
  data: T;
  meta?: { acquiredAt?: string | null; total?: number; limit?: number };
}

interface RadarCacheEntry<T> {
  data: T;
  acquiredAt: string | null;
  cachedAt: string;
  actualCount: number;
}

export interface RadarCacheStore {
  get(key: string): Promise<unknown> | unknown;
  set(key: string, value: unknown): Promise<unknown> | unknown;
}

export class RadarAdapterError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = 'RadarAdapterError';
  }
}

export interface RadarAdapterOptions {
  fetcher?: (request: Request) => Promise<Response>;
  cache?: RadarCacheStore;
  now?: () => string;
  wait?: (milliseconds: number) => Promise<void>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const allowedQueryKeys = ['market', 'category', 'type', 'hours', 'minConfidence', 'source', 'sort', 'limit'] as const;
// 熱門雷達的穩定識別碼會以「市場:主題」表示，主題可包含中、日、韓文字。
// 仍嚴格排除斜線、百分號與空白，避免路徑注入或多段路由。
const radarTopicIdPattern = /^[A-Za-z0-9\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF][A-Za-z0-9\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF._:-]{0,119}$/u;
type RadarCachePath = '/trends' | '/videos' | '/sources' | '/markets' | '/categories' | '/trends/:topicId';
const cacheTtlMilliseconds: Record<RadarCachePath, number> = {
  '/trends': 5 * 60_000,
  '/videos': 5 * 60_000,
  '/sources': 60_000,
  '/markets': 24 * 60 * 60_000,
  '/categories': 24 * 60 * 60_000,
  '/trends/:topicId': 5 * 60_000,
};

function safeFacet(name: string, value: string | null): string | undefined {
  if (value === null) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(value)) throw new RadarAdapterError('invalid_query', `${name} 不符合允許格式。`, 400);
  return value;
}

function safeInteger(name: string, value: string | null, minimum: number, maximum: number): number | undefined {
  if (value === null) return undefined;
  if (!/^\d+$/u.test(value)) throw new RadarAdapterError('invalid_query', `${name} 必須是整數。`, 400);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) throw new RadarAdapterError('invalid_query', `${name} 必須介於 ${minimum} 與 ${maximum}。`, 400);
  return parsed;
}

function safeConfidence(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) throw new RadarAdapterError('invalid_query', 'minConfidence 必須介於 0 與 1。', 400);
  return parsed;
}

function ensureAllowedKeys(parameters: URLSearchParams): void {
  for (const key of parameters.keys()) {
    if (!allowedQueryKeys.includes(key as (typeof allowedQueryKeys)[number])) throw new RadarAdapterError('invalid_query', `不允許的查詢欄位：${key}。`, 400);
  }
}

export function parseRadarQuery(url: URL): RadarQuery {
  ensureAllowedKeys(url.searchParams);
  const market = url.searchParams.get('market');
  const type = url.searchParams.get('type');
  const sort = url.searchParams.get('sort');
  if (market !== null && !RADAR_MARKETS.includes(market as RadarMarket)) throw new RadarAdapterError('invalid_query', 'market 不在允許清單。', 400);
  if (type !== null && !RADAR_TYPES.includes(type as RadarTrendType)) throw new RadarAdapterError('invalid_query', 'type 不在允許清單。', 400);
  if (sort !== null && !RADAR_SORTS.includes(sort as RadarSort)) throw new RadarAdapterError('invalid_query', 'sort 不在允許清單。', 400);
  return {
    ...(market === null ? {} : { market: market as RadarMarket }),
    ...(safeFacet('category', url.searchParams.get('category')) ? { category: safeFacet('category', url.searchParams.get('category')) } : {}),
    ...(type === null ? {} : { type: type as RadarTrendType }),
    ...(safeInteger('hours', url.searchParams.get('hours'), 1, 168) === undefined ? {} : { hours: safeInteger('hours', url.searchParams.get('hours'), 1, 168) }),
    ...(safeConfidence(url.searchParams.get('minConfidence')) === undefined ? {} : { minConfidence: safeConfidence(url.searchParams.get('minConfidence')) }),
    ...(safeFacet('source', url.searchParams.get('source')) ? { source: safeFacet('source', url.searchParams.get('source')) } : {}),
    ...(sort === null ? {} : { sort: sort as RadarSort }),
    ...(safeInteger('limit', url.searchParams.get('limit'), 1, 50) === undefined ? {} : { limit: safeInteger('limit', url.searchParams.get('limit'), 1, 50) }),
  };
}

export function validateRadarQuery(query: RadarQuery): RadarQuery {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) parameters.set(key, String(value));
  return parseRadarQuery(new URL(`https://competition.invalid/?${parameters.toString()}`));
}

export function validateRadarTopicId(value: string): string {
  if (typeof value !== 'string' || !radarTopicIdPattern.test(value) || value.includes('..')) {
    throw new RadarAdapterError('invalid_topic_id', 'topicId 不符合允許格式。', 400);
  }
  return value;
}

/** Cloudflare Pages keeps dynamic route parameters percent-encoded. Decode exactly
 * once before validation; a double-encoded slash remains a forbidden percent sign. */
export function decodeRadarTopicIdPathSegment(value: string): string {
  try {
    return validateRadarTopicId(decodeURIComponent(value));
  } catch (error) {
    if (error instanceof RadarAdapterError) throw error;
    throw new RadarAdapterError('invalid_topic_id', 'topicId 不符合允許格式。', 400);
  }
}

function stableBaseUrl(value?: string): string {
  const normalized = (value?.trim() || STABLE_RADAR_API_BASE_URL).replace(/\/+$/u, '');
  if (normalized !== STABLE_RADAR_API_BASE_URL) throw new RadarAdapterError('invalid_configuration', '熱門雷達服務網址不符合固定契約。', 503);
  return normalized;
}

function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function actualCount(data: unknown, meta?: RadarUpstreamEnvelope<unknown>['meta']): number {
  if (typeof meta?.total === 'number' && Number.isFinite(meta.total)) return Math.max(0, Math.trunc(meta.total));
  if (Array.isArray(data)) return data.length;
  return data === null || data === undefined ? 0 : 1;
}

function isEnvelope(value: unknown): value is RadarUpstreamEnvelope<unknown> {
  return typeof value === 'object' && value !== null && 'data' in value;
}

function cachePath(path: string): RadarCachePath {
  return path.startsWith('/trends/') ? '/trends/:topicId' : path as RadarCachePath;
}

export class RadarAdapter {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetcher: (request: Request) => Promise<Response>;
  private readonly cache?: RadarCacheStore;
  private readonly now: () => string;
  private readonly wait: (milliseconds: number) => Promise<void>;
  private readonly signal?: AbortSignal;
  private readonly timeoutMs: number;

  constructor(environment: RadarAdapterEnvironment, options: RadarAdapterOptions = {}) {
    this.baseUrl = stableBaseUrl(environment.RADAR_API_BASE_URL);
    this.token = environment.RADAR_PROGRAM_API_TOKEN?.trim() ?? '';
    this.fetcher = options.fetcher ?? ((request) => fetch(request.url, { method: request.method, headers: request.headers, signal: request.signal }));
    this.cache = options.cache;
    this.now = options.now ?? (() => new Date().toISOString());
    this.wait = options.wait ?? defaultWait;
    this.signal = options.signal;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  allowedPaths(): string[] { return ['/trends', '/trends/:topicId', '/videos', '/sources', '/markets', '/categories']; }
  trends(query: RadarQuery = {}) { return this.read<RadarRankingItem[]>('/trends', validateRadarQuery(query)); }
  videos(query: RadarQuery = {}) { return this.read<RadarRankingItem[]>('/videos', validateRadarQuery(query)); }
  trend(topicId: string) { return this.read<RadarRankingItem>(`/trends/${encodeURIComponent(validateRadarTopicId(topicId))}`); }
  sources() { return this.read<RadarSourceHealth[]>('/sources'); }
  markets() { return this.read<RadarMarketItem[]>('/markets'); }
  categories() { return this.read<RadarCategoryItem[]>('/categories'); }

  private assertReady(): void {
    if (this.signal?.aborted) throw new RadarAdapterError('aborted', '熱門雷達查詢已取消。', 499);
    if (this.token.length < 16) throw new RadarAdapterError('credentials_missing_or_invalid', '熱門雷達連線憑證未設定或已失效。', 503);
  }

  private async read<T>(path: string, query: RadarQuery = {}): Promise<RadarAdapterResult<T>> {
    this.assertReady();
    const search = new URLSearchParams();
    for (const key of allowedQueryKeys) {
      const value = query[key];
      if (value !== undefined) search.set(key, String(value));
    }
    const url = `${this.baseUrl}${path}${search.size ? `?${search.toString()}` : ''}`;
    const cacheKey = `radar:v1:${path}${search.size ? `?${search.toString()}` : ''}`;
    const cached = await this.readCache<T>(cacheKey);
    const requestedAt = this.now();
    const ttl = cacheTtlMilliseconds[cachePath(path)];
    if (cached && Date.parse(requestedAt) - Date.parse(cached.cachedAt) <= ttl) return { ...cached, requestedAt, delayed: false };

    try {
      const response = await this.fetchWithRateLimitRetry(new Request(url, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${this.token}` },
        signal: this.signal,
      }));
      if (response.status === 401 || response.status === 403) throw new RadarAdapterError('credentials_missing_or_invalid', '熱門雷達連線憑證未設定或已失效。', response.status);
      if (response.status === 429) throw new RadarAdapterError('rate_limited', '熱門雷達目前達到請求限制，請稍後再試。', 429);
      if (!response.ok) throw new RadarAdapterError('upstream_unavailable', '熱門雷達目前無法讀取，請稍後再試。', response.status >= 500 ? 503 : response.status);
      const body = await response.json() as unknown;
      if (!isEnvelope(body)) throw new RadarAdapterError('invalid_upstream_response', '熱門雷達回應格式不完整。', 502);
      const entry: RadarCacheEntry<T> = {
        data: body.data as T,
        acquiredAt: body.meta?.acquiredAt ?? null,
        cachedAt: requestedAt,
        actualCount: actualCount(body.data, body.meta),
      };
      await this.cache?.set(cacheKey, entry);
      return { data: entry.data, acquiredAt: entry.acquiredAt, actualCount: entry.actualCount, requestedAt, delayed: false };
    } catch (error) {
      if (error instanceof RadarAdapterError && ['credentials_missing_or_invalid', 'rate_limited', 'invalid_upstream_response'].includes(error.code)) throw error;
      if (this.signal?.aborted) throw new RadarAdapterError('aborted', '熱門雷達查詢已取消。', 499);
      if (cached) return { data: cached.data, acquiredAt: cached.acquiredAt, actualCount: cached.actualCount, requestedAt, delayed: true };
      if (error instanceof RadarAdapterError) throw error;
      throw new RadarAdapterError('upstream_unavailable', '熱門雷達目前無法讀取，請稍後再試。', 503);
    }
  }

  private async fetchWithRateLimitRetry(request: Request): Promise<Response> {
    let response: Response | undefined;
    for (let attempt = 0; attempt <= 2; attempt += 1) {
      if (this.signal?.aborted) throw new RadarAdapterError('aborted', '熱門雷達查詢已取消。', 499);
      const controller = new AbortController();
      const forwardAbort = () => controller.abort(this.signal?.reason);
      this.signal?.addEventListener('abort', forwardAbort, { once: true });
      const timer = setTimeout(() => controller.abort('radar_timeout'), this.timeoutMs);
      try {
        response = await this.fetcher(new Request(request.url, { method: 'GET', headers: request.headers, signal: controller.signal }));
      } catch (error) {
        if (this.signal?.aborted) throw new RadarAdapterError('aborted', '熱門雷達查詢已取消。', 499);
        if (controller.signal.aborted) throw new RadarAdapterError('upstream_timeout', '熱門雷達回應逾時，請稍後再試。', 504);
        throw error;
      } finally {
        clearTimeout(timer);
        this.signal?.removeEventListener('abort', forwardAbort);
      }
      if (response.status !== 429 || attempt === 2) return response;
      const retryAfter = Number(response.headers.get('Retry-After') ?? 0);
      await this.wait(Math.min(1_000, Math.max(0, retryAfter * 1_000 || 100 * (attempt + 1))));
    }
    return response as Response;
  }

  private async readCache<T>(key: string): Promise<RadarCacheEntry<T> | undefined> {
    const value = await this.cache?.get(key);
    if (!value || typeof value !== 'object' || !('cachedAt' in value) || !('data' in value)) return undefined;
    return value as RadarCacheEntry<T>;
  }
}

export class CloudflareRadarCache implements RadarCacheStore {
  constructor(private readonly cache: Cache, private readonly origin = 'https://competition-cache.invalid') {}

  async get(key: string): Promise<unknown> {
    const response = await this.cache.match(new Request(`${this.origin}/${encodeURIComponent(key)}`));
    return response?.json();
  }

  async set(key: string, value: unknown): Promise<void> {
    const response = Response.json(value, { headers: { 'Cache-Control': 'public, max-age=86400', 'Content-Type': 'application/json; charset=utf-8' } });
    await this.cache.put(new Request(`${this.origin}/${encodeURIComponent(key)}`), response);
  }
}

export function createCloudflareRadarAdapter(environment: RadarAdapterEnvironment, signal?: AbortSignal): RadarAdapter {
  const cloudflareCaches = caches as CacheStorage & { default: Cache };
  return new RadarAdapter(environment, { cache: new CloudflareRadarCache(cloudflareCaches.default), signal });
}
