import { describe, expect, it, vi } from 'vitest';
import type { TrendTopic } from '../../trend-discovery/domain/TrendTopic';
import { createWebMcpToolDefinitions, type WebMcpTrendGateway } from '../application/createWebMcpToolDefinitions';
import { HumanConfirmationCoordinator } from '../application/HumanConfirmationCoordinator';
import { MemoryWebMcpAuditRepository } from '../infrastructure/WebMcpAuditRepository';

function createGateway(): WebMcpTrendGateway & { watched: Set<string>; excluded: Map<string, string>; writes: number } {
  const watched = new Set<string>(); const excluded = new Map<string, string>(); const topic = { id: 'trend-safe', title: '安全主題', totalScore: 80 } as TrendTopic;
  return {
    watched, excluded, writes: 0, async ensureData() {}, listTopics: () => [topic], findTopic: (id) => id === topic.id ? topic : undefined,
    getSourceStatuses: () => [], isWatching: (id) => watched.has(id), addToWatchlist(id) { this.writes += 1; watched.add(id); },
    removeFromWatchlist: (id) => watched.delete(id), getExclusionReason: (id) => excluded.get(id),
    exclude(id, reason) { this.writes += 1; excluded.set(id, reason); }, cancelExclusion: (id) => excluded.delete(id),
  };
}

function setup(timeoutMs = 30_000) {
  const gateway = createGateway(); const audit = new MemoryWebMcpAuditRepository();
  const confirmations = new HumanConfirmationCoordinator(audit, { timeoutMs, sessionId: 'session-a' });
  const tools = createWebMcpToolDefinitions({ gateway, confirmations });
  return { gateway, audit, confirmations, watch: tools[3], exclude: tools[4] };
}

describe('WebMCP 真人確認寫入', () => {
  it('工具呼叫後、真人確認前資料完全不變，確認後只寫入一次', async () => {
    const { gateway, confirmations, watch } = setup(); const pending = watch.execute({ trend_id: 'trend-safe' }, { signal: new AbortController().signal });
    expect(confirmations.getState().status).toBe('pending'); expect(gateway.watched.has('trend-safe')).toBe(false);
    const id = confirmations.getState().operation?.id ?? ''; confirmations.confirm(id); confirmations.confirm(id);
    await expect(pending).resolves.toMatchObject({ ok: true, result: 'confirmed', undo_available: true }); expect(gateway.writes).toBe(1);
  });

  it('取消後資料不變', async () => {
    const { gateway, confirmations, watch } = setup(); const pending = watch.execute({ trend_id: 'trend-safe' }, { signal: new AbortController().signal });
    confirmations.cancel(confirmations.getState().operation?.id ?? ''); await expect(pending).resolves.toMatchObject({ ok: false, result: 'cancelled' }); expect(gateway.writes).toBe(0);
  });

  it('逾時後資料不變', async () => {
    vi.useFakeTimers(); const { gateway, watch } = setup(1_000); const pending = watch.execute({ trend_id: 'trend-safe' }, { signal: new AbortController().signal });
    await vi.advanceTimersByTimeAsync(1_001); await expect(pending).resolves.toMatchObject({ ok: false, result: 'timed_out' }); expect(gateway.writes).toBe(0); vi.useRealTimers();
  });

  it('AbortSignal觸發後資料不變', async () => {
    const { gateway, watch } = setup(); const controller = new AbortController(); const pending = watch.execute({ trend_id: 'trend-safe' }, { signal: controller.signal });
    controller.abort(); await expect(pending).resolves.toMatchObject({ ok: false, result: 'aborted' }); expect(gateway.writes).toBe(0);
  });

  it('相同待確認請求重複送出不會建立第二筆或重複寫入', async () => {
    const { gateway, confirmations, watch } = setup(); const signal = new AbortController().signal;
    const first = watch.execute({ trend_id: 'trend-safe' }, { signal }); const second = watch.execute({ trend_id: 'trend-safe' }, { signal });
    expect(confirmations.listPending()).toHaveLength(1); confirmations.confirm(confirmations.getState().operation?.id ?? ''); await Promise.all([first, second]); expect(gateway.writes).toBe(1);
  });

  it('撤銷後恢復操作前狀態', async () => {
    const { gateway, confirmations, watch } = setup(); const pending = watch.execute({ trend_id: 'trend-safe' }, { signal: new AbortController().signal });
    const id = confirmations.getState().operation?.id ?? ''; confirmations.confirm(id); await pending; expect(gateway.watched.has('trend-safe')).toBe(true);
    await confirmations.undo(id); expect(gateway.watched.has('trend-safe')).toBe(false); expect(confirmations.getState().status).toBe('undone');
  });

  it('排除工具不能用confirm參數繞過真人確認', async () => {
    const { gateway, confirmations, exclude } = setup(); const pending = exclude.execute({ trend_id: 'trend-safe', reason: '風險太高', confirm: true }, { signal: new AbortController().signal });
    expect(gateway.excluded.has('trend-safe')).toBe(false); expect(confirmations.getState().status).toBe('pending'); confirmations.cancel(confirmations.getState().operation?.id ?? ''); await pending;
  });

  it('不同匿名Session的狀態與稽核互相隔離', async () => {
    const first = setup(); const second = setup(); const pending = first.watch.execute({ trend_id: 'trend-safe' }, { signal: new AbortController().signal });
    first.confirmations.confirm(first.confirmations.getState().operation?.id ?? ''); await pending;
    expect(first.gateway.watched.has('trend-safe')).toBe(true); expect(second.gateway.watched.has('trend-safe')).toBe(false);
    expect(first.audit.list('session-a')).toHaveLength(1); expect(second.audit.list('session-a')).toHaveLength(0);
  });
});
