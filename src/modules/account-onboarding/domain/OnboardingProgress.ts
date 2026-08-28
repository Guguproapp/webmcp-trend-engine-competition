import type { PlatformCode } from '../../../shared/domain/platform';

export type OnboardingMode = 'existing' | 'new' | null;

export interface OnboardingProgress {
  mode: OnboardingMode;
  existingPlatforms: PlatformCode[];
  signupPlatforms: PlatformCode[];
  profileCompleted: boolean;
  updatedAt: string;
}

export const EMPTY_ONBOARDING_PROGRESS: OnboardingProgress = {
  mode: null,
  existingPlatforms: [],
  signupPlatforms: [],
  profileCompleted: false,
  updatedAt: new Date(0).toISOString(),
};
