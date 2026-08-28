import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { brandProfileRepository } from '../../../app/services';
import { createEmptyBrandProfile } from '../../brand-profile/domain/BrandProfile';

describe('首次使用主要流程', () => {
  it('已有部分帳號：選擇平台後進入進度頁', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/onboarding']}><App /></MemoryRouter>);
    await user.click(screen.getByRole('link', { name: /我已有部分帳號/ }));
    await user.click(screen.getAllByRole('radio', { name: '已有帳號' })[0]);
    await user.click(screen.getByRole('button', { name: '儲存並查看進度' }));
    expect(screen.getByRole('heading', { name: '一步一步完成平台連接' })).toBeInTheDocument();
    expect(screen.getAllByText('已有帳號').length).toBeGreaterThan(0);
  });

  it('完全沒有帳號：先保存共同資料，再選平台並進入開通進度', async () => {
    const user = userEvent.setup();
    brandProfileRepository.save({
      ...createEmptyBrandProfile(),
      brandName: '熱門引擎',
      handle: '@trendengine',
      industry: '科技',
      contentTopics: 'AI 工具',
      targetAudience: '台灣創作者',
      bio: '協助創作者規劃內容。',
      contactEmail: 'owner@example.com',
      logoDataUrl: 'data:image/png;base64,abc',
      isBusinessAccount: true,
      publishesAiContent: true,
    });
    render(<MemoryRouter initialEntries={['/onboarding']}><App /></MemoryRouter>);
    await user.click(screen.getByRole('link', { name: /我完全沒有帳號/ }));
    expect(screen.getByRole('heading', { name: '建立你的品牌基本資料' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '驗證並選擇平台' }));
    expect(screen.getByRole('heading', { name: '你想先建立哪些平台？' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('平台資料預覽')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '儲存平台並查看開通進度' }));
    expect(screen.getByRole('heading', { name: '一步一步完成平台連接' })).toBeInTheDocument();
  });

  it('共同資料未填時顯示必填錯誤，且不存在密碼或驗證碼欄位', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/onboarding/profile']}><App /></MemoryRouter>);
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
    expect(document.querySelector('[autocomplete="one-time-code"]')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '驗證並選擇平台' }));
    expect(screen.getAllByText('此欄位為必填。').length).toBeGreaterThan(3);
  });
});
