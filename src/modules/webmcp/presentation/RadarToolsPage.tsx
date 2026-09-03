import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createRadarWebMcpToolDefinitions } from '../application/createRadarWebMcpToolDefinitions';
import { HttpRadarBrowserGateway, type RadarBrowserGateway, type RadarGatewayResult, type RadarMarket, type RadarRankingItem, type RadarSort, type RadarSourceHealth, type RadarType } from '../application/RadarBrowserGateway';
import { registerWebMcpTools } from '../infrastructure/registerWebMcpTools';
import { radarLocaleFromSearch, radarPageCopy, radarToolEnglish } from './radarLocale';

const defaultSearchQuery = {
  market: 'TW' as RadarMarket,
  type: 'search_rising' as RadarType,
  hours: 24,
  sort: 'rank' as RadarSort,
  limit: 5,
};

function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function englishDateTime(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei' }).format(new Date(value));
}

function englishSourceName(value: string, index: number): string {
  const known: Record<string,string> = {
    'Google熱門搜尋趨勢':'Google Trends', 'GDELT全球新聞資料':'GDELT', 'YouTube影音平台':'YouTube',
    'Threads社群討論':'Threads', 'Yahoo! JAPAN購物':'Yahoo! JAPAN Shopping',
  };
  if(known[value])return known[value];
  return /[\u3400-\u9fff]/u.test(value)?`Source-backed provider ${index+1}`:value;
}

export function RadarToolsPage({ gateway: suppliedGateway }: { gateway?: RadarBrowserGateway }) {
  const location=useLocation();
  const locale=radarLocaleFromSearch(location.search);
  const english=locale==='en';
  const c=radarPageCopy[locale];
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
  const previousLocale=useRef(locale);
  const requestGeneration=useRef(0);

  useEffect(() => {
    if(previousLocale.current===locale)return;
    previousLocale.current=locale;
    requestGeneration.current+=1;
    const frame=requestAnimationFrame(()=>{ setResult(null); setSources(null); setState('idle'); setMessage(''); });
    return ()=>cancelAnimationFrame(frame);
  }, [locale]);

  useEffect(() => {
    let active = true; let unregister: () => void = () => undefined;
    registerWebMcpTools({ document, tools }).then((registration) => {
      if (!active) { registration.unregister(); return; }
      unregister = registration.unregister; setNativeStatus(registration.supported ? 'supported' : 'unsupported');
    }).catch(() => { if (active) setNativeStatus('failed'); });
    return () => { active = false; unregister(); };
  }, [tools]);

  async function runSearch(query: Parameters<RadarBrowserGateway['trends']>[0]) {
    const generation=requestGeneration.current;
    setState('loading'); setMessage(c.loadingRadar);
    try {
      const data = await gateway.trends(query);
      if(requestGeneration.current!==generation)return;
      setResult(data); setMessage(c.found(data.actualCount)); setState('success');
    } catch (error) {
      if(requestGeneration.current!==generation)return;
      setResult(null);
      setMessage(english ? c.searchError : error instanceof Error ? error.message : c.searchError);
      setState('error');
    }
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
    const generation=requestGeneration.current;
    setState('loading'); setMessage(c.loadingSources);
    try {
      const data = await gateway.sources();
      if(requestGeneration.current!==generation)return;
      setSources(data); setMessage(c.sourcesFound(data.actualCount)); setState('success');
    }
    catch (error) {
      if(requestGeneration.current!==generation)return;
      setSources(null);
      setMessage(english ? c.sourceError : error instanceof Error ? error.message : c.sourceError);
      setState('error');
    }
  }

  const formatTime=(value:string)=>english?englishDateTime(value):value;

  return <section className={`radar-workspace${english?' lang-en':''}`} aria-labelledby="radar-tools-title">
    <div className="radar-language-tools" role="group" aria-label={c.languageLabel}>
      <Link to="/radar-tools" aria-current={english?undefined:'page'}>{c.zh}</Link>
      <Link to="/radar-tools?lang=en" aria-current={english?'page':undefined}>{c.en}</Link>
      <span>{c.scope}</span>
    </div>
    <div className="radar-hero"><div><span>{c.kicker}</span><h1 id="radar-tools-title">{c.title}{c.subtitle&&<> <small>{c.subtitle}</small></>}</h1><p>{c.value}</p><div className="radar-capability-summary" aria-label={english?'Six read-only tool capabilities':'六個唯讀工具用途'}>{c.capabilities.map((label) => <span key={label}>{label}</span>)}</div><button className="button radar-quick-search" type="button" onClick={quickSearch} disabled={state === 'loading'}>{state === 'loading' ? c.loading : c.quick}</button></div><strong className={`radar-native-state state-${nativeStatus}`}>{c.native[nativeStatus]}</strong></div>

    <section className="radar-panel" id="radar-search" aria-labelledby="fallback-search-title">
      <div className="radar-panel-heading"><div><span>{c.searchKicker}</span><h2 id="fallback-search-title">{c.searchTitle}</h2></div><p>{c.searchDescription}</p></div>
      <form className="radar-search-form" onSubmit={search}>
        <label>{c.market}<select value={market} onChange={(event) => setMarket(event.target.value)}>{(['TW','JP','KR','HK','SG'] as const).map((value,index)=><option value={value} key={value}>{c.markets[index]}</option>)}</select></label>
        <label>{c.type}<select value={type} onChange={(event) => setType(event.target.value)}>{(['search_rising','video_viral','dual','news_rising'] as const).map((value,index)=><option value={value} key={value}>{c.types[index]}</option>)}</select></label>
        <label>{c.hours}<select value={hours} onChange={(event) => setHours(Number(event.target.value))}>{([1,24,72,168] as const).map((value,index)=><option value={value} key={value}>{c.windows[index]}</option>)}</select></label>
        <label>{c.sort}<select value={sort} onChange={(event) => setSort(event.target.value)}>{(['rank','freshness','growth'] as const).map((value,index)=><option value={value} key={value}>{c.sorts[index]}</option>)}</select></label>
        <label>{c.limit}<input type="number" min={1} max={50} value={limit} onChange={(event) => setLimit(Math.max(1, Math.min(50, Number(event.target.value))))} /></label>
        <details className="radar-advanced-options"><summary>{c.advanced}</summary><div className="radar-advanced-grid">
          <label>{c.category}<input value={category} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" placeholder={c.optional} onChange={(event) => setCategory(event.target.value)} /></label>
          <label>{c.confidence}<input type="number" min={0} max={1} step={0.1} value={minConfidence} onChange={(event) => setMinConfidence(Math.max(0, Math.min(1, Number(event.target.value))))} /></label>
          <label>{c.source}<input value={source} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" placeholder={c.optional} onChange={(event) => setSource(event.target.value)} /></label>
        </div></details>
        <button className="button trend-primary" type="submit" disabled={state === 'loading'}>{state === 'loading' ? c.loading : c.search}</button>
        <button className="button secondary" type="button" onClick={loadSources} disabled={state === 'loading'}>{c.sourceStatus}</button>
      </form>
      <div id="radar-search-results"><p className={`radar-message message-${state}`} role="status" aria-live="polite">{message || c.idle}</p></div>
      {result && <div className="radar-result-list">{result.data.length ? result.data.map((item) => {
        const sourceUrl = safeSourceUrl(item.sourceUrl);
        const visibleSources=english?item.sourceNames.map(englishSourceName):item.sourceNames;
        const creatorParams = new URLSearchParams({ title: item.traditionalTitle ?? item.originalTitle, summary: `來源：${item.sourceNames.join('、') || '來源不足'}；取得時間：${item.acquiredAt}`, sources: String(item.sourceNames.length) });
        return <article key={item.topicId}><div><span>#{item.rank}</span><span>{item.marketCode}</span><span>{c.dataConfidence} {Math.round(item.confidence * 100)}%</span></div><h3>{item.traditionalTitle ?? item.originalTitle}</h3><p>{c.sources}: {visibleSources.join(english?', ':'、') || c.limitedSource}</p><p>{item.searchGrowth === null && item.videoGrowth === null && item.newsGrowth === null ? c.baseline : `${c.growth}: ${item.searchGrowth ?? item.videoGrowth ?? item.newsGrowth}%`}</p><p>{result.delayed || item.delayed ? `${c.latest}: ${formatTime(item.acquiredAt)}` : `${c.retrieved}: ${formatTime(item.acquiredAt)}`}</p><div className="radar-result-actions">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{c.original}</a> : <span className="radar-source-unavailable">{c.originalUnavailable}</span>}<Link to={`/trends/${encodeURIComponent(item.topicId)}/create?${creatorParams.toString()}`}>{c.create}</Link></div></article>;
      }) : <div className="radar-empty"><strong>{c.emptyTitle}</strong><p>{c.emptyBody}</p></div>}</div>}
      {sources && <div className="radar-source-list">{sources.data.map((sourceItem) => <article key={sourceItem.sourceCode}><strong>{english?sourceItem.sourceCode:sourceItem.sourceName}</strong><span>{c.status[sourceItem.status]} ({sourceItem.status})</span><p>{english?c.sourceMessages[sourceItem.status]:sourceItem.message}</p><small>{c.lastSourceSuccess}: {sourceItem.lastSuccessAt?formatTime(sourceItem.lastSuccessAt):c.none}</small></article>)}</div>}
    </section>

    <details className="radar-trust-details"><summary>{c.trustSummary}</summary><div className="radar-proof-grid" aria-label={c.contractLabel}>
      {c.proof.map(([label,title,body])=><article key={label}><span>{label}</span><strong>{title}</strong><p>{body}</p></article>)}
    </div></details>

    <section className="radar-panel" aria-labelledby="tools-list-title"><div className="radar-panel-heading"><div><span>{c.toolsKicker}</span><h2 id="tools-list-title">{c.toolsTitle}</h2></div></div><div className="radar-tool-list">{tools.map((tool) => <article key={tool.name}><code>{tool.name}</code><strong>{english?radarToolEnglish[tool.name]?.title??tool.name:tool.title}</strong><p>{english?radarToolEnglish[tool.name]?.description??'Read-only WebMCP tool.':tool.description}</p><span>{c.readOnly}</span></article>)}</div></section>

    <section className="radar-panel" aria-labelledby="source-semantics-title"><div className="radar-panel-heading"><div><span>{c.semanticsKicker}</span><h2 id="source-semantics-title">{c.semanticsTitle}</h2></div></div><dl className="radar-semantics">{c.semantics.map(([name, meaning]) => <div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl></section>
  </section>;
}
