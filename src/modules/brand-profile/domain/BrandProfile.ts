export interface BrandProfile {
  brandName: string;
  handle: string;
  industry: string;
  contentTopics: string;
  targetAudience: string;
  bio: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoDataUrl: string;
  primaryColor: string;
  language: string;
  region: string;
  isBusinessAccount: boolean | null;
  publishesAiContent: boolean | null;
  updatedAt: string;
}

export type BrandProfileErrors = Partial<Record<keyof BrandProfile, string>>;

export function createEmptyBrandProfile(): BrandProfile {
  return {
    brandName: '',
    handle: '',
    industry: '',
    contentTopics: '',
    targetAudience: '',
    bio: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    logoDataUrl: '',
    primaryColor: '#ef6a5b',
    language: '繁體中文',
    region: '台灣',
    isBusinessAccount: null,
    publishesAiContent: null,
    updatedAt: new Date(0).toISOString(),
  };
}

const requiredKeys: (keyof BrandProfile)[] = [
  'brandName',
  'handle',
  'industry',
  'contentTopics',
  'targetAudience',
  'bio',
  'contactEmail',
  'logoDataUrl',
  'primaryColor',
  'language',
  'region',
  'isBusinessAccount',
  'publishesAiContent',
];

export function validateBrandProfile(profile: BrandProfile): BrandProfileErrors {
  const errors: BrandProfileErrors = {};
  const requiredText: (keyof BrandProfile)[] = requiredKeys.filter(
    (key) => key !== 'isBusinessAccount' && key !== 'publishesAiContent',
  );

  for (const key of requiredText) {
    if (!String(profile[key] ?? '').trim()) errors[key] = '此欄位為必填。';
  }
  if (profile.isBusinessAccount === null) errors.isBusinessAccount = '請選擇一個答案。';
  if (profile.publishesAiContent === null) errors.publishesAiContent = '請選擇一個答案。';
  if (profile.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail)) {
    errors.contactEmail = '請輸入有效的 Email 格式。';
  }
  if (profile.website && !/^https?:\/\//i.test(profile.website)) {
    errors.website = '網址需以 http:// 或 https:// 開頭。';
  }
  return errors;
}

export function profileCompletion(profile: BrandProfile) {
  const complete = requiredKeys.filter((key) => {
    const value = profile[key];
    return typeof value === 'boolean' ? true : value !== null && String(value).trim().length > 0;
  }).length;
  return Math.round((complete / requiredKeys.length) * 100);
}
