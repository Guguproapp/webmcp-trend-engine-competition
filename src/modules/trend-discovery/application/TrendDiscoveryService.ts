import { filterAndSortTopics, type TrendFilters } from '../domain/TrendFilters';
import { TrendScoreCalculator } from '../domain/TrendScoreCalculator';
import type { RawTrendSignal, TrendTopic } from '../domain/TrendTopic';
import type { TrendSourceProvider } from './TrendSourceProvider';
import type { ExclusionReason, TrendAuditPort, TrendExclusionRepository, TrendFilterRuleRepository, TrendRefreshLogRepository, TrendTopicRepository, TrendWatchlistRepository } from './repositories';

const average = (items: RawTrendSignal[], field: keyof RawTrendSignal) => Math.round(items.reduce((sum, item) => sum + Number(item[field]), 0) / items.length);

export function mergeTrendSignals(signals: RawTrendSignal[], calculator: TrendScoreCalculator, now = new Date()): TrendTopic[] {
  const grouped = new Map<string, RawTrendSignal[]>();
  for (const signal of signals) grouped.set(signal.canonicalKey, [...(grouped.get(signal.canonicalKey) ?? []), signal]);
  return [...grouped.entries()].map(([canonicalKey, items]) => {
    const first = items[0];
    const sourceItems = items.map((item) => item.sourceItem);
    const merged: RawTrendSignal = {
      ...first,
      currentHeat: average(items, 'currentHeat'), growthRate: average(items, 'growthRate'), freshness: average(items, 'freshness'),
      crossPlatformResonance: average(items, 'crossPlatformResonance'), socialResonance: average(items, 'socialResonance'),
      taiwanRelevance: average(items, 'taiwanRelevance'), competitionSaturation: average(items, 'competitionSaturation'),
      riskScore: average(items, 'riskScore'), estimatedLifeHours: average(items, 'estimatedLifeHours'), sourceConfidence: average(items, 'sourceConfidence'),
    };
    const score = calculator.calculate(merged, now);
    return {
      id: `trend-${canonicalKey}`, canonicalKey, title: first.title, summary: first.summary, category: first.category,
      keywords: [...new Set(items.flatMap((item) => item.keywords))], sourceItems,
      sourcePlatforms: [...new Set(sourceItems.map((item) => item.platform))],
      firstSeenAt: sourceItems.map((item) => item.discoveredAt).sort()[0],
      lastSeenAt: sourceItems.map((item) => item.discoveredAt).sort().at(-1)!,
      currentHeat: merged.currentHeat, growthRate: merged.growthRate, freshness: merged.freshness,
      crossPlatformResonance: merged.crossPlatformResonance, socialResonance: merged.socialResonance,
      taiwanRelevance: merged.taiwanRelevance, competitionSaturation: merged.competitionSaturation,
      riskScore: merged.riskScore, estimatedLifeHours: merged.estimatedLifeHours, sourceConfidence: merged.sourceConfidence,
      businessOpportunity: null, totalScore: score.totalScore, status: score.recommendedStatus, tier: score.tier,
      scoreVersion: score.scoreVersion, calculatedAt: score.calculatedAt, scoreDetails: score,
      isNaturalDisaster: first.isNaturalDisaster, isPolitical: first.isPolitical, naturalEvidence: first.naturalEvidence,
    };
  });
}

export class TrendDiscoveryService {
  constructor(
    private readonly provider: TrendSourceProvider,
    private readonly topics: TrendTopicRepository,
    private readonly watchlist: TrendWatchlistRepository,
    private readonly exclusions: TrendExclusionRepository,
    private readonly rules: TrendFilterRuleRepository,
    private readonly refreshLogs: TrendRefreshLogRepository,
    private readonly audit: TrendAuditPort,
    private readonly calculator = new TrendScoreCalculator(),
  ) {}

  async refresh(now = new Date()) {
    const signals = await this.provider.collectSignals({ refreshedAt: now.toISOString() });
    const topics = mergeTrendSignals(signals, this.calculator, now).sort((a, b) => b.totalScore - a.totalScore);
    this.topics.replaceAll(topics);
    this.refreshLogs.append({ id: crypto.randomUUID(), refreshedAt: now.toISOString(), sourceCount: this.provider.getProviderNames().length, signalCount: signals.length, topicCount: topics.length, highPotentialCount: topics.filter((topic) => topic.status === 'high_potential').length });
    this.record('trend.refresh', `重新彙整 ${signals.length} 筆 Mock 訊號，產生 ${topics.length} 個主題。`);
    return topics;
  }

  async ensureData() { return this.topics.list().length ? this.topics.list() : this.refresh(); }
  listAll() { return this.topics.list(); }
  find(id: string) { return this.topics.find(id); }
  getLatestRefresh() { return this.refreshLogs.latest(); }
  getFilters() { return this.rules.getCurrent(); }
  listFiltered(filters: TrendFilters, now = new Date()) { return filterAndSortTopics(this.topics.list().filter((topic) => !this.exclusions.find(topic.id)), filters, now); }
  saveFilters(filters: TrendFilters) { this.rules.saveCurrent(filters); }
  saveNamedRule(name: string, filters: TrendFilters) { this.rules.saveRule({ id: crypto.randomUUID(), name, filters, savedAt: new Date().toISOString() }); this.record('trend.rule_saved', `儲存篩選規則：${name}`); }
  listSavedRules() { return this.rules.listSaved(); }

  addToWatchlist(topicId: string) {
    const topic = this.topics.find(topicId); if (!topic) return;
    this.watchlist.add({ topicId, addedAt: new Date().toISOString(), scoreAtAdded: topic.totalScore });
    this.record('trend.watch_added', `加入觀察：${topic.title}`);
  }
  removeFromWatchlist(topicId: string) { this.watchlist.remove(topicId); this.record('trend.watch_removed', `移出觀察：${topicId}`); }
  isWatching(topicId: string) { return this.watchlist.has(topicId); }
  getWatchlist() { return this.watchlist.list().map((item) => { const topic = this.topics.find(item.topicId); return topic ? { ...item, topic, scoreDelta: topic.totalScore - item.scoreAtAdded } : null; }).filter(Boolean) as Array<{ topicId: string; addedAt: string; scoreAtAdded: number; topic: TrendTopic; scoreDelta: number }>; }

  exclude(topicId: string, reason: ExclusionReason) {
    const topic = this.topics.find(topicId); if (!topic) return;
    this.exclusions.add({ topicId, reason, excludedAt: new Date().toISOString() });
    this.watchlist.remove(topicId);
    this.record('trend.excluded', `排除「${topic.title}」，原因：${reason}`);
  }
  cancelExclusion(topicId: string) { this.exclusions.remove(topicId); this.record('trend.exclusion_cancelled', `取消排除：${topicId}`); }
  getExcluded() { return this.exclusions.list().map((item) => { const topic = this.topics.find(item.topicId); return topic ? { ...item, topic } : null; }).filter(Boolean) as Array<{ topicId: string; reason: ExclusionReason; excludedAt: string; topic: TrendTopic }>; }
  getWeights() { return this.calculator.getWeights(); }
  getProviderNames() { return this.provider.getProviderNames(); }
  private record(action: string, detail: string) { this.audit.append({ id: crypto.randomUUID(), action, detail, createdAt: new Date().toISOString() }); }
}
