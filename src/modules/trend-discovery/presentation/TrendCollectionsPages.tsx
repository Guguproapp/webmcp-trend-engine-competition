import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import { TrendTopicCard } from './TrendComponents';

function useReady() { const [ready,setReady]=useState(Boolean(trendDiscoveryService.listAll().length)); useEffect(()=>{trendDiscoveryService.ensureData().then(()=>setReady(true));},[]); return ready; }

export function TrendWatchlistPage() {
  const ready=useReady(); const [revision,setRevision]=useState(0); const items=ready?trendDiscoveryService.getWatchlist():[];
  return <section className="trend-page" data-revision={revision}><div className="trend-title-row"><div><div className="trend-date">個人清單</div><h1>觀察清單</h1><p>追蹤加入當時分數與目前分數變化。</p></div></div><div className="mock-trend-banner"><strong>Mock 保存</strong><span>觀察狀態保存在本機 Repository，重新整理後仍會保留。</span></div>{items.length?<div className="trend-topic-list">{items.map((item)=><div key={item.topicId}><div className="watch-snapshot"><span>加入時間 {new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.addedAt))}</span><span>加入時 {item.scoreAtAdded} 分</span><strong className={item.scoreDelta>=0?'up':'down'}>目前 {item.topic.totalScore} 分（{item.scoreDelta>=0?'+':''}{item.scoreDelta}）</strong></div><TrendTopicCard topic={item.topic} watching onWatch={()=>{}} onRemoveWatch={()=>{trendDiscoveryService.removeFromWatchlist(item.topicId);setRevision(v=>v+1);}} onExclude={(reason)=>{trendDiscoveryService.exclude(item.topicId,reason);setRevision(v=>v+1);}} /></div>)}</div>:<div className="trend-no-results"><h2>尚未加入觀察</h2><p>從爆紅熱門精選點「加入觀察」即可建立清單。</p></div>}</section>;
}

export function TrendExcludedPage() {
  const ready=useReady(); const [revision,setRevision]=useState(0); const items=ready?trendDiscoveryService.getExcluded():[];
  return <section className="trend-page" data-revision={revision}><div className="trend-title-row"><div><div className="trend-date">稽核可追蹤</div><h1>已排除主題</h1><p>查看排除原因，必要時可取消排除並回到候選清單。</p></div></div><div className="mock-trend-banner"><strong>Mock 保存</strong><span>排除原因與時間保存在本機，所有變更都會留下稽核紀錄。</span></div>{items.length?<div className="trend-topic-list">{items.map((item)=><TrendTopicCard key={item.topicId} topic={item.topic} watching={false} onWatch={()=>{}} onRemoveWatch={()=>{}} onExclude={()=>{}} excludedReason={`${item.reason}｜${new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.excludedAt))}`} onCancelExclude={()=>{trendDiscoveryService.cancelExclusion(item.topicId);setRevision(v=>v+1);}} />)}</div>:<div className="trend-no-results"><h2>目前沒有排除主題</h2><p>排除後會在這裡保留原因與時間。</p></div>}</section>;
}
