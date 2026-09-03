import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { createRadarWebMcpToolDefinitions } from '../application/createRadarWebMcpToolDefinitions';
import { HttpRadarBrowserGateway, type RadarBrowserGateway } from '../application/RadarBrowserGateway';
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
  it('瀏覽器Fetch暫時失敗時，會以同網域唯讀XHR降級，不攜帶任何秘密', async () => {
    const fetcher = vi.fn(async () => { throw new TypeError('network failed'); }) as unknown as typeof fetch;
    const fallbackReader = vi.fn(async (url: string) => {
      expect(url).toBe('/api/radar/trends?market=TW&limit=1');
      return new Response(JSON.stringify({
        ok: true, kind: 'trends', query: { market: 'TW', limit: 1 }, acquiredAt: '2026-09-02T08:00:00.000Z', delayed: false,
        actualCount: 0, data: [],
      }), { status: 200 });
    });
    const client = new HttpRadarBrowserGateway(fetcher, fallbackReader);
    const result = await client.trends({ market: 'TW', limit: 1 });
    expect(fetcher).toHaveBeenCalledWith('/api/radar/trends?market=TW&limit=1', expect.objectContaining({ method: 'GET' }));
    expect(fallbackReader).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ ok: true, actualCount: 0, data: [] });
  });

  it('已取消的請求不會啟動XHR降級請求', async () => {
    const controller = new AbortController(); controller.abort();
    const fallbackReader = vi.fn();
    const client = new HttpRadarBrowserGateway(vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); }) as unknown as typeof fetch, fallbackReader);
    await expect(client.trends({ market: 'TW' }, controller.signal)).rejects.toMatchObject({ code: 'request_aborted' });
    expect(fallbackReader).not.toHaveBeenCalled();
  });

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

  it('WebMCP結構化與文字回應不保留敏感欄位或網址', async () => {
    const marker='NOT_A_REAL_SECRET'; const source=gateway();
    vi.mocked(source.trends).mockResolvedValueOnce({
      ...(await source.trends({market:'TW'})),
      summary:`source https://example.com/file?access_token=${marker}`,
      data:[{...(await source.trends({market:'TW'})).data[0],sourceUrl:`https://example.com/file?X-Amz-Signature=${marker}`,token:marker} as never],
    });
    const output=await createRadarWebMcpToolDefinitions(source)[0].execute({market:'TW'},{signal:new AbortController().signal});
    expect(JSON.stringify(output)).not.toContain(marker);
    expect((output.structuredContent as {data:Array<Record<string,unknown>>}).data[0]).not.toHaveProperty('token');
  });

  it('單一主題工具接受安全的亞洲文字主題識別碼，但仍拒絕路徑注入', async () => {
    const source = gateway(); const tool = createRadarWebMcpToolDefinitions(source)[1];
    await tool.execute({ topicId: 'TW:股東' }, { signal: new AbortController().signal });
    expect(source.trend).toHaveBeenCalledWith('TW:股東', expect.any(AbortSignal));
    await expect(tool.execute({ topicId: '../admin/settings' }, { signal: new AbortController().signal })).rejects.toThrow(/topicId/);
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

  it('首屏說明六類唯讀用途並提供台灣24小時前5名快速搜尋', async () => {
    const source = gateway();
    render(<MemoryRouter><RadarToolsPage gateway={source} /></MemoryRouter>);
    expect(screen.getByText(/利用真實熱門訊號找出值得關注的內容機會/)).toBeInTheDocument();
    for (const label of ['搜尋熱門趨勢', '查看主題詳情', '搜尋爆款影音', '查看資料來源', '查看支援市場', '查看主題分類']) expect(screen.getByText(label)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '立即搜尋台灣近24小時前5名' }));
    await waitFor(() => expect(source.trends).toHaveBeenCalledWith({ market: 'TW', type: 'search_rising', hours: 24, sort: 'rank', limit: 5 }));
  });

  it('英文介面涵蓋搜尋、動態摘要、來源狀態與語言切換', async () => {
    const source = gateway();
    render(<MemoryRouter initialEntries={['/radar-tools?lang=en']}><RadarToolsPage gateway={source} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Asia Trend Radar Tools' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '繁中' })).toHaveAttribute('href', '/radar-tools');
    expect(screen.getByText('English is available on Radar Tools only. Other sections open in Traditional Chinese.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show Taiwan’s top 5 rising searches — last 24 hours' }));
    expect(await screen.findByText('Found 1 trend result.')).toBeInTheDocument();
    expect(screen.queryByText('找到1筆熱門主題。')).not.toBeInTheDocument();
    expect(screen.getByText('Data confidence 82%')).toBeInTheDocument();
    expect(screen.getByText('Sources: Google Trends')).toBeInTheDocument();
    expect(screen.queryByText(/Google熱門搜尋趨勢/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Source Status' }));
    expect(await screen.findByText('Found 3 source status records.')).toBeInTheDocument();
    expect(screen.getByText('The source is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Showing the latest successful data.')).toBeInTheDocument();
    expect(screen.getByText('The server-side source setup is pending.')).toBeInTheDocument();
  });

  it.each([
    { start: '/radar-tools', search: /搜尋雷達/, switchTo: 'English', idle: /No search yet/, stale: '找到1筆熱門主題。' },
    { start: '/radar-tools?lang=en', search: /Search Radar/, switchTo: '繁中', idle: /尚未查詢/, stale: 'Found 1 trend result.' },
  ])('切換語言後不接受舊搜尋回應：$start', async ({ start, search, switchTo, idle, stale }) => {
    const source=gateway();
    const response=await source.trends({market:'TW'});
    let resolveRequest!: (value: typeof response)=>void;
    vi.mocked(source.trends).mockImplementationOnce(()=>new Promise((resolve)=>{resolveRequest=resolve;}));
    render(<MemoryRouter initialEntries={[start]}><RadarToolsPage gateway={source} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', {name:search}));
    fireEvent.click(screen.getByRole('link', {name:switchTo}));
    await waitFor(()=>expect(screen.getByText(idle)).toBeInTheDocument());
    await act(async()=>{resolveRequest(response); await Promise.resolve();});
    expect(screen.queryByText(stale)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', {name:'台灣熱門'})).not.toBeInTheDocument();
  });

  it('切換語言後不接受舊來源狀態回應', async () => {
    const source=gateway();
    const response=await source.sources();
    let resolveRequest!: (value: typeof response)=>void;
    vi.mocked(source.sources).mockImplementationOnce(()=>new Promise((resolve)=>{resolveRequest=resolve;}));
    render(<MemoryRouter initialEntries={['/radar-tools?lang=en']}><RadarToolsPage gateway={source} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', {name:'Source Status'}));
    fireEvent.click(screen.getByRole('link', {name:'繁中'}));
    await waitFor(()=>expect(screen.getByText(/尚未查詢/)).toBeInTheDocument());
    await act(async()=>{resolveRequest(response); await Promise.resolve();});
    expect(screen.queryByText('來源狀態已更新。')).not.toBeInTheDocument();
    expect(screen.queryByText('暫時失敗')).not.toBeInTheDocument();
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

  it('一般網站不把簽名參數或Fragment網址渲染為可點擊連結', async () => {
    const marker='NOT_A_REAL_SECRET'; const source=gateway();
    vi.mocked(source.trends).mockResolvedValueOnce({
      ...(await source.trends({market:'TW'})),
      data:[{...(await source.trends({market:'TW'})).data[0],sourceUrl:`https://example.com/file?signature=${marker}#private`}],
    });
    render(<MemoryRouter><RadarToolsPage gateway={source}/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:/搜尋雷達/}));
    expect(await screen.findByText('原始來源網址不可用')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(marker);
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
