import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_TREND_FILTERS, type TrendFilters } from '../domain/TrendFilters';
import { SOURCE_LABELS, TREND_CATEGORIES, TREND_STATUS_LABELS, TREND_TIER_LABELS, type TrendTopic } from '../domain/TrendTopic';
import { EXCLUSION_REASONS, type ExclusionReason } from '../application/repositories';
import { formatDateTime } from './formatters';
import { getAdvancedFilterCount } from './TrendFilterUi';
import { publicCategoryLabel, publicTopicTitle } from './publicLabels';

export function TrendFilterPanel({ filters, onApply, onClear, onSave }: { filters: TrendFilters; onApply: (filters: TrendFilters) => void; onClear: () => void; onSave: (filters: TrendFilters) => void }) {
  const [draft, setDraft] = useState(filters);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const update = <K extends keyof TrendFilters>(key: K, value: TrendFilters[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const number = (key: keyof TrendFilters, label: string) => <label className="trend-filter-field"><span>{label}</span><input type="number" min="0" max="100" value={String(draft[key])} onChange={(event) => update(key, Number(event.target.value) as TrendFilters[typeof key])} /></label>;
  const advancedCount = getAdvancedFilterCount(draft);
  return <section className="trend-filter-panel" aria-label="熱門主題篩選器">
    <div className="trend-quick-filters">
      <label className="trend-search-field"><span>關鍵字</span><input aria-label="關鍵字搜尋" placeholder="搜尋主題、摘要或關鍵字" value={draft.query} onChange={(event) => update('query', event.target.value)} /></label>
      <label className="trend-filter-field"><span>分類</span><select value={draft.category} onChange={(event) => update('category', event.target.value as TrendFilters['category'])}><option value="all">全部分類</option>{TREND_CATEGORIES.map((category) => <option key={category} value={category}>{publicCategoryLabel(category)}</option>)}</select></label>
      <label className="trend-filter-field"><span>時間範圍</span><select value={draft.timeRangeHours} onChange={(event) => update('timeRangeHours', Number(event.target.value) as TrendFilters['timeRangeHours'])}><option value="1">最近 1 小時</option><option value="6">最近 6 小時</option><option value="24">最近 24 小時</option><option value="72">最近 3 天</option><option value="168">最近 7 天</option></select></label>
      <label className="trend-filter-field"><span>排序方式</span><select value={draft.sortBy} onChange={(event) => update('sortBy', event.target.value as TrendFilters['sortBy'])}><option value="score">綜合分數</option><option value="growth">增長最快</option><option value="heat">目前最熱</option><option value="newest">最新出現</option><option value="resonance">社會共鳴最高</option><option value="low_competition">競爭較低</option><option value="low_risk">風險較低</option></select></label>
    </div>
    <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="advanced-filters">
      <summary aria-expanded={advancedOpen}>{advancedCount ? `進階篩選（已啟用 ${advancedCount} 項）` : '進階篩選'}</summary>
      <div className="trend-filter-grid">
        <label className="trend-filter-field"><span>資料來源</span><select value={draft.source} onChange={(event) => update('source', event.target.value as TrendFilters['source'])}><option value="all">全部來源</option>{Object.entries(SOURCE_LABELS).map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        {number('minimumHeat','最低熱度')}{number('minimumGrowth','最低增速')}{number('minimumScore','最低總分')}{number('minimumTaiwanRelevance','最低台灣相關性')}
        <label className="trend-filter-field"><span>風險等級</span><select value={draft.riskLevel} onChange={(event) => update('riskLevel', event.target.value as TrendFilters['riskLevel'])}><option value="all">全部風險</option><option value="low">低風險</option><option value="medium">中風險</option><option value="high">高風險</option></select></label>
        <label className="trend-filter-field"><span>資料信心</span><select value={draft.confidenceLevel} onChange={(event) => update('confidenceLevel', event.target.value as TrendFilters['confidenceLevel'])}><option value="all">全部信心</option><option value="high">高（75%以上）</option><option value="medium">中（45～74%）</option><option value="low">低（44%以下）</option></select></label>
        <label className="trend-filter-field"><span>主題狀態</span><select value={draft.status} onChange={(event) => update('status', event.target.value as TrendFilters['status'])}><option value="all">全部狀態</option>{Object.entries(TREND_STATUS_LABELS).map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      </div>
      <div className="trend-check-grid">
        <Check label="只看跨平台" checked={draft.crossPlatformOnly} onChange={(value)=>update('crossPlatformOnly',value)} />
        <Check label="排除自然災害" checked={draft.excludeNaturalDisasters} onChange={(value)=>update('excludeNaturalDisasters',value)} />
        <Check label="排除政治" checked={draft.excludePolitics} onChange={(value)=>update('excludePolitics',value)} />
        <Check label="排除高風險內容" checked={draft.excludeHighRisk} onChange={(value)=>update('excludeHighRisk',value)} />
        <Check label="排除證據不足" checked={draft.excludeInsufficientEvidence} onChange={(value)=>update('excludeInsufficientEvidence',value)} />
      </div>
    </details>
    <div className="trend-filter-actions"><button type="button" className="button secondary small" onClick={() => { setDraft(DEFAULT_TREND_FILTERS); setAdvancedOpen(false); onClear(); }}>清除條件</button><button type="button" className="button secondary small" onClick={() => onSave(draft)}>儲存篩選規則</button><button type="button" className="button trend-primary small" onClick={() => onApply(draft)}>套用篩選</button></div>
  </section>;
}

function Check({ label, checked, onChange }: { label:string; checked:boolean; onChange:(value:boolean)=>void }) { return <label className="trend-check"><input type="checkbox" checked={checked} onChange={(event)=>onChange(event.target.checked)} />{label}</label>; }

export function TrendTopicCard({ topic, rank, watching, onWatch, onRemoveWatch, onExclude, onCancelExclude, excludedReason }: { topic:TrendTopic; rank?:number; watching:boolean; onWatch:()=>void; onRemoveWatch:()=>void; onExclude?:(reason:ExclusionReason)=>void; onCancelExclude?:()=>void; excludedReason?:string }) {
  const [reason, setReason] = useState<ExclusionReason | ''>('');
  const riskLabel = topic.riskScore >= 70 ? '高風險' : topic.riskScore >= 35 ? '中風險' : '低風險';
  const series = (topic.sourceItems[0]?.heatHistory ?? []).map((point)=>point.value);
  const trendSummary = series.length > 1 ? `熱度由 ${series[0]} 上升至 ${series.at(-1)}，目前增速 ${topic.growthRate}%` : `目前增速 ${topic.growthRate}%`;
  return <article className={`trend-topic-card tier-${topic.tier}`}>
    <div className="trend-card-top"><div className="trend-card-labels">{rank && rank <= 3 && <span className="rank-label">第 {rank} 名</span>}<span className="trend-category">{publicCategoryLabel(topic.category)}</span><span className={`trend-tier tier-label-${topic.tier}`}>{TREND_TIER_LABELS[topic.tier]}</span><span className="trend-growth-label">熱度增速 +{topic.growthRate}%</span>{watching && <span className="watching-flag">觀察中</span>}{topic.status === 'high_risk' && <span className="risk-flag">警告：高風險</span>}{topic.status === 'insufficient_evidence' && <span className="evidence-flag">證據不足</span>}<span className="mock-data-label">展示題目</span></div><ScoreRing score={topic.totalScore} /></div>
    <h2>{publicTopicTitle(topic.title)}</h2><p className="trend-summary">{topic.summary}</p>
    <div className="trend-card-actions"><Link className="button card-primary small" to={`/trends/${topic.id}`}>查看熱度證據</Link>{watching ? <button type="button" className="button secondary small" onClick={onRemoveWatch}>移出觀察</button> : <button type="button" className="button secondary small" onClick={onWatch}>加入觀察</button>}{onCancelExclude ? <button type="button" className="button danger-outline small" onClick={onCancelExclude}>取消排除</button> : onExclude && <details className="exclude-control"><summary>排除主題</summary><div><label><span className="sr-only">排除原因</span><select aria-label={`${publicTopicTitle(topic.title)} 排除原因`} value={reason} onChange={(event)=>setReason(event.target.value as ExclusionReason | '')}><option value="" disabled>請選擇排除原因</option>{EXCLUSION_REASONS.map((item)=><option key={item}>{item}</option>)}</select></label><button type="button" className="button danger small" disabled={!reason} onClick={()=>reason && onExclude(reason)}>確認排除</button></div></details>}</div>
    <div className="trend-primary-metrics"><Metric label="熱度增速" value={topic.growthRate} suffix="%" /><Metric label="社會共鳴" value={topic.socialResonance} /><Metric label="跨平台數" value={topic.sourcePlatforms.length} suffix=" 個" /><Metric label="風險" value={topic.riskScore} text={riskLabel} /></div>
    <TrendSparkline series={series} summary={trendSummary} />
    {excludedReason && <p className="excluded-reason">排除原因：{excludedReason}</p>}
    <details className="topic-more"><summary>查看更多資料</summary><div className="topic-more-content"><div className="trend-secondary-metrics"><Metric label="目前熱度" value={topic.currentHeat} /><Metric label="台灣相關" value={topic.taiwanRelevance} /><Metric label="資料信心" value={topic.sourceConfidence} suffix="%" /><Metric label="競爭飽和" value={topic.competitionSaturation} /></div><div className="trend-card-meta"><span>首次發現 {formatDateTime(topic.firstSeenAt)}</span><span>預估生命 {topic.estimatedLifeHours} 小時</span></div><div><strong className="source-heading">資料來源</strong><div className="trend-source-pills">{topic.sourcePlatforms.map((source)=><span key={source}>{SOURCE_LABELS[source]}</span>)}</div></div></div></details>
  </article>;
}

function ScoreRing({ score }: { score:number }) { return <div className="score-ring" role="img" aria-label={`綜合分數 ${score} 分，滿分 100 分`} style={{ '--score': score } as CSSProperties}><div><strong>{score}</strong><span>綜合分數</span></div></div>; }

function TrendSparkline({ series, summary }: { series:number[]; summary:string }) {
  if (!series.length) return <p className="trend-line-summary">趨勢資料不足；{summary}</p>;
  const width = 132; const height = 34; const min = Math.min(...series); const max = Math.max(...series); const range = Math.max(max-min, 1);
  const points = series.map((value,index)=>`${(index/(Math.max(series.length-1,1)))*width},${height-((value-min)/range)*(height-4)-2}`).join(' ');
  return <div className="trend-sparkline"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`熱度趨勢：${summary}`} focusable="false"><polyline points={points} /></svg><span>{summary}</span></div>;
}

function Metric({ label, value, suffix='', text }: { label:string; value:number; suffix?:string; text?:string }) { return <div><span>{label}</span><strong>{text ?? `${value}${suffix}`}</strong></div>; }
export function TrendPageEmpty({ title, description }: { title:string; description:string }) { return <section className="trend-empty"><span aria-hidden="true">◇</span><h1>{title}</h1><p>{description}</p><span className="coming-soon">尚未開放</span></section>; }
