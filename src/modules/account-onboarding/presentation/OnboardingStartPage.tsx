import { Link } from 'react-router-dom';

export function OnboardingStartPage() {
  return (
    <section className="narrow-page">
      <div className="step-label">首次使用設定 · 第 1 步</div>
      <h1>先告訴我們，你目前有哪些平台帳號？</h1>
      <p className="lead">帳號註冊、收信驗證與官方授權，都由你本人完成；系統會一步步引導並記住進度。</p>
      <div className="choice-grid">
        <Link className="choice-card" to="/onboarding/existing-accounts">
          <span className="choice-icon" aria-hidden="true">◐</span>
          <div><h2>我已有部分帳號</h2><p>勾選你已擁有的帳號，再選擇還需要開通的平台。</p></div>
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" to="/onboarding/profile">
          <span className="choice-icon" aria-hidden="true">＋</span>
          <div><h2>我完全沒有帳號</h2><p>先一次填寫頻道名稱、頭像、簡介與聯絡資料，再逐平台引導註冊。</p></div>
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="security-callout" role="note">
        <span aria-hidden="true">🔒</span>
        <div><strong>重要：系統不會替你輸入密碼、讀取驗證碼或代替你同意授權。</strong><p>所有敏感步驟都會在平台官方頁面由你本人完成。</p></div>
      </div>
    </section>
  );
}
