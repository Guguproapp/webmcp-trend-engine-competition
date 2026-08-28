import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { DEFAULT_TREND_FILTERS } from '../domain/TrendFilters';
import { LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendWatchlistRepository } from '../infrastructure/LocalTrendRepositories';

describe('觀察、排除與篩選保存',()=>{
  it('加入及移出觀察並保留加入時間與分數',()=>{ const storage=new MemoryStorage(); const first=new LocalTrendWatchlistRepository(storage); first.add({topicId:'trend-a',addedAt:'2026-01-01T00:00:00Z',scoreAtAdded:70}); const refreshed=new LocalTrendWatchlistRepository(storage); expect(refreshed.has('trend-a')).toBe(true); expect(refreshed.list()[0].scoreAtAdded).toBe(70); refreshed.remove('trend-a'); expect(refreshed.has('trend-a')).toBe(false); });
  it('排除原因保存並可取消排除',()=>{ const storage=new MemoryStorage(); const repo=new LocalTrendExclusionRepository(storage); repo.add({topicId:'trend-a',reason:'自然災害',excludedAt:'2026-01-01T00:00:00Z'}); expect(new LocalTrendExclusionRepository(storage).find('trend-a')?.reason).toBe('自然災害'); repo.remove('trend-a'); expect(repo.find('trend-a')).toBeUndefined(); });
  it('篩選與排序重新建立Repository後仍保留',()=>{ const storage=new MemoryStorage(); const repo=new LocalTrendFilterRuleRepository(storage); const filters={...DEFAULT_TREND_FILTERS,minimumScore:65,sortBy:'growth' as const,excludeHighRisk:true}; repo.saveCurrent(filters); repo.saveRule({id:'rule',name:'快速安全主題',filters,savedAt:'2026-01-01T00:00:00Z'}); const afterRefresh=new LocalTrendFilterRuleRepository(storage); expect(afterRefresh.getCurrent()).toMatchObject({minimumScore:65,sortBy:'growth',excludeHighRisk:true}); expect(afterRefresh.listSaved()).toHaveLength(1); });
});
