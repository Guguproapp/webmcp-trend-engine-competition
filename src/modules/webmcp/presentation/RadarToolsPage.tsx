import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRadarWebMcpToolDefinitions } from '../application/createRadarWebMcpToolDefinitions';
import { HttpRadarBrowserGateway, type RadarBrowserGateway, type RadarGatewayResult, type RadarMarket, type RadarRankingItem, type RadarSort, type RadarSourceHealth, type RadarType } from '../application/RadarBrowserGateway';
import { registerWebMcpTools } from '../infrastructure/registerWebMcpTools';

const sourceSemantics = [
  ['Google Trending RSS', '上升搜尋訊號。'], ['YouTube', '官方熱門影片及公開統計；無資料時不補假資料。'], ['NAVER', '韓國候選詞驗證，不是完整熱門榜。'],
  ['Yahoo! JAPAN購物', '購物關鍵字，不是日本全網熱搜。'], ['Daum', '文件量交叉驗證，不是搜尋量。'], ['GDELT', '新聞佐證。'],
  ['Hatena', '公開收藏關注。'], ['Wikimedia', '公開閱讀關注。'], ['中國大陸停用來源', '等待合法來源。'],
] as const;

const sourceStatusLabels: Record<RadarSourceHealth['status'], string> = {
  success: '正常',
  empty: '目前無資料',
  failed: '讀取失敗',
  delayed: '資料延遲',
  waiting_credentials: '等待憑證',
  disabled: '已停用',
};

const defaultSearchQuery = {
  market: 'TW' as RadarMarket,
  type: 'search_rising' as RadarType,
  hours: 24,
  sort: 'rank' as RadarSort,
  limit: 5,
};

const toolValueLabels = ['搜尋熱門趨勢', '查看主題詳情', '搜尋爆款影音', '查看資料來源', '查看支援市場', '查看主題分類'] as const;

function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function RadarToolsPage({ gateway: suppliedGateway }: { gateway?: RadarBrowserGateway }) {
  const gateway = useMemo(() => suppliedGateway ?? new HttpRadarBrowserGateway(), [suppliedGateway]);
  const tools = useMemo(() => createRadarWebMcpToolDefinitions(gateway), [gateway]);
  const [nativeStatus, setNativeStatus] = useState<'checking' | 'supported' | 'unsupported' | 'failed'>('checking');
  const [market, setMarket] = useState('TW'); const [type, setType] = useState('search_rising');
  const [category, setCategory] = useState(''); const [source, setSource] = useState('');
  const [hours, setHours] = useState(24); const [minConfidence, setMinConfidence] = useState(0);
  const [sort, setSort] = useState('rank'); const [limit, setLimit] = useState(5);
  const [result, setResult] = useState<RadarGatewayResult<RadarRankingItem[]> | null>(null);
  const [sources, setSources] = useState<RadarGatewayResult<RadarSourceHealth[]> | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle'); const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true; let unregister: () => void = () => undefined;
    registerWebMcpTools({ document, tools }).then((registration) => {
      if (!active) { registration.unregister(); return; }
      unregister = registration.unregister; setNativeStatus(registration.supported ? 'supported' : 'unsupported');
    }).catch(() => { if (active) setNativeStatus('failed'); });
    return () => { active = false; unregister(); };
  }, [tools]);

  async function runSearch(query: Parameters<RadarBrowserGateway['trends']>[0]) {
    setState('loading'); setMessage('正在讀取熱門雷達。');
    try {
      const data = await gateway.trends(query);
      setResult(data); setMessage(data.summary); setState('success');
    } catch (error) { setResult(null); setMessage(error instanceof Error ? error.message : '熱門雷達查詢暫時無法完成。'); setState('error'); }
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    await runSearch({ market: market as RadarMarket, ...(category ? { category } : {}), type: type as RadarType, hours, ...(minConfidence > 0 ? { minConfidence } : {}), ...(source ? { source } : {}), sort: sort as RadarSort, limit });
  }

  async function quickSearch() {
    setMarket(defaultSearchQuery.market); setType(defaultSearchQuery.type); setHours(defaultSearchQuery.hours); setSort(defaultSearchQuery.sort); setLimit(defaultSearchQuery.limit);
    setCategory(''); setSource(''); setMinConfidence(0);
    await runSearch(defaultSearchQuery);
    requestAnimationFrame(() => {
      const results = document.getElementById('radar-search-results');
      if (typeof results?.scrollIntoView === 'function') results.scrollIntoView({ block: 'start' });
    });
  }

  async function loadSources() {
    setState('loading'); setMessage('正在讀取來源狀態。');
    try { const data = await gateway.sources(); setSources(data); setMessage(data.summary); setState('success'); }
    catch (error) { setSources(null); setMessage(error instanceof Error ? error.message : '來源狀態暫時無法讀取。'); setState('error'); }
  }

  return <section className="radar-workspace" aria-labelledby="radar-tools-title">
    <div className="radar-hero"><div><span>真實來源 · READ-ONLY WEBMCP</span><h1 id="radar-tools-title">熱門雷達工具 <small>Asia Trend Radar Tools</small></h1><p>利用真實熱門訊號找出值得關注的內容機會；所有工具只查詢，不修改排程、來源或資料。</p><div className="radar-capability-summary" aria-label="六個唯讀工具用途">{toolValueLabels.map((label) => <span key={label}>{label}</span>)}</div><button className="button radar-quick-search" type="button" onClick={quickSearch} disabled={state === 'loading'}>{state === 'loading' ? '讀取中' : '立即搜尋台灣近24小時前5名'}</button></div><strong className={`radar-native-state state-${nativeStatus}`}>{nativeStatus === 'supported' ? '6 個唯讀工具已就緒' : nativeStatus === 'checking' ? '正在檢查 WebMCP' : nativeStatus === 'unsupported' ? '安全降級：一般搜尋可用' : 'WebMCP 註冊失敗；一般搜尋可用'}</strong></div>

    <section className="radar-panel" id="radar-search" aria-labelledby="fallback-search-title">
      <div className="radar-panel-heading"><div><span>立即查詢 · WEBSITE FALLBACK</span><h2 id="fallback-search-title">一般網站搜尋備援</h2></div><p>即使瀏覽器不支援 WebMCP，仍使用同一套資料與錯誤語意。</p></div>
      <form className="radar-search-form" onSubmit={search}>
        <label>市場<select value={market} onChange={(event) => setMarket(event.target.value)}><option value="TW">台灣</option><option value="JP">日本</option><option value="KR">韓國</option><option value="HK">香港</option><option value="SG">新加坡</option></select></label>
        <label>情報類型<select value={type} onChange={(event) => setType(event.target.value)}><option value="search_rising">上升熱搜</option><option value="video_viral">爆款影音</option><option value="dual">雙重訊號</option><option value="news_rising">新聞增加</option></select></label>
        <label>時間範圍<select value={hours} onChange={(event) => setHours(Number(event.target.value))}><option value={1}>1小時</option><option value={24}>24小時</option><option value={72}>3天</option><option value={168}>7天</option></select></label>
        <label>排序<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="rank">排名</option><option value="freshness">最新</option><option value="growth">增長最快</option></select></label>
        <label>筆數<input type="number" min={1} max={50} value={limit} onChange={(event) => setLimit(Math.max(1, Math.min(50, Number(event.target.value))))} /></label>
        <details className="radar-advanced-options"><summary>進階條件（選填）</summary><div className="radar-advanced-grid">
          <label>分類代碼<input value={category} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" placeholder="可留空" onChange={(event) => setCategory(event.target.value)} /></label>
          <label>最低信心<input type="number" min={0} max={1} step={0.1} value={minConfidence} onChange={(event) => setMinConfidence(Math.max(0, Math.min(1, Number(event.target.value))))} /></label>
          <label>來源代碼<input value={source} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" placeholder="可留空" onChange={(event) => setSource(event.target.value)} /></label>
        </div></details>
        <button className="button trend-primary" type="submit" disabled={state === 'loading'}>{state === 'loading' ? '讀取中' : '搜尋雷達'}</button>
        <button className="button secondary" type="button" onClick={loadSources} disabled={state === 'loading'}>查看來源狀態</button>
      </form>
      <div id="radar-search-results"><p className={`radar-message message-${state}`} role="status" aria-live="polite">{message || '尚未查詢；可先使用台灣過去24小時前5名。'}</p></div>
      {result && <div className="radar-result-list">{result.data.length ? result.data.map((item) => {
        const sourceUrl = safeSourceUrl(item.sourceUrl);
        const creatorParams = new URLSearchParams({ title: item.traditionalTitle ?? item.originalTitle, summary: `來源：${item.sourceNames.join('、') || '來源不足'}；取得時間：${item.acquiredAt}`, sources: String(item.sourceNames.length) });
        return <article key={item.topicId}><div><span>#{item.rank}</span><span>{item.marketCode}</span><span>信心 {Math.round(item.confidence * 100)}%</span></div><h3>{item.traditionalTitle ?? item.originalTitle}</h3><p>來源：{item.sourceNames.join('、') || '來源不足'}</p><p>{item.searchGrowth === null && item.videoGrowth === null && item.newsGrowth === null ? '正在建立增速基準' : `增速：${item.searchGrowth ?? item.videoGrowth ?? item.newsGrowth}%`}</p><p>{result.delayed || item.delayed ? `目前顯示最近一次成功資料｜取得：${item.acquiredAt}` : `取得時間：${item.acquiredAt}`}</p><div className="radar-result-actions">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">查看原始來源</a> : <span className="radar-source-unavailable">原始來源網址不可用</span>}<Link to={`/trends/${encodeURIComponent(item.topicId)}/create?${creatorParams.toString()}`}>建立影音創作稿</Link></div></article>;
      }) : <div className="radar-empty"><strong>目前沒有符合條件的正式資料</strong><p>系統不會建立假主題或假影片補位。</p></div>}</div>}
      {sources && <div className="radar-source-list">{sources.data.map((source) => <article key={source.sourceCode}><strong>{source.sourceName}</strong><span>{sourceStatusLabels[source.status]}（{source.status}）</span><p>{source.message}</p><small>最後成功：{source.lastSuccessAt ?? '尚無'}</small></article>)}</div>}
    </section>

    <details className="radar-trust-details"><summary>查看信任與安全說明</summary><div className="radar-proof-grid" aria-label="WebMCP工具契約">
      <article><span>工具權限</span><strong>6 個唯讀工具</strong><p>全部標示 readOnlyHint，沒有寫入或管理工具。</p></article>
      <article><span>秘密邊界</span><strong>Token 僅在伺服器</strong><p>瀏覽器、工具輸出與正式產物不含授權標頭。</p></article>
      <article><span>失敗策略</span><strong>延遲或誠實空狀態</strong><p>不使用展示資料填補正式來源失敗。</p></article>
    </div></details>

    <section className="radar-panel" aria-labelledby="tools-list-title"><div className="radar-panel-heading"><div><span>DISCOVERABLE TOOLS</span><h2 id="tools-list-title">評審可發現的工具</h2></div></div><div className="radar-tool-list">{tools.map((tool) => <article key={tool.name}><code>{tool.name}</code><strong>{tool.title}</strong><p>{tool.description}</p><span>唯讀：是 · readOnlyHint=true</span></article>)}</div></section>

    <section className="radar-panel" aria-labelledby="source-semantics-title"><div className="radar-panel-heading"><div><span>TRUST BOUNDARY</span><h2 id="source-semantics-title">來源語意與限制</h2></div></div><dl className="radar-semantics">{sourceSemantics.map(([name, meaning]) => <div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl></section>
  </section>;
}
