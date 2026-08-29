import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trendDiscoveryService } from '../../../app/services';
import { formatDateTime } from './formatters';

const reviewSteps = [
  '查看真實新聞來源建立的熱門候選主題。', '確認資料更新時間與來源運作狀態。', '使用關鍵字、時間與風險條件搜尋。',
  '到爆款影音搜尋查看YouTube官方資料。', '前往平台官方搜尋並貼回影音網址。', '確認候選資料沒有被顯示成官方爆紅排名。',
  '開啟議題查看分數、取得時間與原始來源。', '將議題加入觀察或排除不適合的主題。', '遇到證據不足時確認畫面沒有顯示假增速。',
];

export function ReviewPage() {
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
    <div className="review-hero"><div><span className="review-version">四平台搜尋候選版 0.4 RC1</span><h1>熱門引擎｜公開測試審核</h1><p>這個版本使用可追溯來源，驗證熱門蒐集、四平台影音搜尋入口、網址匯入、取得方式標示、評分與證據流程。</p></div><div className="review-mock-seal real-data-seal" aria-label="公開測試版"><strong>公開</strong><span>測試版</span></div></div>
    <div className="review-disclosure" role="note"><strong>資料使用說明</strong><div><p>{operating.length ? `目前有 ${operating.length} 個真實來源正常運作：${operating.map((source) => source.name).join('與')}。` : '目前沒有正常運作的真實來源，請查看來源狀態。'}</p>{youtube?.state === 'enabled' && <p>YouTube 本輪取得 {youtube.fetchedCount} 筆，資料量仍少，只能證明技術串接成功。</p>}{failed.length > 0 && <p className="source-failure-copy">異常來源：{failed.map((source) => `${source.name}（${source.message}）`).join('、')}。</p>}</div></div>
    <div className="review-status-grid" aria-label="正式來源摘要"><article><span>正常運作來源</span><strong>{operating.length ? operating.map((source) => source.name).join('、') : '目前無'}</strong></article><article><span>等待官方資格或權限</span><strong>{waiting.length ? waiting.map((source) => source.name).join('、') : '目前無'}</strong></article><article><span>最後成功更新</span><strong>{metadata?.lastSuccessAt ? formatDateTime(metadata.lastSuccessAt) : '尚未完成'}</strong></article><article><span>資料狀態</span><strong>{freshnessLabel}</strong></article></div>
    <div className="review-scope-grid"><article><span className="review-card-label">本次範圍</span><h2>可驗證內容</h2><p>YouTube官方資料、Facebook與Instagram權限狀態、TikTok官方網站輔助、四平台網址匯入、主題評分、搜尋、篩選、證據、觀察及排除。</p></article><article><span className="review-card-label excluded">重要限制</span><h2>不是四平台全自動搜尋</h2><p>Facebook與Instagram仍等待Meta審查；TikTok目前採官方網站輔助與使用者分享。候選網址與手動數據不會顯示為官方熱門排名。</p></article></div>
    <article className="review-steps-card"><div><span className="review-card-label">建議流程</span><h2>審核步驟</h2><p>每項數據都應能回到原始來源。</p></div><ol>{reviewSteps.map((step)=><li key={step}>{step}</li>)}</ol></article>
    <div className="review-actions" aria-label="審核捷徑"><Link className="button trend-primary" to="/trends">開始審核</Link><Link className="button secondary" to="/trends/video-search">開始四平台影音審核</Link><Link className="button secondary" to="/trends/search">查看搜尋與篩選</Link><Link className="button secondary" to="/trends/watchlist">查看觀察清單</Link><Link className="button secondary" to="/trends/sources">查看資料來源狀態</Link></div>
  </section>;
}
