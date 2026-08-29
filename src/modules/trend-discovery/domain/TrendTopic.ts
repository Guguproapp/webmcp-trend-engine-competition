export const TREND_CATEGORIES = [
  '社會共鳴', '生活消費', '職場話題', '科技與AI', '娛樂話題', '親子家庭',
  '健康生活', '美食餐飲', '寵物', '節慶事件', '爭議事件', '其他',
] as const;

export type TrendCategory = (typeof TREND_CATEGORIES)[number];
export type TrendStatus = 'candidate' | 'high_potential' | 'watching' | 'excluded' | 'expired' | 'insufficient_evidence' | 'high_risk';
export type TrendTier = 'viral' | 'rising' | 'observe' | 'not_recommended';
export type TrendSourcePlatform = 'gdelt_news' | 'youtube' | 'google_trends' | 'threads' | 'authorized_account' | 'competitor_tracking';
export type TrendGrowthStatus = 'baseline_pending' | 'measured';

export interface TrendHeatPoint { at: string; value: number; }

export interface TrendSourceItem {
  id: string;
  platform: TrendSourcePlatform;
  title: string;
  publisher: string;
  discoveredAt: string;
  publishedAt: string;
  fetchedAt: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  reportCount: number | null;
  engagementCount: number | null;
  growthDelta: number | null;
  growthStatus: TrendGrowthStatus;
  isMock: boolean;
  confidence: number;
  originalUrl: string;
  heatHistory: TrendHeatPoint[];
  acquisitionMethod?: SourceAcquisitionMethod;
}

export interface NaturalPhenomenonEvidence {
  massDiscussion: boolean;
  emotionalResonance: boolean;
  crossPlatformRise: boolean;
  extendableAngles: boolean;
  beyondWeatherInformation: boolean;
}

export interface TrendScoreComponent {
  key: string; label: string; rawValue: number; weight: number; points: number;
}

export interface TrendScoreResult {
  totalScore: number;
  tier: TrendTier;
  recommendedStatus: TrendStatus;
  components: TrendScoreComponent[];
  bonusReasons: string[];
  deductionReasons: string[];
  missingData: string[];
  scoreVersion: string;
  calculatedAt: string;
}

export interface TrendTopic {
  id: string;
  canonicalKey: string;
  title: string;
  summary: string;
  category: TrendCategory;
  keywords: string[];
  sourceItems: TrendSourceItem[];
  sourcePlatforms: TrendSourcePlatform[];
  firstSeenAt: string;
  lastSeenAt: string;
  currentHeat: number;
  growthRate: number;
  growthStatus: TrendGrowthStatus;
  freshness: number;
  crossPlatformResonance: number;
  socialResonance: number;
  taiwanRelevance: number;
  competitionSaturation: number;
  riskScore: number;
  estimatedLifeHours: number;
  sourceConfidence: number;
  businessOpportunity: string | null;
  totalScore: number;
  status: TrendStatus;
  tier: TrendTier;
  scoreVersion: string;
  calculatedAt: string;
  scoreDetails: TrendScoreResult;
  isNaturalDisaster: boolean;
  isPolitical: boolean;
  naturalEvidence?: NaturalPhenomenonEvidence;
}

export interface RawTrendSignal {
  canonicalKey: string;
  title: string;
  summary: string;
  category: TrendCategory;
  keywords: string[];
  sourceItem: TrendSourceItem;
  currentHeat: number;
  growthRate: number;
  growthStatus: TrendGrowthStatus;
  freshness: number;
  crossPlatformResonance: number;
  socialResonance: number;
  taiwanRelevance: number;
  competitionSaturation: number;
  riskScore: number;
  estimatedLifeHours: number;
  sourceConfidence: number;
  businessOpportunity: string | null;
  isNaturalDisaster: boolean;
  isPolitical: boolean;
  naturalEvidence?: NaturalPhenomenonEvidence;
}

export const TREND_TIER_LABELS: Record<TrendTier, string> = {
  viral: '爆紅高潛力', rising: '快速上升', observe: '持續觀察', not_recommended: '不建議',
};

export const TREND_STATUS_LABELS: Record<TrendStatus, string> = {
  candidate: '候選主題', high_potential: '高潛力', watching: '觀察中', excluded: '已排除',
  expired: '已過時', insufficient_evidence: '證據不足', high_risk: '高風險',
};

export const SOURCE_LABELS: Record<TrendSourcePlatform, string> = {
  gdelt_news: 'GDELT全球新聞資料', youtube: 'YouTube影音平台', google_trends: 'Google熱門搜尋趨勢', threads: 'Threads社群討論',
  authorized_account: '客戶授權資料', competitor_tracking: '競爭者與關鍵字追蹤',
};
import type { SourceAcquisitionMethod } from './VideoDiscovery';
