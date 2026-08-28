export interface AuditLogEntry {
  id: string;
  action: string;
  platformCode?: string;
  detail: string;
  createdAt: string;
}
