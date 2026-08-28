import type { TrendSourceProvider, TrendCollectionRequest } from '../application/TrendSourceProvider';
import type { NaturalPhenomenonEvidence, RawTrendSignal, TrendCategory, TrendSourcePlatform } from '../domain/TrendTopic';

type Metrics = [number, number, number, number, number, number, number, number, number, number];
interface MockTopicConfig {
  key: string; title: string; summary: string; category: TrendCategory; keywords: string[];
  platforms: TrendSourcePlatform[]; hoursAgo: number; metrics: Metrics;
  natural?: boolean; political?: boolean; naturalEvidence?: NaturalPhenomenonEvidence;
}

const allNaturalFalse: NaturalPhenomenonEvidence = { massDiscussion: true, emotionalResonance: false, crossPlatformRise: true, extendableAngles: false, beyondWeatherInformation: false };

export const MOCK_TOPIC_CONFIGS: MockTopicConfig[] = [
  { key:'subscription-fatigue', title:'Mock 測試｜訂閱服務悄悄漲價引發「訂閱疲勞」', summary:'消費者開始整理每月自動扣款，分享取消與降級經驗。', category:'生活消費', keywords:['訂閱','漲價','省錢'], platforms:['threads','youtube','google_trends','gdelt_news'], hoursAgo:.4, metrics:[95,96,93,92,95,96,22,8,80,95] },
  { key:'meeting-overload', title:'Mock 測試｜上班族挑戰「一天不開會」', summary:'冗長會議與深度工作衝突，形成大量職場共鳴。', category:'職場話題', keywords:['會議','上班族','效率'], platforms:['threads','youtube','authorized_account'], hoursAgo:.8, metrics:[91,94,96,88,92,95,25,10,72,92] },
  { key:'ai-voice-notes', title:'Mock 測試｜AI 語音筆記新功能快速擴散', summary:'使用者比較逐字稿、摘要與隱私差異，教學需求同步上升。', category:'科技與AI', keywords:['AI','語音筆記','摘要'], platforms:['threads','youtube','google_trends','competitor_tracking'], hoursAgo:.5, metrics:[94,98,86,95,96,90,30,14,84,94] },
  { key:'shrinkflation', title:'Mock 測試｜同價縮量的生活用品被集體比較', summary:'網友用舊包裝對照新規格，帶動價格透明討論。', category:'社會共鳴', keywords:['縮水式通膨','物價','比較'], platforms:['threads','youtube','gdelt_news'], hoursAgo:1.2, metrics:[92,91,94,87,90,98,28,12,68,93] },
  { key:'pet-commute', title:'Mock 測試｜寵物通勤包安全挑戰', summary:'飼主分享大眾運輸與機車移動的安全做法，實用性高。', category:'寵物', keywords:['寵物','通勤','安全'], platforms:['threads','youtube','google_trends'], hoursAgo:1.6, metrics:[88,92,90,86,89,94,18,9,76,90] },

  { key:'sleep-revenge', title:'Mock 測試｜報復性熬夜自救清單', summary:'上班族討論下班後捨不得睡的共同困擾與改善方法。', category:'健康生活', keywords:['熬夜','睡眠','上班族'], platforms:['threads','youtube','google_trends'], hoursAgo:2.2, metrics:[82,84,82,76,86,91,38,13,60,89] },
  { key:'family-screen-time', title:'Mock 測試｜家庭螢幕時間協議', summary:'家長與孩子共同制定手機使用規則，正反經驗快速增加。', category:'親子家庭', keywords:['親子','手機','螢幕時間'], platforms:['threads','youtube','gdelt_news'], hoursAgo:3, metrics:[79,86,84,74,82,92,35,18,64,86] },
  { key:'concert-queue', title:'Mock 測試｜演唱會排隊規則爭議', summary:'購票與入場體驗引發粉絲社群討論，但熱度生命週期偏短。', category:'娛樂話題', keywords:['演唱會','排隊','購票'], platforms:['threads','youtube','gdelt_news'], hoursAgo:1.8, metrics:[86,88,79,81,88,90,48,30,42,88] },
  { key:'lunch-price', title:'Mock 測試｜百元午餐消失感', summary:'外食族分享日常午餐價格變化與替代選擇。', category:'美食餐飲', keywords:['午餐','外食','物價'], platforms:['threads','google_trends','gdelt_news'], hoursAgo:4, metrics:[80,78,85,72,78,97,42,12,72,91] },
  { key:'festival-reuse', title:'Mock 測試｜節慶包裝二次利用挑戰', summary:'節慶後大量包材如何再利用，帶動生活創意分享。', category:'節慶事件', keywords:['節慶','包裝','環保'], platforms:['threads','youtube','competitor_tracking'], hoursAgo:5, metrics:[77,82,76,70,75,88,28,8,56,83] },

  { key:'delivery-fee', title:'Mock 測試｜外送費顯示方式爭議', summary:'消費者比較結帳前後價格，服務透明度成為焦點。', category:'爭議事件', keywords:['外送','費用','透明'], platforms:['threads','youtube','gdelt_news'], hoursAgo:6, metrics:[72,66,76,64,70,92,54,38,48,84] },
  { key:'shared-fridge', title:'Mock 測試｜辦公室共享冰箱禮儀', summary:'食物標示、過期清理與氣味問題形成輕量職場共鳴。', category:'職場話題', keywords:['辦公室','冰箱','禮儀'], platforms:['threads','authorized_account'], hoursAgo:8, metrics:[64,62,72,55,68,86,30,10,52,76] },
  { key:'secondhand-gift', title:'Mock 測試｜二手禮物能不能送', summary:'節省與心意的界線引起多方觀點，但成長速度普通。', category:'社會共鳴', keywords:['二手','送禮','價值觀'], platforms:['threads','youtube'], hoursAgo:10, metrics:[63,58,70,56,65,80,34,22,58,75] },
  { key:'digital-declutter', title:'Mock 測試｜手機照片斷捨離', summary:'大量照片與雲端空間焦慮，出現整理流程分享。', category:'其他', keywords:['照片','整理','雲端'], platforms:['threads','youtube'], hoursAgo:12, metrics:[61,60,64,54,62,82,36,8,66,78] },

  { key:'old-meme', title:'Mock 測試｜三年前迷因短暫回鍋', summary:'討論量有限且缺少延伸角度，預估很快衰退。', category:'娛樂話題', keywords:['迷因','懷舊'], platforms:['threads','competitor_tracking'], hoursAgo:36, metrics:[44,34,38,32,38,60,72,12,18,68] },
  { key:'generic-water', title:'Mock 測試｜每天喝水八杯舊話題', summary:'內容高度重複，缺乏新證據與差異化。', category:'健康生活', keywords:['喝水','健康'], platforms:['youtube','competitor_tracking'], hoursAgo:60, metrics:[40,28,36,30,30,72,88,18,30,70] },
  { key:'expired-coupon', title:'Mock 測試｜已結束的限時優惠討論', summary:'活動已過期，剩餘搜尋與互動快速下降。', category:'生活消費', keywords:['優惠','過期'], platforms:['threads','gdelt_news'], hoursAgo:90, metrics:[32,18,30,26,18,80,76,8,6,82] },

  { key:'dangerous-challenge', title:'Mock 測試｜高風險模仿挑戰擴散', summary:'互動快速增加但可能造成身體傷害，必須獨立標示高風險。', category:'爭議事件', keywords:['挑戰','危險','模仿'], platforms:['threads','youtube','gdelt_news'], hoursAgo:1, metrics:[92,94,86,88,94,90,36,92,36,92] },
  { key:'unverified-rumor', title:'Mock 測試｜未查證名人傳聞快速擴散', summary:'來源互相引用且可能傷害當事人，不應因流量高而推薦。', category:'娛樂話題', keywords:['傳聞','未查證','名人'], platforms:['threads','youtube','gdelt_news'], hoursAgo:1.5, metrics:[94,90,78,86,92,82,44,88,28,80] },
  { key:'single-source-ai', title:'Mock 測試｜單一貼文宣稱 AI 神秘新功能', summary:'只有一筆來源且無官方佐證，必須標示證據不足。', category:'科技與AI', keywords:['AI','新功能','未證實'], platforms:['threads'], hoursAgo:.3, metrics:[90,96,82,25,96,74,18,16,48,25] },

  { key:'heavy-rain-info', title:'Mock 測試｜豪雨即時資訊大量轉貼', summary:'新聞量高但主要是氣象與交通資訊，缺少情緒共鳴與延伸角度。', category:'其他', keywords:['豪雨','天氣','交通'], platforms:['threads','gdelt_news','google_trends'], hoursAgo:.4, metrics:[96,90,42,76,96,98,18,24,18,91], natural:true, naturalEvidence:allNaturalFalse },
  { key:'earthquake-info', title:'Mock 測試｜地震速報搜尋瞬間上升', summary:'瞬時搜尋很高，但內容以速報為主且生命週期極短。', category:'其他', keywords:['地震','速報','自然災害'], platforms:['threads','gdelt_news','google_trends','youtube'], hoursAgo:.2, metrics:[99,98,38,88,99,99,20,36,8,94], natural:true, naturalEvidence:{...allNaturalFalse, emotionalResonance:true} },
];

const providerNames = ['Threads Keyword Search API', 'YouTube Data API', 'Google Trends', 'GDELT全球新聞資料', '客戶授權帳號資料', '競爭者與關鍵字追蹤'];
const isoHoursAgo = (base: Date, hours: number) => new Date(base.getTime() - hours * 3600000).toISOString();

export class MockTrendSourceProvider implements TrendSourceProvider {
  async collectSignals(request: TrendCollectionRequest): Promise<RawTrendSignal[]> {
    const base = new Date(request.refreshedAt);
    return MOCK_TOPIC_CONFIGS.flatMap((config) => config.platforms.map((platform, index) => {
      const [currentHeat, growthRate, socialResonance, crossPlatformResonance, freshness, taiwanRelevance, competitionSaturation, riskScore, estimatedLifeHours, sourceConfidence] = config.metrics;
      const discoveredAt = isoHoursAgo(base, config.hoursAgo + index * .08);
      const publishedAt = isoHoursAgo(base, config.hoursAgo + .5 + index * .2);
      return {
        canonicalKey: config.key, title: config.title, summary: config.summary, category: config.category, keywords: config.keywords,
        sourceItem: {
          id:`mock-${config.key}-${platform}`, platform, title:`${config.title}｜${platform} Mock 證據`, publisher:'展示發布者', discoveredAt, publishedAt, fetchedAt:base.toISOString(),
          viewCount:platform==='youtube'?Math.round(currentHeat * (850 + index * 240)):null, likeCount:null, commentCount:null,
          reportCount:platform==='gdelt_news'?index+1:null, engagementCount:Math.round(currentHeat * (850 + index * 240)), growthDelta:growthRate - 40 + index * 2, growthStatus:'measured',
          isMock:true, confidence:Math.max(10, sourceConfidence - index * 2), originalUrl:`https://example.invalid/mock/${config.key}/${platform}`,
          heatHistory:[6,4,2,0].map((hours, pointIndex) => ({ at:isoHoursAgo(base, config.hoursAgo + hours), value:Math.max(1, Math.round(currentHeat - growthRate * .12 * (3 - pointIndex))) })),
        },
        currentHeat, growthRate, growthStatus:'measured', freshness, crossPlatformResonance, socialResonance, taiwanRelevance,
        competitionSaturation, riskScore, estimatedLifeHours, sourceConfidence, businessOpportunity:null,
        isNaturalDisaster:Boolean(config.natural), isPolitical:Boolean(config.political), naturalEvidence:config.naturalEvidence,
      } satisfies RawTrendSignal;
    }));
  }
  async searchSignals(query: string, request: TrendCollectionRequest) {
    const normalized = query.toLocaleLowerCase('zh-TW');
    return (await this.collectSignals(request)).filter((item) => `${item.title} ${item.summary} ${item.keywords.join(' ')}`.toLocaleLowerCase('zh-TW').includes(normalized));
  }
  getProviderNames() { return [...providerNames]; }
}
