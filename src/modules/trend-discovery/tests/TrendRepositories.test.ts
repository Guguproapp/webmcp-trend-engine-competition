import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { DEFAULT_TREND_FILTERS } from '../domain/TrendFilters';
import { LocalTrendAuditRepository, LocalTrendExclusionRepository, LocalTrendFilterRuleRepository, LocalTrendRefreshLogRepository, LocalTrendTopicRepository, LocalTrendWatchlistRepository, TREND_STORAGE_KEYS } from '../infrastructure/LocalTrendRepositories';

describe('觀察、排除與篩選保存',()=>{
  it('加入及移出觀察並保留加入時間與分數',()=>{ const storage=new MemoryStorage(); const first=new LocalTrendWatchlistRepository(storage); first.add({topicId:'trend-a',addedAt:'2026-01-01T00:00:00Z',scoreAtAdded:70}); const refreshed=new LocalTrendWatchlistRepository(storage); expect(refreshed.has('trend-a')).toBe(true); expect(refreshed.list()[0].scoreAtAdded).toBe(70); refreshed.remove('trend-a'); expect(refreshed.has('trend-a')).toBe(false); });
  it('排除原因保存並可取消排除',()=>{ const storage=new MemoryStorage(); const repo=new LocalTrendExclusionRepository(storage); repo.add({topicId:'trend-a',reason:'自然災害',excludedAt:'2026-01-01T00:00:00Z'}); expect(new LocalTrendExclusionRepository(storage).find('trend-a')?.reason).toBe('自然災害'); repo.remove('trend-a'); expect(repo.find('trend-a')).toBeUndefined(); });
  it('篩選與排序重新建立Repository後仍保留',()=>{ const storage=new MemoryStorage(); const repo=new LocalTrendFilterRuleRepository(storage); const filters={...DEFAULT_TREND_FILTERS,minimumScore:65,sortBy:'growth' as const,excludeHighRisk:true}; repo.saveCurrent(filters); repo.saveRule({id:'rule',name:'快速安全主題',filters,savedAt:'2026-01-01T00:00:00Z'}); const afterRefresh=new LocalTrendFilterRuleRepository(storage); expect(afterRefresh.getCurrent()).toMatchObject({minimumScore:65,sortBy:'growth',excludeHighRisk:true}); expect(afterRefresh.listSaved()).toHaveLength(1); });

  it('敏感篩選字串不會寫入儲存且保留其他合法設定',()=>{
    const storage=new MemoryStorage(); const repo=new LocalTrendFilterRuleRepository(storage);
    const marker='NOT_A_REAL_SECRET';
    repo.saveCurrent({...DEFAULT_TREND_FILTERS,query:`https://files.example.test/report?access_token=${marker}`,minimumScore:65});
    repo.saveRule({id:'rule-sensitive',name:`authorization=${marker}`,filters:{...DEFAULT_TREND_FILTERS,query:`Bearer ${marker}`,sortBy:'growth'},savedAt:'2026-01-01T00:00:00Z'});
    const raw=storage.getItem(TREND_STORAGE_KEYS.filterRules) ?? '';
    expect(raw).not.toContain(marker);
    expect(repo.getCurrent()).toMatchObject({query:'',minimumScore:65});
    expect(repo.listSaved()[0]).toMatchObject({name:'authorization=[redacted]',filters:{query:'',sortBy:'growth'}});
  });

  it('讀取舊Repository資料時清理敏感內容且不清除其他命名空間',()=>{
    const storage=new MemoryStorage(); const marker='NOT_A_REAL_SECRET'; storage.setItem('other-product.data','keep');
    storage.setItem(TREND_STORAGE_KEYS.topics,JSON.stringify([{id:'trend-safe',title:`token=${marker}`,sourceItems:[{originalUrl:`https://files.example.test/a?signature=${marker}`}],access_token:marker}]));
    storage.setItem(TREND_STORAGE_KEYS.watchlist,JSON.stringify([{topicId:`session_id=${marker}`,addedAt:'2026-01-01T00:00:00Z',scoreAtAdded:70}]));
    storage.setItem(TREND_STORAGE_KEYS.exclusions,JSON.stringify([{topicId:`auth=${marker}`,reason:'其他',excludedAt:'2026-01-01T00:00:00Z'}]));
    storage.setItem(TREND_STORAGE_KEYS.filterRules,JSON.stringify({current:{...DEFAULT_TREND_FILTERS,query:`https://files.example.test/a#${marker}`,minimumScore:65},saved:[]}));
    storage.setItem(TREND_STORAGE_KEYS.refreshLog,JSON.stringify([{id:'refresh-safe',refreshedAt:'2026-01-01T00:00:00Z',sourceCount:2,signalCount:3,topicCount:4,highPotentialCount:1,token:marker}]));
    storage.setItem(TREND_STORAGE_KEYS.auditLog,JSON.stringify([{id:'audit-safe',action:'refresh',detail:`cookie=${marker}`,createdAt:'2026-01-01T00:00:00Z'}]));

    expect(new LocalTrendTopicRepository(storage).list()).toHaveLength(1);
    expect(new LocalTrendWatchlistRepository(storage).list()).toHaveLength(1);
    expect(new LocalTrendExclusionRepository(storage).list()).toHaveLength(1);
    expect(new LocalTrendFilterRuleRepository(storage).getCurrent()).toMatchObject({query:'',minimumScore:65});
    expect(new LocalTrendRefreshLogRepository(storage).list()[0]).toMatchObject({sourceCount:2,topicCount:4});
    expect(new LocalTrendAuditRepository(storage).list()[0].detail).toBe('cookie=[redacted]');

    for(const key of Object.values(TREND_STORAGE_KEYS)) expect(storage.getItem(key)).not.toContain(marker);
    expect(storage.getItem('other-product.data')).toBe('keep');
  });
});
