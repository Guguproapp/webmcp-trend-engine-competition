import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

const publicRoutes = [
  ['/trends', '爆紅熱門精選'],
  ['/trends/search', '主題搜尋'],
  ['/trends/watchlist', '觀察清單'],
  ['/trends/excluded', '已排除主題'],
  ['/trends/rules', '篩選規則'],
] as const;

describe('B版公開產品邊界', () => {
  it.each(publicRoutes)('%s正常顯示', async (path, heading) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each(['/onboarding', '/oauth/mock/callback', '/settings/connections'])('%s不會渲染A版頁面', async (path) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '此功能不屬於目前產品' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回爆紅熱門精選' })).toHaveAttribute('href', '/trends');
  });

  it('導覽及公開文字只包含B版功能', async () => {
    render(<MemoryRouter initialEntries={['/trends']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '爆紅熱門精選' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '帳號開通管家' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '平台連接' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock OAuth/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI 影音發布助手/i)).not.toBeInTheDocument();
  });

  it('原A版專屬模組不在B版原始碼模組圖中', () => {
    const modules = Object.keys(import.meta.glob('../modules/**/*.{ts,tsx}'));
    expect(modules.some((path) => /account-onboarding|brand-profile|platform-connections|dashboard|media-generation|media-rendering|publishing|billing/.test(path))).toBe(false);
  });
});
