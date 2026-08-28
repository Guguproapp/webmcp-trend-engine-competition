import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/trends', icon: '⌁', label: '爆紅熱門精選', end:true },
  { to: '/trends/search', icon: '⌕', label: '主題搜尋' },
  { to: '/trends/watchlist', icon: '☆', label: '觀察清單' },
  { to: '/trends/excluded', icon: '⊘', label: '已排除主題' },
  { to: '/trends/sources', icon: '◫', label: '資料來源' },
  { to: '/trends/rules', icon: '⚙', label: '篩選規則' },
  { to: '/onboarding', icon: '✓', label: '帳號開通管家' },
  { to: '/settings/connections', icon: '↔', label: '系統設定' },
];

export function AppShell() {
  const location = useLocation();
  const isTrend = location.pathname.startsWith('/trends') || location.pathname === '/';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">熱</div>
          <div>
            <strong>熱門引擎</strong>
            <span>AI 影音發布助手</span>
          </div>
        </div>
        <nav aria-label="主要導覽">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="badge badge-lime">工作包 002</span>
          <p>爆紅流量蒐集、評分與篩選 Mock 版。</p>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">{isTrend ? 'TREND DISCOVERY · 爆紅流量雷達' : 'ACCOUNT ONBOARDING · 帳號開通管家'}</span>
          </div>
          <span className="mock-pill">● 模擬環境</span>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  );
}
