import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import type { TrendTopic } from '../domain/TrendTopic';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import { containsSensitiveText, sanitizeUntrustedPublicData } from '../../../shared/security/PublicUrlSafety';
import type { SavedTrendFilterRule, TrendAuditEntry, TrendAuditPort, TrendExclusion, TrendExclusionRepository, TrendFilterRuleRepository, TrendRefreshLog, TrendRefreshLogRepository, TrendReviewResetRepository, TrendTopicRepository, TrendWatchItem, TrendWatchlistRepository } from '../application/repositories';

export const TREND_STORAGE_KEYS = {
  topics: 'trend-engine.real-topics.v1',
  watchlist: 'trend-engine.watchlist.v1',
  exclusions: 'trend-engine.exclusions.v1',
  filterRules: 'trend-engine.filter-rules.v1',
  refreshLog: 'trend-engine.refresh-log.v1',
  auditLog: 'trend-engine.audit-log.v1',
} as const;

export const TREND_STORAGE_KEY_LIST = Object.values(TREND_STORAGE_KEYS);

function sanitizeStoredValue<T>(store: JsonStore<T>): T {
  const value = store.read();
  const sanitized = sanitizeUntrustedPublicData(value) as T;
  if (JSON.stringify(sanitized) !== JSON.stringify(value)) store.write(sanitized);
  return sanitized;
}

function sanitizeForStorage<T>(value: T): T {
  return sanitizeUntrustedPublicData(value) as T;
}

function sanitizeFilters(filters: TrendFilters): TrendFilters {
  const sanitized = sanitizeForStorage(filters);
  const query = typeof filters.query === 'string' && !containsSensitiveText(filters.query) ? sanitized.query : '';
  return { ...sanitized, query };
}

function sanitizeFilterState(state: FilterState): FilterState {
  const current = state && typeof state === 'object' && state.current && typeof state.current === 'object' ? state.current : DEFAULT_TREND_FILTERS;
  const saved = state && typeof state === 'object' && Array.isArray(state.saved) ? state.saved : [];
  return {
    current: sanitizeFilters(current),
    saved: saved.filter((rule) => rule && typeof rule === 'object' && rule.filters && typeof rule.filters === 'object')
      .map((rule) => ({ ...sanitizeForStorage(rule), filters: sanitizeFilters(rule.filters) })),
  };
}

export class LocalTrendTopicRepository implements TrendTopicRepository {
  private readonly store: JsonStore<TrendTopic[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.topics, []); }
  list() { return sanitizeStoredValue(this.store); }
  find(id: string) { return this.list().find((item) => item.id === id); }
  replaceAll(topics: TrendTopic[]) { this.store.write(sanitizeForStorage(topics)); }
}
export class LocalTrendWatchlistRepository implements TrendWatchlistRepository {
  private readonly store: JsonStore<TrendWatchItem[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.watchlist, []); }
  list() { return sanitizeStoredValue(this.store); }
  add(item: TrendWatchItem) { const safeItem = sanitizeForStorage(item); this.store.write([safeItem, ...this.list().filter((entry) => entry.topicId !== safeItem.topicId)]); }
  remove(topicId: string) { this.store.write(this.list().filter((entry) => entry.topicId !== topicId)); }
  has(topicId: string) { return this.list().some((entry) => entry.topicId === topicId); }
}
export class LocalTrendExclusionRepository implements TrendExclusionRepository {
  private readonly store: JsonStore<TrendExclusion[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.exclusions, []); }
  list() { return sanitizeStoredValue(this.store); }
  add(item: TrendExclusion) { const safeItem = sanitizeForStorage(item); this.store.write([safeItem, ...this.list().filter((entry) => entry.topicId !== safeItem.topicId)]); }
  remove(topicId: string) { this.store.write(this.list().filter((entry) => entry.topicId !== topicId)); }
  find(topicId: string) { return this.list().find((entry) => entry.topicId === topicId); }
}
interface FilterState { current: TrendFilters; saved: SavedTrendFilterRule[]; }
export class LocalTrendFilterRuleRepository implements TrendFilterRuleRepository {
  private readonly store: JsonStore<FilterState>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.filterRules, { current: DEFAULT_TREND_FILTERS, saved: [] }); }
  private readState() {
    const state = this.store.read();
    const sanitized = sanitizeFilterState(state);
    if (JSON.stringify(sanitized) !== JSON.stringify(state)) this.store.write(sanitized);
    return sanitized;
  }
  getCurrent() { return this.readState().current; }
  saveCurrent(filters: TrendFilters) { const state = this.readState(); this.store.write({ ...state, current: sanitizeFilters(filters) }); }
  listSaved() { return this.readState().saved; }
  saveRule(rule: SavedTrendFilterRule) { const state = this.readState(); const safeRule = { ...sanitizeForStorage(rule), filters: sanitizeFilters(rule.filters) }; this.store.write({ ...state, saved: [safeRule, ...state.saved] }); }
}
export class LocalTrendRefreshLogRepository implements TrendRefreshLogRepository {
  private readonly store: JsonStore<TrendRefreshLog[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.refreshLog, []); }
  list() { return sanitizeStoredValue(this.store); }
  latest() { return this.list()[0]; }
  append(log: TrendRefreshLog) { this.store.write([sanitizeForStorage(log), ...this.list()].slice(0, 30)); }
}
export class LocalTrendAuditRepository implements TrendAuditPort {
  private readonly store: JsonStore<TrendAuditEntry[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, TREND_STORAGE_KEYS.auditLog, []); }
  list() { return sanitizeStoredValue(this.store); }
  append(entry: TrendAuditEntry) { this.store.write([sanitizeForStorage(entry), ...this.list()].slice(0, 100)); }
}

export class LocalTrendReviewResetRepository implements TrendReviewResetRepository {
  constructor(private readonly storage: KeyValueStorage) {}
  clearReviewData() { TREND_STORAGE_KEY_LIST.forEach((key) => this.storage.removeItem(key)); }
}
