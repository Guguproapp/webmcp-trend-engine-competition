import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { VideoCreationWorkspace } from '../presentation/VideoCreationPage';

describe('影音創作節點', () => {
  const seed = {
    topicId: 'topic-1',
    title: '通勤時間變長引發討論',
    summary: '多個來源提及交通與生活安排。',
    score: 78,
    sourceCount: 2,
    evidenceState: '有兩個可追溯來源',
  };

  it('顯示來源邊界並可由使用者指令產生所有創作區塊', () => {
    render(<MemoryRouter><VideoCreationWorkspace seed={seed} copyText={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: '影音創作工作區' })).toBeInTheDocument();
    expect(screen.getByText(/本機規則產生/)).toBeInTheDocument();
    expect(screen.getByText(/不是已查證事實/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('自行輸入創作指令'), { target: { value: '做成節奏明快的30秒直式短片' } });
    fireEvent.click(screen.getByRole('button', { name: '產生創作建議' }));
    expect(screen.getByRole('heading', { name: '前三秒鉤子' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '旁白腳本' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '逐鏡分鏡' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '通用文字轉影片指令' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '圖片轉影片動作指令' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人工查證提醒' })).toBeInTheDocument();
  });

  it('可一鍵複製單一區塊與完整創作包', async () => {
    const copyText = vi.fn(async () => undefined);
    render(<MemoryRouter><VideoCreationWorkspace seed={seed} copyText={copyText} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '產生創作建議' }));
    fireEvent.click(screen.getByRole('button', { name: '複製通用文字轉影片指令' }));
    expect(copyText).toHaveBeenCalledWith(expect.stringContaining('主體'));
    fireEvent.click(screen.getByRole('button', { name: '複製完整創作包' }));
    expect(copyText).toHaveBeenLastCalledWith(expect.stringContaining('人工查證提醒'));
    expect(await screen.findByText('已複製完整創作包，可貼到其他影音生成 App。')).toBeInTheDocument();
  });

  it('未輸入指令時提供安全的本機建議起點', () => {
    render(<MemoryRouter><VideoCreationWorkspace seed={seed} copyText={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '使用安全建議格式' }));
    expect((screen.getByLabelText('自行輸入創作指令') as HTMLTextAreaElement).value).toContain('先呈現共同困擾');
  });
});
