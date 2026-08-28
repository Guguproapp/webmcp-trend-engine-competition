import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import type { OnboardingProgressRepository } from '../application/OnboardingProgressRepository';
import { EMPTY_ONBOARDING_PROGRESS, type OnboardingProgress } from '../domain/OnboardingProgress';

export class LocalOnboardingProgressRepository implements OnboardingProgressRepository {
  private readonly store: JsonStore<OnboardingProgress>;

  constructor(storage: KeyValueStorage) {
    this.store = new JsonStore(storage, 'trend-engine.onboarding.v1', EMPTY_ONBOARDING_PROGRESS);
  }

  get() {
    return this.store.read();
  }

  save(progress: OnboardingProgress) {
    this.store.write({ ...progress, updatedAt: new Date().toISOString() });
  }
}
