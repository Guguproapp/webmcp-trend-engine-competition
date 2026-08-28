import { BrowserStorage } from '../shared/infrastructure/storage';
import { TrendDiscoveryService } from '../modules/trend-discovery/application/TrendDiscoveryService';
import { LocalTrendAuditRepository, LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendRefreshLogRepository, LocalTrendTopicRepository, LocalTrendWatchlistRepository } from '../modules/trend-discovery/infrastructure/LocalTrendRepositories';
import { MockTrendSourceProvider } from '../modules/trend-discovery/infrastructure/MockTrendSourceProvider';

const localStorageAdapter = new BrowserStorage();

export const trendTopicRepository = new LocalTrendTopicRepository(localStorageAdapter);
export const trendWatchlistRepository = new LocalTrendWatchlistRepository(localStorageAdapter);
export const trendExclusionRepository = new LocalTrendExclusionRepository(localStorageAdapter);
export const trendFilterRuleRepository = new LocalTrendFilterRuleRepository(localStorageAdapter);
export const trendRefreshLogRepository = new LocalTrendRefreshLogRepository(localStorageAdapter);
export const trendAuditRepository = new LocalTrendAuditRepository(localStorageAdapter);
export const trendDiscoveryService = new TrendDiscoveryService(
  new MockTrendSourceProvider(), trendTopicRepository, trendWatchlistRepository, trendExclusionRepository,
  trendFilterRuleRepository, trendRefreshLogRepository, trendAuditRepository,
);
