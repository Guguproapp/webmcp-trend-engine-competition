import { SOURCE_LABELS, type TrendCategory, type TrendSourcePlatform } from '../domain/TrendTopic';

export function publicTopicTitle(title: string) {
  return title
    .replace(/^Mock\s*測試｜/u, '')
    .replace(/\bAI\b\s*/gu, '人工智慧');
}

export function publicSourceTitle(title:string){return publicTopicTitle(title).replace(/｜(?:threads|youtube|google_trends|gdelt_news)\s*Mock\s*證據/gu,'｜來源證據');}

export function publicCategoryLabel(category: TrendCategory) {
  return category === '科技與AI' ? '科技與人工智慧' : category;
}

export function publicScoreVersionLabel(version: string) {
  return version === 'trend-score-v1.0.0' ? '熱點評分版本1.0.0' : version;
}

export function publicSortLabel(sort: string) {
  return ({
    score: '綜合分數', growth: '增長最快', heat: '目前最熱', newest: '最新出現',
    resonance: '社會共鳴最高', low_competition: '競爭較低', low_risk: '風險較低',
  } as Record<string, string>)[sort] ?? sort;
}

export function publicSourceEvidenceTitle(topicTitle: string, platform: TrendSourcePlatform) {
  return `${publicTopicTitle(topicTitle)}｜${SOURCE_LABELS[platform]}展示證據`;
}
