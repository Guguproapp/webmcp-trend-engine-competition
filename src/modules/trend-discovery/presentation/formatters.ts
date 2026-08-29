import type { TrendGrowthStatus, TrendHeatPoint } from '../domain/TrendTopic';

export const formatDateTime = (value: string) => new Intl.DateTimeFormat('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(value));
export const formatNumber = (value: number) => new Intl.NumberFormat('zh-TW', { notation:value >= 10000 ? 'compact' : 'standard', maximumFractionDigits:1 }).format(value);

export function growthPresentation(status: TrendGrowthStatus, rate: number | null, history: TrendHeatPoint[]) {
  const first = history[0];
  const last = history.at(-1);
  if (status === 'baseline_pending' || history.length < 2 || !first || !last) {
    const snapshotTime = first ? formatDateTime(first.at) : '尚未建立';
    return { label: '正在建立增速基準', summary: `第一次快照時間 ${snapshotTime}，等待下一次有效快照後計算增速。`, ariaLabel: '正在建立增速基準，目前只有一次有效快照' };
  }
  const measuredRate = rate ?? 0;
  if (measuredRate === 0 && first.value === last.value) {
    return { label: '0%', summary: `目前無明顯變化；${formatDateTime(first.at)} 與 ${formatDateTime(last.at)} 的熱度皆為 ${last.value}。`, ariaLabel: `兩次有效快照熱度皆為 ${last.value}，目前無明顯變化` };
  }
  const label = `${measuredRate > 0 ? '+' : ''}${measuredRate}%`;
  return { label, summary: `${formatDateTime(first.at)} 熱度 ${first.value}，${formatDateTime(last.at)} 熱度 ${last.value}，增速 ${label}。`, ariaLabel: `熱度由 ${first.value} 變為 ${last.value}，增速 ${label}` };
}
