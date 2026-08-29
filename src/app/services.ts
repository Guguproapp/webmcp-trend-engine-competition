import { BrowserStorage } from '../shared/infrastructure/storage';
import { TrendDiscoveryService } from '../modules/trend-discovery/application/TrendDiscoveryService';
import { LocalTrendAuditRepository, LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendRefreshLogRepository, LocalTrendTopicRepository, LocalTrendWatchlistRepository } from '../modules/trend-discovery/infrastructure/LocalTrendRepositories';
import { ApiTrendSourceProvider } from '../modules/trend-discovery/infrastructure/ApiTrendSourceProvider';
import { LocalVideoCandidateRepository } from '../modules/trend-discovery/infrastructure/LocalVideoCandidateRepository';
import { VideoDiscoveryService } from '../modules/trend-discovery/application/VideoDiscoveryService';
import { LocalRegionalSearchPreferencesRepository } from '../modules/trend-discovery/infrastructure/LocalRegionalSearchPreferencesRepository';

const localStorageAdapter = new BrowserStorage();

export const trendTopicRepository = new LocalTrendTopicRepository(localStorageAdapter);
export const trendWatchlistRepository = new LocalTrendWatchlistRepository(localStorageAdapter);
export const trendExclusionRepository = new LocalTrendExclusionRepository(localStorageAdapter);
export const trendFilterRuleRepository = new LocalTrendFilterRuleRepository(localStorageAdapter);
export const trendRefreshLogRepository = new LocalTrendRefreshLogRepository(localStorageAdapter);
export const trendAuditRepository = new LocalTrendAuditRepository(localStorageAdapter);
export const videoCandidateRepository = new LocalVideoCandidateRepository(localStorageAdapter);
export const videoDiscoveryService = new VideoDiscoveryService(videoCandidateRepository);
export const regionalSearchPreferencesRepository = new LocalRegionalSearchPreferencesRepository(localStorageAdapter);
export const trendDiscoveryService = new TrendDiscoveryService(
  new ApiTrendSourceProvider(), trendTopicRepository, trendWatchlistRepository, trendExclusionRepository,
  trendFilterRuleRepository, trendRefreshLogRepository, trendAuditRepository,
);
