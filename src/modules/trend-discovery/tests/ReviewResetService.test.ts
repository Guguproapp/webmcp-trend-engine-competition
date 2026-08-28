import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { ReviewResetService } from '../application/ReviewResetService';
import { TrendDiscoveryService } from '../application/TrendDiscoveryService';
import { DEFAULT_TREND_FILTERS } from '../domain/TrendFilters';
import { LocalTrendAuditRepository, LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendRefreshLogRepository, LocalTrendReviewResetRepository, LocalTrendTopicRepository, LocalTrendWatchlistRepository, TREND_STORAGE_KEY_LIST } from '../infrastructure/LocalTrendRepositories';
import { MockTrendSourceProvider } from '../infrastructure/MockTrendSourceProvider';

function fixture(storage = new MemoryStorage()) {
  const topics = new LocalTrendTopicRepository(storage);
  const watchlist = new LocalTrendWatchlistRepository(storage);
  const exclusions = new LocalTrendExclusionRepository(storage);
  const filters = new LocalTrendFilterRuleRepository(storage);
  const refreshLogs = new LocalTrendRefreshLogRepository(storage);
  const service = new TrendDiscoveryService(
    new MockTrendSourceProvider(), topics, watchlist, exclusions, filters, refreshLogs,
    new LocalTrendAuditRepository(storage),
  );
  return { storage, topics, watchlist, exclusions, filters, refreshLogs, reset: new ReviewResetService(new LocalTrendReviewResetRepository(storage), service) };
}

describe('ReviewResetService', () => {
  it('只刪除B版trend namespace，不影響其他資料', () => {
    const storage = new MemoryStorage();
    TREND_STORAGE_KEY_LIST.forEach((key) => storage.setItem(key, 'review-data'));
    storage.setItem('another-product.profile.v1', 'keep-me');
    new LocalTrendReviewResetRepository(storage).clearReviewData();
    TREND_STORAGE_KEY_LIST.forEach((key) => expect(storage.getItem(key)).toBeNull());
    expect(storage.getItem('another-product.profile.v1')).toBe('keep-me');
  });

  it('重設後恢復22個Mock主題與61筆來源訊號', async () => {
    const state = fixture();
    state.watchlist.add({ topicId: 'old-topic', addedAt: '2026-01-01T00:00:00Z', scoreAtAdded: 50 });
    state.filters.saveCurrent({ ...DEFAULT_TREND_FILTERS, query: '舊條件' });
    const result = await state.reset.reset();
    expect(result).toEqual({ topicCount: 22, signalCount: 61, sourceCount: 6 });
    expect(state.topics.list()).toHaveLength(22);
    expect(state.refreshLogs.latest()?.signalCount).toBe(61);
    expect(state.watchlist.list()).toEqual([]);
    expect(state.exclusions.list()).toEqual([]);
    expect(state.filters.getCurrent()).toEqual(DEFAULT_TREND_FILTERS);
  });
});
