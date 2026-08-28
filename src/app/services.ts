import { LocalOnboardingProgressRepository } from '../modules/account-onboarding/infrastructure/LocalOnboardingProgressRepository';
import { LocalBrandProfileRepository } from '../modules/brand-profile/infrastructure/LocalBrandProfileRepository';
import { PlatformConnectionService } from '../modules/platform-connections/application/PlatformConnectionService';
import { LocalAuditLogRepository, LocalPlatformConnectionRepository } from '../modules/platform-connections/infrastructure/LocalRepositories';
import { MockPlatformAuthorizationProvider } from '../modules/platform-connections/infrastructure/MockPlatformAuthorizationProvider';
import { BrowserStorage, SessionStorage } from '../shared/infrastructure/storage';
import { TrendDiscoveryService } from '../modules/trend-discovery/application/TrendDiscoveryService';
import { LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendRefreshLogRepository, LocalTrendTopicRepository, LocalTrendWatchlistRepository } from '../modules/trend-discovery/infrastructure/LocalTrendRepositories';
import { MockTrendSourceProvider } from '../modules/trend-discovery/infrastructure/MockTrendSourceProvider';

const localStorageAdapter = new BrowserStorage();
const sessionStorageAdapter = new SessionStorage();

export const brandProfileRepository = new LocalBrandProfileRepository(localStorageAdapter);
export const onboardingProgressRepository = new LocalOnboardingProgressRepository(localStorageAdapter);
export const platformConnectionRepository = new LocalPlatformConnectionRepository(localStorageAdapter);
export const auditLogRepository = new LocalAuditLogRepository(localStorageAdapter);
export const trendTopicRepository = new LocalTrendTopicRepository(localStorageAdapter);
export const trendWatchlistRepository = new LocalTrendWatchlistRepository(localStorageAdapter);
export const trendExclusionRepository = new LocalTrendExclusionRepository(localStorageAdapter);
export const trendFilterRuleRepository = new LocalTrendFilterRuleRepository(localStorageAdapter);
export const trendRefreshLogRepository = new LocalTrendRefreshLogRepository(localStorageAdapter);
export const platformConnectionService = new PlatformConnectionService(
  platformConnectionRepository,
  auditLogRepository,
  new MockPlatformAuthorizationProvider(),
  sessionStorageAdapter,
);
export const trendDiscoveryService = new TrendDiscoveryService(
  new MockTrendSourceProvider(), trendTopicRepository, trendWatchlistRepository, trendExclusionRepository,
  trendFilterRuleRepository, trendRefreshLogRepository, auditLogRepository,
);
