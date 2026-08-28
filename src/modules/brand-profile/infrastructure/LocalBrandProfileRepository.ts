import type { BrandProfileRepository } from '../application/BrandProfileRepository';
import { createEmptyBrandProfile, type BrandProfile } from '../domain/BrandProfile';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';

export class LocalBrandProfileRepository implements BrandProfileRepository {
  private readonly store: JsonStore<BrandProfile>;

  constructor(storage: KeyValueStorage) {
    this.store = new JsonStore(storage, 'trend-engine.brand-profile.v1', createEmptyBrandProfile());
  }

  get() {
    return this.store.read();
  }

  save(profile: BrandProfile) {
    this.store.write({ ...profile, updatedAt: new Date().toISOString() });
  }
}
