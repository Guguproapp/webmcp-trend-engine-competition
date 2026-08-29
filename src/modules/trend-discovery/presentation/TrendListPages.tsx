import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import { type ExclusionReason } from '../application/repositories';
import { TrendFilterPanel, TrendTopicCard } from './TrendComponents';
import { getActiveFilterLabels } from './TrendFilterUi';
import { formatDateTime } from './formatters';
import { publicTopicTitle } from './publicLabels';

function useTrendRevision() {
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(!trendDiscoveryService.listAll().length);
  const [loadError,setLoadError]=useState('');
  useEffect(() => { trendDiscoveryService.ensureData().then(() => { setRevision((value)=>value+1); setLoading(false); }).catch((error:unknown)=>{setLoadError(error instanceof Error?error.message:'真實資料讀取失敗');setLoading(false);}); }, []);
  return { revision, loading, loadError, refresh: () => setRevision((value)=>value+1) };
}

interface ExclusionUndo {
  topicId: string;
  title: string;
  wasWatching: boolean;
}

function TrendListPage({ fullFilters = false }: { fullFilters?: boolean }) {
  const { revision, loading, loadError, refresh: rerender } = useTrendRevision();
  const [filters, setFilters] = useState<TrendFilters>(()=>fullFilters ? trendDiscoveryService.getFilters() : DEFAULT_TREND_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<ExclusionUndo | null>(null);
  const topics = trendDiscoveryService.listAll();
  const results = trendDiscoveryService.listFiltered(filters);
  const latest = trendDiscoveryService.getLatestRefresh();
  const metadata=trendDiscoveryService.getApiMetadata();
  const today = new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric', weekday:'long' }).format(new Date());
  const risingTopics=topics.filter((topic)=>topic.growthStatus==='measured'&&(topic.tier==='viral'||topic.tier==='rising'));
  const highestScore = topics.length ? Math.max(...topics.map((topic)=>topic.totalScore)) : 0;
  const collapsedTopics = results.slice(0,5);
  const visibleTopics = fullFilters || showAll ? results : collapsedTopics;
  const activeLabels = getActiveFilterLabels(filters);

  async function updateData() { setRefreshing(true); try{await trendDiscoveryService.refresh();setUndo(null);setNotice('已取得伺服器目前最新的真實情報快取。');rerender();}catch(error){setNotice(error instanceof Error?error.message:'暫時無法取得最新情報。');}finally{setRefreshing(false);} }
  function apply(next: TrendFilters) { setFilters(next); setShowAll(false); setUndo(null); trendDiscoveryService.saveFilters(next); setNotice(`已套用篩選，目前 ${trendDiscoveryService.listFiltered(next).length} 筆結果。`); }
  function save(next: TrendFilters) { const name = `我的規則 ${trendDiscoveryService.listSavedRules().length + 1}`; trendDiscoveryService.saveNamedRule(name,next); trendDiscoveryService.saveFilters(next); setFilters(next); setUndo(null); setNotice(`已儲存「${name}」。`); }
  function changed() { rerender(); }
  function exclude(topicId:string, title:string, reason:ExclusionReason) {
    const wasWatching = trendDiscoveryService.isWatching(topicId);
    trendDiscoveryService.exclude(topicId,reason);
    setUndo({ topicId, title, wasWatching });
    setNotice(`已排除「${publicTopicTitle(title)}」。`);
    changed();
  }
  function undoExclusion() {
    if (!undo) return;
    trendDiscoveryService.cancelExclusion(undo.topicId);
    if (undo.wasWatching) trendDiscoveryService.addToWatchlist(undo.topicId);
    setNotice(`已撤銷排除「${publicTopicTitle(undo.title)}」。`);
    setUndo(null);
    changed();
  }

  const overviewStats = [
    <Stat key="topics" label="有效主題數" value={`${topics.length}`} />,
    <Stat key="rising" label="快速上升數" value={`${risingTopics.length}`} highlight />,
    <Stat key="sources" label="正常運作來源" value={`${metadata?.sourceStatuses.filter((source)=>source.state==='enabled').length??0}`} />,
    <Stat key="updated" label="最後更新" value={metadata?.lastSuccessAt ? formatDateTime(metadata.lastSuccessAt) : '蒐集中'} />,
  ];
  const searchStats = [
    <Stat key="updated" label="上次更新" value={latest ? formatDateTime(latest.refreshedAt) : '準備中'} />,
    <Stat key="sources" label="正常運作來源" value={`${metadata?.sourceStatuses.filter((source)=>source.state==='enabled').length??0}`} />,
    <Stat key="topics" label="蒐集主題數" value={`${topics.length}`} />,
    <Stat key="results" label="目前結果數" value={`${results.length}`} highlight />,
  ];

  return <section className={`trend-page ${fullFilters ? 'trend-page--search' : 'trend-page--overview'}`} data-revision={revision}>
    <div className="trend-title-row"><div><div className="trend-date">{today}｜{metadata?.message??'正在連接真實資料來源'}</div><h1>{fullFilters ? '主題搜尋' : '爆紅熱門精選'}</h1><p>{fullFilters ? '用清楚的條件搜尋與比較候選熱門主題。' : '蒐集正在快速上升的話題，並依熱度、增速、共鳴與風險排序。'}</p></div><button className="button secondary refresh-button" onClick={updateData} disabled={refreshing}>{refreshing ? '取得中…' : '取得最新情報'}</button></div>
    {!fullFilters && <section className="trend-daily-summary" aria-label="今日熱門摘要"><div><span className="summary-kicker">今日發現</span><strong>{risingTopics.length?`今天有 ${risingTopics.length} 個話題正在快速上升，最高潛力 ${highestScore} 分。`:`目前正在蒐集真實訊號，已有 ${topics.length} 個主題建立資料。`}</strong><span>數據不足時不顯示推測增速。</span></div><span className="summary-pulse" aria-hidden="true" /></section>}
    <div className="trend-stat-grid">{fullFilters ? searchStats : overviewStats}</div>
    <TrendFilterPanel compact={!fullFilters} filters={filters} onApply={apply} onClear={()=>apply(DEFAULT_TREND_FILTERS)} onSave={save} />
    {fullFilters && <div className="active-filter-summary" aria-live="polite"><strong>目前結果：{results.length} 筆</strong>{activeLabels.length ? <ul>{activeLabels.map((label)=><li key={label}>{label}</li>)}</ul> : <span>使用預設條件，尚未加入額外限制。</span>}</div>}
    {notice && <div className="trend-toast" role="status" aria-live="polite"><span>✓ {notice}</span>{undo && <button type="button" onClick={undoExclusion}>撤銷</button>}</div>}
    <div className="trend-results-heading"><div><h2>{fullFilters ? '搜尋結果' : '候選熱門主題'}</h2><span>{fullFilters || showAll ? `目前顯示 ${visibleTopics.length} 筆，依 ${sortLabel(filters.sortBy)} 排序` : `先顯示高潛力前 ${visibleTopics.length} 名`}</span></div>{!fullFilters && results.length > collapsedTopics.length && <button type="button" className="button trend-primary" onClick={()=>setShowAll((value)=>!value)} aria-expanded={showAll}>{showAll ? `收合為前 ${collapsedTopics.length} 名` : `查看全部 ${results.length} 個主題`}</button>}</div>
    {loading ? <div className="trend-loading">正在讀取真實熱門資料…</div> : visibleTopics.length ? <div className="trend-topic-list results-fade">{visibleTopics.map((topic,index)=><TrendTopicCard key={topic.id} topic={topic} rank={filters.sortBy==='score'?index+1:undefined} watching={trendDiscoveryService.isWatching(topic.id)} onWatch={()=>{trendDiscoveryService.addToWatchlist(topic.id);setUndo(null);setNotice(`已將「${publicTopicTitle(topic.title)}」加入觀察。`);changed();}} onRemoveWatch={()=>{trendDiscoveryService.removeFromWatchlist(topic.id);setUndo(null);setNotice(`已將「${publicTopicTitle(topic.title)}」移出觀察。`);changed();}} onExclude={(reason)=>exclude(topic.id,topic.title,reason)} />)}</div> : <div className="trend-no-results"><h2>{loadError?'真實資料暫時無法讀取':'目前沒有符合條件的真實主題'}</h2><p>{loadError||metadata?.message||'請稍後再取得最新情報，系統不會以測試題目替代真實資料。'}</p></div>}
  </section>;
}

export function TrendOverviewPage() { return <TrendListPage />; }
export function TrendSearchPage() { return <TrendListPage fullFilters />; }
function Stat({ label, value, highlight=false }: { label:string; value:string; highlight?:boolean }) { return <article className={highlight?'highlight':''}><span>{label}</span><strong>{value}</strong></article>; }
const sortLabel = (sort:string) => ({score:'綜合分數',growth:'增長最快',heat:'目前最熱',newest:'最新出現',resonance:'社會共鳴',low_competition:'低競爭',low_risk:'低風險'}[sort] ?? sort);
