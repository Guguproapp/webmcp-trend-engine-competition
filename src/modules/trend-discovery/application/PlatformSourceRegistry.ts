import type { TrendProviderStatus } from './TrendSourceProvider';
import type { SourceAcquisitionMethod, VideoPlatform } from '../domain/VideoDiscovery';
import type { SpecificMarketRegion } from '../domain/RegionalDiscovery';

export type DiscoverySourceCode = VideoPlatform
  | 'gdelt' | 'web_search' | 'google_trends' | 'google_news' | 'youtube_search_trends'
  | 'taiwan_news_rss' | 'trusted_news' | 'baidu_search_trends' | 'baidu_hot_search'
  | 'baidu_index' | 'weibo_hot_search' | 'douyin_hot_chart';
export type DiscoverySourceState = 'enabled' | 'not_applied' | 'preparing' | 'waiting_review' | 'approved'
  | 'expired' | 'unavailable' | 'waiting_authorization' | 'temporary_failure' | 'quota_exceeded'
  | 'disabled' | 'waiting_official_access' | 'waiting_platform_permission' | 'official_site_assisted' | 'user_shared';
export type DiscoverySourceGroup = 'search_trend' | 'viral_video' | 'news_evidence';

export const DISCOVERY_SOURCE_GROUP_LABELS: Record<DiscoverySourceGroup, string> = {
  search_trend:'熱搜來源', viral_video:'爆紅影音來源', news_evidence:'新聞佐證來源',
};

export interface DiscoverySourceDefinition {
  code: DiscoverySourceCode;
  name: string;
  group: DiscoverySourceGroup;
  regions: readonly SpecificMarketRegion[];
  platform?: VideoPlatform;
  acquisitionMethod: SourceAcquisitionMethod;
  defaultState: DiscoverySourceState;
  description: string;
  limitation: string;
  capabilities: readonly string[];
}

const allRegions: readonly SpecificMarketRegion[] = ['china_mainland','taiwan','hong_kong','macau'];

export const DISCOVERY_SOURCE_REGISTRY: readonly DiscoverySourceDefinition[] = [
  { code:'youtube', platform:'youtube', name:'YouTube', group:'viral_video', regions:['taiwan','hong_kong','macau'], acquisitionMethod:'official_api', defaultState:'enabled', description:'透過官方API取得公開影片與官方統計；目前正式自動查詢設定以台灣為主。', limitation:'YouTube長影音與Shorts短影音分開比較；未確認內容形式時不混入任一基準。', capabilities:['官方API自動取得','不同時間快照','台灣地區正式啟用'] },
  { code:'tiktok', platform:'tiktok', name:'TikTok', group:'viral_video', regions:['taiwan','hong_kong'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供官方網站搜尋、熱門創意中心及使用者分享網址。', limitation:'不是全平台自動API；香港保留手動選擇但不列入預設平台。', capabilities:['官方網站輔助搜尋','使用者分享網址'] },
  { code:'instagram', platform:'instagram', name:'Instagram Reels', group:'viral_video', regions:['taiwan','hong_kong','macau'], acquisitionMethod:'waiting_review', defaultState:'waiting_platform_permission', description:'提供官方搜尋及Reels公開網址匯入。', limitation:'等待Meta公開內容權限，不宣稱任意搜尋整個Instagram。', capabilities:['官方網站輔助搜尋','使用者分享網址','等待平台權限'] },
  { code:'facebook', platform:'facebook', name:'Facebook Reels', group:'viral_video', regions:['taiwan','hong_kong','macau'], acquisitionMethod:'waiting_review', defaultState:'waiting_platform_permission', description:'提供官方搜尋及公開影片網址匯入。', limitation:'等待Meta公開內容權限，不使用登入爬蟲。', capabilities:['官方網站輔助搜尋','使用者分享網址','等待平台權限'] },
  { code:'douyin', platform:'douyin', name:'抖音', group:'viral_video', regions:['china_mainland','macau'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供抖音官方網站搜尋及使用者分享網址。', limitation:'沒有商業公開搜尋API時不回傳假數據或假熱門排名。', capabilities:['官方網站輔助搜尋','使用者分享網址'] },
  { code:'kuaishou', platform:'kuaishou', name:'快手', group:'viral_video', regions:['china_mainland'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供快手官方網站搜尋及使用者分享網址。', limitation:'沒有正式平台權限時只保留輔助入口。', capabilities:['官方網站輔助搜尋','使用者分享網址'] },
  { code:'xiaohongshu', platform:'xiaohongshu', name:'小紅書', group:'viral_video', regions:['china_mainland','hong_kong'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供小紅書官方網站搜尋及使用者分享網址。', limitation:'未取得正式介面前不自動抓取平台內容。', capabilities:['官方網站輔助搜尋','使用者分享網址'] },
  { code:'bilibili', platform:'bilibili', name:'B站', group:'viral_video', regions:['china_mainland'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供B站官方搜尋及使用者分享網址。', limitation:'沒有第二次可靠快照時不顯示爆紅增速。', capabilities:['官方網站輔助搜尋','使用者分享網址'] },
  { code:'google_trends', name:'Google熱門搜尋趨勢', group:'search_trend', regions:['taiwan','hong_kong','macau'], acquisitionMethod:'waiting_review', defaultState:'waiting_official_access', description:'等待Google官方API存取資格。', limitation:'不使用非官方端點或網頁爬蟲代替。', capabilities:['等待官方資格'] },
  { code:'google_news', name:'Google新聞', group:'search_trend', regions:['taiwan','hong_kong'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'只提供Google新聞官方網站輔助搜尋。', limitation:'新聞結果不是搜尋量，也不是影音觀看數。', capabilities:['官方網站輔助搜尋'] },
  { code:'youtube_search_trends', name:'YouTube搜尋趨勢', group:'search_trend', regions:['taiwan','hong_kong'], acquisitionMethod:'insufficient_evidence', defaultState:'unavailable', description:'暫時無法取得可靠的公開搜尋量。', limitation:'YouTube影片搜尋結果數不會冒充使用者搜尋量。', capabilities:['暫時無法取得'] },
  { code:'baidu_search_trends', name:'百度搜尋趨勢', group:'search_trend', regions:['macau'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供百度官方網站輔助搜尋。', limitation:'未取得正式資料介面前不建立自動搜尋量。', capabilities:['官方網站輔助搜尋'] },
  { code:'baidu_hot_search', name:'百度熱搜', group:'search_trend', regions:['china_mainland'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供百度熱搜官方網站輔助檢查。', limitation:'目前不自動抓取榜單。', capabilities:['官方網站輔助搜尋'] },
  { code:'baidu_index', name:'百度指數', group:'search_trend', regions:['china_mainland'], acquisitionMethod:'waiting_review', defaultState:'waiting_platform_permission', description:'等待百度正式資料權限。', limitation:'不使用登入Cookie或自動化登入取得資料。', capabilities:['等待平台權限'] },
  { code:'weibo_hot_search', name:'微博熱搜', group:'search_trend', regions:['china_mainland'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供微博官方熱搜頁輔助檢查。', limitation:'目前不自動抓取榜單。', capabilities:['官方網站輔助搜尋'] },
  { code:'douyin_hot_chart', name:'抖音熱榜', group:'search_trend', regions:['china_mainland'], acquisitionMethod:'official_site_assisted', defaultState:'official_site_assisted', description:'提供抖音官方網站熱榜輔助檢查。', limitation:'人工確認不得偽裝成官方API自動取得。', capabilities:['官方網站輔助搜尋'] },
  { code:'gdelt', name:'GDELT全球新聞資料', group:'news_evidence', regions:allRegions, acquisitionMethod:'public_news', defaultState:'enabled', description:'作為新聞快速增加與事件討論的額外佐證來源。', limitation:'新聞篇數不會當成搜尋量、觀看數、按讚或留言。', capabilities:['公開新聞索引','不保存新聞全文'] },
  { code:'taiwan_news_rss', name:'台灣可信新聞RSS', group:'news_evidence', regions:['taiwan'], acquisitionMethod:'insufficient_evidence', defaultState:'disabled', description:'尚未建立正式可信來源白名單。', limitation:'確認授權與來源清單後才會啟用。', capabilities:['暫時無法取得'] },
  { code:'trusted_news', name:'地區可信新聞來源', group:'news_evidence', regions:['macau'], acquisitionMethod:'insufficient_evidence', defaultState:'disabled', description:'尚未建立澳門可信新聞來源白名單。', limitation:'不得保存或轉載完整新聞全文。', capabilities:['暫時無法取得'] },
  { code:'web_search', name:'合法搜尋引擎輔助', group:'search_trend', regions:allRegions, acquisitionMethod:'search_engine_candidate', defaultState:'disabled', description:'只產生限定官方網域的搜尋入口。', limitation:'尚未啟用自動網頁搜尋，也不爬取搜尋結果頁。', capabilities:['官方網站輔助搜尋','自動搜尋尚未啟用'] },
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
