import type { BrandProfile } from '../domain/BrandProfile';

export interface BrandProfileRepository {
  get(): BrandProfile;
  save(profile: BrandProfile): void;
}
