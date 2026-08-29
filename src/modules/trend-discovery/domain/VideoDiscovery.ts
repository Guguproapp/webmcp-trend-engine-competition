import type { IntelligenceType, SpecificMarketRegion, VideoContentForm } from './RegionalDiscovery';

export const VIDEO_PLATFORMS = ['youtube', 'tiktok', 'instagram', 'facebook', 'douyin', 'kuaishou', 'xiaohongshu', 'bilibili'] as const;
export type VideoPlatform = (typeof VIDEO_PLATFORMS)[number];

export const VIDEO_PLATFORM_LABELS: Record<VideoPlatform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  facebook: 'Facebook Reels',
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小紅書',
  bilibili: 'B站',
};

export const SOURCE_ACQUISITION_METHODS = [
  'official_api', 'authorized_account', 'official_site_assisted', 'user_shared',
  'search_engine_candidate', 'public_news', 'waiting_review', 'temporary_failure', 'insufficient_evidence',
] as const;
export type SourceAcquisitionMethod = (typeof SOURCE_ACQUISITION_METHODS)[number];

export const SOURCE_ACQUISITION_LABELS: Record<SourceAcquisitionMethod, string> = {
  official_api: '官方API自動取得',
  authorized_account: '使用者帳號授權取得',
  official_site_assisted: '官方網站輔助取得',
  user_shared: '使用者分享取得',
  search_engine_candidate: '搜尋引擎候選結果',
  public_news: '新聞公開資料',
  waiting_review: '等待平台審查',
  temporary_failure: '來源暫時失敗',
  insufficient_evidence: '證據不足',
};

export type VideoEvidenceConfidence = 'high' | 'medium' | 'low';
export const VIDEO_CONFIDENCE_LABELS: Record<VideoEvidenceConfidence, string> = {
  high: '高：官方數據可追溯',
  medium: '中：來源可追溯，部分數據待驗證',
  low: '低：使用者提供，尚待驗證',
};

export interface VideoCandidateMetrics {
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
}

export interface VideoCandidateSnapshot extends VideoCandidateMetrics {
  capturedAt: string;
  source: 'user_provided';
}

export interface VideoCandidate {
  id: string;
  platform: VideoPlatform;
  originalUrl: string;
  normalizedUrl: string;
  title: string;
  author: string;
  acquiredAt: string;
  updatedAt: string;
  acquisitionMethod: Extract<SourceAcquisitionMethod, 'official_site_assisted' | 'user_shared' | 'search_engine_candidate'>;
  evidenceConfidence: VideoEvidenceConfidence;
  verified: false;
  notes: string;
  snapshots: VideoCandidateSnapshot[];
  region?: SpecificMarketRegion;
  intelligenceType?: IntelligenceType;
  contentForm?: VideoContentForm;
}

export interface NormalizedVideoUrl {
  platform: VideoPlatform;
  originalUrl: string;
  normalizedUrl: string;
}

export class VideoUrlValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'VideoUrlValidationError'; }
}

const TRACKING_PARAMETERS = new Set(['fbclid', 'igshid', 'si', 'feature', 'share_app_id', 'share_link_id', 'is_from_webapp', 'sender_device']);
const allowedHost = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

function cleanTracking(url: URL) {
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLocaleLowerCase('en-US').startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLocaleLowerCase('en-US'))) url.searchParams.delete(key);
  }
  url.hash = '';
}

function ensureSafeHttps(url: URL) {
  if (url.protocol !== 'https:') throw new VideoUrlValidationError('只接受使用HTTPS加密連線的官方影音網址。');
  if (url.username || url.password || url.port) throw new VideoUrlValidationError('網址不得包含帳號、密碼或自訂連接埠。');
}

function normalizeYouTube(url: URL): NormalizedVideoUrl | null {
  let videoId: string;
  if (url.hostname === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
  else if (allowedHost(url.hostname, 'youtube.com')) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? '';
    else videoId = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{6,20})/u)?.[1] ?? '';
  } else return null;
  if (!/^[A-Za-z0-9_-]{6,20}$/u.test(videoId)) throw new VideoUrlValidationError('找不到有效的YouTube影片識別碼。');
  return { platform:'youtube', originalUrl:url.toString(), normalizedUrl:`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` };
}

function normalizeFacebook(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'facebook.com') && url.hostname !== 'fb.watch') return null;
  const validPath = url.hostname === 'fb.watch'
    ? /^\/[A-Za-z0-9_-]+\/?$/u.test(url.pathname)
    : /^\/(?:watch\/?|reel\/[A-Za-z0-9._-]+\/?|share\/(?:v|r)\/[A-Za-z0-9._-]+\/?|[^/]+\/videos\/[A-Za-z0-9._-]+\/?)/u.test(url.pathname);
  if (!validPath || (url.pathname.startsWith('/watch') && !url.searchParams.get('v'))) throw new VideoUrlValidationError('請貼上Facebook公開影片、Reels或貼文的完整網址。');
  cleanTracking(url);
  url.hostname = url.hostname === 'fb.watch' ? 'fb.watch' : 'www.facebook.com';
  return { platform:'facebook', originalUrl:url.toString(), normalizedUrl:url.toString() };
}

function normalizeInstagram(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'instagram.com')) return null;
  const match = url.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)\/?/u);
  if (!match) throw new VideoUrlValidationError('請貼上Instagram公開Reels短影音或貼文網址。');
  return { platform:'instagram', originalUrl:url.toString(), normalizedUrl:`https://www.instagram.com/${match[1]}/${match[2]}/` };
}

function normalizeTikTok(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'tiktok.com')) return null;
  const longVideo = url.pathname.match(/^\/@([^/]+)\/video\/([0-9]+)\/?/u);
  const shortPath = url.pathname.match(/^\/t\/([A-Za-z0-9]+)\/?/u);
  const mobileShortPath = (url.hostname === 'vm.tiktok.com' || url.hostname === 'vt.tiktok.com')
    ? url.pathname.match(/^\/([A-Za-z0-9]+)\/?/u)
    : null;
  if (!longVideo && !shortPath && !mobileShortPath) throw new VideoUrlValidationError('請貼上TikTok公開影片的完整網址。');
  const normalizedUrl = longVideo
    ? `https://www.tiktok.com/@${encodeURIComponent(longVideo[1])}/video/${longVideo[2]}`
    : mobileShortPath
      ? `https://${url.hostname}/${mobileShortPath[1]}/`
      : `https://www.tiktok.com/t/${shortPath![1]}/`;
  return { platform:'tiktok', originalUrl:url.toString(), normalizedUrl };
}

function normalizeDouyin(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'douyin.com') && !allowedHost(url.hostname, 'iesdouyin.com')) return null;
  const video = url.pathname.match(/^\/(?:share\/)?video\/([0-9]+)\/?/u);
  const short = url.hostname === 'v.douyin.com' ? url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?/u) : null;
  if (!video && !short) throw new VideoUrlValidationError('請貼上抖音公開影片的完整網址。');
  cleanTracking(url);
  return {
    platform:'douyin', originalUrl:url.toString(),
    normalizedUrl: video ? `https://www.douyin.com/video/${video[1]}` : `https://v.douyin.com/${short![1]}/`,
  };
}

function normalizeKuaishou(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'kuaishou.com')) return null;
  const video = url.pathname.match(/^\/(?:short-video|f)\/([A-Za-z0-9_-]+)\/?/u);
  const short = url.hostname === 'v.kuaishou.com' ? url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?/u) : null;
  if (!video && !short) throw new VideoUrlValidationError('請貼上快手公開影片的完整網址。');
  cleanTracking(url);
  return {
    platform:'kuaishou', originalUrl:url.toString(),
    normalizedUrl: video ? `https://www.kuaishou.com/short-video/${video[1]}` : `https://v.kuaishou.com/${short![1]}/`,
  };
}

function normalizeXiaohongshu(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'xiaohongshu.com') && !allowedHost(url.hostname, 'xhslink.com')) return null;
  const item = url.pathname.match(/^\/(?:explore|discovery\/item)\/([A-Za-z0-9]+)\/?/u);
  const short = allowedHost(url.hostname, 'xhslink.com') ? url.pathname.match(/^\/(?:a\/)?([A-Za-z0-9_-]+)\/?/u) : null;
  if (!item && !short) throw new VideoUrlValidationError('請貼上小紅書公開筆記或影片的完整網址。');
  cleanTracking(url);
  return {
    platform:'xiaohongshu', originalUrl:url.toString(),
    normalizedUrl:item ? `https://www.xiaohongshu.com/explore/${item[1]}` : `https://xhslink.com/${short![1]}`,
  };
}

function normalizeBilibili(url: URL): NormalizedVideoUrl | null {
  if (!allowedHost(url.hostname, 'bilibili.com') && url.hostname !== 'b23.tv') return null;
  const video = url.pathname.match(/^\/video\/((?:BV|av)[A-Za-z0-9]+)\/?/u);
  const short = url.hostname === 'b23.tv' ? url.pathname.match(/^\/([A-Za-z0-9]+)\/?/u) : null;
  if (!video && !short) throw new VideoUrlValidationError('請貼上B站公開影片的完整網址。');
  cleanTracking(url);
  return {
    platform:'bilibili', originalUrl:url.toString(),
    normalizedUrl:video ? `https://www.bilibili.com/video/${video[1]}` : `https://b23.tv/${short![1]}`,
  };
}

export function normalizeVideoUrl(input: string): NormalizedVideoUrl {
  const trimmed = input.trim();
  if (!trimmed) throw new VideoUrlValidationError('請貼上影音網址。');
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new VideoUrlValidationError('網址格式不正確，請貼上完整HTTPS網址。'); }
  ensureSafeHttps(url);
  const host = url.hostname.toLocaleLowerCase('en-US').replace(/\.$/u, '');
  url.hostname = host;
  const normalized = normalizeYouTube(url) ?? normalizeFacebook(url) ?? normalizeInstagram(url) ?? normalizeTikTok(url)
    ?? normalizeDouyin(url) ?? normalizeKuaishou(url) ?? normalizeXiaohongshu(url) ?? normalizeBilibili(url);
  if (!normalized) throw new VideoUrlValidationError('只接受八個指定影音平台的官方網域。');
  return { ...normalized, originalUrl: trimmed };
}

export interface PlatformSearchLinks {
  official: Record<VideoPlatform, string>;
  creativeCenter: string;
  webSearch: Record<VideoPlatform, string>;
}

export function buildPlatformSearchLinks(keyword: string): PlatformSearchLinks {
  const query = keyword.trim();
  const encoded = encodeURIComponent(query);
  const web = (site: string, extra = '') => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${extra} ${query}`.trim())}`;
  return {
    official: {
      youtube: `https://www.youtube.com/results?search_query=${encoded}`,
      tiktok: `https://www.tiktok.com/search/video?q=${encoded}`,
      instagram: `https://www.instagram.com/explore/search/keyword/?q=${encoded}`,
      facebook: `https://www.facebook.com/search/videos/?q=${encoded}`,
      douyin: `https://www.douyin.com/search/${encoded}`,
      kuaishou: `https://www.kuaishou.com/search/video?searchKey=${encoded}`,
      xiaohongshu: `https://www.xiaohongshu.com/search_result?keyword=${encoded}`,
      bilibili: `https://search.bilibili.com/all?keyword=${encoded}`,
    },
    creativeCenter: 'https://ads.tiktok.com/creative/creativeCenter/trends',
    webSearch: {
      youtube: web('youtube.com/watch'),
      tiktok: web('tiktok.com', 'video'),
      instagram: web('instagram.com/reel', 'Reels'),
      facebook: web('facebook.com', '影片'),
      douyin: web('douyin.com/video', '影片'),
      kuaishou: web('kuaishou.com/short-video', '影片'),
      xiaohongshu: web('xiaohongshu.com/explore', '影片'),
      bilibili: web('bilibili.com/video', '影片'),
    },
  };
}

export function sourceAcquisitionForPlatform(platform: 'gdelt_news' | 'youtube'): SourceAcquisitionMethod {
  return platform === 'youtube' ? 'official_api' : 'public_news';
}
