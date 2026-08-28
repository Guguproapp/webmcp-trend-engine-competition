import { createEmptyBrandProfile, profileCompletion, validateBrandProfile } from '../domain/BrandProfile';

describe('BrandProfile', () => {
  it('驗證必填欄位且不把選填電話與網站列為錯誤', () => {
    const errors = validateBrandProfile(createEmptyBrandProfile());
    expect(errors.brandName).toBeDefined();
    expect(errors.logoDataUrl).toBeDefined();
    expect(errors.contactPhone).toBeUndefined();
    expect(errors.website).toBeUndefined();
  });

  it('計算共同資料完成百分比', () => {
    const empty = createEmptyBrandProfile();
    expect(profileCompletion(empty)).toBeGreaterThan(0);
    const complete = {
      ...empty,
      brandName: '熱門引擎',
      handle: '@trendengine',
      industry: '科技',
      contentTopics: 'AI 工具',
      targetAudience: '台灣創作者',
      bio: '協助創作者規劃內容。',
      contactEmail: 'owner@example.com',
      logoDataUrl: 'data:image/png;base64,abc',
      isBusinessAccount: true,
      publishesAiContent: true,
    };
    expect(validateBrandProfile(complete)).toEqual({});
    expect(profileCompletion(complete)).toBe(100);
  });
});
