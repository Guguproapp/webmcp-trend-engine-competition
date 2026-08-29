import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { regionalSearchPreferencesRepository, trendDiscoveryService, videoDiscoveryService } from '../../../app/services';
import {
  buildPlatformSearchLinks, SOURCE_ACQUISITION_LABELS, VIDEO_CONFIDENCE_LABELS, VIDEO_PLATFORM_LABELS,
  VIDEO_PLATFORMS, type SourceAcquisitionMethod, type VideoCandidate, type VideoPlatform,
} from '../domain/VideoDiscovery';
import {
  classifyIntelligence, inferYouTubeContentForm, INTELLIGENCE_TYPES, INTELLIGENCE_TYPE_LABELS,
  isRegionalResultMatch, MARKET_REGIONS, MARKET_REGION_LABELS, REGION_DEFAULT_PLATFORMS,
  VIDEO_CONTENT_FORM_LABELS, YOUTUBE_CONTENT_FILTERS, YOUTUBE_CONTENT_FILTER_LABELS,
  type RegionalSearchFilters, type SpecificMarketRegion, type VideoContentForm,
} from '../domain/RegionalDiscovery';
import { resolveDiscoverySources, type DiscoverySourceState } from '../application/PlatformSourceRegistry';
import { formatDateTime, formatNumber, growthPresentation } from './formatters';

type ImportMethod = Extract<SourceAcquisitionMethod, 'official_site_assisted' | 'user_shared' | 'search_engine_candidate'>;
const importMethods: ImportMethod[] = ['user_shared', 'official_site_assisted', 'search_engine_candidate'];
const specificRegions: SpecificMarketRegion[] = ['china_mainland','taiwan','hong_kong','macau'];
const emptyMetric = { viewCount:'', likeCount:'', commentCount:'', shareCount:'' };

const sourceStateLabel = (state: DiscoverySourceState) => ({
  enabled:'官方自動取得已啟用', official_site_assisted:'官方網站輔助搜尋', waiting_platform_permission:'等待平台權限',
  waiting_official_access:'等待官方資格', unavailable:'暫時無法取得', temporary_failure:'來源暫時失敗',
  quota_exceeded:'超過配額', disabled:'尚未啟用', not_applied:'尚未申請', preparing:'準備申請資料',
  waiting_review:'等待平台審查', approved:'已取得官方權限', expired:'權限失效', waiting_authorization:'等待授權', user_shared:'使用者分享網址',
}[state]);

export function VideoSearchPage() {
  const initial = useMemo(()=>regionalSearchPreferencesRepository.read(),[]);
  const [draft,setDraft]=useState<RegionalSearchFilters>(initial);
  const [applied,setApplied]=useState<RegionalSearchFilters>(initial);
  const [ready,setReady]=useState(Boolean(trendDiscoveryService.listAll().length)); const [,setRevision]=useState(0);
  const [referenceNow] = useState(() => Date.now());
  const [url,setUrl]=useState(''); const [title,setTitle]=useState(''); const [author,setAuthor]=useState(''); const [notes,setNotes]=useState('');
  const [candidateRegion,setCandidateRegion]=useState<SpecificMarketRegion>(initial.region==='all'?'taiwan':initial.region);
  const [candidateContentForm,setCandidateContentForm]=useState<VideoContentForm>('unknown');
  const [method,setMethod]=useState<ImportMethod>('user_shared'); const [metrics,setMetrics]=useState(emptyMetric); const [notice,setNotice]=useState(''); const [error,setError]=useState('');
  useEffect(()=>{trendDiscoveryService.ensureData().finally(()=>setReady(true));},[]);
  const links=useMemo(()=>buildPlatformSearchLinks(applied.keyword),[applied.keyword]);
  const sourceStates=resolveDiscoverySources(trendDiscoveryService.getApiMetadata()?.sourceStatuses??[]);
  const cutoff=referenceNow-applied.timeRangeHours*3600000;
  const normalizedQuery=applied.keyword.trim().toLocaleLowerCase('zh-TW');
  const youtubeEvidence=trendDiscoveryService.listAll().flatMap((topic)=>topic.sourceItems.map((source)=>({topic,source})))
    .filter(({source})=>source.platform==='youtube')
    .map(({topic,source})=>({topic,source,region:'taiwan' as const,platform:'youtube' as const,contentForm:inferYouTubeContentForm(source.originalUrl),intelligenceType:classifyIntelligence({
      searchVolume:null, searchGrowthRate:null, videoGrowthRate:source.growthStatus==='measured'?source.growthDelta:null,
      videoEvidenceReliable:source.viewCount!==null&&source.confidence>=50, newsGrowthRate:null, videoSupplyCount:null,
    })}))
    .filter((item)=>new Date(item.source.publishedAt).getTime()>=cutoff && (!normalizedQuery || `${item.source.title} ${item.topic.title} ${item.topic.keywords.join(' ')}`.toLocaleLowerCase('zh-TW').includes(normalizedQuery)))
    .filter((item)=>isRegionalResultMatch(item,applied))
    .filter((item,index,items)=>items.findIndex((entry)=>entry.source.originalUrl===item.source.originalUrl)===index);
  const candidates=videoDiscoveryService.listCandidates().filter((candidate)=>{
    const item={region:candidate.region??'taiwan',intelligenceType:candidate.intelligenceType??'insufficient_evidence',platform:candidate.platform,contentForm:candidate.contentForm??'unknown'};
    const searchable=`${candidate.title} ${candidate.author} ${candidate.notes}`.toLocaleLowerCase('zh-TW');
    return new Date(candidate.updatedAt).getTime()>=cutoff && (!normalizedQuery||searchable.includes(normalizedQuery)) && isRegionalResultMatch(item,applied);
  });

  function updateRegion(region:RegionalSearchFilters['region']) {
    const platforms=[...REGION_DEFAULT_PLATFORMS[region]];
    setDraft((current)=>({...current,region,platforms}));
    if(region!=='all')setCandidateRegion(region);
  }
  function togglePlatform(platform:VideoPlatform) {
    setDraft((current)=>({...current,platforms:current.platforms.includes(platform)?current.platforms.filter((item)=>item!==platform):[...current.platforms,platform]}));
  }
  function applyFilters() {
    if(!draft.platforms.length){setError('請至少選擇一個影音平台。');return;}
    const next={...draft,platforms:[...draft.platforms]};
    regionalSearchPreferencesRepository.save(next); setApplied(next); setError(''); setNotice('已套用並保存地區、情報類型與平台條件。');
  }

  function submitImport(event:FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const numeric=Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,value===''?null:Number(value)]));
      const result=videoDiscoveryService.importCandidate({url,title,author,notes,acquisitionMethod:method,metrics:numeric,region:candidateRegion,contentForm:candidateContentForm});
      setNotice(result.merged?'已合併重複網址並更新候選資料。':'已加入影音候選；尚未驗證，不會直接計算爆紅增速。');
      setUrl('');setTitle('');setAuthor('');setNotes('');setMetrics(emptyMetric);setCandidateContentForm('unknown');setRevision((value)=>value+1);
    } catch (caught) { setError(caught instanceof Error?caught.message:'影音網址匯入失敗。'); }
  }

  return <section className="trend-page video-search-page">
    <div className="trend-title-row"><div><div className="trend-date">地區、情報類型與來源平台三維搜尋</div><h1>爆款影音搜尋</h1><p>整合官方資料、平台官方搜尋及使用者網址匯入；新聞篇數不冒充搜尋量，人工資料不偽裝成官方數據。</p></div></div>
    <section className="regional-search-workflow" aria-label="爆款影音搜尋條件">
      <label className="filter-step"><span><b>1</b>選擇地區</span><select aria-label="選擇地區" value={draft.region} onChange={(event)=>updateRegion(event.target.value as RegionalSearchFilters['region'])}>{MARKET_REGIONS.map((region)=><option key={region} value={region}>{MARKET_REGION_LABELS[region]}</option>)}</select></label>
      <label className="filter-step"><span><b>2</b>選擇情報類型</span><select aria-label="選擇情報類型" value={draft.intelligenceType} onChange={(event)=>setDraft({...draft,intelligenceType:event.target.value as RegionalSearchFilters['intelligenceType']})}><option value="all">全部情報類型</option>{INTELLIGENCE_TYPES.map((type)=><option key={type} value={type}>{INTELLIGENCE_TYPE_LABELS[type]}</option>)}</select></label>
      <fieldset className="filter-step platform-checks"><legend><b>3</b>選擇平台</legend>{VIDEO_PLATFORMS.map((platform)=><label key={platform}><input type="checkbox" checked={draft.platforms.includes(platform)} onChange={()=>togglePlatform(platform)} /><span>{VIDEO_PLATFORM_LABELS[platform]}</span></label>)}</fieldset>
      {draft.platforms.includes('youtube')&&<fieldset className="filter-step youtube-form-filter"><legend>YouTube內容形式</legend>{YOUTUBE_CONTENT_FILTERS.map((form)=><label key={form}><input type="radio" name="youtube-form" value={form} checked={draft.youtubeContentForm===form} onChange={()=>setDraft({...draft,youtubeContentForm:form})} /><span>{YOUTUBE_CONTENT_FILTER_LABELS[form]}</span></label>)}</fieldset>}
      <div className="filter-step search-time-row"><span><b>4</b>選擇時間與關鍵字</span><label><span>時間範圍</span><select aria-label="時間範圍" value={draft.timeRangeHours} onChange={(event)=>setDraft({...draft,timeRangeHours:Number(event.target.value) as RegionalSearchFilters['timeRangeHours']})}><option value="24">最近24小時</option><option value="72">最近3天</option><option value="168">最近7天</option></select></label><label><span>搜尋關鍵字</span><input value={draft.keyword} onChange={(event)=>setDraft({...draft,keyword:event.target.value})} placeholder="例如：物價、上班族、人工智慧" /></label></div>
      <div className="filter-step filter-actions"><b>5</b><button type="button" className="button trend-primary" onClick={applyFilters}>套用篩選</button><Link className="button secondary" to="/trends/sources"><b>6</b>查看來源證據</Link></div>
      <p className="applied-filter-summary" aria-live="polite">目前條件：{MARKET_REGION_LABELS[applied.region]}｜{applied.intelligenceType==='all'?'全部情報類型':INTELLIGENCE_TYPE_LABELS[applied.intelligenceType]}｜{applied.platforms.map((item)=>VIDEO_PLATFORM_LABELS[item]).join('、')}</p>
    </section>
    <div className="form-message" aria-live="polite">{error&&<span className="form-error">{error}</span>}{notice&&<span className="form-success">{notice}</span>}</div>

    <section className="platform-entry-grid" aria-labelledby="platform-entry-title"><div className="section-heading"><div><h2 id="platform-entry-title">八平台官方搜尋入口</h2><p>八個平台都可手動勾選；未取得正式介面時只開啟官方頁面或接受使用者分享網址。</p></div></div>
      {sourceStates.filter((source)=>source.group==='viral_video'&&source.platform&&applied.platforms.includes(source.platform)).map((source)=>{
        const code=source.platform!; return <article key={source.code}><div><strong>{source.name}</strong><span className={`provider-state state-${source.state}`}>{sourceStateLabel(source.state)}</span></div><p>{source.description}</p><small>{source.limitation}</small><a className="button secondary small" href={links.official[code]} target="_blank" rel="noopener noreferrer">前往{source.name}官方搜尋 ↗</a>{code==='tiktok'&&<a className="button secondary small" href={links.creativeCenter} target="_blank" rel="noopener noreferrer">前往TikTok官方熱門創意中心 ↗</a>}</article>;
      })}
    </section>

    <details className="web-search-assist"><summary>使用搜尋引擎尋找候選影音</summary><div><p>尚未啟用自動網頁搜尋。本功能只開啟限定官方網域的搜尋頁，不讀取或爬取搜尋結果。</p>{applied.platforms.map((code)=><a key={code} className="button secondary small" href={links.webSearch[code]} target="_blank" rel="noopener noreferrer">搜尋{VIDEO_PLATFORM_LABELS[code]}候選 ↗</a>)}</div></details>

    {applied.platforms.includes('youtube')&&<section className="youtube-official-results"><div className="section-heading"><div><h2>YouTube官方自動搜尋結果</h2><p>目前正式自動查詢以台灣為主；長影音與Shorts短影音只在內容形式已確認時分開比較。</p></div><span>{ready?`${youtubeEvidence.length} 筆`:'讀取中'}</span></div>{ready&&youtubeEvidence.length?<div className="video-result-grid">{youtubeEvidence.map(({source,region,intelligenceType,contentForm})=>{const growth=growthPresentation(source.growthStatus,source.growthDelta,source.heatHistory);return <article key={source.id}><div className="candidate-label-row"><span>{MARKET_REGION_LABELS[region]}</span><span>{INTELLIGENCE_TYPE_LABELS[intelligenceType]}</span><span>{VIDEO_PLATFORM_LABELS.youtube}</span><span>{VIDEO_CONTENT_FORM_LABELS[contentForm]}</span></div><h3>{source.title}</h3><p>{source.publisher}</p><dl><div><dt>資料取得方式</dt><dd>{SOURCE_ACQUISITION_LABELS.official_api}</dd></div><div><dt>最後更新時間</dt><dd>{formatDateTime(source.fetchedAt)}</dd></div><div><dt>資料可信度</dt><dd>{source.confidence}%</dd></div><div><dt>觀看</dt><dd>{source.viewCount===null?'來源未提供':formatNumber(source.viewCount)}</dd></div><div><dt>增速</dt><dd>{growth.label}</dd></div></dl><a className="source-link" href={source.originalUrl} target="_blank" rel="noopener noreferrer">查看原始來源 ↗</a></article>;})}</div>:ready?<div className="trend-no-results"><h3>目前沒有符合三維條件的YouTube資料</h3><p>若選擇熱搜上升或雙重爆紅，因目前沒有可靠搜尋量，系統不會用假結果補滿畫面。</p></div>:<div className="trend-loading">正在讀取YouTube官方資料…</div>}</section>}

    <section className="video-import-section" aria-labelledby="video-import-title"><div className="section-heading"><div><h2 id="video-import-title">貼上八平台影音網址</h2><p>只接受指定平台官方HTTPS網址；資料保存在此瀏覽器的B版專用命名空間。</p></div></div>
      <form onSubmit={submitImport} className="video-import-form" noValidate>
        <label className="wide"><span>影音網址（必填）</span><input type="url" required value={url} onChange={(event)=>setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
        <label><span>地區</span><select value={candidateRegion} onChange={(event)=>setCandidateRegion(event.target.value as SpecificMarketRegion)}>{specificRegions.map((region)=><option key={region} value={region}>{MARKET_REGION_LABELS[region]}</option>)}</select></label>
        <label><span>YouTube內容形式</span><select value={candidateContentForm} onChange={(event)=>setCandidateContentForm(event.target.value as VideoContentForm)}><option value="unknown">尚待分類</option><option value="long_video">長影音</option><option value="shorts">Shorts短影音</option></select></label>
        <label><span>題目或標題</span><input value={title} onChange={(event)=>setTitle(event.target.value)} placeholder="尚未提供時可稍後補上" /></label>
        <label><span>作者或頻道</span><input value={author} onChange={(event)=>setAuthor(event.target.value)} /></label>
        <label><span>資料取得方式</span><select value={method} onChange={(event)=>setMethod(event.target.value as ImportMethod)}>{importMethods.map((item)=><option key={item} value={item}>{SOURCE_ACQUISITION_LABELS[item]}</option>)}</select></label>
        <label><span>使用者看到的觀看數</span><input type="number" min="0" value={metrics.viewCount} onChange={(event)=>setMetrics({...metrics,viewCount:event.target.value})} /></label>
        <label><span>按讚數</span><input type="number" min="0" value={metrics.likeCount} onChange={(event)=>setMetrics({...metrics,likeCount:event.target.value})} /></label>
        <label><span>留言數</span><input type="number" min="0" value={metrics.commentCount} onChange={(event)=>setMetrics({...metrics,commentCount:event.target.value})} /></label>
        <label><span>分享數</span><input type="number" min="0" value={metrics.shareCount} onChange={(event)=>setMetrics({...metrics,shareCount:event.target.value})} /></label>
        <label className="wide"><span>備註</span><textarea value={notes} onChange={(event)=>setNotes(event.target.value)} rows={3} /></label>
        <div className="wide form-safety-note">使用者輸入的公開數據一律是「證據不足」，不會當成平台官方統計或直接判定爆紅。</div>
        <button className="button trend-primary wide" type="submit">加入影音候選</button>
      </form>
    </section>

    <section className="video-candidate-section"><div className="section-heading"><div><h2>已收集影音候選</h2><p>候選依目前地區、情報類型、平台、時間與關鍵字條件顯示。</p></div><span>{candidates.length} 筆</span></div>{candidates.length?<div className="video-candidate-list">{candidates.map((candidate)=><CandidateCard key={candidate.id} candidate={candidate} />)}</div>:<div className="trend-no-results"><h3>目前沒有符合條件的影音候選</h3><p>可調整篩選，或前往平台官方搜尋後貼回公開影片網址。</p></div>}</section>
  </section>;
}

function CandidateCard({candidate}:{candidate:VideoCandidate}) {
  const growth=videoDiscoveryService.getGrowthPresentation(candidate);
  return <article><div className="candidate-label-row"><span>{MARKET_REGION_LABELS[candidate.region??'taiwan']}</span><span>{INTELLIGENCE_TYPE_LABELS[candidate.intelligenceType??'insufficient_evidence']}</span><span>{VIDEO_PLATFORM_LABELS[candidate.platform]}</span><span>{VIDEO_CONTENT_FORM_LABELS[candidate.contentForm??'unknown']}</span></div><h3>{candidate.title}</h3>{candidate.author&&<p>{candidate.author}</p>}<dl><div><dt>資料取得方式</dt><dd>{SOURCE_ACQUISITION_LABELS[candidate.acquisitionMethod]}</dd></div><div><dt>最後更新時間</dt><dd>{formatDateTime(candidate.updatedAt)}</dd></div><div><dt>資料可信度</dt><dd>{VIDEO_CONFIDENCE_LABELS[candidate.evidenceConfidence]}</dd></div><div><dt>增速基準</dt><dd>{growth.label}</dd></div></dl>{candidate.notes&&<p className="candidate-notes">備註：{candidate.notes}</p>}<a className="source-link" href={candidate.normalizedUrl} target="_blank" rel="noopener noreferrer">查看原始來源 ↗</a></article>;
}
