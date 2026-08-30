import type { WebMcpToolName } from '../domain/WebMcpContracts';

export interface WebMcpActivitySnapshot {
  lastCall: { toolName: WebMcpToolName; startedAt: string; completedAt: string | null; status: 'running' | 'success' | 'failed'; message: string } | null;
  candidates: Array<{ trend_id: string; title: string; region: string; platforms: string[]; time_range: string; total_score: number; data_status: string; limitation: string }>;
  evidence: Record<string, unknown> | null;
  sourceStatus: Record<string, unknown> | null;
}

const initial: WebMcpActivitySnapshot = { lastCall: null, candidates: [], evidence: null, sourceStatus: null };

export class WebMcpActivityStore {
  private state: WebMcpActivitySnapshot = structuredClone(initial);
  private readonly listeners = new Set<() => void>();
  getSnapshot() { return structuredClone(this.state); }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  start(toolName: WebMcpToolName) {
    this.state.lastCall = { toolName, startedAt: new Date().toISOString(), completedAt: null, status: 'running', message: '工具執行中 / Tool running' }; this.emit();
  }
  complete(toolName: WebMcpToolName, result: Record<string, unknown>) {
    const resultType = result.result_type;
    if (resultType === 'trend_candidates' && Array.isArray(result.candidates)) this.state.candidates = structuredClone(result.candidates) as WebMcpActivitySnapshot['candidates'];
    if (resultType === 'trend_evidence') this.state.evidence = structuredClone(result);
    if (resultType === 'source_status') this.state.sourceStatus = structuredClone(result);
    this.state.lastCall = { toolName, startedAt: this.state.lastCall?.toolName === toolName ? this.state.lastCall.startedAt : new Date().toISOString(), completedAt: new Date().toISOString(), status: result.ok === false ? 'failed' : 'success', message: typeof result.message === 'string' ? result.message : '工具已回傳結構化結果 / Structured result returned' }; this.emit();
  }
  fail(toolName: WebMcpToolName) {
    this.state.lastCall = { toolName, startedAt: this.state.lastCall?.toolName === toolName ? this.state.lastCall.startedAt : new Date().toISOString(), completedAt: new Date().toISOString(), status: 'failed', message: '工具無法完成；未顯示內部錯誤資訊。' }; this.emit();
  }
  private emit() { this.listeners.forEach((listener) => listener()); }
}
