import { LocalOnboardingProgressRepository } from '../modules/account-onboarding/infrastructure/LocalOnboardingProgressRepository';
import { LocalBrandProfileRepository } from '../modules/brand-profile/infrastructure/LocalBrandProfileRepository';
import { PlatformConnectionService } from '../modules/platform-connections/application/PlatformConnectionService';
import { LocalAuditLogRepository, LocalPlatformConnectionRepository } from '../modules/platform-connections/infrastructure/LocalRepositories';
import { MockPlatformAuthorizationProvider } from '../modules/platform-connections/infrastructure/MockPlatformAuthorizationProvider';
import { BrowserStorage, SessionStorage } from '../shared/infrastructure/storage';

const localStorageAdapter = new BrowserStorage();
const sessionStorageAdapter = new SessionStorage();

export const brandProfileRepository = new LocalBrandProfileRepository(localStorageAdapter);
export const onboardingProgressRepository = new LocalOnboardingProgressRepository(localStorageAdapter);
export const platformConnectionRepository = new LocalPlatformConnectionRepository(localStorageAdapter);
export const auditLogRepository = new LocalAuditLogRepository(localStorageAdapter);
export const platformConnectionService = new PlatformConnectionService(
  platformConnectionRepository,
  auditLogRepository,
  new MockPlatformAuthorizationProvider(),
  sessionStorageAdapter,
);
