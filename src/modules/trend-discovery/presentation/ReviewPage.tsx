import { Link } from 'react-router-dom';

const reviewSteps = [
  '查看真實新聞來源建立的熱門候選主題。', '確認資料更新時間與來源運作狀態。', '使用關鍵字、時間與風險條件搜尋。',
  '開啟議題查看分數、取得時間與原始來源。', '將議題加入觀察或排除不適合的主題。', '遇到證據不足時確認畫面沒有顯示假增速。',
];

export function ReviewPage() {
  return <section className="review-page">
    <div className="review-hero"><div><span className="review-version">真實來源候選版 0.3</span><h1>熱門引擎｜真實熱門情報審核</h1><p>這個版本開始使用可追溯的官方資料來源，驗證真實蒐集、合併、評分、搜尋、證據、觀察與排除流程。</p></div><div className="review-mock-seal real-data-seal" aria-label="真實來源候選資料"><strong>真實來源</strong><span>候選資料</span></div></div>
    <div className="review-disclosure" role="note"><strong>資料使用說明</strong><p>目前啟用 GDELT 全球新聞資料；YouTube 需完成官方金鑰設定後才會啟用。第一次取得的主題會標示「正在建立增速基準」，不會製造假成長率。</p></div>
    <div className="review-scope-grid"><article><span className="review-card-label">本次範圍</span><h2>可驗證內容</h2><p>真實來源蒐集、主題合併、熱點評分、搜尋、篩選、來源證據、觀察、排除及來源失敗提示。</p></article><article><span className="review-card-label excluded">不包含</span><h2>目前未開放</h2><p>人工智慧內容生成、社群帳號授權、自動發布、會員、金流、非官方爬蟲與 A 版營運功能。</p></article></div>
    <article className="review-steps-card"><div><span className="review-card-label">建議流程</span><h2>審核步驟</h2><p>每項數據都應能回到原始來源。</p></div><ol>{reviewSteps.map((step)=><li key={step}>{step}</li>)}</ol></article>
    <div className="review-actions" aria-label="審核捷徑"><Link className="button trend-primary" to="/trends">開始審核</Link><Link className="button secondary" to="/trends/search">查看搜尋與篩選</Link><Link className="button secondary" to="/trends/watchlist">查看觀察清單</Link><Link className="button secondary" to="/trends/sources">查看資料來源狀態</Link></div>
  </section>;
}
