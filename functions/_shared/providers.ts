import { safePublicHttpsUrl } from '../../src/shared/security/PublicUrlSafety';

export interface RealSourceRecord {
  provider: 'gdelt' | 'youtube';
  originalId: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  reportCount: number | null;
  language: string;
  sourceCountry: string;
}

export type ProviderRunState = 'enabled' | 'waiting_authorization' | 'temporary_failure' | 'quota_exceeded' | 'disabled';

export interface ProviderCollectionResult {
  provider: 'gdelt' | 'youtube';
  state: ProviderRunState;
  message: string;
  records: RealSourceRecord[];
  attemptedAt: string;
  completedAt: string;
  nextRetryAt: string | null;
  errorType: string | null;
}

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse { articles?: GdeltArticle[]; }

const GDELT_HTTPS_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_HTTP_ENDPOINT = 'http://api.gdeltproject.org/api/v2/doc/doc';
const MAX_PROVIDER_BYTES = 2_000_000;

function parseGdeltDate(value: string | undefined) {
  if (!value || !/^\d{8}T\d{6}Z$/u.test(value)) return null;
  const normalized = `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T${value.slice(9,11)}:${value.slice(11,13)}:${value.slice(13,15)}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function validateProviderResponse(response: Response) {
  const length = Number(response.headers.get('content-length') ?? '0');
  if (length > MAX_PROVIDER_BYTES) throw new Error('來源回應超過安全大小限制');
  if (!response.ok) throw new Error(`來源回應 ${response.status}`);
}

function gdeltUrl(endpoint: string) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    query: 'sourcecountry:taiwan', mode: 'artlist', maxrecords: '100', timespan: '24h', sort: 'datedesc', format: 'json',
  }).toString();
  return url;
}

export async function collectGdelt(fetcher: typeof fetch, now = new Date()): Promise<ProviderCollectionResult> {
  const attemptedAt = now.toISOString();
  let response: Response;
  let usedTransportFallback = false;
  const requestInit = {
    headers: { accept: 'application/json' },
    cf: { cacheTtl: 900, cacheEverything: true },
  } as RequestInit;
  try {
    response = await fetcher(gdeltUrl(GDELT_HTTPS_ENDPOINT), requestInit);
    validateProviderResponse(response);
  } catch {
    usedTransportFallback = true;
    response = await fetcher(gdeltUrl(GDELT_HTTP_ENDPOINT), requestInit);
    validateProviderResponse(response);
  }
  const payload = await response.json() as GdeltResponse;
  const seen = new Set<string>();
  const records = (payload.articles ?? []).flatMap((article): RealSourceRecord[] => {
    const publishedAt = parseGdeltDate(article.seendate);
    const title = article.title?.replace(/\s+/gu, ' ').trim();
    if (!article.url || !title || !publishedAt) return [];
    const canonicalUrl = safePublicHttpsUrl(article.url);
    if (!canonicalUrl) return [];
    const parsedUrl = new URL(canonicalUrl);
    if (seen.has(canonicalUrl)) return [];
    seen.add(canonicalUrl);
    return [{
      provider: 'gdelt', originalId: canonicalUrl, title, publisher: article.domain ?? parsedUrl.hostname,
      url: canonicalUrl, publishedAt, fetchedAt: attemptedAt, viewCount: null, likeCount: null, commentCount: null,
      reportCount: null, language: article.language ?? 'Unknown', sourceCountry: article.sourcecountry ?? 'Unknown',
    }];
  });
  return {
    provider: 'gdelt', state: 'enabled', records, attemptedAt, completedAt: new Date().toISOString(), errorType: usedTransportFallback ? 'tls_fallback' : null,
    message: usedTransportFallback ? '已取得官方公開新聞索引；官方加密憑證異常，暫由伺服器端官方備援網址取得。' : 'GDELT全球新聞資料運作正常。',
    nextRetryAt: null,
  };
}

interface YouTubeSearchResponse { items?: Array<{ id?: { videoId?: string } }>; error?: { errors?: Array<{ reason?: string }>; message?: string }; }
interface YouTubeVideoResponse {
  items?: Array<{ id?: string; snippet?: { title?: string; channelTitle?: string; publishedAt?: string; defaultLanguage?: string }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
  error?: { errors?: Array<{ reason?: string }>; message?: string };
}

function count(value: string | undefined) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

async function youtubeJson<T extends { error?: { errors?: Array<{ reason?: string }>; message?: string } }>(fetcher: typeof fetch, url: URL, apiKey: string) {
  const response = await fetcher(url, { headers: { accept: 'application/json', 'x-goog-api-key': apiKey } });
  const length = Number(response.headers.get('content-length') ?? '0');
  if (length > MAX_PROVIDER_BYTES) throw new Error('YouTube回應超過安全大小限制');
  const payload = await response.json() as T;
  if (!response.ok) {
    const reason = payload.error?.errors?.[0]?.reason ?? `http_${response.status}`;
    const error = new Error(payload.error?.message ?? 'YouTube資料取得失敗');
    error.name = reason;
    throw error;
  }
  return payload;
}

export async function collectYouTube(fetcher: typeof fetch, apiKey: string | undefined, queries: string[], now = new Date()): Promise<ProviderCollectionResult> {
  const attemptedAt = now.toISOString();
  if (!apiKey) return { provider:'youtube', state:'waiting_authorization', message:'等待YouTube官方API金鑰設定。', records:[], attemptedAt, completedAt:attemptedAt, nextRetryAt:null, errorType:'missing_secret' };
  try {
    const videoIds = new Set<string>();
    for (const query of queries.slice(0, 3)) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({ part:'snippet', q:query, type:'video', regionCode:'TW', relevanceLanguage:'zh-Hant', publishedAfter:new Date(now.getTime()-24*3600000).toISOString(), maxResults:'10', order:'date' }).toString();
      const payload = await youtubeJson<YouTubeSearchResponse>(fetcher, url, apiKey);
      payload.items?.forEach((item) => { if (item.id?.videoId) videoIds.add(item.id.videoId); });
    }
    if (!videoIds.size) return { provider:'youtube', state:'enabled', message:'YouTube官方資料運作正常，本次沒有符合條件的新影片。', records:[], attemptedAt, completedAt:new Date().toISOString(), nextRetryAt:null, errorType:null };
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.search = new URLSearchParams({ part:'snippet,statistics', id:[...videoIds].join(',') }).toString();
    const details = await youtubeJson<YouTubeVideoResponse>(fetcher, detailsUrl, apiKey);
    const records = (details.items ?? []).flatMap((video): RealSourceRecord[] => video.id && video.snippet?.title && video.snippet.publishedAt ? [{
      provider:'youtube', originalId:video.id, title:video.snippet.title, publisher:video.snippet.channelTitle ?? 'YouTube頻道',
      url:`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`, publishedAt:new Date(video.snippet.publishedAt).toISOString(), fetchedAt:attemptedAt,
      viewCount:count(video.statistics?.viewCount), likeCount:count(video.statistics?.likeCount), commentCount:count(video.statistics?.commentCount), reportCount:null,
      language:video.snippet.defaultLanguage ?? 'zh-Hant', sourceCountry:'Taiwan region query',
    }] : []);
    return { provider:'youtube', state:'enabled', message:'YouTube影音平台資料運作正常。', records, attemptedAt, completedAt:new Date().toISOString(), nextRetryAt:null, errorType:null };
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    const quota = /quota/iu.test(reason);
    return { provider:'youtube', state:quota?'quota_exceeded':'temporary_failure', message:quota?'YouTube今日配額已用完，將保留最近成功資料。':'YouTube來源暫時失敗，將保留最近成功資料。', records:[], attemptedAt, completedAt:new Date().toISOString(), nextRetryAt:new Date(now.getTime()+3600000).toISOString(), errorType:reason };
  }
}
