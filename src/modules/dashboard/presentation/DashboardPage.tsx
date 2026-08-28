import { Link } from 'react-router-dom';
import { platformConnectionRepository } from '../../../app/services';

const modules = ['熱門議題蒐集', '內容企劃', 'AI 媒體生成', '影音轉檔', '審核與發布', '成效分析', '方案與點數'];

export function DashboardPage() {
  const connected = platformConnectionRepository.getAll().filter((item) => item.status === 'authorized').length;
  return <section><div className="dashboard-hero"><div><span className="badge badge-gold">熱門引擎</span><h1>內容旅程，從連接平台開始</h1><p>工作包 001 已建立後續模組入口；未開放功能會清楚標示，不會假裝已可使用。</p></div><div className="connection-score"><strong>{connected}</strong><span>個模擬連接成功</span><Link to="/settings/connections">管理連接 →</Link></div></div><div className="module-grid">{modules.map((name, index) => <article key={name} className="module-card"><span className="module-number">0{index + 1}</span><h2>{name}</h2><p>介面邊界已預留，功能尚未開發。</p><span className="coming-soon">尚未開放</span></article>)}</div><div className="security-callout"><span>✓</span><div><strong>帳號開通管家可供驗收</strong><p>你可以回到首次設定測試兩種流程、模擬授權結果及重新整理後續接。</p></div><Link className="button primary small" to="/onboarding">進入首次設定</Link></div></section>;
}
