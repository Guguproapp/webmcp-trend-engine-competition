import type { TrendFilters } from '../domain/TrendFilters';
import type { TrendTopic } from '../domain/TrendTopic';

export interface TrendTopicRepository { list(): TrendTopic[]; find(id: string): TrendTopic | undefined; replaceAll(topics: TrendTopic[]): void; }
export interface TrendWatchItem { topicId: string; addedAt: string; scoreAtAdded: number; }
export interface TrendWatchlistRepository { list(): TrendWatchItem[]; add(item: TrendWatchItem): void; remove(topicId: string): void; has(topicId: string): boolean; }
export const EXCLUSION_REASONS = ['無品牌價值', '共鳴不足', '風險太高', '已經過時', '競爭過度', '自然災害', '政治敏感', '來源不可信', '其他'] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];
export interface TrendExclusion { topicId: string; reason: ExclusionReason; excludedAt: string; }
export interface TrendExclusionRepository { list(): TrendExclusion[]; add(item: TrendExclusion): void; remove(topicId: string): void; find(topicId: string): TrendExclusion | undefined; }
export interface SavedTrendFilterRule { id: string; name: string; filters: TrendFilters; savedAt: string; }
export interface TrendFilterRuleRepository { getCurrent(): TrendFilters; saveCurrent(filters: TrendFilters): void; listSaved(): SavedTrendFilterRule[]; saveRule(rule: SavedTrendFilterRule): void; }
export interface TrendRefreshLog { id: string; refreshedAt: string; sourceCount: number; signalCount: number; topicCount: number; highPotentialCount: number; }
export interface TrendRefreshLogRepository { list(): TrendRefreshLog[]; latest(): TrendRefreshLog | undefined; append(log: TrendRefreshLog): void; }
export interface TrendAuditPort { append(entry: { id: string; action: string; platformCode?: string; detail: string; createdAt: string }): void; }
