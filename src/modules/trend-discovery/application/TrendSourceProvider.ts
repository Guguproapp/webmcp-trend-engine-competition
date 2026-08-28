import type { RawTrendSignal } from '../domain/TrendTopic';

export interface TrendCollectionRequest { refreshedAt: string; }

export interface TrendSourceProvider {
  collectSignals(request: TrendCollectionRequest): Promise<RawTrendSignal[]>;
  searchSignals(query: string, request: TrendCollectionRequest): Promise<RawTrendSignal[]>;
  getProviderNames(): string[];
}
