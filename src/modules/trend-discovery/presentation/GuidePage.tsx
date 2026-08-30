import { Link } from 'react-router-dom';

const steps = [
  '先到熱門精選查看目前值得注意的主題。',
  '使用地區、情報類型、平台與時間條件縮小範圍。',
  '開啟主題詳情，確認分數拆解、取得時間與原始來源。',
  '到爆款影音搜尋查看YouTube官方資料，或前往其他平台官方網站搜尋。',
  '將公開影音網址貼回系統，保存為個人影音候選。',
  '只有一筆資料時先建立增速基準，不把缺少證據的候選判定為爆紅。',
  '把值得追蹤的主題加入觀察，排除不符合需求的內容。',
];

export function GuidePage() {
  return <section className="review-page">
    <div className="review-hero"><div><span className="review-version">使用說明</span><h1>如何探索熱門情報</h1><p>從搜尋與影音訊號找到候選，再回到原始來源核對內容與數據。</p></div><div className="review-mock-seal real-data-seal" aria-hidden="true"><strong>7</strong><span>步驟</span></div></div>
    <article className="review-steps-card"><div><span className="review-card-label">建議流程</span><h2>從發現到保存</h2><p>所有分數都是系統評估，使用前仍應開啟原始來源確認。</p></div><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></article>
    <div className="review-scope-grid"><article><span className="review-card-label">資料取得方式</span><h2>每筆來源清楚標示</h2><p>來源會區分官方API自動取得、官方網站輔助搜尋、使用者分享網址、等待平台權限或暫時無法取得。</p></article><article><span className="review-card-label excluded">使用提醒</span><h2>不要只看總分</h2><p>搜尋結果數不等於觀看數，新聞篇數也不等於搜尋量。請一併檢查資料可信度、快照數量、平台限制與原始來源。</p></article></div>
    <div className="review-actions" aria-label="使用捷徑"><Link className="button trend-primary" to="/trends">開始探索熱門</Link><Link className="button secondary" to="/trends/search">搜尋熱門情報</Link><Link className="button secondary" to="/trends/video-search">爆款影音搜尋</Link><Link className="button secondary" to="/trends/sources">查看資料來源</Link></div>
  </section>;
}
