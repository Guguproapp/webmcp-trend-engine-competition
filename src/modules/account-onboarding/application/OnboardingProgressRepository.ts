import type { OnboardingProgress } from '../domain/OnboardingProgress';

export interface OnboardingProgressRepository {
  get(): OnboardingProgress;
  save(progress: OnboardingProgress): void;
}
