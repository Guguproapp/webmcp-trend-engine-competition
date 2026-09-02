import { describe, expect, it, vi } from 'vitest';
import {
  RadarAdapter,
  RadarAdapterError,
  parseRadarQuery,
  validateRadarTopicId,
  type RadarAdapterEnvironment,
} from '../../../../functions/_shared/radar/RadarAdapter';

const now = '2026-09-02T08:00:00.000Z';
const testToken = ['competition', 'only', 'test', 'value'].join('-');

function environment(overrides: Partial<RadarAdapterEnvironment> = {}): RadarAdapterEnvironment {
  return {
    RADAR_API_BASE_URL: 'https://asia-trend-radar.gugupro-app.workers.dev/api/v1',
    RADAR_PROGRAM_API_TOKEN: testToken,
    ...overrides,
  };
}

function upstream(data: unknown, meta: Record<string, unknown> = {}) {
  return Response.json({ data, meta: { acquiredAt: now, ...meta } });
}

describe('熱門雷達伺服器轉接器', () => {
  it('只允許固定市場、類型、排序與安全數值範圍', () => {
    expect(parseRadarQuery(new URL('https://app.example/api/radar/trends?market=TW&type=search_rising&hours=24&minConfidence=.7&sort=rank&limit=5')))
      .toEqual({ market: 'TW', type: 'search_rising', hours: 24, minConfidence: 0.7, sort: 'rank', limit: 5 });
    for (const url of [
      'https://app.example/api/radar/trends?market=XX',
      'https://app.example/api/radar/trends?type=unknown',
      'https://app.example/api/radar/trends?hours=0',
      'https://app.example/api/radar/trends?minConfidence=1.1',
      'https://app.example/api/radar/trends?sort=score',
      'https://app.example/api/radar/trends?limit=500',
      'https://app.example/api/radar/trends?upstream=https://evil.example',
    ]) expect(() => parseRadarQuery(new URL(url))).toThrow(RadarAdapterError);
  });

  it('topicId限制格式、長度並阻擋路徑注入', () => {
    expect(validateRadarTopicId('topic-TW_2026.09:abc')).toBe('topic-TW_2026.09:abc');
    for (const id of ['../admin/settings', 'topic/%2e%2e', '<script>', 'a'.repeat(121), '']) {
      expect(() => validateRadarTopicId(id)).toThrow(RadarAdapterError);
    }
  });

  it('只向穩定API送出GET及伺服器Authorization且不回傳Token', async () => {
    const fetcher = vi.fn(async (request: Request) => {
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://asia-trend-radar.gugupro-app.workers.dev/api/v1/trends?market=TW&limit=5');
      expect(request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
      return upstream([], { total: 0, limit: 5 });
    });
    const result = await new RadarAdapter(environment(), { fetcher, now: () => now }).trends({ market: 'TW', limit: 5 });
    expect(result.data).toEqual([]);
    expect(JSON.stringify(result)).not.toContain(testToken);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('未設定Token時安全失敗且不發出上游請求', async () => {
    const fetcher = vi.fn();
    await expect(new RadarAdapter(environment({ RADAR_PROGRAM_API_TOKEN: '' }), { fetcher }).markets())
      .rejects.toMatchObject({ code: 'credentials_missing_or_invalid', status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('401與403轉成不洩漏內部資訊的憑證錯誤', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { message: 'DB secret token stack /Users/private' } }, { status: 401 }));
    await expect(new RadarAdapter(environment(), { fetcher }).sources()).rejects.toMatchObject({
      code: 'credentials_missing_or_invalid', message: '熱門雷達連線憑證未設定或已失效。',
    });
  });

  it('429最多重試兩次後回傳安全錯誤', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { message: 'quota' } }, { status: 429, headers: { 'Retry-After': '0' } }));
    await expect(new RadarAdapter(environment(), { fetcher, wait: async () => undefined }).videos({ market: 'TW' }))
      .rejects.toMatchObject({ code: 'rate_limited', status: 429 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('5xx或逾時時使用最近成功資料並標示延遲與原始時間', async () => {
    const cache = new Map<string, unknown>();
    const success = new RadarAdapter(environment(), { fetcher: async () => upstream([{ topicId: 'topic-1' }]), cache, now: () => now });
    await success.trends({ market: 'TW' });
    const failed = new RadarAdapter(environment(), { fetcher: async () => Response.json({}, { status: 503 }), cache, now: () => '2026-09-02T08:06:00.000Z' });
    const result = await failed.trends({ market: 'TW' });
    expect(result).toMatchObject({ delayed: true, acquiredAt: now, data: [{ topicId: 'topic-1' }] });
  });

  it('上游逾時時中止請求，沒有快取就回傳安全錯誤', async () => {
    const fetcher = vi.fn((request: Request) => new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    }));
    await expect(new RadarAdapter(environment(), { fetcher, timeoutMs: 1 }).trends({ market: 'TW' }))
      .rejects.toMatchObject({ code: 'upstream_timeout', status: 504, message: '熱門雷達回應逾時，請稍後再試。' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('沒有成功快取時誠實回傳錯誤，不以展示資料補位', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { message: 'internal stack' } }, { status: 500 }));
    await expect(new RadarAdapter(environment(), { fetcher }).trends({ market: 'TW' }))
      .rejects.toMatchObject({ code: 'upstream_unavailable' });
  });

  it('禁止任意HTTP方法、任意上游與管理端點', async () => {
    const adapter = new RadarAdapter(environment(), { fetcher: vi.fn() });
    expect(adapter.allowedPaths()).toEqual(['/trends', '/trends/:topicId', '/videos', '/sources', '/markets', '/categories']);
    expect(JSON.stringify(adapter.allowedPaths())).not.toMatch(/admin|POST|PUT|PATCH|DELETE/i);
  });
});
