import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/review', icon: '✓', label: '審核說明' },
  { to: '/trends', icon: '⌁', label: '爆紅熱門精選', end:true },
  { to: '/trends/search', icon: '⌕', label: '主題搜尋' },
  { to: '/trends/watchlist', icon: '☆', label: '觀察清單' },
  { to: '/trends/excluded', icon: '⊘', label: '已排除主題' },
  { to: '/trends/sources', icon: '◫', label: '資料來源' },
  { to: '/trends/rules', icon: '⚙', label: '篩選規則' },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">熱</div>
          <div>
            <strong>熱門引擎</strong>
            <span>爆紅流量情報SaaS</span>
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
          <span className="badge badge-lime">公開產品 B版</span>
          <p>熱門蒐集、評分、證據與篩選 Mock 版。</p>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">TREND DISCOVERY · 爆紅流量情報</span>
          </div>
          <span className="mock-pill">● Mock審核資料｜非即時熱門情報</span>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  );
}
