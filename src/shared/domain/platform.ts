export const PLATFORM_CONNECTION_STATUSES = [
  'not_started',
  'account_exists',
  'signup_required',
  'signup_in_progress',
  'awaiting_user_verification',
  'ready_for_authorization',
  'authorizing',
  'authorized',
  'permission_incomplete',
  'token_expired',
  'connection_error',
  'disconnected',
] as const;

export type PlatformConnectionStatus = (typeof PLATFORM_CONNECTION_STATUSES)[number];
export type PlatformCode = 'youtube' | 'instagram' | 'facebook' | 'tiktok';

export interface PlatformDefinition {
  code: PlatformCode;
  name: string;
  icon: string;
  registrationUrl: string;
  supportsOAuth: boolean;
  supportsVideoPublishing: boolean;
  supportsDrafts: boolean;
  supportsScheduling: boolean;
  supportsAiDisclosure: boolean;
  accountRequirement: string;
  displayOrder: number;
  description: string;
  unsupportedHint?: string;
}

export interface PlatformConnection {
  platformCode: PlatformCode;
  status: PlatformConnectionStatus;
  statusMessage: string;
  updatedAt: string;
  isMock: true;
}

export const PLATFORM_REGISTRY: readonly PlatformDefinition[] = [
  {
    code: 'youtube',
    name: 'YouTube',
    icon: '▶',
    registrationUrl: 'https://accounts.google.com/signup',
    supportsOAuth: true,
    supportsVideoPublishing: true,
    supportsDrafts: false,
    supportsScheduling: true,
    supportsAiDisclosure: true,
    accountRequirement: 'Google 帳號與 YouTube 頻道',
    displayOrder: 1,
    description: '長短影音與 Shorts 頻道。',
  },
  {
    code: 'instagram',
    name: 'Instagram',
    icon: '◎',
    registrationUrl: 'https://www.instagram.com/accounts/emailsignup/',
    supportsOAuth: true,
    supportsVideoPublishing: true,
    supportsDrafts: false,
    supportsScheduling: true,
    supportsAiDisclosure: false,
    accountRequirement: '專業帳號；正式串接時需連結 Facebook 粉絲專頁',
    displayOrder: 2,
    description: 'Reels 與品牌圖文內容。',
  },
  {
    code: 'facebook',
    name: 'Facebook',
    icon: 'f',
    registrationUrl: 'https://www.facebook.com/pages/create',
    supportsOAuth: true,
    supportsVideoPublishing: true,
    supportsDrafts: true,
    supportsScheduling: true,
    supportsAiDisclosure: false,
    accountRequirement: 'Facebook 個人帳號管理的粉絲專頁',
    displayOrder: 3,
    description: '粉絲專頁影音與貼文。',
  },
  {
    code: 'tiktok',
    name: 'TikTok',
    icon: '♪',
    registrationUrl: 'https://www.tiktok.com/signup',
    supportsOAuth: true,
    supportsVideoPublishing: true,
    supportsDrafts: true,
    supportsScheduling: false,
    supportsAiDisclosure: true,
    accountRequirement: 'TikTok 帳號；正式發布能力需另通過平台審核',
    displayOrder: 4,
    description: '直式短影音帳號。',
    unsupportedHint: '工作包 001 僅提供模擬授權，不代表已取得正式發布權限。',
  },
] as const;

export const STATUS_LABELS: Record<PlatformConnectionStatus, string> = {
  not_started: '尚未開始',
  account_exists: '已有帳號',
  signup_required: '需要註冊',
  signup_in_progress: '註冊進行中',
  awaiting_user_verification: '等待本人驗證',
  ready_for_authorization: '可以開始官方授權',
  authorizing: '正在授權',
  authorized: '已授權（模擬）',
  permission_incomplete: '權限不足',
  token_expired: '授權過期',
  connection_error: '連接失敗',
  disconnected: '已解除連接',
};

const transitions: Record<PlatformConnectionStatus, readonly PlatformConnectionStatus[]> = {
  not_started: ['account_exists', 'signup_required'],
  account_exists: ['ready_for_authorization'],
  signup_required: ['signup_in_progress'],
  signup_in_progress: ['awaiting_user_verification'],
  awaiting_user_verification: ['ready_for_authorization'],
  ready_for_authorization: ['authorizing', 'disconnected'],
  authorizing: ['authorized', 'ready_for_authorization', 'permission_incomplete', 'token_expired', 'connection_error'],
  authorized: ['token_expired', 'permission_incomplete', 'connection_error', 'disconnected', 'authorizing'],
  permission_incomplete: ['authorizing', 'disconnected'],
  token_expired: ['authorizing', 'disconnected'],
  connection_error: ['authorizing', 'disconnected'],
  disconnected: ['authorizing', 'ready_for_authorization'],
};

export function canTransition(from: PlatformConnectionStatus, to: PlatformConnectionStatus) {
  return transitions[from].includes(to);
}

export function findPlatform(code: string | null): PlatformDefinition | undefined {
  return PLATFORM_REGISTRY.find((platform) => platform.code === code);
}
