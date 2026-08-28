import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import type { TrendTopic } from '../domain/TrendTopic';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import type { SavedTrendFilterRule, TrendAuditEntry, TrendAuditPort, TrendExclusion, TrendExclusionRepository, TrendFilterRuleRepository, TrendRefreshLog, TrendRefreshLogRepository, TrendTopicRepository, TrendWatchItem, TrendWatchlistRepository } from '../application/repositories';

export class LocalTrendTopicRepository implements TrendTopicRepository {
  private readonly store: JsonStore<TrendTopic[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.topics.v1', []); }
  list() { return this.store.read(); }
  find(id: string) { return this.list().find((item) => item.id === id); }
  replaceAll(topics: TrendTopic[]) { this.store.write(topics); }
}
export class LocalTrendWatchlistRepository implements TrendWatchlistRepository {
  private readonly store: JsonStore<TrendWatchItem[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.watchlist.v1', []); }
  list() { return this.store.read(); }
  add(item: TrendWatchItem) { this.store.write([item, ...this.list().filter((entry) => entry.topicId !== item.topicId)]); }
  remove(topicId: string) { this.store.write(this.list().filter((entry) => entry.topicId !== topicId)); }
  has(topicId: string) { return this.list().some((entry) => entry.topicId === topicId); }
}
export class LocalTrendExclusionRepository implements TrendExclusionRepository {
  private readonly store: JsonStore<TrendExclusion[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.exclusions.v1', []); }
  list() { return this.store.read(); }
  add(item: TrendExclusion) { this.store.write([item, ...this.list().filter((entry) => entry.topicId !== item.topicId)]); }
  remove(topicId: string) { this.store.write(this.list().filter((entry) => entry.topicId !== topicId)); }
  find(topicId: string) { return this.list().find((entry) => entry.topicId === topicId); }
}
interface FilterState { current: TrendFilters; saved: SavedTrendFilterRule[]; }
export class LocalTrendFilterRuleRepository implements TrendFilterRuleRepository {
  private readonly store: JsonStore<FilterState>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.filter-rules.v1', { current: DEFAULT_TREND_FILTERS, saved: [] }); }
  getCurrent() { return this.store.read().current; }
  saveCurrent(filters: TrendFilters) { const state = this.store.read(); this.store.write({ ...state, current: filters }); }
  listSaved() { return this.store.read().saved; }
  saveRule(rule: SavedTrendFilterRule) { const state = this.store.read(); this.store.write({ ...state, saved: [rule, ...state.saved] }); }
}
export class LocalTrendRefreshLogRepository implements TrendRefreshLogRepository {
  private readonly store: JsonStore<TrendRefreshLog[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.refresh-log.v1', []); }
  list() { return this.store.read(); }
  latest() { return this.list()[0]; }
  append(log: TrendRefreshLog) { this.store.write([log, ...this.list()].slice(0, 30)); }
}
export class LocalTrendAuditRepository implements TrendAuditPort {
  private readonly store: JsonStore<TrendAuditEntry[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, 'trend-engine.audit-log.v1', []); }
  list() { return this.store.read(); }
  append(entry: TrendAuditEntry) { this.store.write([entry, ...this.list()].slice(0, 100)); }
}
