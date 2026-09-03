import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import type { TrendProviderStatus } from '../application/TrendSourceProvider';
import { formatDateTime } from './formatters';
import { SOURCE_ACQUISITION_LABELS } from '../domain/VideoDiscovery';
import { DISCOVERY_SOURCE_GROUP_LABELS, resolveDiscoverySources, type DiscoverySourceGroup, type DiscoverySourceState } from '../application/PlatformSourceRegistry';
import { MARKET_REGION_LABELS } from '../domain/RegionalDiscovery';

const stateLabel: Record<DiscoverySourceState, string> = {
  enabled:'已啟用', not_applied:'尚未申請', preparing:'準備申請資料', waiting_review:'等待平台審查',
  approved:'已取得官方權限', expired:'權限失效', unavailable:'暫時無法使用', waiting_authorization:'等待授權',
  delayed:'資料延遲', failed:'安全連線失敗', temporary_failure:'暫時失敗', quota_exceeded:'超過配額', disabled:'尚未啟用',
  waiting_official_access:'等待官方資格', waiting_platform_permission:'等待平台權限',
  official_site_assisted:'官方網站輔助搜尋', user_shared:'使用者分享網址',
};

const groups: DiscoverySourceGroup[] = ['search_trend','viral_video','news_evidence'];

export function TrendSourcesPage() {
  const [, setRevision] = useState(0);
  useEffect(() => { trendDiscoveryService.ensureData().finally(() => setRevision((value) => value + 1)); }, []);
  const apiSources = (trendDiscoveryService.getApiMetadata()?.sourceStatuses ?? []) as TrendProviderStatus[];
  const sources = resolveDiscoverySources(apiSources);
  return <section className="trend-page">
    <div className="trend-title-row"><div><div className="trend-date">市場地區、情報類型與來源平台分開管理</div><h1>資料來源</h1><p>清楚區分熱搜、爆紅影音與新聞佐證；沒有權限的來源只顯示合法邊界，不回傳假資料。</p></div></div>
    {groups.map((group)=><section className="source-group" key={group} aria-labelledby={`source-${group}`}><div className="section-heading"><div><h2 id={`source-${group}`}>{DISCOVERY_SOURCE_GROUP_LABELS[group]}</h2><p>{group==='search_trend'?'搜尋量與搜尋增速來源；新聞篇數不得代替搜尋量。':group==='viral_video'?'八個固定影音平台；各平台依官方API、權限或輔助方式取得。':'只作為事件與新聞成長佐證，不冒充搜尋量或觀看數。'}</p></div></div><div className="source-status-grid">{sources.filter((source)=>source.group===group).map((source) => <article key={source.code}>
      <div><strong>{source.name}</strong><span className={`provider-state state-${source.state}`}>{stateLabel[source.state]}</span></div>
      <p>{source.message}</p>
      <p className="source-regions">適用地區：{source.regions.map((region)=>MARKET_REGION_LABELS[region]).join('、')}</p>
      <ul className="source-capability-list">{source.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
      <p className="source-limitation">限制：{source.limitation}</p>
      <dl>
        <div><dt>資料取得方式</dt><dd>{SOURCE_ACQUISITION_LABELS[source.acquisitionMethod]}</dd></div>
        <div><dt>本次取得</dt><dd>{source.fetchedCount} 筆</dd></div>
        <div><dt>最後成功</dt><dd>{source.lastSuccessAt ? formatDateTime(source.lastSuccessAt) : '尚無'}</dd></div>
        <div><dt>最後嘗試</dt><dd>{source.lastAttemptAt ? formatDateTime(source.lastAttemptAt) : '尚無'}</dd></div>
        <div><dt>下次重試</dt><dd>{source.nextRetryAt ? formatDateTime(source.nextRetryAt) : source.state === 'enabled' ? '依來源週期' : '取得權限後'}</dd></div>
      </dl>
    </article>)}</div></section>)}
  </section>;
}
