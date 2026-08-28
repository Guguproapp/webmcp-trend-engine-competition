import type { AuditLogEntry } from '../../../shared/domain/audit';
import type { PlatformCode, PlatformConnection } from '../../../shared/domain/platform';

export interface PlatformConnectionRepository {
  getAll(): PlatformConnection[];
  get(platformCode: PlatformCode): PlatformConnection | undefined;
  save(connection: PlatformConnection): void;
}

export interface AuditLogRepository {
  append(entry: AuditLogEntry): void;
  list(): AuditLogEntry[];
}
