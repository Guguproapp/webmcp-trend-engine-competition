import type {
  AuthorizationCallbackInput,
  AuthorizationResult,
  PlatformAuthorizationProvider,
} from '../../../shared/application/provider-ports';
import type { PlatformCode, PlatformConnectionStatus } from '../../../shared/domain/platform';

export class MockPlatformAuthorizationProvider implements PlatformAuthorizationProvider {
  async createAuthorizationUrl(platformCode: PlatformCode, state: string, codeChallenge: string) {
    const query = new URLSearchParams({ state, code_challenge: codeChallenge });
    return `/oauth/mock/authorize/${platformCode}?${query.toString()}`;
  }

  async handleCallback(input: AuthorizationCallbackInput): Promise<AuthorizationResult> {
    if (!input.state || input.state !== input.expectedState) {
      return { status: 'connection_error', message: 'OAuth state 驗證失敗，已中止模擬授權。' };
    }
    const outcomes: Record<AuthorizationCallbackInput['outcome'], AuthorizationResult> = {
      success: { status: 'authorized', message: '模擬授權與連接測試成功。' },
      cancelled: { status: 'ready_for_authorization', message: '使用者取消授權，尚未連接。' },
      permission_incomplete: { status: 'permission_incomplete', message: '授權完成，但必要權限不足。' },
      token_expired: { status: 'token_expired', message: '模擬 Token 已過期，請重新授權。' },
      platform_error: { status: 'connection_error', message: '模擬平台錯誤，連接失敗。' },
    };
    return outcomes[input.outcome];
  }

  async refreshAuthorization(): Promise<AuthorizationResult> {
    return { status: 'authorized', message: '重新授權成功（模擬）。' };
  }

  async revokeAuthorization() {}

  async checkAuthorizationStatus(): Promise<PlatformConnectionStatus> {
    return 'authorized';
  }

  async testConnection() {
    return true;
  }
}
