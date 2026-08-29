import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import type { TrendProviderStatus } from '../application/TrendSourceProvider';
import { formatDateTime } from './formatters';

const stateLabel:Record<TrendProviderStatus['state'],string>={enabled:'已啟用',waiting_authorization:'等待授權',temporary_failure:'暫時失敗',quota_exceeded:'超過配額',disabled:'尚未啟用'};

export function TrendSourcesPage(){
  const [,setRevision]=useState(0); useEffect(()=>{trendDiscoveryService.ensureData().finally(()=>setRevision((value)=>value+1));},[]);
  const sources=trendDiscoveryService.getApiMetadata()?.sourceStatuses??[];
  return <section className="trend-page"><div className="trend-title-row"><div><div className="trend-date">官方來源狀態</div><h1>資料來源</h1><p>查看每個正式提供者的啟用、失敗、配額與重試狀態。</p></div></div>{sources.length?<div className="source-status-grid">{sources.map((source)=><article key={source.code}><div><strong>{source.name}</strong><span className={`provider-state state-${source.state}`}>{stateLabel[source.state]}</span></div><p>{source.message}</p><dl><div><dt>本次取得</dt><dd>{source.fetchedCount} 筆</dd></div><div><dt>最後成功</dt><dd>{source.lastSuccessAt?formatDateTime(source.lastSuccessAt):'尚無'}</dd></div><div><dt>最後嘗試</dt><dd>{source.lastAttemptAt?formatDateTime(source.lastAttemptAt):'尚無'}</dd></div><div><dt>下次重試</dt><dd>{source.nextRetryAt?formatDateTime(source.nextRetryAt):'依快取週期'}</dd></div></dl></article>)}</div>:<div className="trend-loading">正在讀取來源狀態…</div>}</section>;
}
