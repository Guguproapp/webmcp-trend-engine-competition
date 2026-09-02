import { trendDiscoveryService } from '../../app/services';
import { BrowserStorage } from '../../shared/infrastructure/storage';
import { HumanConfirmationCoordinator } from './application/HumanConfirmationCoordinator';
import { createWebMcpToolDefinitions } from './application/createWebMcpToolDefinitions';
import { WebMcpActivityStore } from './application/WebMcpActivityStore';
import { getOrCreateAnonymousSessionId } from './infrastructure/AnonymousWebMcpSession';
import { LocalWebMcpAuditRepository } from './infrastructure/WebMcpAuditRepository';
import { TrendDiscoveryWebMcpGateway } from './infrastructure/TrendDiscoveryWebMcpGateway';

const storage = new BrowserStorage();
export const webMcpActivityStore = new WebMcpActivityStore();
export const webMcpAuditRepository = new LocalWebMcpAuditRepository(storage);
export const humanConfirmationCoordinator = new HumanConfirmationCoordinator(webMcpAuditRepository, { sessionId: getOrCreateAnonymousSessionId() });
export const webMcpToolDefinitions = createWebMcpToolDefinitions({ gateway: new TrendDiscoveryWebMcpGateway(trendDiscoveryService), confirmations: humanConfirmationCoordinator, activity: webMcpActivityStore });
