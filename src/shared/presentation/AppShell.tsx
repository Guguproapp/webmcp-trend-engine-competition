import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { trendDiscoveryService } from '../../app/services';
import { formatDateTime } from '../../modules/trend-discovery/presentation/formatters';

const navItems = [
  { to:'/review',icon:'✓',label:'審核說明' }, { to:'/trends',icon:'⌁',label:'爆紅熱門精選',end:true }, { to:'/trends/search',icon:'⌕',label:'主題搜尋' },
  { to:'/trends/watchlist',icon:'☆',label:'觀察清單' }, { to:'/trends/excluded',icon:'⊘',label:'已排除主題' }, { to:'/trends/sources',icon:'◫',label:'資料來源' }, { to:'/trends/rules',icon:'⚙',label:'篩選規則' },
];
const mobilePrimary=navItems.filter((item)=>['/trends','/trends/search','/trends/watchlist'].includes(item.to));
const mobileMore=navItems.filter((item)=>['/review','/trends/excluded','/trends/sources','/trends/rules'].includes(item.to));

export function AppShell() {
  const [,setRevision]=useState(0); const [moreOpen,setMoreOpen]=useState(false); const firstMore=useRef<HTMLAnchorElement>(null); const moreButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const unsubscribe=trendDiscoveryService.subscribe(()=>setRevision((value)=>value+1)); trendDiscoveryService.ensureData().catch(()=>setRevision((value)=>value+1)); return unsubscribe;},[]);
  useEffect(()=>{if(moreOpen)firstMore.current?.focus();},[moreOpen]);
  const metadata=trendDiscoveryService.getApiMetadata();
  const dataLabel=metadata?.dataState==='fresh'&&metadata.lastSuccessAt?`真實來源資料｜最後更新：${formatDateTime(metadata.lastSuccessAt)}`:metadata?.dataState==='stale'?'資料更新延遲｜目前顯示最近一次成功結果':metadata?.message??'正在連接真實資料來源';
  function closeMore(){setMoreOpen(false);requestAnimationFrame(()=>moreButton.current?.focus());}
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand-lockup"><div className="brand-mark" aria-hidden="true">熱</div><div><strong>熱門引擎</strong><span>爆紅流量情報服務</span></div></div><nav aria-label="主要導覽">{navItems.map((item)=><NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>isActive?'active':''}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}</nav><div className="sidebar-note"><span className="badge badge-lime">公開測試中</span><p>熱門蒐集、評分、證據與篩選。</p></div></aside>
    <main className="main-content"><header className="topbar"><div><span className="eyebrow">熱門情報探索 · 爆紅流量情報</span></div><span className={`mock-pill data-state-${metadata?.dataState??'loading'}`}>● {dataLabel}</span></header><div className="page-container"><Outlet /></div></main>
    <nav className="mobile-nav" aria-label="手機主要導覽">{mobilePrimary.map((item)=><NavLink key={item.to} to={item.to} end={item.end} onClick={()=>setMoreOpen(false)}><span aria-hidden="true">{item.icon}</span>{item.to==='/trends'?'熱門':item.to==='/trends/search'?'搜尋':'觀察'}</NavLink>)}<button ref={moreButton} type="button" aria-expanded={moreOpen} aria-controls="mobile-more-menu" onClick={()=>setMoreOpen((value)=>!value)}><span aria-hidden="true">•••</span>更多</button></nav>
    {moreOpen&&<div className="mobile-more-backdrop" onClick={closeMore}><div id="mobile-more-menu" className="mobile-more-menu" role="menu" aria-label="更多功能" onClick={(event)=>event.stopPropagation()} onKeyDown={(event)=>{if(event.key==='Escape')closeMore();}}>{mobileMore.map((item,index)=><NavLink ref={index===0?firstMore:undefined} role="menuitem" key={item.to} to={item.to} onClick={closeMore}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}<button type="button" onClick={closeMore}>關閉選單</button></div></div>}
  </div>;
}
