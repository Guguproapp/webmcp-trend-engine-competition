import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { trendDiscoveryService } from '../../../app/services';

describe('熱門畫面互動',()=>{
  it('使用系統日期、顯示Mock標示，更新資料按鈕有實際作用',async()=>{ const user=userEvent.setup(); render(<MemoryRouter initialEntries={['/trends']}><App/></MemoryRouter>); const today=new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date()); expect(screen.getByText(today)).toBeInTheDocument(); expect(screen.getByText(/目前為 Mock 資料/)).toBeInTheDocument(); await user.click(screen.getByRole('button',{name:/更新資料/})); expect(await screen.findByText(/Mock 資料已重新彙整/)).toBeInTheDocument(); expect((await screen.findAllByText('Mock 測試資料')).length).toBeGreaterThan(0); });
  it('加入觀察按鈕會切換為移出觀察',async()=>{ await trendDiscoveryService.refresh(); const user=userEvent.setup(); render(<MemoryRouter initialEntries={['/trends']}><App/></MemoryRouter>); const add=(await screen.findAllByRole('button',{name:'加入觀察'}))[0]; await user.click(add); expect((await screen.findAllByRole('button',{name:'移出觀察'})).length).toBeGreaterThan(0); });
  it('熱度證據詳情顯示來源、分數拆解與原因',async()=>{ const topics=await trendDiscoveryService.refresh(); render(<MemoryRouter initialEntries={[`/trends/${topics[0].id}`]}><App/></MemoryRouter>); expect(await screen.findByRole('heading',{name:'分數拆解'})).toBeInTheDocument(); expect(screen.getByRole('heading',{name:'各來源證據'})).toBeInTheDocument(); expect(screen.getByRole('heading',{name:'為什麼進入此分級'})).toBeInTheDocument(); expect(screen.getAllByText(/原始連結：Mock 示意/).length).toBeGreaterThan(0); });
});
