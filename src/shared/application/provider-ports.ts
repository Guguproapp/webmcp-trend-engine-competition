import type { PlatformCode, PlatformConnectionStatus } from '../domain/platform';

export interface AuthorizationCallbackInput {
  platformCode: PlatformCode;
  state: string;
  expectedState: string;
  outcome: 'success' | 'cancelled' | 'permission_incomplete' | 'token_expired' | 'platform_error';
}

export interface AuthorizationResult {
  status: PlatformConnectionStatus;
  message: string;
}

export interface PlatformAuthorizationProvider {
  createAuthorizationUrl(platformCode: PlatformCode, state: string, codeChallenge: string): Promise<string>;
  handleCallback(input: AuthorizationCallbackInput): Promise<AuthorizationResult>;
  refreshAuthorization(platformCode: PlatformCode): Promise<AuthorizationResult>;
  revokeAuthorization(platformCode: PlatformCode): Promise<void>;
  checkAuthorizationStatus(platformCode: PlatformCode): Promise<PlatformConnectionStatus>;
  testConnection(platformCode: PlatformCode): Promise<boolean>;
}
