import type { TrendProviderStatus } from './TrendSourceProvider';
import type { SourceAcquisitionMethod } from '../domain/VideoDiscovery';

export type DiscoverySourceCode = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'gdelt' | 'web_search';
export type DiscoverySourceState = 'enabled' | 'not_applied' | 'preparing' | 'waiting_review' | 'approved' | 'expired' | 'unavailable' | 'waiting_authorization' | 'temporary_failure' | 'quota_exceeded' | 'disabled';

export interface DiscoverySourceDefinition {
  code: DiscoverySourceCode;
  name: string;
  acquisitionMethod: SourceAcquisitionMethod;
  defaultState: DiscoverySourceState;
  description: string;
  limitation: string;
  capabilities: readonly string[];
}

export const DISCOVERY_SOURCE_REGISTRY: readonly DiscoverySourceDefinition[] = [
  { code:'youtube', name:'YouTube影音平台', acquisitionMethod:'official_api', defaultState:'enabled', description:'透過官方API自動取得台灣地區近期公開影片與官方統計。', limitation:'繁體中文設定提高相關性，但不保證所有結果皆為繁體中文。', capabilities:['公開影片搜尋：已啟用','台灣地區與繁體中文相關性：已啟用','不同時間快照：已啟用'] },
  { code:'facebook', name:'Facebook社群平台', acquisitionMethod:'waiting_review', defaultState:'not_applied', description:'可前往官方搜尋並貼回公開影片網址；正式公開內容介面尚未申請。', limitation:'未通過Meta審查前，不會回傳其他公開粉絲專頁的假資料。', capabilities:['官方網站輔助搜尋：可使用','公開影音網址匯入：可使用','Meta公開內容權限：尚未申請'] },
  { code:'instagram', name:'Instagram圖文與短影音平台', acquisitionMethod:'waiting_review', defaultState:'not_applied', description:'可前往官方搜尋並貼回公開Reels或貼文網址。', limitation:'專業帳號及公開內容能力須依Meta正式權限與審查結果啟用。', capabilities:['專業帳號授權：尚未申請','公開內容權限：尚未申請','主題標籤搜尋能力：等待Meta審查','Reels與公開貼文網址匯入：可使用'] },
  { code:'tiktok', name:'TikTok短影音平台', acquisitionMethod:'official_site_assisted', defaultState:'enabled', description:'提供TikTok官方搜尋、熱門創意中心及公開影片網址匯入。', limitation:'目前不是全平台自動API搜尋，人工匯入不會標示為官方熱門排名。', capabilities:['官方網站搜尋：可使用','官方熱門創意中心：可使用','公開影片網址匯入：可使用','全平台自動API：未啟用'] },
  { code:'gdelt', name:'GDELT全球新聞資料', acquisitionMethod:'public_news', defaultState:'enabled', description:'作為事件與新聞討論的補充發現來源。', limitation:'新聞篇數不會當成影音觀看、按讚或留言。', capabilities:['公開新聞索引：已啟用','新聞全文保存：未啟用'] },
  { code:'web_search', name:'合法搜尋引擎輔助', acquisitionMethod:'search_engine_candidate', defaultState:'disabled', description:'只產生限定官方網域的搜尋入口，由使用者選擇結果後貼回。', limitation:'尚未啟用自動網頁搜尋，也不爬取搜尋結果頁。', capabilities:['限定官方網域搜尋入口：可使用','自動網頁搜尋：尚未啟用'] },
] as const;

export interface ResolvedDiscoverySource extends DiscoverySourceDefinition {
  state: DiscoverySourceState;
  message: string;
  fetchedCount: number;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
}

export function resolveDiscoverySources(apiStatuses: TrendProviderStatus[]): ResolvedDiscoverySource[] {
  const statuses = new Map(apiStatuses.map((status) => [status.code, status]));
  return DISCOVERY_SOURCE_REGISTRY.map((source) => {
    const live = source.code === 'youtube' || source.code === 'gdelt' ? statuses.get(source.code) : undefined;
    return {
      ...source,
      state:live?.state ?? source.defaultState,
      message:live?.message ?? source.description,
      fetchedCount:live?.fetchedCount ?? 0,
      lastSuccessAt:live?.lastSuccessAt ?? null,
      lastAttemptAt:live?.lastAttemptAt ?? null,
      nextRetryAt:live?.nextRetryAt ?? null,
    };
  });
}
