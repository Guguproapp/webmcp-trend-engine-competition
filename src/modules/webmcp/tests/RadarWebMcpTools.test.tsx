import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { createRadarWebMcpToolDefinitions } from '../application/createRadarWebMcpToolDefinitions';
import type { RadarBrowserGateway } from '../application/RadarBrowserGateway';
import { RadarToolsPage } from '../presentation/RadarToolsPage';

function gateway(): RadarBrowserGateway {
  return {
    trends: vi.fn(async (query) => ({
      ok: true, kind: 'trends', query, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false,
      actualCount: 1, summary: '找到1筆熱門主題。', data: [{ topicId: 'topic-1', rank: 1, originalTitle: '台灣熱門', traditionalTitle: '台灣熱門', marketCode: 'TW', categoryId: 'technology', trendType: 'search_rising', searchHeat: 86, searchGrowth: null, videoHeat: null, videoGrowth: null, newsGrowth: null, resonance: 70, freshness: 90, confidence: 0.82, sourceNames: ['Google熱門搜尋趨勢'], sourceUrl: 'https://trends.google.com/', publishedAt: null, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false }],
    })),
    trend: vi.fn(async (topicId) => ({ ok: true, kind: 'trend', query: { topicId }, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false, actualCount: 1, summary: '找到主題。', data: { topicId, sourceUrl: 'https://trends.google.com/', confidence: 0.82, acquiredAt: '2026-09-02T08:00:00.000Z', sourceNames: ['Google熱門搜尋趨勢'], searchGrowth: null } })),
    videos: vi.fn(async (query) => ({ ok: true, kind: 'videos', query, acquiredAt: null, delayed: false, actualCount: 0, summary: '目前沒有符合條件的爆款影音。', data: [] })),
    sources: vi.fn(async () => ({ ok: true, kind: 'sources', query: {}, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: true, actualCount: 3, summary: '來源狀態已更新。', data: [
      { sourceCode: 'youtube-most-popular', sourceName: 'YouTube', status: 'failed', lastAttemptAt: null, lastSuccessAt: null, lastRecordCount: 0, message: '暫時失敗', sourceTrack: 'official', sourceFamily: 'video', fallbackFor: null },
      { sourceCode: 'gdelt-news', sourceName: 'GDELT', status: 'delayed', lastAttemptAt: null, lastSuccessAt: '2026-09-02T07:00:00.000Z', lastRecordCount: 2, message: '延遲', sourceTrack: 'public_signal', sourceFamily: 'news', fallbackFor: null },
      { sourceCode: 'naver-datalab', sourceName: 'NAVER', status: 'waiting_credentials', lastAttemptAt: null, lastSuccessAt: null, lastRecordCount: 0, message: '等待憑證', sourceTrack: 'official', sourceFamily: 'search', fallbackFor: null },
    ] })),
    markets: vi.fn(async () => ({ ok: true, kind: 'markets', query: {}, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false, actualCount: 1, summary: '市場清單已更新。', data: [{ code: 'TW', nameZh: '台灣', group: 'asia', enabled: true, newsOnly: false }] })),
    categories: vi.fn(async () => ({ ok: true, kind: 'categories', query: {}, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false, actualCount: 1, summary: '分類清單已更新。', data: [{ id: 'technology', nameZh: '科技' }] })),
  } as unknown as RadarBrowserGateway;
}

describe('熱門雷達唯讀WebMCP工具', () => {
  it('註冊六個固定名稱且全部唯讀無副作用', () => {
    const tools = createRadarWebMcpToolDefinitions(gateway());
    expect(tools.map((tool) => tool.name)).toEqual(['search_radar_trends', 'get_radar_trend', 'search_radar_videos', 'list_radar_sources', 'list_radar_markets', 'list_radar_categories']);
    expect(tools.every((tool) => tool.annotations.readOnlyHint === true)).toBe(true);
    expect(tools.find((tool) => tool.name === 'get_radar_trend')?.annotations.untrustedContentHint).toBe(true);
  });

  it('搜尋Schema拒絕additionalProperties、limit 500與非法市場', async () => {
    const tool = createRadarWebMcpToolDefinitions(gateway())[0];
    expect(tool.inputSchema).toMatchObject({ type: 'object', additionalProperties: false, properties: { limit: { minimum: 1, maximum: 50 } } });
    await expect(tool.execute({ market: 'TW', limit: 500 }, { signal: new AbortController().signal })).rejects.toThrow(/limit/);
    await expect(tool.execute({ market: 'XX' }, { signal: new AbortController().signal })).rejects.toThrow(/market/);
    await expect(tool.execute({ market: 'TW', upstream: 'https://evil.example' }, { signal: new AbortController().signal })).rejects.toThrow(/欄位/);
  });

  it('台灣24小時前5名情境傳送正確結構化條件', async () => {
    const source = gateway(); const tool = createRadarWebMcpToolDefinitions(source)[0];
    const output = await tool.execute({ market: 'TW', type: 'search_rising', hours: 24, sort: 'rank', limit: 5 }, { signal: new AbortController().signal });
    expect(source.trends).toHaveBeenCalledWith({ market: 'TW', type: 'search_rising', hours: 24, sort: 'rank', limit: 5 }, expect.any(AbortSignal));
    expect(output).toMatchObject({ structuredContent: { actualCount: 1, delayed: false, query: { market: 'TW', limit: 5 } } });
  });

  it('日本增長最快最多10筆情境保留來源、取得時間及信心', async () => {
    const tool = createRadarWebMcpToolDefinitions(gateway())[0];
    const output = await tool.execute({ market: 'JP', sort: 'growth', limit: 10 }, { signal: new AbortController().signal });
    expect(JSON.stringify(output)).toMatch(/sourceNames|acquiredAt|confidence/);
  });

  it('來源狀態正確區分失敗、延遲及等待憑證', async () => {
    const tool = createRadarWebMcpToolDefinitions(gateway())[3];
    const output = await tool.execute({}, { signal: new AbortController().signal });
    const data = (output.structuredContent as { data: Array<{ status: string }> }).data;
    expect(data.map((item) => item.status)).toEqual(['failed', 'delayed', 'waiting_credentials']);
  });

  it('爆款影音無資料時誠實回傳空陣列', async () => {
    const tool = createRadarWebMcpToolDefinitions(gateway())[2];
    const output = await tool.execute({ market: 'TW', type: 'video_viral', limit: 10 }, { signal: new AbortController().signal });
    expect(output).toMatchObject({ structuredContent: { actualCount: 0, data: [] } });
  });

  it('growth為null時摘要顯示正在建立增速基準', async () => {
    const output = await createRadarWebMcpToolDefinitions(gateway())[0].execute({ market: 'TW' }, { signal: new AbortController().signal });
    expect(JSON.stringify(output)).toContain('正在建立增速基準');
  });

  it('AbortSignal會中止且不回傳秘密或堆疊', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(createRadarWebMcpToolDefinitions(gateway())[0].execute({ market: 'TW' }, { signal: controller.signal })).rejects.toThrow(/取消/);
  });

  it('一般網站搜尋在WebMCP不可用時仍可操作', async () => {
    Object.defineProperty(document, 'modelContext', { configurable: true, value: undefined });
    render(<MemoryRouter><RadarToolsPage gateway={gateway()} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/安全降級/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /搜尋雷達/ }));
    expect(await screen.findByRole('heading', { name: '台灣熱門' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '建立影音創作稿' })).toHaveAttribute('href', expect.stringMatching(/^\/trends\/topic-1\/create\?/));
  });

  it('一般網站不把非HTTPS外部網址渲染為可點擊連結', async () => {
    const source = gateway();
    vi.mocked(source.trends).mockResolvedValueOnce({
      ...(await source.trends({ market: 'TW' })),
      data: [{ ...(await source.trends({ market: 'TW' })).data[0], sourceUrl: 'javascript:alert(1)' }],
    });
    Object.defineProperty(document, 'modelContext', { configurable: true, value: undefined });
    render(<MemoryRouter><RadarToolsPage gateway={source} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /搜尋雷達/ }));
    expect(await screen.findByText('原始來源網址不可用')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '查看原始來源' })).not.toBeInTheDocument();
  });

  it('工具被原生介面發現且頁面卸載後移除', async () => {
    const names: string[] = []; const signals: AbortSignal[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (tool: { name: string }, options: { signal: AbortSignal }) => { names.push(tool.name); signals.push(options.signal); }) } });
    const view = render(<MemoryRouter><RadarToolsPage gateway={gateway()} /></MemoryRouter>);
    await waitFor(() => expect(names).toHaveLength(6));
    expect(screen.getByText(/6 個唯讀工具已就緒/)).toBeInTheDocument();
    view.unmount(); await waitFor(() => expect(signals.every((signal) => signal.aborted)).toBe(true));
  });
});
