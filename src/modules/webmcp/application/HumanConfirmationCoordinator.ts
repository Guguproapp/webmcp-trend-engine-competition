import type { WebMcpAuditRepository } from '../infrastructure/WebMcpAuditRepository';
import type { WebMcpExclusionReason, WebMcpToolName } from '../domain/WebMcpContracts';

export type ConfirmationStatus = 'idle' | 'pending' | 'confirmed' | 'cancelled' | 'timed_out' | 'aborted' | 'failed' | 'undone';
export interface PendingHumanOperation { id: string; toolName: WebMcpToolName; trendId: string; topicTitle: string; actionLabel: string; impact: string; undoDescription: string; reason?: WebMcpExclusionReason; }
export interface HumanConfirmationState { status: ConfirmationStatus; operation: PendingHumanOperation | null; message: string; }
export interface ConfirmationRequest extends PendingHumanOperation { perform: () => void; undo: () => void; signal: AbortSignal; }

export class HumanConfirmationCoordinator {
  constructor(audit: WebMcpAuditRepository, options?: { timeoutMs?: number; sessionId?: string }) { void audit; void options; }
  getState(): HumanConfirmationState { return { status: 'idle', operation: null, message: '' }; }
  subscribe(listener: () => void) { void listener; return () => undefined; }
  listPending(): PendingHumanOperation[] { return []; }
  request(request: ConfirmationRequest): Promise<Record<string, unknown>> { void request; return Promise.reject(new Error('真人確認功能尚未實作')); }
  confirm(id: string) { void id; }
  cancel(id: string) { void id; }
  async undo(id: string) { void id; }
  abortPending() {}
}
