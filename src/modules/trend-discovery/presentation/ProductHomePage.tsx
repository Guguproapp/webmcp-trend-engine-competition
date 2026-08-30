import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trendDiscoveryService } from '../../../app/services';
import { formatDateTime } from './formatters';

export function ProductHomePage() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = trendDiscoveryService.subscribe(() => setRevision((value) => value + 1));
    trendDiscoveryService.ensureData().catch(() => setRevision((value) => value + 1));
    return unsubscribe;
  }, []);

  const metadata = trendDiscoveryService.getApiMetadata();
  const operating = metadata?.sourceStatuses.filter((source) => source.state === 'enabled') ?? [];
  const waiting = metadata?.sourceStatuses.filter((source) => source.state === 'waiting_authorization' || source.state === 'disabled') ?? [];
  const failed = metadata?.sourceStatuses.filter((source) => source.state === 'temporary_failure' || source.state === 'quota_exceeded') ?? [];
  const youtube = metadata?.sourceStatuses.find((source) => source.code === 'youtube');
  const freshnessLabel = metadata?.dataState === 'fresh' ? '資料已更新' : metadata?.dataState === 'waiting' ? '顯示最近一次成功資料' : metadata?.dataState === 'stale' ? '資料更新延遲' : '資料蒐集中';

  return <section className="review-page">
    <div className="review-hero"><div><span className="review-version">搜尋趨勢、影音訊號與新聞佐證</span><h1>熱門引擎｜爆紅流量情報服務</h1><p>蒐集正在上升的搜尋話題與爆紅影音，依照地區、熱度、增速、跨平台程度及資料可信度，協助使用者找到值得關注的內容機會。</p></div><div className="review-mock-seal real-data-seal" aria-label="真實來源"><strong>即時</strong><span>情報</span></div></div>
    <div className="review-actions" aria-label="產品捷徑"><Link className="button trend-primary" to="/trends">開始探索熱門</Link><Link className="button secondary" to="/trends/search">搜尋熱門情報</Link><Link className="button secondary" to="/trends/video-search">爆款影音搜尋</Link><Link className="button secondary" to="/guide">查看使用說明</Link></div>
    <div className="review-disclosure" role="note"><strong>資料來源概況</strong><div>{!metadata ? <p>正在讀取來源狀態。</p> : <><p>{operating.length ? `目前有 ${operating.length} 個真實來源正常運作：${operating.map((source) => source.name).join('與')}。` : '目前沒有正常運作的真實來源，請查看資料來源頁。'}</p>{youtube?.state === 'enabled' && <p>YouTube 本輪取得 {youtube.fetchedCount} 筆；資料量仍少，請搭配其他來源判斷。</p>}{failed.length > 0 && <p className="source-failure-copy">異常來源：{failed.map((source) => `${source.name}（${source.message}）`).join('、')}。</p>}</>}</div></div>
    <div className="review-status-grid" aria-label="正式來源摘要"><article><span>正常運作來源</span><strong>{!metadata ? '讀取中' : operating.length ? operating.map((source) => source.name).join('、') : '目前無'}</strong></article><article><span>等待官方資格或權限</span><strong>{!metadata ? '讀取中' : waiting.length ? waiting.map((source) => source.name).join('、') : '目前無'}</strong></article><article><span>最後成功更新</span><strong>{metadata?.lastSuccessAt ? formatDateTime(metadata.lastSuccessAt) : metadata ? '尚未完成' : '讀取中'}</strong></article><article><span>資料狀態</span><strong>{freshnessLabel}</strong></article></div>
    <div className="review-scope-grid"><article><span className="review-card-label">可用能力</span><h2>從地區到來源證據</h2><p>可依四個市場與全部地區、六種情報類型及八個影音平台搜尋，並查看官方與輔助來源、取得方式、更新時間及原始證據。</p></article><article><span className="review-card-label excluded">重要限制</span><h2>平台能力依實際權限提供</h2><p>目前只有YouTube官方API自動取得；其他平台依權限狀態提供官方網站輔助或使用者分享。新聞篇數不會冒充搜尋量或觀看數。</p></article></div>
  </section>;
}
