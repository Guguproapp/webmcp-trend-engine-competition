import type { RawTrendSignal } from '../domain/TrendTopic';
import type { TrendDataState } from '../domain/TrendFreshness';

export interface TrendCollectionRequest { refreshedAt: string; }

export interface TrendSourceProvider {
  readonly isRemote?: boolean;
  collectSignals(request: TrendCollectionRequest): Promise<RawTrendSignal[]>;
  searchSignals(query: string, request: TrendCollectionRequest): Promise<RawTrendSignal[]>;
  getProviderNames(): string[];
  getMetadata?(): TrendApiMetadata | null;
}

export type TrendProviderState = 'enabled' | 'waiting_authorization' | 'temporary_failure' | 'quota_exceeded' | 'disabled';

export interface TrendProviderStatus {
  code: 'gdelt' | 'youtube' | 'google_trends' | 'threads';
  name: string;
  state: TrendProviderState;
  message: string;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  fetchedCount: number;
}

export interface TrendApiMetadata {
  dataState: TrendDataState;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  nextRefreshAt: string | null;
  staleAfterAt: string | null;
  isRefreshing: boolean;
  sourceStatuses: TrendProviderStatus[];
  message: string;
}
