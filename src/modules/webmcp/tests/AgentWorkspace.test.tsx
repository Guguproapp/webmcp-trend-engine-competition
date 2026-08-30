import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AgentWorkspacePage } from '../presentation/AgentWorkspacePage';
import type { WebMcpToolDefinition } from '../domain/WebMcpContracts';
import { humanConfirmationCoordinator, trendDiscoveryService } from '../../../app/services';

describe('Agent Workspace 代理協作工作區', () => {
  it('原生介面可用時註冊五工具並顯示雙語狀態', async () => {
    const tools: WebMcpToolDefinition[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (tool: WebMcpToolDefinition) => { tools.push(tool); }) } });
    render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /代理協作工作區/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/原生 WebMCP 已就緒/)).toBeInTheDocument());
    expect(tools).toHaveLength(5);
    expect(screen.getByText(/Native tool status/)).toBeInTheDocument();
  });

  it('不支援WebMCP時保留原網站功能並清楚標示安全降級', async () => {
    Object.defineProperty(document, 'modelContext', { configurable: true, value: undefined });
    render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/安全降級/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /前往熱門精選/ })).toHaveAttribute('href', '/trends');
  });

  it('代理寫入要求在工作區顯示真人確認，確認及撤銷可用', async () => {
    const tools: WebMcpToolDefinition[] = [];
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: vi.fn(async (tool: WebMcpToolDefinition) => { tools.push(tool); }) } });
    render(<MemoryRouter><AgentWorkspacePage /></MemoryRouter>);
    await waitFor(() => expect(tools).toHaveLength(5));
    await trendDiscoveryService.ensureData(); const topic = trendDiscoveryService.listAll()[0];
    let result: Promise<Record<string, unknown>> | Record<string, unknown>;
    act(() => { result = tools.find((tool) => tool.name === 'add_trend_to_watchlist')!.execute({ trend_id: topic.id }, { signal: new AbortController().signal }); });
    expect(await screen.findByRole('dialog', { name: /真人確認/ })).toBeInTheDocument();
    expect(trendDiscoveryService.isWatching(topic.id)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /確認加入觀察/ }));
    await expect(result!).resolves.toMatchObject({ result: 'confirmed' });
    expect(trendDiscoveryService.isWatching(topic.id)).toBe(true);
    fireEvent.click(await screen.findByRole('button', { name: /撤銷操作/ }));
    await waitFor(() => expect(trendDiscoveryService.isWatching(topic.id)).toBe(false));
    expect(humanConfirmationCoordinator.getState().status).toBe('undone');
  });
});
