import { useEffect, useState } from 'react';
import { trendDiscoveryService } from '../../../app/services';
import type { TrendProviderStatus } from '../application/TrendSourceProvider';
import { formatDateTime } from './formatters';
import { SOURCE_ACQUISITION_LABELS } from '../domain/VideoDiscovery';
import { resolveDiscoverySources, type DiscoverySourceState } from '../application/PlatformSourceRegistry';

const stateLabel: Record<DiscoverySourceState, string> = {
  enabled:'已啟用', not_applied:'尚未申請', preparing:'準備申請資料', waiting_review:'等待平台審查',
  approved:'已取得官方權限', expired:'權限失效', unavailable:'暫時無法使用', waiting_authorization:'等待授權',
  temporary_failure:'暫時失敗', quota_exceeded:'超過配額', disabled:'尚未啟用',
};

export function TrendSourcesPage() {
  const [, setRevision] = useState(0);
  useEffect(() => { trendDiscoveryService.ensureData().finally(() => setRevision((value) => value + 1)); }, []);
  const apiSources = (trendDiscoveryService.getApiMetadata()?.sourceStatuses ?? []) as TrendProviderStatus[];
  const sources = resolveDiscoverySources(apiSources);
  return <section className="trend-page">
    <div className="trend-title-row"><div><div className="trend-date">四大平台與補充來源狀態</div><h1>資料來源</h1><p>清楚區分官方自動、官方網站輔助、使用者分享及等待審查；沒有權限的來源不會回傳假資料。</p></div></div>
    <div className="source-status-grid">{sources.map((source) => <article key={source.code}>
      <div><strong>{source.name}</strong><span className={`provider-state state-${source.state}`}>{stateLabel[source.state]}</span></div>
      <p>{source.message}</p>
      <ul className="source-capability-list">{source.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
      <p className="source-limitation">限制：{source.limitation}</p>
      <dl>
        <div><dt>資料取得方式</dt><dd>{SOURCE_ACQUISITION_LABELS[source.acquisitionMethod]}</dd></div>
        <div><dt>本次取得</dt><dd>{source.fetchedCount} 筆</dd></div>
        <div><dt>最後成功</dt><dd>{source.lastSuccessAt ? formatDateTime(source.lastSuccessAt) : '尚無'}</dd></div>
        <div><dt>最後嘗試</dt><dd>{source.lastAttemptAt ? formatDateTime(source.lastAttemptAt) : '尚無'}</dd></div>
        <div><dt>下次重試</dt><dd>{source.nextRetryAt ? formatDateTime(source.nextRetryAt) : source.state === 'enabled' ? '依來源週期' : '取得權限後'}</dd></div>
      </dl>
    </article>)}</div>
  </section>;
}
