import type { KeyValueStorage } from '../../../shared/infrastructure/storage';
import { JsonStore } from '../../../shared/infrastructure/storage';
import { redactSensitiveText } from '../../../shared/security/PublicUrlSafety';
import { WEBMCP_TOOL_NAMES, type WebMcpToolName } from '../domain/WebMcpContracts';

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

const WEBMCP_AUDIT_RESULTS: WebMcpAuditResult[] = ['confirmed', 'cancelled', 'timed_out', 'aborted', 'failed', 'undone'];

function sanitizeAuditEntry(value: unknown): WebMcpAuditEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.toolName !== 'string' || !WEBMCP_TOOL_NAMES.includes(item.toolName as WebMcpToolName)
    || typeof item.trendId !== 'string' || typeof item.requestedAt !== 'string'
    || !(typeof item.confirmedAt === 'string' || item.confirmedAt === null)
    || typeof item.result !== 'string' || !WEBMCP_AUDIT_RESULTS.includes(item.result as WebMcpAuditResult)
    || typeof item.undone !== 'boolean' || typeof item.sessionId !== 'string') return null;
  return {
    id: redactSensitiveText(item.id),
    toolName: item.toolName as WebMcpToolName,
    trendId: redactSensitiveText(item.trendId),
    requestedAt: redactSensitiveText(item.requestedAt),
    confirmedAt: item.confirmedAt === null ? null : redactSensitiveText(item.confirmedAt),
    result: item.result as WebMcpAuditResult,
    undone: item.undone,
    sessionId: redactSensitiveText(item.sessionId),
  };
}

function sanitizeAuditUpdate(update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>) {
  return {
    ...(typeof update.result === 'string' && WEBMCP_AUDIT_RESULTS.includes(update.result) ? { result: update.result } : {}),
    ...(typeof update.undone === 'boolean' ? { undone: update.undone } : {}),
  };
}

export class MemoryWebMcpAuditRepository implements WebMcpAuditRepository {
  private readonly entries: WebMcpAuditEntry[] = [];
  append(entry: WebMcpAuditEntry) { const sanitized = sanitizeAuditEntry(entry); if (sanitized) this.entries.unshift(structuredClone(sanitized)); }
  list(sessionId: string) { return this.entries.filter((entry) => entry.sessionId === sessionId).map((entry) => structuredClone(entry)); }
  update(id: string, update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>) {
    const entry = this.entries.find((item) => item.id === id); if (entry) Object.assign(entry, sanitizeAuditUpdate(update));
  }
}

export const WEBMCP_AUDIT_STORAGE_KEY = 'trend-engine.webmcp.audit.v1';

export class LocalWebMcpAuditRepository implements WebMcpAuditRepository {
  private readonly store: JsonStore<WebMcpAuditEntry[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, WEBMCP_AUDIT_STORAGE_KEY, []); }
  private readEntries() {
    const entries = this.store.read();
    const sanitized = Array.isArray(entries) ? entries.map(sanitizeAuditEntry).filter((entry): entry is WebMcpAuditEntry => entry !== null) : [];
    if (JSON.stringify(sanitized) !== JSON.stringify(entries)) this.store.write(sanitized);
    return sanitized;
  }
  append(entry: WebMcpAuditEntry) { const sanitized = sanitizeAuditEntry(entry); if (sanitized) this.store.write([sanitized, ...this.readEntries()].slice(0, 100)); }
  list(sessionId: string) { return this.readEntries().filter((entry) => entry.sessionId === sessionId); }
  update(id: string, update: Partial<Pick<WebMcpAuditEntry, 'result' | 'undone'>>) {
    const sanitizedUpdate = sanitizeAuditUpdate(update);
    this.store.write(this.readEntries().map((entry) => entry.id === id ? { ...entry, ...sanitizedUpdate } : entry));
  }
}
