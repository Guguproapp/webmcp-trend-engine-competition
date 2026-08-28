import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewResetService } from '../../../app/services';

const reviewSteps = [
  '查看爆紅熱門精選。',
  '查看快速上升議題。',
  '使用關鍵字搜尋。',
  '套用來源、時間、熱度、風險及信心篩選。',
  '開啟議題查看分數與來源證據。',
  '將議題加入觀察。',
  '排除不適合的議題。',
  '重設審核資料後重新操作。',
];

export function ReviewPage() {
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState('');

  async function resetReviewData() {
    setResetting(true);
    setNotice('');
    try {
      const result = await reviewResetService.reset();
      setNotice(`審核資料已重設：恢復 ${result.topicCount} 個 Mock 主題與 ${result.signalCount} 筆來源訊號。`);
    } finally {
      setResetting(false);
    }
  }

  return <section className="review-page">
    <div className="review-hero">
      <div>
        <span className="review-version">B版審核候選版 RC2</span>
        <h1>熱門引擎B版｜MVP原型審核</h1>
        <p>這個入口協助審核人員理解產品邊界，並用更清楚的步驟操作爆紅流量情報原型。</p>
      </div>
      <div className="review-mock-seal" aria-label="Mock審核資料，非即時熱門情報">
        <strong>Mock</strong><span>非即時情報</span>
      </div>
    </div>

    <div className="review-disclosure" role="note">
      <strong>資料聲明</strong>
      <p>目前所有熱門議題、來源訊號、熱度分數及成長數據均為Mock審核資料，不代表即時市場情報。</p>
    </div>

    <div className="review-scope-grid">
      <article>
        <span className="review-card-label">產品範圍</span>
        <h2>本次要驗證</h2>
        <p>本版本只驗證爆紅議題蒐集、評分、搜尋、篩選、證據、觀察及排除流程。</p>
      </article>
      <article>
        <span className="review-card-label excluded">不包含</span>
        <h2>本次不驗證</h2>
        <p>AI文案、圖片生成、影片生成、社群帳號授權、自動發布、藍新金流及正式即時資料來源。</p>
      </article>
    </div>

    <article className="review-steps-card">
      <div>
        <span className="review-card-label">建議流程</span>
        <h2>審核步驟</h2>
        <p>建議依序完成，約需 8～12 分鐘。</p>
      </div>
      <ol>{reviewSteps.map((step) => <li key={step}>{step}</li>)}</ol>
    </article>

    <div className="review-actions" aria-label="審核捷徑">
      <Link className="button trend-primary" to="/trends">開始審核</Link>
      <Link className="button secondary" to="/trends/search">查看搜尋與篩選</Link>
      <Link className="button secondary" to="/trends/watchlist">查看觀察清單</Link>
      <button className="button danger" type="button" onClick={resetReviewData} disabled={resetting}>
        {resetting ? '正在重設…' : '重設審核資料'}
      </button>
    </div>
    {notice && <p className="review-reset-notice" role="status">✓ {notice}</p>}
  </section>;
}
