import type { TrendDiscoveryService } from '../../trend-discovery/application/TrendDiscoveryService';
import type { ExclusionReason } from '../../trend-discovery/application/repositories';
import type { WebMcpTrendGateway } from '../application/createWebMcpToolDefinitions';

export class TrendDiscoveryWebMcpGateway implements WebMcpTrendGateway {
  constructor(private readonly service: TrendDiscoveryService) {}
  ensureData() { return this.service.ensureData(); }
  listTopics() { return this.service.listAll(); }
  findTopic(id: string) { return this.service.find(id); }
  getSourceStatuses() { return this.service.getApiMetadata()?.sourceStatuses ?? []; }
  isWatching(id: string) { return this.service.isWatching(id); }
  addToWatchlist(id: string) { this.service.addToWatchlist(id); }
  removeFromWatchlist(id: string) { this.service.removeFromWatchlist(id); }
  getExclusionReason(id: string) { return this.service.getExcluded().find((item) => item.topicId === id)?.reason; }
  exclude(id: string, reason: ExclusionReason) { this.service.exclude(id, reason); }
  cancelExclusion(id: string) { this.service.cancelExclusion(id); }
}
