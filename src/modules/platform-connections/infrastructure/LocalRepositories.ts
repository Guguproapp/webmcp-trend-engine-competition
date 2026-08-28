import type { AuditLogEntry } from '../../../shared/domain/audit';
import type { PlatformCode, PlatformConnection } from '../../../shared/domain/platform';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import type { AuditLogRepository, PlatformConnectionRepository } from '../application/repositories';

export class LocalPlatformConnectionRepository implements PlatformConnectionRepository {
  private readonly store: JsonStore<PlatformConnection[]>;

  constructor(storage: KeyValueStorage) {
    this.store = new JsonStore(storage, 'trend-engine.connections.v1', []);
  }

  getAll() {
    return this.store.read();
  }

  get(platformCode: PlatformCode) {
    return this.getAll().find((item) => item.platformCode === platformCode);
  }

  save(connection: PlatformConnection) {
    const all = this.getAll().filter((item) => item.platformCode !== connection.platformCode);
    this.store.write([...all, connection]);
  }
}

export class LocalAuditLogRepository implements AuditLogRepository {
  private readonly store: JsonStore<AuditLogEntry[]>;

  constructor(storage: KeyValueStorage) {
    this.store = new JsonStore(storage, 'trend-engine.audit.v1', []);
  }

  append(entry: AuditLogEntry) {
    this.store.write([entry, ...this.store.read()].slice(0, 100));
  }

  list() {
    return this.store.read();
  }
}
