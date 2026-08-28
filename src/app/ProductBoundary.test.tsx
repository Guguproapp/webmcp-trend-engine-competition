import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

const publicRoutes = [
  ['/review', '熱門引擎｜初步產品審核'],
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

  it('審核頁按鈕連到正確的B版路由', async () => {
    render(<MemoryRouter initialEntries={['/review']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '熱門引擎｜初步產品審核' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '開始審核' })).toHaveAttribute('href', '/trends');
    expect(screen.getByRole('link', { name: '查看搜尋與篩選' })).toHaveAttribute('href', '/trends/search');
    expect(screen.getByRole('link', { name: '查看觀察清單' })).toHaveAttribute('href', '/trends/watchlist');
    expect(screen.getByRole('button', { name: '重設審核資料' })).toBeInTheDocument();
  });

  it.each(['/review', '/trends', '/trends/search', '/trends/watchlist', '/trends/excluded', '/trends/rules', '/trends/sources', '/trends/trend-subscription-fatigue'])('%s持續顯示全站展示審核標示', async (path) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(await screen.findByText('● 展示審核資料｜非即時熱門情報')).toBeInTheDocument();
  });

  it('原A版專屬模組不在B版原始碼模組圖中', () => {
    const modules = Object.keys(import.meta.glob('../modules/**/*.{ts,tsx}'));
    expect(modules.some((path) => /account-onboarding|brand-profile|platform-connections|dashboard|media-generation|media-rendering|publishing|billing/.test(path))).toBe(false);
  });
});
