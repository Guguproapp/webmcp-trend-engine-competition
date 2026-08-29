export const TREND_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
export const TREND_REFRESH_GRACE_MS = 15 * 60 * 1000;

export type TrendDataState = 'fresh' | 'waiting' | 'stale' | 'empty';

export interface TrendFreshnessResult {
  dataState: TrendDataState;
  nextRefreshAt: string | null;
  staleAfterAt: string | null;
  message: string;
}

export function evaluateTrendFreshness(lastSuccessAt: string | null, hasData: boolean, now = new Date()): TrendFreshnessResult {
  if (!hasData || !lastSuccessAt) {
    return { dataState: 'empty', nextRefreshAt: null, staleAfterAt: null, message: '目前沒有可用的真實熱門資料，請查看來源狀態。' };
  }

  const lastSuccessTime = new Date(lastSuccessAt).getTime();
  const nextRefreshTime = lastSuccessTime + TREND_REFRESH_INTERVAL_MS;
  const staleAfterTime = nextRefreshTime + TREND_REFRESH_GRACE_MS;
  const shared = {
    nextRefreshAt: new Date(nextRefreshTime).toISOString(),
    staleAfterAt: new Date(staleAfterTime).toISOString(),
  };

  if (now.getTime() <= nextRefreshTime) return { ...shared, dataState: 'fresh', message: '資料已更新' };
  if (now.getTime() <= staleAfterTime) return { ...shared, dataState: 'waiting', message: '顯示最近一次成功資料' };
  return { ...shared, dataState: 'stale', message: '資料更新延遲｜目前顯示最近一次成功結果' };
}

export function retainLastSuccessfulTopics<T>(previous: T[], incoming: T[]) {
  return incoming.length ? incoming : previous;
}
