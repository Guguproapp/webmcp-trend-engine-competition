import type { PlatformAuthorizationProvider } from '../../../shared/application/provider-ports';
import {
  STATUS_LABELS,
  type PlatformCode,
  type PlatformConnection,
  type PlatformConnectionStatus,
} from '../../../shared/domain/platform';
import type { KeyValueStorage } from '../../../shared/infrastructure/storage';
import type { AuditLogRepository, PlatformConnectionRepository } from './repositories';

export class PlatformConnectionService {
  constructor(
    private readonly connections: PlatformConnectionRepository,
    private readonly audit: AuditLogRepository,
    private readonly provider: PlatformAuthorizationProvider,
    private readonly transactionStorage: KeyValueStorage,
  ) {}

  list() {
    return this.connections.getAll();
  }

  setStatus(platformCode: PlatformCode, status: PlatformConnectionStatus, message = STATUS_LABELS[status]) {
    const connection: PlatformConnection = {
      platformCode,
      status,
      statusMessage: message,
      updatedAt: new Date().toISOString(),
      isMock: true,
    };
    this.connections.save(connection);
    this.record('connection.status_changed', platformCode, `${STATUS_LABELS[status]}：${message}`);
    return connection;
  }

  async beginAuthorization(platformCode: PlatformCode) {
    const state = crypto.randomUUID();
    const verifier = crypto.randomUUID();
    const codeChallenge = `mock-s256-${verifier}`;
    this.transactionStorage.setItem(`oauth.state.${platformCode}`, state);
    this.setStatus(platformCode, 'authorizing', '正在進入模擬官方授權頁。');
    this.record('authorization.started', platformCode, '已建立含 state 與 PKCE 預留欄位的模擬授權交易。');
    return this.provider.createAuthorizationUrl(platformCode, state, codeChallenge);
  }

  async completeAuthorization(
    platformCode: PlatformCode,
    state: string,
    outcome: 'success' | 'cancelled' | 'permission_incomplete' | 'token_expired' | 'platform_error',
  ) {
    const key = `oauth.state.${platformCode}`;
    const expectedState = this.transactionStorage.getItem(key) ?? '';
    const result = await this.provider.handleCallback({ platformCode, state, expectedState, outcome });
    this.transactionStorage.removeItem(key);
    if (result.status === 'authorized') {
      const connected = await this.provider.testConnection(platformCode);
      if (!connected) return this.setStatus(platformCode, 'connection_error', '授權完成，但連接測試失敗。');
      this.record('connection.test_succeeded', platformCode, '模擬連接測試成功。');
    }
    return this.setStatus(platformCode, result.status, result.message);
  }

  async disconnect(platformCode: PlatformCode) {
    await this.provider.revokeAuthorization(platformCode);
    this.record('authorization.revoked', platformCode, '使用者解除模擬授權。');
    return this.setStatus(platformCode, 'disconnected', '已解除模擬連接。');
  }

  private record(action: string, platformCode: PlatformCode, detail: string) {
    this.audit.append({
      id: crypto.randomUUID(),
      action,
      platformCode,
      detail,
      createdAt: new Date().toISOString(),
    });
  }
}
