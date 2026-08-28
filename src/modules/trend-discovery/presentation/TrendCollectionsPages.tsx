import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trendDiscoveryService } from '../../../app/services';
import { type ExclusionReason } from '../application/repositories';
import { TrendTopicCard } from './TrendComponents';

function useReady() { const [ready,setReady]=useState(Boolean(trendDiscoveryService.listAll().length)); useEffect(()=>{trendDiscoveryService.ensureData().then(()=>setReady(true));},[]); return ready; }

export function TrendWatchlistPage() {
  const ready=useReady(); const [revision,setRevision]=useState(0); const [notice,setNotice]=useState(''); const [undoTopicId,setUndoTopicId]=useState<string | null>(null); const items=ready?trendDiscoveryService.getWatchlist():[];
  function exclude(topicId:string, reason:ExclusionReason) { trendDiscoveryService.exclude(topicId,reason); setUndoTopicId(topicId); setNotice('主題已排除，可立即撤銷。'); setRevision(v=>v+1); }
  function undo() { if(!undoTopicId)return; trendDiscoveryService.cancelExclusion(undoTopicId); trendDiscoveryService.addToWatchlist(undoTopicId); setUndoTopicId(null); setNotice('已撤銷排除並恢復觀察狀態。'); setRevision(v=>v+1); }
  return <section className="trend-page" data-revision={revision}><div className="trend-title-row"><div><div className="trend-date">個人清單</div><h1>觀察清單</h1><p>追蹤加入當時分數與目前分數變化。</p></div></div><div className="subtle-data-note"><strong>本機保存</strong><span>觀察狀態只保存在這台裝置，重新整理後仍會保留。</span></div>{notice&&<div className="trend-toast" role="status" aria-live="polite"><span>✓ {notice}</span>{undoTopicId&&<button type="button" onClick={undo}>撤銷</button>}</div>}{items.length?<div className="trend-topic-list">{items.map((item)=><div key={item.topicId}><div className="watch-snapshot"><span>加入時間 {new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.addedAt))}</span><span>加入時 {item.scoreAtAdded} 分</span><strong className={item.scoreDelta>=0?'up':'down'}>目前 {item.topic.totalScore} 分（{item.scoreDelta>=0?'+':''}{item.scoreDelta}）</strong></div><TrendTopicCard topic={item.topic} watching onWatch={()=>{}} onRemoveWatch={()=>{trendDiscoveryService.removeFromWatchlist(item.topicId);setNotice('已移出觀察清單。');setUndoTopicId(null);setRevision(v=>v+1);}} onExclude={(reason)=>exclude(item.topicId,reason)} /></div>)}</div>:<EmptyCollection title="尚未加入觀察" description="在熱門精選或搜尋結果中選擇「加入觀察」，就能持續追蹤分數變化。" actions={[['前往爆紅熱門精選','/trends'],['前往主題搜尋','/trends/search']]} />}</section>;
}

export function TrendExcludedPage() {
  const ready=useReady(); const [revision,setRevision]=useState(0); const [notice,setNotice]=useState(''); const items=ready?trendDiscoveryService.getExcluded():[];
  return <section className="trend-page" data-revision={revision}><div className="trend-title-row"><div><div className="trend-date">選擇紀錄</div><h1>已排除主題</h1><p>查看排除原因，必要時可取消排除並回到候選清單。</p></div></div><div className="subtle-data-note"><strong>本機保存</strong><span>排除原因與時間保存在這台裝置，所有變更都會留下操作紀錄。</span></div>{notice&&<div className="trend-toast" role="status" aria-live="polite"><span>✓ {notice}</span></div>}{items.length?<div className="trend-topic-list">{items.map((item)=><TrendTopicCard key={item.topicId} topic={item.topic} watching={false} onWatch={()=>{}} onRemoveWatch={()=>{}} excludedReason={`${item.reason}｜${new Intl.DateTimeFormat('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(item.excludedAt))}`} onCancelExclude={()=>{trendDiscoveryService.cancelExclusion(item.topicId);setNotice('已取消排除，主題已回到候選清單。');setRevision(v=>v+1);}} />)}</div>:<EmptyCollection title="尚未排除任何主題" description="不適合追蹤的議題可從熱門精選或搜尋結果選擇原因後排除。" actions={[['前往爆紅熱門精選','/trends'],['前往主題搜尋','/trends/search']]} />}</section>;
}

function EmptyCollection({ title, description, actions }: { title:string; description:string; actions:Array<[string,string]> }) { return <section className="trend-no-results actionable-empty"><span className="empty-mark" aria-hidden="true">◇</span><h2>{title}</h2><p>{description}</p><div>{actions.map(([label,to],index)=><Link key={to} className={`button ${index===0?'card-primary':'secondary'}`} to={to}>{label}</Link>)}</div></section>; }
