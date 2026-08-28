import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { findPlatform } from '../../../shared/domain/platform';

const outcomes = [
  ['success', '同意授權', '成功'],
  ['cancelled', '取消授權', '取消'],
  ['permission_incomplete', '模擬權限不足', '權限不足'],
  ['token_expired', '模擬 Token 過期', '過期'],
  ['platform_error', '模擬平台錯誤', '錯誤'],
] as const;

export function MockAuthorizationPage() {
  const { platformCode } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const platform = findPlatform(platformCode ?? null);
  if (!platform) return <section className="empty-state"><h1>找不到平台</h1></section>;
  const complete = (outcome: typeof outcomes[number][0]) => {
    const query = new URLSearchParams({ platform: platform.code, state: search.get('state') ?? '', outcome });
    navigate(`/oauth/mock/callback?${query.toString()}`);
  };
  return <section className="oauth-page">
    <div className="mock-banner"><strong>注意：這不是 {platform.name} 官方頁面</strong><span>目前為模擬授權，尚未連接正式平台。</span></div>
    <div className="oauth-card"><span className={`platform-icon platform-${platform.code}`}>{platform.icon}</span><h1>{platform.name} 模擬官方授權</h1><p>熱門引擎想要取得未來管理影音所需的權限。本頁只測試狀態流程，不會取得帳號、密碼或真實 Token。</p><ul className="permission-list"><li>✓ 查看頻道基本資料（模擬）</li><li>✓ 管理影片與發布狀態（模擬）</li><li>✓ 讀取成效資訊（模擬）</li></ul><div className="oauth-state"><strong>安全預留</strong><span>已包含 state 驗證與 PKCE 欄位；callback 會驗證交易一致性。</span></div><div className="outcome-grid">{outcomes.map(([value, label, short]) => <button key={value} className={`button ${value === 'success' ? 'primary' : 'secondary'}`} onClick={() => complete(value)} aria-label={`${platform.name} ${label}`}><span>{label}</span><small>結果：{short}</small></button>)}</div></div>
  </section>;
}
