import { StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { humanConfirmationCoordinator, trendDiscoveryService } from '../../../app/services';
import type { WebMcpToolDefinition } from '../domain/WebMcpContracts';
import { getOrCreateAnonymousSessionId } from '../infrastructure/AnonymousWebMcpSession';
import { LocalWebMcpAuditRepository } from '../infrastructure/WebMcpAuditRepository';
import { AgentWorkspacePage } from '../presentation/AgentWorkspacePage';

describe('WebMCP 安全與生命週期', () => {
  it('React StrictMode雙重掛載仍只建立一組有效工具', async () => {
    const signals: AbortSignal[] = [];
    const names: string[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn((tool: WebMcpToolDefinition, options: { signal: AbortSignal }) => { names.push(tool.name); signals.push(options.signal); }) } });
    const view = render(<StrictMode><MemoryRouter><AgentWorkspacePage /></MemoryRouter></StrictMode>);
    await waitFor(() => expect(names).toEqual(['search_trends', 'get_trend_evidence', 'get_source_status', 'add_trend_to_watchlist', 'exclude_trend']));
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    view.unmount();
    await waitFor(() => expect(signals.every((signal) => signal.aborted)).toBe(true));
  });

  it('元件卸載時透過註冊AbortSignal移除全部工具', async () => {
    const signals: AbortSignal[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (_tool: WebMcpToolDefinition, options: { signal: AbortSignal }) => { signals.push(options.signal); }) } });
    const view = render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    await waitFor(() => expect(signals).toHaveLength(5));
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    view.unmount(); await waitFor(() => expect(signals.every((signal) => signal.aborted)).toBe(true));
  });

  it('頁面離開會中止待確認操作且不寫入', async () => {
    const tools: WebMcpToolDefinition[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (tool: WebMcpToolDefinition) => { tools.push(tool); }) } });
    const view = render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    await waitFor(() => expect(tools).toHaveLength(5)); await trendDiscoveryService.ensureData();
    const topic = trendDiscoveryService.listAll()[0]; const before = trendDiscoveryService.isWatching(topic.id);
    let pending!: Promise<Record<string, unknown>>;
    act(() => { pending = tools[3].execute({ trend_id: topic.id }, { signal: new AbortController().signal }) as Promise<Record<string, unknown>>; });
    view.unmount(); await expect(pending).resolves.toMatchObject({ result: 'aborted' });
    expect(trendDiscoveryService.isWatching(topic.id)).toBe(before);
  });

  it('匿名Session在同一儲存中穩定、不同儲存互相隔離', () => {
    const first = new MemoryStorage(); const second = new MemoryStorage();
    const firstId = getOrCreateAnonymousSessionId(first as unknown as Storage);
    expect(getOrCreateAnonymousSessionId(first as unknown as Storage)).toBe(firstId);
    expect(getOrCreateAnonymousSessionId(second as unknown as Storage)).not.toBe(firstId);
  });

  it('稽核只保存核准欄位且不清除其他命名空間', () => {
    const storage = new MemoryStorage(); storage.setItem('other-product.data', 'keep');
    const repository = new LocalWebMcpAuditRepository(storage);
    repository.append({ id: 'audit-1', toolName: 'exclude_trend', trendId: 'trend-safe', requestedAt: '2026-08-30T00:00:00Z', confirmedAt: null, result: 'cancelled', undone: false, sessionId: 'session-safe' });
    expect(storage.getItem('other-product.data')).toBe('keep');
    expect(Object.keys(repository.list('session-safe')[0]).sort()).toEqual(['confirmedAt', 'id', 'requestedAt', 'result', 'sessionId', 'toolName', 'trendId', 'undone'].sort());
    expect(JSON.stringify(repository.list('session-safe'))).not.toMatch(/prompt|cookie|token|conversation/i);
  });

  it('寫入工具Schema不接受網址、HTML、程式碼、批次或代理確認欄位', () => {
    const writeTools = ['add_trend_to_watchlist', 'exclude_trend'];
    const registered: WebMcpToolDefinition[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (tool: WebMcpToolDefinition) => { registered.push(tool); }) } });
    render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    return waitFor(() => {
      expect(registered).toHaveLength(5);
      for (const tool of registered.filter((item) => writeTools.includes(item.name))) {
        const properties = tool.inputSchema.properties as Record<string, unknown>;
        expect(Object.keys(properties).every((key) => ['trend_id', 'reason'].includes(key))).toBe(true);
        expect(properties).not.toHaveProperty('confirm'); expect(properties).not.toHaveProperty('url'); expect(properties).not.toHaveProperty('html');
      }
    });
  });

  it('真人確認協調器不保存代理完整Prompt', () => {
    expect(JSON.stringify(humanConfirmationCoordinator.getState())).not.toMatch(/完整Prompt|system prompt|private conversation/i);
  });
});
