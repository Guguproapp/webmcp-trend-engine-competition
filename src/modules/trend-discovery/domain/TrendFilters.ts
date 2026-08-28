import type { TrendCategory, TrendSourcePlatform, TrendStatus, TrendTopic } from './TrendTopic';

export type TrendSort = 'score' | 'growth' | 'heat' | 'newest' | 'resonance' | 'low_competition' | 'low_risk';
export type TrendTimeRange = 1 | 6 | 24 | 72 | 168;
export interface TrendFilters {
  query: string; category: TrendCategory | 'all'; source: TrendSourcePlatform | 'all'; timeRangeHours: TrendTimeRange;
  minimumHeat: number; minimumGrowth: number; minimumScore: number; minimumTaiwanRelevance: number;
  crossPlatformOnly: boolean; riskLevel: 'all' | 'low' | 'medium' | 'high';
  confidenceLevel: 'all' | 'high' | 'medium' | 'low'; status: TrendStatus | 'all';
  excludeNaturalDisasters: boolean; excludePolitics: boolean; excludeHighRisk: boolean;
  excludeInsufficientEvidence: boolean; sortBy: TrendSort;
}
export const DEFAULT_TREND_FILTERS: TrendFilters = {
  query: '', category: 'all', source: 'all', timeRangeHours: 168, minimumHeat: 0, minimumGrowth: 0,
  minimumScore: 0, minimumTaiwanRelevance: 0, crossPlatformOnly: false, riskLevel: 'all',
  confidenceLevel: 'all', status: 'all', excludeNaturalDisasters: false, excludePolitics: false,
  excludeHighRisk: false, excludeInsufficientEvidence: false, sortBy: 'score',
};
const riskMatches = (topic: TrendTopic, level: TrendFilters['riskLevel']) => level === 'all' || (level === 'low' && topic.riskScore < 35) || (level === 'medium' && topic.riskScore >= 35 && topic.riskScore < 70) || (level === 'high' && topic.riskScore >= 70);
const confidenceMatches = (topic: TrendTopic, level: TrendFilters['confidenceLevel']) => level === 'all' || (level === 'high' && topic.sourceConfidence >= 75) || (level === 'medium' && topic.sourceConfidence >= 45 && topic.sourceConfidence < 75) || (level === 'low' && topic.sourceConfidence < 45);

export function filterAndSortTopics(topics: TrendTopic[], filters: TrendFilters, now = new Date()) {
  const cutoff = now.getTime() - filters.timeRangeHours * 3600000;
  const query = filters.query.trim().toLocaleLowerCase('zh-TW');
  const filtered = topics.filter((topic) => {
    const searchable = `${topic.title} ${topic.summary} ${topic.keywords.join(' ')}`.toLocaleLowerCase('zh-TW');
    return (!query || searchable.includes(query)) && (filters.category === 'all' || topic.category === filters.category)
      && (filters.source === 'all' || topic.sourcePlatforms.includes(filters.source)) && new Date(topic.lastSeenAt).getTime() >= cutoff
      && topic.currentHeat >= filters.minimumHeat && topic.growthRate >= filters.minimumGrowth && topic.totalScore >= filters.minimumScore
      && topic.taiwanRelevance >= filters.minimumTaiwanRelevance && (!filters.crossPlatformOnly || topic.sourcePlatforms.length >= 2)
      && riskMatches(topic, filters.riskLevel) && confidenceMatches(topic, filters.confidenceLevel)
      && (filters.status === 'all' || topic.status === filters.status) && (!filters.excludeNaturalDisasters || !topic.isNaturalDisaster)
      && (!filters.excludePolitics || !topic.isPolitical) && (!filters.excludeHighRisk || topic.riskScore < 70)
      && (!filters.excludeInsufficientEvidence || topic.status !== 'insufficient_evidence');
  });
  const comparators: Record<TrendSort, (a: TrendTopic, b: TrendTopic) => number> = {
    score: (a, b) => b.totalScore - a.totalScore, growth: (a, b) => b.growthRate - a.growthRate,
    heat: (a, b) => b.currentHeat - a.currentHeat, newest: (a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime(),
    resonance: (a, b) => b.socialResonance - a.socialResonance,
    low_competition: (a, b) => a.competitionSaturation - b.competitionSaturation, low_risk: (a, b) => a.riskScore - b.riskScore,
  };
  return [...filtered].sort(comparators[filters.sortBy]);
}
