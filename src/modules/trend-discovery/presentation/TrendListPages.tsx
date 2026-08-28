import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import { TrendFilterPanel, TrendTopicCard } from './TrendComponents';
import { formatDateTime } from './formatters';

function useTrendRevision() {
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(!trendDiscoveryService.listAll().length);
  useEffect(() => { trendDiscoveryService.ensureData().then(() => { setRevision((value)=>value+1); setLoading(false); }); }, []);
  return { revision, loading, refresh: () => setRevision((value)=>value+1) };
}

function TrendListPage({ fullFilters = false }: { fullFilters?: boolean }) {
  const { revision, loading, refresh: rerender } = useTrendRevision();
  const [filters, setFilters] = useState<TrendFilters>(()=>trendDiscoveryService.getFilters());
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const topics = trendDiscoveryService.listAll();
  const results = trendDiscoveryService.listFiltered(filters);
  const latest = trendDiscoveryService.getLatestRefresh();
  const today = new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric', weekday:'long' }).format(new Date());
  const highPotential = topics.filter((topic)=>topic.status === 'high_potential').length;

  async function updateData() { setRefreshing(true); await trendDiscoveryService.refresh(); setRefreshing(false); setNotice('Mock 資料已重新彙整、評分並排序。'); rerender(); }
  function apply(next: TrendFilters) { setFilters(next); trendDiscoveryService.saveFilters(next); setNotice(`已套用篩選，目前 ${trendDiscoveryService.listFiltered(next).length} 筆結果。`); }
  function save(next: TrendFilters) { const name = `我的規則 ${trendDiscoveryService.listSavedRules().length + 1}`; trendDiscoveryService.saveNamedRule(name,next); trendDiscoveryService.saveFilters(next); setFilters(next); setNotice(`已儲存「${name}」。`); }
  function changed() { rerender(); }

  return <section className="trend-page" data-revision={revision}>
    <div className="trend-title-row"><div><div className="trend-date">{today}</div><h1>{fullFilters ? '主題搜尋' : '爆紅熱門精選'}</h1><p>{fullFilters ? '用完整條件搜尋與比較 Mock 候選熱門主題。' : '蒐集正在快速上升的話題，並依熱度、增速、共鳴與風險排序。'}</p></div><button className="button trend-primary refresh-button" onClick={updateData} disabled={refreshing}>{refreshing ? '重新彙整中…' : '↻ 更新資料'}</button></div>
    <div className="mock-trend-banner"><strong>Mock 模擬資料</strong><span>目前為 Mock 資料，尚未連接正式熱門來源；所有題目皆為測試案例，不代表今日真實新聞。</span></div>
    <div className="trend-stat-grid"><Stat label="上次更新" value={latest ? formatDateTime(latest.refreshedAt) : '準備中'} /><Stat label="資料來源數" value={`${latest?.sourceCount ?? trendDiscoveryService.getProviderNames().length}`} /><Stat label="蒐集主題數" value={`${topics.length}`} /><Stat label="通過篩選數" value={`${results.length}`} /><Stat label="高潛力主題" value={`${highPotential}`} highlight /></div>
    <TrendFilterPanel filters={filters} onApply={apply} onClear={()=>apply(DEFAULT_TREND_FILTERS)} onSave={save} expanded={fullFilters} />
    {notice && <p className="trend-notice" role="status">✓ {notice}</p>}
    <div className="trend-results-heading"><div><h2>候選熱門主題</h2><span>目前顯示 {results.length} 筆，依 {sortLabel(filters.sortBy)} 排序</span></div></div>
    {loading ? <div className="trend-loading">正在建立 Mock 熱門資料…</div> : results.length ? <div className="trend-topic-list">{results.map((topic)=><TrendTopicCard key={topic.id} topic={topic} watching={trendDiscoveryService.isWatching(topic.id)} onWatch={()=>{trendDiscoveryService.addToWatchlist(topic.id);changed();}} onRemoveWatch={()=>{trendDiscoveryService.removeFromWatchlist(topic.id);changed();}} onExclude={(reason)=>{trendDiscoveryService.exclude(topic.id,reason);setNotice(`已排除「${topic.title}」。`);changed();}} />)}</div> : <div className="trend-no-results"><h2>找不到符合條件的主題</h2><p>請清除部分篩選條件後再試一次。</p></div>}
  </section>;
}

export function TrendOverviewPage() { return <TrendListPage />; }
export function TrendSearchPage() { return <TrendListPage fullFilters />; }
function Stat({ label, value, highlight=false }: { label:string; value:string; highlight?:boolean }) { return <article className={highlight?'highlight':''}><span>{label}</span><strong>{value}</strong></article>; }
const sortLabel = (sort:string) => ({score:'綜合分數',growth:'增長最快',heat:'目前最熱',newest:'最新出現',resonance:'社會共鳴',low_competition:'低競爭',low_risk:'低風險'}[sort] ?? sort);
