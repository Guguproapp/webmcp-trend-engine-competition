import { TrendScoreCalculator } from '../../src/modules/trend-discovery/domain/TrendScoreCalculator';
import type { NaturalPhenomenonEvidence, RawTrendSignal, TrendCategory, TrendGrowthStatus, TrendHeatPoint, TrendSourceItem, TrendTopic } from '../../src/modules/trend-discovery/domain/TrendTopic';
import type { RealSourceRecord } from './providers';

export interface PreviousTopicSnapshot {
  topicId: string;
  capturedAt: string;
  reportCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  heatValue: number;
}

export interface TopicBuildResult { topics: TrendTopic[]; signalTopicIds: Map<string, string>; }

const stopWords = new Set(['快訊','最新','獨家','影音','圖','有片','新聞','台灣','今日','今天','表示','報導','消息','即時','生活','綜合','要聞','財經','政治','焦點','國際','職場達人','專題周報','taipei','times']);
const naturalWords = /豪雨|颱風|地震|雷雨|氣象|淹水|洪災|洪水|天氣|低壓|高溫|寒流/u;
const politicalWords = /總統|立法院|立委|政黨|選舉|罷免|行政院|國防|兩岸|政黨/u;
const riskWords = /死亡|傷亡|暴力|危險|自殺|色情|詐騙|未查證|傳聞|攻擊|戰爭/u;

export function normalizeTrendTitle(title: string) {
  return title.normalize('NFKC').replace(/^(快訊|獨家|最新|有片|影音)\s*[：:》｜|-]?\s*/gu, '').replace(/[｜|][-–—]?\s*[^｜|]{0,14}$/u, '').replace(/[\p{P}\p{S}\s]+/gu, '').toLocaleLowerCase('zh-TW');
}

export function trendTokens(title: string) {
  const normalized = title.normalize('NFKC').replace(/[\p{P}\p{S}]/gu, ' ');
  const tokens = new Set<string>();
  for (const chunk of normalized.match(/[\p{Script=Han}]{2,}|[A-Za-z0-9]{3,}/gu) ?? []) {
    const lowerChunk = chunk.toLocaleLowerCase('zh-TW');
    if (stopWords.has(chunk) || stopWords.has(lowerChunk)) continue;
    if (/^[\p{Script=Han}]+$/u.test(chunk)) {
      if (chunk.length <= 4) tokens.add(chunk);
      for (let index = 0; index < chunk.length - 1; index += 1) {
        const pair = chunk.slice(index, index + 2);
        if (!stopWords.has(pair)) tokens.add(pair);
      }
    } else tokens.add(lowerChunk);
  }
  return tokens;
}

export function titleSimilarity(left: string, right: string) {
  const a = trendTokens(left); const b = trendTokens(right);
  return tokenSetSimilarity(a,b);
}

function tokenSetSimilarity(a:Set<string>,b:Set<string>) {
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(a.size, b.size);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.codePointAt(0) ?? 0; hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

function classify(title: string): TrendCategory {
  if (/人工智慧|\bAI\b|晶片|科技|軟體|手機|蘋果|Google|YouTube/iu.test(title)) return '科技與AI';
  if (/股價|物價|價格|消費|漲價|優惠|房價|租金|財經/u.test(title)) return '生活消費';
  if (/職場|上班|勞工|薪資|公司|就業/u.test(title)) return '職場話題';
  if (/電影|演唱會|藝人|娛樂|影集|音樂/u.test(title)) return '娛樂話題';
  if (/家長|孩子|兒童|家庭|婚育|少子/u.test(title)) return '親子家庭';
  if (/健康|醫療|疾病|睡眠|運動|飲食/u.test(title)) return '健康生活';
  if (/餐廳|美食|午餐|咖啡|料理|食品/u.test(title)) return '美食餐飲';
  if (/寵物|貓|狗|動物/u.test(title)) return '寵物';
  if (/節慶|中秋|春節|端午|活動/u.test(title)) return '節慶事件';
  if (/爭議|詐騙|衝突|抗議|批評/u.test(title)) return '爭議事件';
  return '社會共鳴';
}

function freshnessScore(publishedAt: string, now: Date) { return Math.max(0, Math.round(100 - (now.getTime() - new Date(publishedAt).getTime()) / 864000)); }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function sum(records: RealSourceRecord[], field: 'viewCount'|'likeCount'|'commentCount') { return records.reduce((total, record) => total + (record[field] ?? 0), 0); }

export function clusterSourceRecords(records: RealSourceRecord[]) {
  const unique = [...new Map(records.map((record) => [`${record.provider}:${record.originalId}`, record])).values()]
    .sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime())
    .map((record)=>({record,tokens:trendTokens(record.title)}));
  const clusters: Array<{records:RealSourceRecord[];anchorTokens:Set<string>}> = [];
  for (const entry of unique) {
    const match = clusters.find((cluster) => {
      const anchor = cluster.records[0];
      const timeDistance = Math.abs(new Date(anchor.publishedAt).getTime()-new Date(entry.record.publishedAt).getTime());
      return timeDistance <= 36*3600000 && tokenSetSimilarity(cluster.anchorTokens,entry.tokens) >= 0.42;
    });
    if (match) match.records.push(entry.record); else clusters.push({records:[entry.record],anchorTokens:entry.tokens});
  }
  const sortedClusters = clusters.map((cluster)=>cluster.records)
    .sort((a,b)=>b.length-a.length || new Date(b[0].publishedAt).getTime()-new Date(a[0].publishedAt).getTime());
  const selected: RealSourceRecord[][] = [];
  const include = (cluster: RealSourceRecord[] | undefined) => {
    if (cluster && !selected.includes(cluster) && selected.length < 30) selected.push(cluster);
  };
  const providers = new Set(sortedClusters.flatMap((cluster)=>cluster.map((record)=>record.provider)));
  providers.forEach((provider)=>include(sortedClusters.find((cluster)=>cluster.some((record)=>record.provider===provider))));
  sortedClusters.forEach(include);
  return selected;
}

function sourceItem(record: RealSourceRecord, topicReportCount: number, growth: number | null, growthStatus: TrendGrowthStatus, confidence: number, history: TrendHeatPoint[]): TrendSourceItem {
  return {
    id:`signal-${stableHash(`${record.provider}:${record.originalId}`)}`, platform:record.provider==='gdelt'?'gdelt_news':'youtube', title:record.title,
    publisher:record.publisher, discoveredAt:record.fetchedAt, publishedAt:record.publishedAt, fetchedAt:record.fetchedAt,
    viewCount:record.viewCount, likeCount:record.likeCount, commentCount:record.commentCount, reportCount:record.provider==='gdelt'?topicReportCount:null,
    engagementCount:record.provider==='youtube'?(record.viewCount ?? 0)+(record.likeCount ?? 0)+(record.commentCount ?? 0):null,
    growthDelta:growth, growthStatus, isMock:false, confidence, originalUrl:record.url, heatHistory:history,
  };
}

export function buildTrendTopics(records: RealSourceRecord[], previous: Map<string, PreviousTopicSnapshot>, now = new Date()): TopicBuildResult {
  const clusters = clusterSourceRecords(records);
  const maxReports = Math.max(1, ...clusters.map((cluster)=>cluster.filter((record)=>record.provider==='gdelt').length));
  const maxViews = Math.max(1, ...clusters.map((cluster)=>sum(cluster,'viewCount')));
  const calculator = new TrendScoreCalculator();
  const signalTopicIds = new Map<string,string>();
  const topics = clusters.map((cluster): TrendTopic => {
    const normalized = normalizeTrendTitle(cluster[0].title);
    const canonicalKey = `${stableHash(normalized)}-${normalized.slice(0,12)}`;
    const id = `trend-${stableHash(canonicalKey)}`;
    const prior = previous.get(id);
    const reports = cluster.filter((record)=>record.provider==='gdelt').length;
    const views = sum(cluster,'viewCount'); const likes = sum(cluster,'likeCount'); const comments = sum(cluster,'commentCount');
    const providers = new Set(cluster.map((record)=>record.provider));
    const activity = reports + Math.log10(views + 1) * 3 + Math.log10(likes + comments + 1) * 2;
    const previousActivity = prior ? prior.reportCount + Math.log10(prior.viewCount + 1) * 3 + Math.log10(prior.likeCount + prior.commentCount + 1) * 2 : 0;
    const growthStatus: TrendGrowthStatus = prior ? 'measured' : 'baseline_pending';
    const elapsedHours = prior ? Math.max((now.getTime()-new Date(prior.capturedAt).getTime())/3600000,0.25) : 1;
    const growthRate = prior ? clamp((((activity-previousActivity)/Math.max(previousActivity,1))*100)/elapsedHours) : 0;
    const currentHeat = clamp((reports/maxReports)*65 + (views/maxViews)*35);
    const newestPublished = cluster.map((record)=>record.publishedAt).sort().at(-1)!;
    const freshness = freshnessScore(newestPublished,now);
    const uniquePublishers = new Set(cluster.map((record)=>record.publisher)).size;
    const completeness = cluster.filter((record)=>record.title&&record.publisher&&record.url&&record.publishedAt).length/cluster.length;
    const sourceConfidence = clamp((prior?18:0) + Math.min(28,uniquePublishers*7) + Math.min(18,cluster.length*4) + completeness*20 + (providers.size>1?16:0));
    const taiwanRelevance = clamp(55 + cluster.filter((record)=>record.sourceCountry.toLocaleLowerCase().includes('taiwan')).length/cluster.length*30 + cluster.filter((record)=>/Chinese|zh-Hant/iu.test(record.language)).length/cluster.length*15);
    const socialResonance = cluster.some((record)=>record.provider==='youtube') ? clamp(Math.log10(likes+comments+1)*22) : 0;
    const crossPlatformResonance = providers.size > 1 ? clamp(55+providers.size*20) : 0;
    const competitionSaturation = clamp((cluster.length/clusters.reduce((sumValue,item)=>sumValue+item.length,0))*500);
    const titleText = cluster.map((record)=>record.title).join(' ');
    const riskScore = clamp((riskWords.test(titleText)?72:12)+(politicalWords.test(titleText)?12:0));
    const isNaturalDisaster = naturalWords.test(titleText);
    const isPolitical = politicalWords.test(titleText);
    const naturalEvidence: NaturalPhenomenonEvidence | undefined = isNaturalDisaster ? { massDiscussion:cluster.length>=5, emotionalResonance:socialResonance>=60, crossPlatformRise:providers.size>=2, extendableAngles:false, beyondWeatherInformation:false } : undefined;
    const history: TrendHeatPoint[] = prior ? [{at:prior.capturedAt,value:prior.heatValue},{at:now.toISOString(),value:currentHeat}] : [{at:now.toISOString(),value:currentHeat}];
    const sourceItems = cluster.map((record)=>sourceItem(record,reports,prior?growthRate:null,growthStatus,sourceConfidence,history));
    const keywords = [...trendTokens(cluster[0].title)].slice(0,8);
    const raw: RawTrendSignal = {
      canonicalKey,title:cluster[0].title,summary:`已彙整 ${cluster.length} 筆可追溯來源，包含 ${uniquePublishers} 個發布者。`,category:classify(titleText),keywords,sourceItem:sourceItems[0],
      currentHeat,growthRate,growthStatus,freshness,crossPlatformResonance,socialResonance,taiwanRelevance,competitionSaturation,riskScore,
      estimatedLifeHours:Math.max(12,Math.round((freshness/100)*72)),sourceConfidence,businessOpportunity:null,isNaturalDisaster,isPolitical,naturalEvidence,
    };
    const score = calculator.calculate(raw,now);
    if (growthStatus==='baseline_pending') score.missingData.push('正在建立增速基準');
    if (providers.size<2) score.missingData.push('尚無跨來源證據');
    if (providers.size<2 || growthStatus==='baseline_pending') {
      score.totalScore=Math.min(score.totalScore,64); score.tier=score.totalScore>=50?'observe':'not_recommended';
      if (score.recommendedStatus!=='high_risk') score.recommendedStatus='insufficient_evidence';
    }
    sourceItems.forEach((item)=>signalTopicIds.set(item.id,id));
    return {
      id,canonicalKey,title:raw.title,summary:raw.summary,category:raw.category,keywords,sourceItems,sourcePlatforms:[...new Set(sourceItems.map((item)=>item.platform))],
      firstSeenAt:cluster.map((record)=>record.fetchedAt).sort()[0],lastSeenAt:cluster.map((record)=>record.fetchedAt).sort().at(-1)!,currentHeat,growthRate,growthStatus,
      freshness,crossPlatformResonance,socialResonance,taiwanRelevance,competitionSaturation,riskScore,estimatedLifeHours:raw.estimatedLifeHours,
      sourceConfidence,businessOpportunity:null,totalScore:score.totalScore,status:score.recommendedStatus,tier:score.tier,scoreVersion:score.scoreVersion,calculatedAt:score.calculatedAt,
      scoreDetails:score,isNaturalDisaster,isPolitical,naturalEvidence,
    };
  }).sort((a,b)=>b.totalScore-a.totalScore);
  return {topics,signalTopicIds};
}
