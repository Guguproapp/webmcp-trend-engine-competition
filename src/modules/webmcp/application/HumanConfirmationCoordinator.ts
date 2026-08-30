import type { WebMcpAuditEntry, WebMcpAuditRepository, WebMcpAuditResult } from '../infrastructure/WebMcpAuditRepository';
import type { WebMcpExclusionReason, WebMcpToolName } from '../domain/WebMcpContracts';

export type ConfirmationStatus = 'idle' | 'pending' | 'confirmed' | 'cancelled' | 'timed_out' | 'aborted' | 'failed' | 'undone';
export interface PendingHumanOperation { id: string; toolName: WebMcpToolName; trendId: string; topicTitle: string; actionLabel: string; impact: string; undoDescription: string; reason?: WebMcpExclusionReason; }
export interface HumanConfirmationState { status: ConfirmationStatus; operation: PendingHumanOperation | null; message: string; }
export interface ConfirmationRequest extends Omit<PendingHumanOperation, 'id'> { id: string; perform: () => void; undo: () => void; signal: AbortSignal; }

interface PendingRecord {
  idempotencyKey: string;
  operation: PendingHumanOperation;
  request: ConfirmationRequest;
  requestedAt: string;
  promise: Promise<Record<string, unknown>>;
  resolve: (value: Record<string, unknown>) => void;
  timer: ReturnType<typeof setTimeout>;
  abortListener: () => void;
}

interface CompletedRecord {
  idempotencyKey: string;
  operation: PendingHumanOperation;
  request: ConfirmationRequest;
  auditId: string;
  undone: boolean;
  result: Record<string, unknown>;
}

export class HumanConfirmationCoordinator {
  private readonly timeoutMs: number;
  private readonly sessionId: string;
  private readonly listeners = new Set<() => void>();
  private readonly pendingByKey = new Map<string, PendingRecord>();
  private readonly pendingById = new Map<string, PendingRecord>();
  private readonly completedByKey = new Map<string, CompletedRecord>();
  private readonly completedById = new Map<string, CompletedRecord>();
  private state: HumanConfirmationState = { status: 'idle', operation: null, message: '尚無待確認操作。' };

  constructor(private readonly audit: WebMcpAuditRepository, options?: { timeoutMs?: number; sessionId?: string }) {
    this.timeoutMs = Math.max(100, Math.min(options?.timeoutMs ?? 45_000, 120_000));
    this.sessionId = options?.sessionId ?? crypto.randomUUID();
  }

  getState(): HumanConfirmationState { return structuredClone(this.state); }
  getSessionId() { return this.sessionId; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  listPending(): PendingHumanOperation[] { return [...this.pendingById.values()].map((record) => structuredClone(record.operation)); }

  request(request: ConfirmationRequest): Promise<Record<string, unknown>> {
    const existingPending = this.pendingByKey.get(request.id);
    if (existingPending) return existingPending.promise;
    const existingCompleted = this.completedByKey.get(request.id);
    if (existingCompleted && !existingCompleted.undone) return Promise.resolve({ ...existingCompleted.result, duplicate_request: true });
    if (this.pendingById.size) return Promise.resolve({ ok: false, result: 'cancelled', message: '已有另一項操作等待真人確認，請先完成或取消。' });

    const operation: PendingHumanOperation = { id: crypto.randomUUID(), toolName: request.toolName, trendId: request.trendId, topicTitle: request.topicTitle, actionLabel: request.actionLabel, impact: request.impact, undoDescription: request.undoDescription, reason: request.reason };
    if (request.signal.aborted) return Promise.resolve(this.recordImmediate(operation, 'aborted', '代理已取消操作，資料沒有變更。'));

    let resolvePromise: (value: Record<string, unknown>) => void = () => undefined;
    const promise = new Promise<Record<string, unknown>>((resolve) => { resolvePromise = resolve; });
    const abortListener = () => this.finishWithoutWrite(operation.id, 'aborted', '代理已取消操作，資料沒有變更。');
    const timer = setTimeout(() => this.finishWithoutWrite(operation.id, 'timed_out', '等待真人確認逾時，資料沒有變更。'), this.timeoutMs);
    const record: PendingRecord = { idempotencyKey: request.id, operation, request, requestedAt: new Date().toISOString(), promise, resolve: resolvePromise, timer, abortListener };
    request.signal.addEventListener('abort', abortListener, { once: true });
    this.pendingByKey.set(request.id, record); this.pendingById.set(operation.id, record);
    this.setState({ status: 'pending', operation, message: '等待真人在網站確認；確認前資料完全不變。' });
    return promise;
  }

  confirm(id: string) {
    const record = this.pendingById.get(id); if (!record) return;
    if (record.request.signal.aborted) { this.finishWithoutWrite(id, 'aborted', '代理已取消操作，資料沒有變更。'); return; }
    this.removePending(record);
    const confirmedAt = new Date().toISOString();
    try {
      record.request.perform();
      const result = { ok: true, result: 'confirmed', tool_name: record.operation.toolName, trend_id: record.operation.trendId, message: `已確認：${record.operation.actionLabel}。`, undo_available: true, confirmed_at: confirmedAt };
      const auditId = record.operation.id;
      this.audit.append(this.auditEntry(record, auditId, 'confirmed', confirmedAt));
      const completed: CompletedRecord = { idempotencyKey: record.idempotencyKey, operation: record.operation, request: record.request, auditId, undone: false, result };
      this.completedByKey.set(record.idempotencyKey, completed); this.completedById.set(record.operation.id, completed);
      this.setState({ status: 'confirmed', operation: record.operation, message: result.message }); record.resolve(result);
    } catch {
      const result = { ok: false, result: 'failed', tool_name: record.operation.toolName, trend_id: record.operation.trendId, message: '操作失敗，資料未完成變更。' };
      this.audit.append(this.auditEntry(record, record.operation.id, 'failed', confirmedAt));
      this.setState({ status: 'failed', operation: record.operation, message: result.message }); record.resolve(result);
    }
  }

  cancel(id: string) { this.finishWithoutWrite(id, 'cancelled', '真人已取消，資料沒有變更。'); }

  async undo(id: string) {
    const record = this.completedById.get(id);
    if (!record || record.undone) return { ok: false, result: 'failed', message: '沒有可撤銷的操作。' };
    try {
      record.request.undo(); record.undone = true;
      this.audit.update(record.auditId, { result: 'undone', undone: true });
      this.completedByKey.delete(record.idempotencyKey);
      const result = { ok: true, result: 'undone', tool_name: record.operation.toolName, trend_id: record.operation.trendId, message: '已撤銷並恢復操作前狀態。' };
      this.setState({ status: 'undone', operation: record.operation, message: result.message }); return result;
    } catch {
      const result = { ok: false, result: 'failed', message: '撤銷失敗，請以原本功能檢查目前狀態。' };
      this.setState({ status: 'failed', operation: record.operation, message: result.message }); return result;
    }
  }

  abortPending() { [...this.pendingById.keys()].forEach((id) => this.finishWithoutWrite(id, 'aborted', '頁面已離開，待確認操作已取消。')); }

  private finishWithoutWrite(id: string, resultName: Exclude<WebMcpAuditResult, 'confirmed' | 'failed' | 'undone'>, message: string) {
    const record = this.pendingById.get(id); if (!record) return;
    this.removePending(record); const result = { ok: false, result: resultName, tool_name: record.operation.toolName, trend_id: record.operation.trendId, message, undo_available: false };
    this.audit.append(this.auditEntry(record, record.operation.id, resultName, null));
    this.setState({ status: resultName, operation: record.operation, message }); record.resolve(result);
  }

  private removePending(record: PendingRecord) {
    clearTimeout(record.timer); record.request.signal.removeEventListener('abort', record.abortListener);
    this.pendingById.delete(record.operation.id); this.pendingByKey.delete(record.idempotencyKey);
  }

  private auditEntry(record: PendingRecord, id: string, result: WebMcpAuditResult, confirmedAt: string | null): WebMcpAuditEntry {
    return { id, toolName: record.operation.toolName, trendId: record.operation.trendId, requestedAt: record.requestedAt, confirmedAt, result, undone: false, sessionId: this.sessionId };
  }

  private recordImmediate(operation: PendingHumanOperation, result: WebMcpAuditResult, message: string) {
    this.audit.append({ id: operation.id, toolName: operation.toolName, trendId: operation.trendId, requestedAt: new Date().toISOString(), confirmedAt: null, result, undone: false, sessionId: this.sessionId });
    this.setState({ status: result as ConfirmationStatus, operation, message }); return { ok: false, result, tool_name: operation.toolName, trend_id: operation.trendId, message, undo_available: false };
  }

  private setState(state: HumanConfirmationState) { this.state = state; this.listeners.forEach((listener) => listener()); }
}
