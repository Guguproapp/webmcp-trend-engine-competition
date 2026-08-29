import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { trendDiscoveryService, videoDiscoveryService } from '../../../app/services';
import {
  buildPlatformSearchLinks, SOURCE_ACQUISITION_LABELS, VIDEO_CONFIDENCE_LABELS, VIDEO_PLATFORM_LABELS,
  VIDEO_PLATFORMS, type SourceAcquisitionMethod, type VideoCandidate, type VideoPlatform,
} from '../domain/VideoDiscovery';
import { resolveDiscoverySources } from '../application/PlatformSourceRegistry';
import { formatDateTime, formatNumber, growthPresentation } from './formatters';

type ImportMethod = Extract<SourceAcquisitionMethod, 'official_site_assisted' | 'user_shared' | 'search_engine_candidate'>;
const importMethods: ImportMethod[] = ['user_shared', 'official_site_assisted', 'search_engine_candidate'];
const emptyMetric = { viewCount:'', likeCount:'', commentCount:'', shareCount:'' };

export function VideoSearchPage() {
  const [keyword,setKeyword]=useState(''); const [platform,setPlatform]=useState<'all'|VideoPlatform>('all'); const [timeRange,setTimeRange]=useState(24);
  const [ready,setReady]=useState(Boolean(trendDiscoveryService.listAll().length)); const [,setRevision]=useState(0);
  const [referenceNow] = useState(() => Date.now());
  const [url,setUrl]=useState(''); const [title,setTitle]=useState(''); const [author,setAuthor]=useState(''); const [notes,setNotes]=useState('');
  const [method,setMethod]=useState<ImportMethod>('user_shared'); const [metrics,setMetrics]=useState(emptyMetric); const [notice,setNotice]=useState(''); const [error,setError]=useState('');
  useEffect(()=>{trendDiscoveryService.ensureData().finally(()=>setReady(true));},[]);
  const links=useMemo(()=>buildPlatformSearchLinks(keyword),[keyword]);
  const sourceStates=resolveDiscoverySources(trendDiscoveryService.getApiMetadata()?.sourceStatuses??[]);
  const cutoff=referenceNow-timeRange*3600000;
  const normalizedQuery=keyword.trim().toLocaleLowerCase('zh-TW');
  const youtubeEvidence=trendDiscoveryService.listAll().flatMap((topic)=>topic.sourceItems.map((source)=>({topic,source})))
    .filter(({source})=>source.platform==='youtube')
    .filter(({source,topic})=>new Date(source.publishedAt).getTime()>=cutoff && (!normalizedQuery || `${source.title} ${topic.title} ${topic.keywords.join(' ')}`.toLocaleLowerCase('zh-TW').includes(normalizedQuery)))
    .filter((item,index,items)=>items.findIndex((entry)=>entry.source.originalUrl===item.source.originalUrl)===index);
  const candidates=videoDiscoveryService.listCandidates();

  function submitImport(event:FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const numeric=Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,value===''?null:Number(value)]));
      const result=videoDiscoveryService.importCandidate({url,title,author,notes,acquisitionMethod:method,metrics:numeric});
      setNotice(result.merged?'已合併重複網址並更新候選資料。':'已加入影音候選；尚未驗證，不會直接計算爆紅增速。');
      setUrl('');setTitle('');setAuthor('');setNotes('');setMetrics(emptyMetric);setRevision((value)=>value+1);
    } catch (caught) { setError(caught instanceof Error?caught.message:'影音網址匯入失敗。'); }
  }

  return <section className="trend-page video-search-page">
    <div className="trend-title-row"><div><div className="trend-date">四大平台合法搜尋入口</div><h1>爆款影音搜尋</h1><p>整合YouTube官方資料、平台官方搜尋及使用者網址匯入；人工候選資料不會偽裝為官方自動取得。</p></div></div>
    <section className="video-search-controls" aria-label="爆款影音搜尋條件">
      <label><span>搜尋關鍵字</span><input value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="例如：上班族、物價、人工智慧" /></label>
      <label><span>地區</span><select value="TW" disabled aria-label="地區"><option value="TW">台灣</option></select></label>
      <label><span>時間範圍</span><select value={timeRange} onChange={(event)=>setTimeRange(Number(event.target.value))}><option value="24">最近24小時</option><option value="72">最近3天</option><option value="168">最近7天</option></select></label>
      <label><span>平台</span><select value={platform} onChange={(event)=>setPlatform(event.target.value as 'all'|VideoPlatform)}><option value="all">全部平台</option>{VIDEO_PLATFORMS.map((code)=><option key={code} value={code}>{VIDEO_PLATFORM_LABELS[code]}</option>)}</select></label>
    </section>

    <section className="platform-entry-grid" aria-labelledby="platform-entry-title"><div className="section-heading"><div><h2 id="platform-entry-title">平台官方搜尋入口</h2><p>官方網站會在新分頁開啟；找到候選影片後，回到本頁貼上網址。</p></div></div>
      {sourceStates.filter((source)=>['youtube','facebook','instagram','tiktok'].includes(source.code)).map((source)=>{
        const code=source.code as VideoPlatform; if(platform!=='all'&&platform!==code)return null;
        return <article key={source.code}><div><strong>{source.name}</strong><span className={`provider-state state-${source.state}`}>{source.state==='enabled'?'可使用':source.state==='not_applied'?'尚未申請正式權限':'等待平台審查'}</span></div><p>{source.description}</p><small>{source.limitation}</small><a className="button secondary small" href={links.official[code]} target="_blank" rel="noopener noreferrer">前往{source.name}官方搜尋 ↗</a>{code==='tiktok'&&<a className="button secondary small" href={links.creativeCenter} target="_blank" rel="noopener noreferrer">前往TikTok官方熱門創意中心 ↗</a>}</article>;
      })}
    </section>

    <details className="web-search-assist"><summary>使用搜尋引擎尋找候選影音</summary><div><p>尚未啟用自動網頁搜尋。本功能只開啟限定官方網域的搜尋頁，不讀取或爬取搜尋結果。</p>{VIDEO_PLATFORMS.map((code)=><a key={code} className="button secondary small" href={links.webSearch[code]} target="_blank" rel="noopener noreferrer">搜尋{VIDEO_PLATFORM_LABELS[code]}候選 ↗</a>)}</div></details>

    {(platform==='all'||platform==='youtube')&&<section className="youtube-official-results"><div className="section-heading"><div><h2>YouTube官方自動搜尋結果</h2><p>搜尋目前伺服器已依法取得並快取的YouTube官方資料；一般使用者不會直接消耗外部API配額。</p></div><span>{ready?`${youtubeEvidence.length} 筆`:'讀取中'}</span></div>{ready&&youtubeEvidence.length?<div className="video-result-grid">{youtubeEvidence.map(({source})=>{const growth=growthPresentation(source.growthStatus,source.growthDelta,source.heatHistory);return <article key={source.id}><div className="candidate-label-row"><span>{SOURCE_ACQUISITION_LABELS.official_api}</span><span>{source.confidence}%來源信心</span></div><h3>{source.title}</h3><p>{source.publisher}</p><dl><div><dt>觀看</dt><dd>{source.viewCount===null?'來源未提供':formatNumber(source.viewCount)}</dd></div><div><dt>按讚</dt><dd>{source.likeCount===null?'來源未提供':formatNumber(source.likeCount)}</dd></div><div><dt>留言</dt><dd>{source.commentCount===null?'來源未提供':formatNumber(source.commentCount)}</dd></div><div><dt>增速</dt><dd>{growth.label}</dd></div></dl><a className="source-link" href={source.originalUrl} target="_blank" rel="noopener noreferrer">查看YouTube原始影片 ↗</a></article>;})}</div>:ready?<div className="trend-no-results"><h3>目前沒有符合條件的YouTube資料</h3><p>可調整關鍵字或時間範圍；系統不會用假影片補滿畫面。</p></div>:<div className="trend-loading">正在讀取YouTube官方資料…</div>}</section>}

    <section className="video-import-section" aria-labelledby="video-import-title"><div className="section-heading"><div><h2 id="video-import-title">貼上影音網址</h2><p>只接受四大平台官方HTTPS網址；資料保存在此瀏覽器的B版專用命名空間。</p></div></div>
      <form onSubmit={submitImport} className="video-import-form" noValidate>
        <label className="wide"><span>影音網址（必填）</span><input type="url" required value={url} onChange={(event)=>setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
        <label><span>題目或標題</span><input value={title} onChange={(event)=>setTitle(event.target.value)} placeholder="尚未提供時可稍後補上" /></label>
        <label><span>作者或頻道</span><input value={author} onChange={(event)=>setAuthor(event.target.value)} /></label>
        <label><span>資料取得方式</span><select value={method} onChange={(event)=>setMethod(event.target.value as ImportMethod)}>{importMethods.map((item)=><option key={item} value={item}>{SOURCE_ACQUISITION_LABELS[item]}</option>)}</select></label>
        <label><span>使用者看到的觀看數</span><input type="number" min="0" value={metrics.viewCount} onChange={(event)=>setMetrics({...metrics,viewCount:event.target.value})} /></label>
        <label><span>按讚數</span><input type="number" min="0" value={metrics.likeCount} onChange={(event)=>setMetrics({...metrics,likeCount:event.target.value})} /></label>
        <label><span>留言數</span><input type="number" min="0" value={metrics.commentCount} onChange={(event)=>setMetrics({...metrics,commentCount:event.target.value})} /></label>
        <label><span>分享數</span><input type="number" min="0" value={metrics.shareCount} onChange={(event)=>setMetrics({...metrics,shareCount:event.target.value})} /></label>
        <label className="wide"><span>備註</span><textarea value={notes} onChange={(event)=>setNotes(event.target.value)} rows={3} /></label>
        <div className="wide form-safety-note">使用者輸入的公開數據會標示「使用者提供，尚待驗證」，不會當成平台官方統計。</div>
        <button className="button trend-primary wide" type="submit">加入影音候選</button>
      </form>
      <div className="form-message" aria-live="polite">{error&&<span className="form-error">{error}</span>}{notice&&<span className="form-success">{notice}</span>}</div>
    </section>

    <section className="video-candidate-section"><div className="section-heading"><div><h2>已收集影音候選</h2><p>候選網址尚未經平台API驗證，不會自動取得高分或顯示官方熱門排名。</p></div><span>{candidates.length} 筆</span></div>{candidates.length?<div className="video-candidate-list">{candidates.map((candidate)=><CandidateCard key={candidate.id} candidate={candidate} />)}</div>:<div className="trend-no-results"><h3>尚未匯入影音候選</h3><p>可先前往平台官方搜尋，再把公開影片網址貼回本頁。</p></div>}</section>
  </section>;
}

function CandidateCard({candidate}:{candidate:VideoCandidate}) {
  const growth=videoDiscoveryService.getGrowthPresentation(candidate);
  const latest=candidate.snapshots.at(-1);
  return <article><div className="candidate-label-row"><span>{VIDEO_PLATFORM_LABELS[candidate.platform]}</span><span>{SOURCE_ACQUISITION_LABELS[candidate.acquisitionMethod]}</span><span>未經官方驗證</span></div><h3>{candidate.title}</h3>{candidate.author&&<p>{candidate.author}</p>}<dl><div><dt>取得時間</dt><dd>{formatDateTime(candidate.acquiredAt)}</dd></div><div><dt>證據可信度</dt><dd>{VIDEO_CONFIDENCE_LABELS[candidate.evidenceConfidence]}</dd></div><div><dt>增速基準</dt><dd>{growth.label}</dd></div><div><dt>快照數</dt><dd>{candidate.snapshots.length} 次</dd></div>{latest&&<div><dt>使用者提供觀看數</dt><dd>{latest.viewCount===null?'未提供':formatNumber(latest.viewCount)}</dd></div>}</dl>{candidate.notes&&<p className="candidate-notes">備註：{candidate.notes}</p>}<a className="source-link" href={candidate.normalizedUrl} target="_blank" rel="noopener noreferrer">開啟官方平台網址 ↗</a></article>;
}
