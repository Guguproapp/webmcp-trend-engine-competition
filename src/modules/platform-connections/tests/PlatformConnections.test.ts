import { canTransition } from '../../../shared/domain/platform';
import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { PlatformConnectionService } from '../application/PlatformConnectionService';
import { LocalAuditLogRepository, LocalPlatformConnectionRepository } from '../infrastructure/LocalRepositories';
import { MockPlatformAuthorizationProvider } from '../infrastructure/MockPlatformAuthorizationProvider';

function createFixture() {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const repo = new LocalPlatformConnectionRepository(local);
  const audit = new LocalAuditLogRepository(local);
  const service = new PlatformConnectionService(repo, audit, new MockPlatformAuthorizationProvider(), session);
  return { service, repo, audit };
}

describe('平台狀態與模擬授權', () => {
  it('允許合理狀態轉換並拒絕跳躍判定', () => {
    expect(canTransition('signup_required', 'signup_in_progress')).toBe(true);
    expect(canTransition('not_started', 'authorized')).toBe(false);
    expect(canTransition('token_expired', 'authorizing')).toBe(true);
  });

  it.each([
    ['success', 'authorized'],
    ['cancelled', 'ready_for_authorization'],
    ['permission_incomplete', 'permission_incomplete'],
    ['token_expired', 'token_expired'],
    ['platform_error', 'connection_error'],
  ] as const)('處理 %s 結果為 %s', async (outcome, expected) => {
    const { service, repo } = createFixture();
    const url = await service.beginAuthorization('youtube');
    const state = new URL(url, 'http://localhost').searchParams.get('state') ?? '';
    await service.completeAuthorization('youtube', state, outcome);
    expect(repo.get('youtube')?.status).toBe(expected);
  });

  it('Token 過期後可重新授權並可解除連接', async () => {
    const { service, repo, audit } = createFixture();
    service.setStatus('tiktok', 'token_expired');
    const url = await service.beginAuthorization('tiktok');
    const state = new URL(url, 'http://localhost').searchParams.get('state') ?? '';
    await service.completeAuthorization('tiktok', state, 'success');
    expect(repo.get('tiktok')?.status).toBe('authorized');
    await service.disconnect('tiktok');
    expect(repo.get('tiktok')?.status).toBe('disconnected');
    expect(audit.list().some((entry) => entry.action === 'authorization.revoked')).toBe(true);
  });

  it('state 不一致時中止 callback', async () => {
    const { service, repo } = createFixture();
    await service.beginAuthorization('facebook');
    await service.completeAuthorization('facebook', 'wrong-state', 'success');
    expect(repo.get('facebook')?.status).toBe('connection_error');
  });
});
