import { filterAndSortTopics, DEFAULT_TREND_FILTERS } from '../domain/TrendFilters';
import { TrendScoreCalculator } from '../domain/TrendScoreCalculator';
import { mergeTrendSignals } from '../application/TrendDiscoveryService';
import { MockTrendSourceProvider } from '../infrastructure/MockTrendSourceProvider';

async function topics(){ const now=new Date(); const signals=await new MockTrendSourceProvider().collectSignals({refreshedAt:now.toISOString()}); return {now,topics:mergeTrendSignals(signals,new TrendScoreCalculator(),now)}; }
describe('搜尋、篩選與排序',()=>{
  it('關鍵字搜尋標題、摘要與keywords',async()=>{ const data=await topics(); const result=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,query:'語音筆記'},data.now); expect(result).toHaveLength(1); expect(result[0].canonicalKey).toBe('ai-voice-notes'); });
  it('分類與來源篩選',async()=>{ const data=await topics(); const category=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,category:'寵物'},data.now); expect(category.every((item)=>item.category==='寵物')).toBe(true); const source=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,source:'google_trends'},data.now); expect(source.every((item)=>item.sourcePlatforms.includes('google_trends'))).toBe(true); });
  it('時間、分數與跨平台篩選',async()=>{ const data=await topics(); const result=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,timeRangeHours:6,minimumScore:65,crossPlatformOnly:true},data.now); expect(result.every((item)=>new Date(item.lastSeenAt).getTime()>=data.now.getTime()-21600000&&item.totalScore>=65&&item.sourcePlatforms.length>=2)).toBe(true); });
  it('支援七種排序',async()=>{ const data=await topics(); const growth=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,sortBy:'growth'},data.now); expect(growth[0].growthRate).toBeGreaterThanOrEqual(growth[1].growthRate); const risk=filterAndSortTopics(data.topics,{...DEFAULT_TREND_FILTERS,sortBy:'low_risk'},data.now); expect(risk[0].riskScore).toBeLessThanOrEqual(risk[1].riskScore); });
});
