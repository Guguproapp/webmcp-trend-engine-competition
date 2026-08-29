import type { VideoPlatform } from '../domain/VideoDiscovery';

export type PlatformPermissionState = 'not_applied' | 'preparing' | 'waiting_review' | 'approved' | 'expired' | 'unavailable';

export interface PlatformContentProvider {
  readonly platform: Extract<VideoPlatform, 'facebook' | 'instagram' | 'tiktok'>;
  getPermissionState(): PlatformPermissionState;
  searchPublicContent(): Promise<never[]>;
}

export interface WebSearchProvider {
  isEnabled(): boolean;
  getStatusMessage(): string;
  search(): Promise<never[]>;
}
