import type { TrendReviewResetRepository } from './repositories';
import type { TrendDiscoveryService } from './TrendDiscoveryService';

export interface ReviewResetResult {
  topicCount: number;
  signalCount: number;
  sourceCount: number;
}

export class ReviewResetService {
  constructor(
    private readonly resetStore: TrendReviewResetRepository,
    private readonly discoveryService: TrendDiscoveryService,
  ) {}

  async reset(): Promise<ReviewResetResult> {
    this.resetStore.clearReviewData();
    const topics = await this.discoveryService.refresh();
    const refresh = this.discoveryService.getLatestRefresh();
    return {
      topicCount: topics.length,
      signalCount: refresh?.signalCount ?? topics.reduce((total, topic) => total + topic.sourceItems.length, 0),
      sourceCount: refresh?.sourceCount ?? this.discoveryService.getProviderNames().length,
    };
  }
}
