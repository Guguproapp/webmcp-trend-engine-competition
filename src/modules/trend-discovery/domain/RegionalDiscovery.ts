import type { VideoPlatform } from './VideoDiscovery';

export const MARKET_REGIONS = ['china_mainland', 'taiwan', 'hong_kong', 'macau', 'all'] as const;
export type MarketRegion = (typeof MARKET_REGIONS)[number];
export type SpecificMarketRegion = Exclude<MarketRegion, 'all'>;

export const MARKET_REGION_LABELS: Record<MarketRegion, string> = {
  china_mainland: '中國大陸',
  taiwan: '台灣',
  hong_kong: '香港',
  macau: '澳門',
  all: '全部地區',
};

export const INTELLIGENCE_TYPES = [
  'search_rising',
  'video_viral',
  'dual_viral',
  'video_supply_gap',
  'news_growth',
  'insufficient_evidence',
] as const;
export type IntelligenceType = (typeof INTELLIGENCE_TYPES)[number];

export const INTELLIGENCE_TYPE_LABELS: Record<IntelligenceType, string> = {
  search_rising: '熱搜上升',
  video_viral: '影音爆紅',
  dual_viral: '雙重爆紅',
  video_supply_gap: '影音供給缺口',
  news_growth: '新聞快速增加',
  insufficient_evidence: '證據不足',
};

export const YOUTUBE_CONTENT_FILTERS = ['all', 'long_video', 'shorts'] as const;
export type YouTubeContentFilter = (typeof YOUTUBE_CONTENT_FILTERS)[number];
export type VideoContentForm = Exclude<YouTubeContentFilter, 'all'> | 'short_video' | 'unknown';

export const YOUTUBE_CONTENT_FILTER_LABELS: Record<YouTubeContentFilter, string> = {
  all: '全部',
  long_video: '長影音',
  shorts: 'Shorts短影音',
};

export const VIDEO_CONTENT_FORM_LABELS: Record<VideoContentForm, string> = {
  long_video: '長影音',
  shorts: 'Shorts短影音',
  short_video: '短影音',
  unknown: '尚待分類',
};

export const REGION_DEFAULT_PLATFORMS: Record<MarketRegion, readonly VideoPlatform[]> = {
  taiwan: ['youtube', 'tiktok', 'instagram', 'facebook'],
  hong_kong: ['youtube', 'instagram', 'facebook', 'xiaohongshu'],
  macau: ['youtube', 'instagram', 'facebook', 'douyin'],
  china_mainland: ['douyin', 'kuaishou', 'xiaohongshu', 'bilibili'],
  all: ['youtube', 'tiktok', 'instagram', 'facebook', 'douyin', 'kuaishou', 'xiaohongshu', 'bilibili'],
};

export interface RegionalSearchFilters {
  keyword: string;
  region: MarketRegion;
  intelligenceType: IntelligenceType | 'all';
  platforms: VideoPlatform[];
  timeRangeHours: 24 | 72 | 168;
  youtubeContentForm: YouTubeContentFilter;
}

export const DEFAULT_REGIONAL_SEARCH_FILTERS: RegionalSearchFilters = {
  keyword: '',
  region: 'taiwan',
  intelligenceType: 'all',
  platforms: [...REGION_DEFAULT_PLATFORMS.taiwan],
  timeRangeHours: 24,
  youtubeContentForm: 'all',
};

export interface IntelligenceEvidence {
  searchVolume: number | null;
  searchGrowthRate: number | null;
  videoGrowthRate: number | null;
  videoEvidenceReliable: boolean;
  newsGrowthRate: number | null;
  videoSupplyCount: number | null;
}

export function classifyIntelligence(evidence: IntelligenceEvidence): IntelligenceType {
  const reliableSearchRise = evidence.searchVolume !== null && evidence.searchVolume > 0
    && evidence.searchGrowthRate !== null && evidence.searchGrowthRate > 0;
  const reliableVideoRise = evidence.videoEvidenceReliable
    && evidence.videoGrowthRate !== null && evidence.videoGrowthRate > 0;
  if (reliableSearchRise && reliableVideoRise) return 'dual_viral';
  if (reliableSearchRise && evidence.videoSupplyCount !== null && evidence.videoSupplyCount <= 3) return 'video_supply_gap';
  if (reliableSearchRise) return 'search_rising';
  if (reliableVideoRise) return 'video_viral';
  if (evidence.newsGrowthRate !== null && evidence.newsGrowthRate > 0) return 'news_growth';
  return 'insufficient_evidence';
}

export function inferYouTubeContentForm(url: string): VideoContentForm {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/shorts/')) return 'shorts';
    if (parsed.pathname === '/watch' || parsed.hostname === 'youtu.be') return 'long_video';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function canCompareYouTubeBenchmarks(first: VideoContentForm, second: VideoContentForm) {
  return first !== 'unknown' && second !== 'unknown' && first === second
    && (first === 'long_video' || first === 'shorts');
}

export function isRegionalResultMatch(
  item: { region: SpecificMarketRegion; intelligenceType: IntelligenceType; platform: VideoPlatform; contentForm: VideoContentForm },
  filters: RegionalSearchFilters,
) {
  return (filters.region === 'all' || item.region === filters.region)
    && (filters.intelligenceType === 'all' || item.intelligenceType === filters.intelligenceType)
    && filters.platforms.includes(item.platform)
    && (item.platform !== 'youtube' || filters.youtubeContentForm === 'all' || item.contentForm === filters.youtubeContentForm);
}
