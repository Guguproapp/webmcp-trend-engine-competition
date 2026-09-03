import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { trendDiscoveryService } from '../../app/services';
import { radarLocaleFromSearch, radarShellCopy } from '../../modules/webmcp/presentation/radarLocale';
import { formatDateTime } from '../../modules/trend-discovery/presentation/formatters';

const navItems = [
  { to:'/',icon:'⌂',end:true }, { to:'/radar-tools',icon:'◎' }, { to:'/trends',icon:'⌁',end:true }, { to:'/trends/search',icon:'⌕' },
  { to:'/trends/video-search',icon:'▶' }, { to:'/trends/watchlist',icon:'☆' }, { to:'/trends/excluded',icon:'⊘' }, { to:'/trends/sources',icon:'◫' }, { to:'/trends/rules',icon:'⚙' },
  { to:'/guide',icon:'?' },
];
const mobilePrimaryIndexes=[1,2,3] as const;
const mobileMoreIndexes=[0,5,9,4,6,7,8] as const;

function englishDateTime(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function AppShell() {
  const location=useLocation();
  const isRadar=location.pathname==='/radar-tools';
  const locale=isRadar?radarLocaleFromSearch(location.search):'zh-Hant';
  const isEnglishRadar=locale==='en';
  const copy=radarShellCopy[locale];
  const [,setRevision]=useState(0); const [moreOpen,setMoreOpen]=useState(false); const firstMore=useRef<HTMLAnchorElement>(null); const moreButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const unsubscribe=trendDiscoveryService.subscribe(()=>setRevision((value)=>value+1)); trendDiscoveryService.ensureData().catch(()=>setRevision((value)=>value+1)); return unsubscribe;},[]);
  useEffect(()=>{if(moreOpen)firstMore.current?.focus();},[moreOpen]);
  useEffect(()=>{
    document.documentElement.lang=isEnglishRadar?'en':'zh-Hant-TW';
    document.title=isEnglishRadar?'Asia Trend Radar Tools | Trend Engine':'熱門引擎｜爆紅流量情報服務';
  },[isEnglishRadar]);
  const metadata=trendDiscoveryService.getApiMetadata();
  const failedSources=metadata?.sourceStatuses.filter((source)=>source.state==='temporary_failure'||source.state==='quota_exceeded')??[];
  const formatTime=(value:string)=>isEnglishRadar?englishDateTime(value):formatDateTime(value);
  const noSuccess=isEnglishRadar?'No successful update yet':'尚無';
  const dataLabel=isEnglishRadar
    ?failedSources.length
      ?`${copy.sourceIssue}: ${failedSources.map((source)=>source.code).join(', ')} · ${copy.lastSuccess}: ${metadata?.lastSuccessAt?formatTime(metadata.lastSuccessAt):noSuccess}`
      :metadata?.lastSuccessAt
        ?`${copy.sourceData} · ${copy.lastSuccess}: ${formatTime(metadata.lastSuccessAt)}`
        :copy.connecting
    :failedSources.length
      ?`來源異常：${failedSources.map((source)=>source.name).join('、')}｜最近成功：${metadata?.lastSuccessAt?formatTime(metadata.lastSuccessAt):noSuccess}`
      :metadata?.lastSuccessAt
        ?`真實來源資料｜${metadata.message}：${formatTime(metadata.lastSuccessAt)}`
        :metadata?.message??copy.connecting;
  const itemHref=(to:string)=>isEnglishRadar&&to==='/radar-tools'?'/radar-tools?lang=en':to;
  function closeMore(){setMoreOpen(false);requestAnimationFrame(()=>moreButton.current?.focus());}
  return <div className={`app-shell${isEnglishRadar?' app-shell--english':''}`}>
    <aside className="sidebar"><div className="brand-lockup"><div className="brand-mark" aria-hidden="true">熱</div><div><strong>{copy.brand}</strong><span>{copy.subtitle}</span></div></div><nav aria-label={copy.navLabel}>{navItems.map((item,index)=><NavLink key={item.to} to={itemHref(item.to)} end={item.end} className={({isActive})=>isActive?'active':''}><span aria-hidden="true">{item.icon}</span>{copy.nav[index]}</NavLink>)}</nav><div className="sidebar-note"><span className="badge badge-public">{copy.sourceBadge}</span><p>{copy.note}</p></div></aside>
    <main className="main-content"><header className="topbar" data-brand={copy.brand}><div><span className="eyebrow">{copy.eyebrow}</span></div><span className={`mock-pill data-state-${metadata?.dataState??'loading'}`} aria-label={dataLabel}>● {dataLabel}</span></header><div className="page-container"><Outlet /></div></main>
    <nav className="mobile-nav" aria-label={copy.mobileNavLabel}>{mobilePrimaryIndexes.map((index)=><NavLink key={navItems[index].to} to={itemHref(navItems[index].to)} end={navItems[index].end} onClick={()=>setMoreOpen(false)}><span aria-hidden="true">{navItems[index].icon}</span>{copy.mobile[mobilePrimaryIndexes.indexOf(index)]}</NavLink>)}<button ref={moreButton} type="button" aria-expanded={moreOpen} aria-controls="mobile-more-menu" onClick={()=>setMoreOpen((value)=>!value)}><span aria-hidden="true">•••</span>{copy.more}</button></nav>
    {moreOpen&&<div className="mobile-more-backdrop" onClick={closeMore}><div id="mobile-more-menu" className="mobile-more-menu" role="menu" aria-label={copy.moreLabel} onClick={(event)=>event.stopPropagation()} onKeyDown={(event)=>{if(event.key==='Escape')closeMore();}}>{mobileMoreIndexes.map((index,itemIndex)=><NavLink ref={itemIndex===0?firstMore:undefined} role="menuitem" key={navItems[index].to} to={navItems[index].to} onClick={closeMore}><span aria-hidden="true">{navItems[index].icon}</span>{copy.nav[index]}</NavLink>)}<button type="button" onClick={closeMore}>{copy.close}</button></div></div>}
  </div>;
}
