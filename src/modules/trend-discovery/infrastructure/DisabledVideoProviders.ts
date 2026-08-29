import type { PlatformContentProvider, PlatformPermissionState, WebSearchProvider } from '../application/VideoDiscoveryProviders';
import type { VideoPlatform } from '../domain/VideoDiscovery';

export class AwaitingPlatformContentProvider implements PlatformContentProvider {
  constructor(
    readonly platform: Extract<VideoPlatform, 'facebook' | 'instagram' | 'tiktok'>,
    private readonly state: PlatformPermissionState = 'not_applied',
  ) {}
  getPermissionState() { return this.state; }
  async searchPublicContent(): Promise<never[]> { return []; }
}

export class DisabledWebSearchProvider implements WebSearchProvider {
  isEnabled() { return false; }
  getStatusMessage() { return '尚未啟用自動網頁搜尋'; }
  async search(): Promise<never[]> { return []; }
}
