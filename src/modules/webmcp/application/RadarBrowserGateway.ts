export const RADAR_MARKETS = ['TW', 'HK', 'MO', 'JP', 'KR', 'SG', 'MY', 'TH', 'ID', 'VN', 'PH', 'IN', 'US', 'GB', 'AU', 'CN'] as const;
export const RADAR_TYPES = ['search_rising', 'video_viral', 'dual', 'news_rising'] as const;
export const RADAR_SORTS = ['rank', 'freshness', 'growth'] as const;
export type RadarMarket = (typeof RADAR_MARKETS)[number];
export type RadarType = (typeof RADAR_TYPES)[number];
export type RadarSort = (typeof RADAR_SORTS)[number];

export interface RadarQuery {
  market?: RadarMarket;
  category?: string;
  type?: RadarType;
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
  trendType: RadarType;
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

export interface RadarSourceHealth {
  sourceCode: string;
  sourceName: string;
  status: 'success' | 'empty' | 'failed' | 'delayed' | 'waiting_credentials' | 'disabled';
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastRecordCount: number;
  message: string;
  sourceTrack: 'official' | 'public_signal';
  sourceFamily: string;
  fallbackFor: string | null;
}

export interface RadarMarketItem { code: RadarMarket; nameZh: string; group: 'asia' | 'leading' | 'restricted'; enabled: boolean; newsOnly: boolean; }
export interface RadarCategoryItem { id: string; nameZh: string; }

export interface RadarGatewayResult<T> {
  ok: true;
  kind: 'trends' | 'trend' | 'videos' | 'sources' | 'markets' | 'categories';
  query: RadarQuery | { topicId: string };
  data: T;
  acquiredAt: string | null;
  delayed: boolean;
  actualCount: number;
  summary: string;
}

export interface RadarBrowserGateway {
  trends(query: RadarQuery, signal?: AbortSignal): Promise<RadarGatewayResult<RadarRankingItem[]>>;
  trend(topicId: string, signal?: AbortSignal): Promise<RadarGatewayResult<RadarRankingItem>>;
  videos(query: RadarQuery, signal?: AbortSignal): Promise<RadarGatewayResult<RadarRankingItem[]>>;
  sources(signal?: AbortSignal): Promise<RadarGatewayResult<RadarSourceHealth[]>>;
  markets(signal?: AbortSignal): Promise<RadarGatewayResult<RadarMarketItem[]>>;
  categories(signal?: AbortSignal): Promise<RadarGatewayResult<RadarCategoryItem[]>>;
}

export class RadarGatewayError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) { super(message); this.name = 'RadarGatewayError'; }
}

interface ErrorEnvelope { error?: { code?: string; message?: string } }

function buildQuery(query: RadarQuery): string {
  const parameters = new URLSearchParams();
  for (const key of ['market', 'category', 'type', 'hours', 'minConfidence', 'source', 'sort', 'limit'] as const) {
    const value = query[key]; if (value !== undefined) parameters.set(key, String(value));
  }
  return parameters.toString();
}

function summary(kind: RadarGatewayResult<unknown>['kind'], count: number, delayed: boolean): string {
  const prefix = delayed ? '目前顯示最近一次成功資料。' : '';
  const label = kind === 'videos' ? '爆款影音' : kind === 'trends' ? '熱門主題' : kind === 'sources' ? '來源狀態' : kind === 'markets' ? '市場' : kind === 'categories' ? '分類' : '主題';
  return `${prefix}${count ? `找到 ${count} 筆${label}。` : `目前沒有符合條件的${label}。`}`;
}

export class HttpRadarBrowserGateway implements RadarBrowserGateway {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  trends(query: RadarQuery, signal?: AbortSignal) { return this.read<RadarRankingItem[]>('/api/radar/trends', query, signal); }
  videos(query: RadarQuery, signal?: AbortSignal) { return this.read<RadarRankingItem[]>('/api/radar/videos', query, signal); }
  trend(topicId: string, signal?: AbortSignal) { return this.read<RadarRankingItem>(`/api/radar/trends/${encodeURIComponent(topicId)}`, { topicId }, signal); }
  sources(signal?: AbortSignal) { return this.read<RadarSourceHealth[]>('/api/radar/sources', {}, signal); }
  markets(signal?: AbortSignal) { return this.read<RadarMarketItem[]>('/api/radar/markets', {}, signal); }
  categories(signal?: AbortSignal) { return this.read<RadarCategoryItem[]>('/api/radar/categories', {}, signal); }

  private async read<T>(path: string, query: RadarQuery | Record<string, unknown>, signal?: AbortSignal): Promise<RadarGatewayResult<T>> {
    const search = 'topicId' in query ? '' : buildQuery(query as RadarQuery);
    let response: Response;
    try { response = await this.fetcher(`${path}${search ? `?${search}` : ''}`, { method: 'GET', headers: { Accept: 'application/json' }, signal }); }
    catch { throw new RadarGatewayError('network_error', '熱門雷達目前無法連線，請稍後再試。', 503); }
    const body = await response.json().catch(() => ({})) as Partial<RadarGatewayResult<T>> & ErrorEnvelope;
    if (!response.ok || body.ok !== true) throw new RadarGatewayError(body.error?.code ?? 'request_failed', body.error?.message ?? '熱門雷達查詢暫時無法完成。', response.status);
    const count = typeof body.actualCount === 'number' ? body.actualCount : Array.isArray(body.data) ? body.data.length : body.data ? 1 : 0;
    const delayed = body.delayed === true;
    return { ok: true, kind: body.kind ?? 'trends', query: body.query ?? query, data: body.data as T, acquiredAt: body.acquiredAt ?? null, delayed, actualCount: count, summary: summary(body.kind ?? 'trends', count, delayed) };
  }
}
