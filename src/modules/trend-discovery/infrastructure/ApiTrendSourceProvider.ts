import type { TrendApiMetadata, TrendCollectionRequest, TrendSourceProvider } from '../application/TrendSourceProvider';
import type { RawTrendSignal, TrendTopic } from '../domain/TrendTopic';

interface TrendApiResponse {
  topics: TrendTopic[];
  metadata: TrendApiMetadata;
}

const providerNames = ['GDELT全球新聞資料', 'YouTube影音平台', 'Google熱門搜尋趨勢', 'Threads社群討論'];

export class ApiTrendSourceProvider implements TrendSourceProvider {
  readonly isRemote = true;
  private metadata: TrendApiMetadata | null = null;

  constructor(private readonly fetcher?: typeof fetch) {}

  async collectSignals(): Promise<RawTrendSignal[]> {
    const response = await (this.fetcher ?? fetch)('/api/trends', { headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`熱門情報服務暫時無法使用（${response.status}）`);
    const payload = await response.json() as TrendApiResponse;
    this.metadata = payload.metadata;
    return payload.topics.flatMap((topic) => topic.sourceItems.map((sourceItem) => ({
      canonicalKey: topic.canonicalKey,
      title: topic.title,
      summary: topic.summary,
      category: topic.category,
      keywords: topic.keywords,
      sourceItem,
      currentHeat: topic.currentHeat,
      growthRate: topic.growthRate,
      growthStatus: topic.growthStatus,
      freshness: topic.freshness,
      crossPlatformResonance: topic.crossPlatformResonance,
      socialResonance: topic.socialResonance,
      taiwanRelevance: topic.taiwanRelevance,
      competitionSaturation: topic.competitionSaturation,
      riskScore: topic.riskScore,
      estimatedLifeHours: topic.estimatedLifeHours,
      sourceConfidence: topic.sourceConfidence,
      businessOpportunity: null,
      isNaturalDisaster: topic.isNaturalDisaster,
      isPolitical: topic.isPolitical,
      naturalEvidence: topic.naturalEvidence,
    })));
  }

  async searchSignals(query: string, request: TrendCollectionRequest) {
    const normalized = query.toLocaleLowerCase('zh-TW');
    void request;
    return (await this.collectSignals()).filter((item) =>
      `${item.title} ${item.summary} ${item.keywords.join(' ')}`.toLocaleLowerCase('zh-TW').includes(normalized),
    );
  }

  getProviderNames() { return [...providerNames]; }
  getMetadata() { return this.metadata; }
}
