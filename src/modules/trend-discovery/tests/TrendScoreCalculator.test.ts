import { DEFAULT_TREND_WEIGHTS, TrendScoreCalculator } from '../domain/TrendScoreCalculator';
import type { RawTrendSignal } from '../domain/TrendTopic';

function signal(overrides: Partial<RawTrendSignal> = {}): RawTrendSignal {
  const now = new Date().toISOString();
  return { canonicalKey:'test', title:'Mock 測試', summary:'測試', category:'科技與AI', keywords:['測試'],
    sourceItem:{id:'source',platform:'threads',title:'Mock',publisher:'測試來源',discoveredAt:now,publishedAt:now,fetchedAt:now,viewCount:null,likeCount:null,commentCount:null,reportCount:null,engagementCount:1000,growthDelta:50,growthStatus:'measured',isMock:true,confidence:90,originalUrl:'https://example.invalid',heatHistory:[]},
    currentHeat:90,growthRate:90,growthStatus:'measured',freshness:90,crossPlatformResonance:90,socialResonance:90,taiwanRelevance:90,
    competitionSaturation:10,riskScore:10,estimatedLifeHours:72,sourceConfidence:90,businessOpportunity:null,isNaturalDisaster:false,isPolitical:false,...overrides };
}

describe('TrendScoreCalculator',()=>{
  it('集中提供指定權重並計算100分制子分數',()=>{ const calculator=new TrendScoreCalculator(); expect(calculator.getWeights()).toEqual(DEFAULT_TREND_WEIGHTS); const result=calculator.calculate(signal()); expect(result.components).toHaveLength(7); expect(result.totalScore).toBeGreaterThanOrEqual(80); expect(result.tier).toBe('viral'); });
  it('競爭飽和會最高扣10分',()=>{ const calculator=new TrendScoreCalculator(); const low=calculator.calculate(signal({competitionSaturation:0})); const high=calculator.calculate(signal({competitionSaturation:100})); expect(low.totalScore-high.totalScore).toBe(10); expect(high.deductionReasons.join(' ')).toContain('競爭飽和'); });
  it('風險會最高扣20分且高風險獨立標示',()=>{ const calculator=new TrendScoreCalculator(); const low=calculator.calculate(signal({riskScore:0})); const high=calculator.calculate(signal({riskScore:100})); expect(low.totalScore-high.totalScore).toBe(20); expect(high.recommendedStatus).toBe('high_risk'); });
  it('資料信心不足會扣分、限制高分並標示證據不足',()=>{ const result=new TrendScoreCalculator().calculate(signal({sourceConfidence:20})); expect(result.totalScore).toBeLessThanOrEqual(49); expect(result.recommendedStatus).toBe('insufficient_evidence'); expect(result.missingData).toContain('來源信心低於 45%'); });
  it('自然災害未通過五項門檻不會因熱度高進入高潛力',()=>{ const result=new TrendScoreCalculator().calculate(signal({isNaturalDisaster:true,currentHeat:100,growthRate:100,naturalEvidence:{massDiscussion:true,emotionalResonance:false,crossPlatformRise:true,extendableAngles:false,beyondWeatherInformation:false}})); expect(result.totalScore).toBeLessThanOrEqual(49); expect(result.tier).toBe('not_recommended'); });
});
