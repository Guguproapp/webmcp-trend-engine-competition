import type { KeyValueStorage } from '../../../shared/infrastructure/storage';
import { JsonStore } from '../../../shared/infrastructure/storage';
import type { WebMcpToolName } from '../domain/WebMcpContracts';

export type WebMcpAuditResult = 'confirmed' | 'cancelled' | 'timed_out' | 'aborted' | 'failed' | 'undone';

export interface WebMcpAuditEntry {
  id: string;
  toolName: WebMcpToolName;
  trendId: string;
  requestedAt: string;
  confirmedAt: string | null;
  result: WebMcpAuditResult;
  undone: boolean;
  sessionId: string;
}

export interface WebMcpAuditRepository {
  append(entry: WebMcpAuditEntry): void;
  list(sessionId: string): WebMcpAuditEntry[];
  update(id: string, update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>): void;
}

export class MemoryWebMcpAuditRepository implements WebMcpAuditRepository {
  private readonly entries: WebMcpAuditEntry[] = [];
  append(entry: WebMcpAuditEntry) { this.entries.unshift(structuredClone(entry)); }
  list(sessionId: string) { return this.entries.filter((entry) => entry.sessionId === sessionId).map((entry) => structuredClone(entry)); }
  update(id: string, update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>) {
    const entry = this.entries.find((item) => item.id === id); if (entry) Object.assign(entry, update);
  }
}

export const WEBMCP_AUDIT_STORAGE_KEY = 'trend-engine.webmcp.audit.v1';

export class LocalWebMcpAuditRepository implements WebMcpAuditRepository {
  private readonly store: JsonStore<WebMcpAuditEntry[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, WEBMCP_AUDIT_STORAGE_KEY, []); }
  append(entry: WebMcpAuditEntry) { this.store.write([entry, ...this.store.read()].slice(0, 100)); }
  list(sessionId: string) { return this.store.read().filter((entry) => entry.sessionId === sessionId); }
  update(id: string, update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>) {
    this.store.write(this.store.read().map((entry) => entry.id === id ? { ...entry, ...update } : entry));
  }
}
