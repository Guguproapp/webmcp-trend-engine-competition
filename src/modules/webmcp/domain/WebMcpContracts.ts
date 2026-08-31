export const WEBMCP_TOOL_NAMES = [
  'search_trends',
  'get_trend_evidence',
  'get_source_status',
  'add_trend_to_watchlist',
  'exclude_trend',
] as const;

export type WebMcpToolName = (typeof WEBMCP_TOOL_NAMES)[number];

export interface WebMcpToolAnnotations {
  readOnlyHint: boolean;
  untrustedContentHint?: boolean;
}

export interface WebMcpExecuteOptions { signal: AbortSignal; }

export interface WebMcpToolDefinition {
  name: WebMcpToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: WebMcpToolAnnotations;
  execute: (input: unknown, options?: WebMcpExecuteOptions) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

export const WEBMCP_REGIONS = ['china_mainland', 'taiwan', 'hong_kong', 'macau', 'all'] as const;
export type WebMcpRegion = (typeof WEBMCP_REGIONS)[number];
export const WEBMCP_PLATFORMS = ['all', 'youtube', 'tiktok', 'instagram', 'facebook', 'douyin', 'kuaishou', 'xiaohongshu', 'bilibili', 'gdelt_news', 'google_trends', 'threads'] as const;
export type WebMcpPlatform = (typeof WEBMCP_PLATFORMS)[number];
export const WEBMCP_TIME_RANGES = ['1h', '6h', '24h', '3d', '7d'] as const;
export type WebMcpTimeRange = (typeof WEBMCP_TIME_RANGES)[number];

export const WEBMCP_EXCLUSION_REASONS = ['無品牌價值', '共鳴不足', '風險太高', '已經過時', '競爭過度', '自然災害', '政治敏感', '來源不可信', '其他'] as const;
export type WebMcpExclusionReason = (typeof WEBMCP_EXCLUSION_REASONS)[number];

export class SafeWebMcpError extends Error {
  constructor(message: string) { super(message); this.name = 'WebMcpError'; }
}

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new SafeWebMcpError('操作已取消。');
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeId(value: unknown) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 160 || !/^trend-[\p{L}\p{N}._-]+$/u.test(value)) {
    throw new SafeWebMcpError('找不到指定主題。');
  }
  return value;
}
