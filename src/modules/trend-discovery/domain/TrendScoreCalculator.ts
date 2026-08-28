import type { RawTrendSignal, TrendScoreComponent, TrendScoreResult, TrendStatus, TrendTier } from './TrendTopic';

export const TREND_SCORE_VERSION = 'trend-score-v1.0.0';
export const DEFAULT_TREND_WEIGHTS = {
  currentHeat: 0.20, growthRate: 0.25, socialResonance: 0.15, crossPlatformResonance: 0.15,
  freshness: 0.10, taiwanRelevance: 0.10, estimatedLifeHours: 0.05,
  competitionPenaltyMax: 10, riskPenaltyMax: 20, confidencePenaltyMax: 15,
} as const;
export type TrendWeights = typeof DEFAULT_TREND_WEIGHTS;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const lifespanScore = (hours: number) => clamp((hours / 96) * 100);

export class TrendScoreCalculator {
  constructor(private readonly weights: TrendWeights = DEFAULT_TREND_WEIGHTS) {}

  calculate(input: RawTrendSignal, now = new Date()): TrendScoreResult {
    const fields: Array<[keyof TrendWeights, string, number]> = [
      ['currentHeat', '目前熱度', input.currentHeat], ['growthRate', '熱度增速', input.growthRate],
      ['socialResonance', '社會共鳴', input.socialResonance], ['crossPlatformResonance', '跨平台共振', input.crossPlatformResonance],
      ['freshness', '新鮮度', input.freshness], ['taiwanRelevance', '台灣相關性', input.taiwanRelevance],
      ['estimatedLifeHours', '預估生命週期', lifespanScore(input.estimatedLifeHours)],
    ];
    const components: TrendScoreComponent[] = fields.map(([key, label, value]) => ({
      key, label, rawValue: Math.round(value), weight: this.weights[key] as number,
      points: Number((clamp(value) * (this.weights[key] as number)).toFixed(2)),
    }));
    const base = components.reduce((sum, item) => sum + item.points, 0);
    const competitionPenalty = clamp(input.competitionSaturation) / 100 * this.weights.competitionPenaltyMax;
    const riskPenalty = clamp(input.riskScore) / 100 * this.weights.riskPenaltyMax;
    const confidencePenalty = (100 - clamp(input.sourceConfidence)) / 100 * this.weights.confidencePenaltyMax;
    const deductionReasons: string[] = [];
    if (competitionPenalty >= 3) deductionReasons.push(`競爭飽和扣 ${competitionPenalty.toFixed(1)} 分`);
    if (riskPenalty >= 3) deductionReasons.push(`內容風險扣 ${riskPenalty.toFixed(1)} 分`);
    if (confidencePenalty >= 3) deductionReasons.push(`資料信心不足扣 ${confidencePenalty.toFixed(1)} 分`);
    const missingData: string[] = [];
    if (input.sourceConfidence < 45) missingData.push('來源信心低於 45%');
    const naturalChecks = input.naturalEvidence ? Object.values(input.naturalEvidence) : [];
    const naturalEligible = !input.isNaturalDisaster || (naturalChecks.length === 5 && naturalChecks.every(Boolean));
    if (input.isNaturalDisaster && !naturalEligible) deductionReasons.push('自然現象未通過社會討論、情緒共鳴、跨平台、延伸角度及非純氣象五項門檻');
    let totalScore = Math.round(Math.max(0, base - competitionPenalty - riskPenalty - confidencePenalty));
    if (!naturalEligible) totalScore = Math.min(totalScore, 49);
    const insufficient = input.sourceConfidence < 45;
    if (insufficient) totalScore = Math.min(totalScore, 49);
    const tier: TrendTier = totalScore >= 80 ? 'viral' : totalScore >= 65 ? 'rising' : totalScore >= 50 ? 'observe' : 'not_recommended';
    let recommendedStatus: TrendStatus = totalScore >= 80 ? 'high_potential' : 'candidate';
    if (input.riskScore >= 70) recommendedStatus = 'high_risk';
    if (insufficient) recommendedStatus = 'insufficient_evidence';
    const bonusReasons = components.filter((item) => item.rawValue >= 80).map((item) => `${item.label}表現突出（${item.rawValue}）`);
    return { totalScore, tier, recommendedStatus, components, bonusReasons, deductionReasons, missingData, scoreVersion: TREND_SCORE_VERSION, calculatedAt: now.toISOString() };
  }
  getWeights() { return { ...this.weights }; }
}
