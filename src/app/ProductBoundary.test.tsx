import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

const publicRoutes = [
  ['/', '熱門引擎｜爆紅流量情報服務'],
  ['/guide', '如何探索熱門情報'],
  ['/radar-tools', '熱門雷達工具 Asia Trend Radar Tools'],
  ['/trends', '爆紅熱門精選'],
  ['/trends/search', '主題搜尋'],
  ['/trends/watchlist', '觀察清單'],
  ['/trends/excluded', '已排除主題'],
  ['/trends/rules', '篩選規則'],
  ['/trends/sources', '資料來源'],
  ['/trends/trend-subscription-fatigue/create', '影音創作工作區'],
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

  it('產品首頁按鈕連到正確的B版路由', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '熱門引擎｜爆紅流量情報服務' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '開始探索熱門' })).toHaveAttribute('href', '/trends');
    expect(screen.getByRole('link', { name: '搜尋熱門情報' })).toHaveAttribute('href', '/trends/search');
    expect(screen.getAllByRole('link', { name: '爆款影音搜尋' }).some((link) => link.getAttribute('href') === '/trends/video-search')).toBe(true);
    expect(screen.getByRole('link', { name: '查看使用說明' })).toHaveAttribute('href', '/guide');
  });

  it('手機四格主要導覽直接包含雷達且觀察清單保留在更多選單', async () => {
    render(<MemoryRouter initialEntries={['/radar-tools']}><App /></MemoryRouter>);
    const navigation = screen.getByRole('navigation', { name: '手機主要導覽' });
    expect(navigation.querySelectorAll(':scope > a, :scope > button')).toHaveLength(4);
    expect(screen.getByRole('link', { name: '雷達' })).toHaveAttribute('href', '/radar-tools');
    expect(screen.getByRole('link', { name: '雷達' })).toHaveClass('active');
    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    await waitFor(() => expect(screen.getByRole('menuitem', { name: /觀察清單/ })).toHaveAttribute('href', '/trends/watchlist'));
  });

  it('英文雷達同步切換外框、文件語言與標題，其他導覽不攜帶語言參數', async () => {
    render(<MemoryRouter initialEntries={['/radar-tools?lang=en']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Asia Trend Radar Tools' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('Asia Trend Radar Tools | Trend Engine');
    expect(screen.getByText('Trend Engine')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trend Radar Tools' })).toHaveAttribute('href', '/radar-tools?lang=en');
    expect(screen.getByRole('link', { name: 'Product Home (ZH)' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Guide (ZH)' })).toHaveAttribute('href', '/guide');
  });

  it('未知語言參數安全回退繁體中文', async () => {
    render(<MemoryRouter initialEntries={['/radar-tools?lang=fr']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '熱門雷達工具 Asia Trend Radar Tools' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-Hant-TW');
    expect(document.title).toBe('熱門引擎｜爆紅流量情報服務');
  });

  it('/review會導向正式產品首頁', async () => {
    render(<MemoryRouter initialEntries={['/review']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '熱門引擎｜爆紅流量情報服務' })).toBeInTheDocument();
  });

  it.each(['/', '/guide', '/review', '/trends', '/trends/search', '/trends/watchlist', '/trends/excluded', '/trends/rules', '/trends/sources', '/trends/trend-subscription-fatigue'])('%s持續顯示真實資料狀態', async (path) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(await screen.findByText(/● 真實來源資料｜資料已更新/)).toBeInTheDocument();
  });

  it('原A版專屬模組不在B版原始碼模組圖中', () => {
    const modules = Object.keys(import.meta.glob('../modules/**/*.{ts,tsx}'));
    expect(modules.some((path) => /account-onboarding|brand-profile|platform-connections|dashboard|media-generation|media-rendering|publishing|billing/.test(path))).toBe(false);
  });
});
