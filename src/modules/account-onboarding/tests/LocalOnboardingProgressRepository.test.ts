import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { LocalOnboardingProgressRepository } from '../infrastructure/LocalOnboardingProgressRepository';

it('換頁或重新建立 Repository 後仍保留進度', () => {
  const storage = new MemoryStorage();
  const first = new LocalOnboardingProgressRepository(storage);
  first.save({ mode: 'existing', existingPlatforms: ['youtube'], signupPlatforms: ['tiktok'], profileCompleted: false, updatedAt: '' });
  const afterRefresh = new LocalOnboardingProgressRepository(storage);
  expect(afterRefresh.get()).toMatchObject({ mode: 'existing', existingPlatforms: ['youtube'], signupPlatforms: ['tiktok'] });
});
