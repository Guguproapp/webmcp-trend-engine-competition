import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: '⌂', label: '主控台' },
  { to: '/onboarding', icon: '✓', label: '首次設定' },
  { to: '/settings/connections', icon: '↔', label: '平台連接' },
];

export function AppShell() {
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
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="badge badge-gold">工作包 001</span>
          <p>目前只提供帳號開通引導與模擬授權。</p>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">ACCOUNT ONBOARDING · 帳號開通管家</span>
          </div>
          <span className="mock-pill">● 模擬環境</span>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  );
}
