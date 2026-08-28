import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import { SOURCE_LABELS, TREND_STATUS_LABELS } from '../domain/TrendTopic';

const ADVANCED_FILTER_KEYS: Array<keyof TrendFilters> = [
  'source', 'minimumHeat', 'minimumGrowth', 'minimumScore', 'minimumTaiwanRelevance',
  'riskLevel', 'confidenceLevel', 'status', 'crossPlatformOnly', 'excludeNaturalDisasters',
  'excludePolitics', 'excludeHighRisk', 'excludeInsufficientEvidence',
];

export function getAdvancedFilterCount(filters: TrendFilters) {
  return ADVANCED_FILTER_KEYS.filter((key) => filters[key] !== DEFAULT_TREND_FILTERS[key]).length;
}

export function getActiveFilterLabels(filters: TrendFilters) {
  const labels: string[] = [];
  if (filters.query) labels.push(`關鍵字「${filters.query}」`);
  if (filters.category !== 'all') labels.push(`分類：${filters.category}`);
  if (filters.timeRangeHours !== DEFAULT_TREND_FILTERS.timeRangeHours) labels.push(`最近 ${filters.timeRangeHours} 小時`);
  if (filters.sortBy !== 'score') labels.push(`排序：${sortLabel(filters.sortBy)}`);
  if (filters.source !== 'all') labels.push(`來源：${SOURCE_LABELS[filters.source]}`);
  if (filters.minimumHeat) labels.push(`熱度至少 ${filters.minimumHeat}`);
  if (filters.minimumGrowth) labels.push(`增速至少 ${filters.minimumGrowth}%`);
  if (filters.minimumScore) labels.push(`總分至少 ${filters.minimumScore}`);
  if (filters.minimumTaiwanRelevance) labels.push(`台灣相關至少 ${filters.minimumTaiwanRelevance}`);
  if (filters.riskLevel !== 'all') labels.push(`${riskLevelLabel(filters.riskLevel)}風險`);
  if (filters.confidenceLevel !== 'all') labels.push(`${confidenceLabel(filters.confidenceLevel)}信心`);
  if (filters.status !== 'all') labels.push(`狀態：${TREND_STATUS_LABELS[filters.status]}`);
  if (filters.crossPlatformOnly) labels.push('只看跨平台');
  if (filters.excludeNaturalDisasters) labels.push('排除自然災害');
  if (filters.excludePolitics) labels.push('排除政治');
  if (filters.excludeHighRisk) labels.push('排除高風險');
  if (filters.excludeInsufficientEvidence) labels.push('排除證據不足');
  return labels;
}

const sortLabel = (sort:string) => ({score:'綜合分數',growth:'增長最快',heat:'目前最熱',newest:'最新出現',resonance:'社會共鳴',low_competition:'低競爭',low_risk:'低風險'}[sort] ?? sort);
const riskLevelLabel = (risk:string) => ({low:'低',medium:'中',high:'高'}[risk] ?? risk);
const confidenceLabel = (confidence:string) => ({low:'低',medium:'中',high:'高'}[confidence] ?? confidence);
