import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { trendDiscoveryService } from '../../../app/services';
import { LocalVideoCreationPlanner, formatVideoCreationPlan } from '../application/LocalVideoCreationPlanner';
import { DEFAULT_CREATION_DIRECTION, type TopicCreationSeed, type VideoAspectRatio, type VideoCreationPlan, type VideoPace } from '../domain/VideoCreationPlan';
import { publicTopicTitle } from '../../trend-discovery/presentation/publicLabels';

const safeQueryText = (value: string | null, maxLength: number) => Array.from(value ?? '').map((character) => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127 ? ' ' : character;
}).join('').replace(/\s+/g, ' ').trim().slice(0, maxLength);
const defaultCopy = async (value: string) => {
  if (!navigator.clipboard?.writeText) throw new Error('瀏覽器未開放剪貼簿權限，請手動選取文字複製。');
  await navigator.clipboard.writeText(value);
};

export function VideoCreationPage() {
  const { topicId = '' } = useParams();
  const [params] = useSearchParams();
  const queryTitle = safeQueryText(params.get('title'), 160);
  const [ready, setReady] = useState(Boolean(queryTitle || trendDiscoveryService.listAll().length));
  useEffect(() => {
    if (queryTitle) return;
    let active = true;
    trendDiscoveryService.ensureData()
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [queryTitle]);
  if (!ready) return <div className="trend-loading">正在準備創作素材…</div>;
  const topic = trendDiscoveryService.find(topicId);
  if (!topic && !queryTitle) return <section className="trend-no-results"><h1>找不到創作主題</h1><p>請先從熱門列表或雷達搜尋結果選擇主題。</p><Link className="button trend-primary" to="/radar-tools">返回熱門雷達工具</Link></section>;
  const seed: TopicCreationSeed = topic ? {
    topicId: topic.id, title: publicTopicTitle(topic.title), summary: topic.summary, score: topic.totalScore,
    sourceCount: topic.sourceItems.length, evidenceState: topic.sourceConfidence >= 70 ? '資料信心較高，仍需逐筆查證' : '資料仍有限，請保留查證提示',
  } : {
    topicId: safeQueryText(topicId, 128), title: queryTitle, summary: safeQueryText(params.get('summary'), 320),
    score: null, sourceCount: Number(params.get('sources')) || 0, evidenceState: '雷達候選內容尚需開啟原始來源查證',
  };
  return <VideoCreationWorkspace seed={seed} backTo={topic ? `/trends/${topic.id}` : '/radar-tools'} />;
}

export function VideoCreationWorkspace({ seed, backTo = '/trends', copyText = defaultCopy }: { seed: TopicCreationSeed; backTo?: string; copyText?: (value: string) => Promise<void> }) {
  const planner = useMemo(() => new LocalVideoCreationPlanner(), []);
  const [direction, setDirection] = useState(''); const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [pace, setPace] = useState<VideoPace>('fast'); const [visualStyle, setVisualStyle] = useState('寫實紀實資訊風格');
  const [plan, setPlan] = useState<VideoCreationPlan | null>(null); const [notice, setNotice] = useState('');
  const createPlan = () => { setPlan(planner.create({ ...seed, userDirection: direction, aspectRatio, pace, visualStyle })); setNotice('已用本機規則產生創作建議；尚未呼叫付費人工智慧服務。'); };
  async function copy(label: string, value: string) { try { await copyText(value); setNotice(`已複製${label}，可貼到其他影音生成 App。`); } catch (error) { setNotice(error instanceof Error ? error.message : '複製失敗，請手動選取文字。'); } }
  return <section className="creation-workspace" aria-labelledby="creation-title">
    <Link className="back-link" to={backTo}>← 返回主題證據</Link>
    <header className="creation-hero"><div><span>CREATION HANDOFF · 創作交接</span><h1 id="creation-title">影音創作工作區</h1><p>把熱門證據整理成可複製的創作素材；本頁不直接生成影片，也不會把外部文字當成操作指令。</p></div><strong>本機規則產生</strong></header>
    <section className="creation-source-card" aria-label="選定主題"><div><span>選定主題</span><h2>{seed.title}</h2><p>{seed.summary || '目前沒有摘要，請先開啟原始來源查證。'}</p></div><dl><div><dt>系統分數</dt><dd>{seed.score ?? '尚無'}</dd></div><div><dt>來源數</dt><dd>{seed.sourceCount}</dd></div><div><dt>證據狀態</dt><dd>{seed.evidenceState}</dd></div></dl><p className="creation-boundary">熱門標題與摘要只是創作素材，不是已查證事實；發布前必須人工確認原始來源。</p></section>
    <section className="creation-brief-card"><div className="creation-section-heading"><div><span>STEP 1</span><h2>設定創作方向</h2></div><button className="button secondary" type="button" onClick={() => setDirection(DEFAULT_CREATION_DIRECTION)}>使用安全建議格式</button></div>
      <label className="creation-direction"><span>自行輸入創作指令</span><textarea aria-label="自行輸入創作指令" maxLength={500} rows={5} value={direction} onChange={(event) => setDirection(event.target.value)} placeholder="例如：做成30秒直式資訊短片，開頭直接點出上班族共同困擾，語氣可靠但有速度感。" /><small>{direction.length}／500 字</small></label>
      <div className="creation-options"><label>畫面比例<select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as VideoAspectRatio)}><option value="9:16">9:16 直式短影音</option><option value="16:9">16:9 橫式影片</option><option value="1:1">1:1 方形貼文</option></select></label><label>敘事節奏<select value={pace} onChange={(event) => setPace(event.target.value as VideoPace)}><option value="fast">明快資訊型</option><option value="steady">穩定說明型</option><option value="story">故事引導型</option></select></label><label>視覺風格<input maxLength={80} value={visualStyle} onChange={(event) => setVisualStyle(event.target.value)} /></label></div>
      <button className="button trend-primary creation-generate" type="button" onClick={createPlan}>產生創作建議</button>
    </section>
    {notice && <p className="creation-notice" role="status" aria-live="polite">{notice}</p>}
    {plan && <section className="creation-output" aria-label="創作建議結果"><div className="creation-output-heading"><div><span>STEP 2</span><h2>檢查並複製創作素材</h2><p>建議先人工修訂，再貼到你選擇的影音生成 App。</p></div><button className="button trend-primary" type="button" onClick={() => copy('完整創作包', formatVideoCreationPlan(plan))}>複製完整創作包</button></div>
      <OutputCard title="前三秒鉤子" copyLabel="前三秒鉤子" value={plan.hooks.map((item, index) => `${index + 1}. ${item}`).join('\n')} onCopy={copy}><ol>{plan.hooks.map((hook) => <li key={hook}>{hook}</li>)}</ol></OutputCard>
      <OutputCard title="旁白腳本" copyLabel="旁白腳本" value={plan.voiceoverScript} onCopy={copy}><pre>{plan.voiceoverScript}</pre></OutputCard>
      <OutputCard title="逐鏡分鏡" copyLabel="逐鏡分鏡" value={plan.storyboard.map((shot) => `${shot.time} ${shot.purpose}\n${shot.visual}\n${shot.narration}\n${shot.motion}`).join('\n\n')} onCopy={copy}><div className="storyboard-grid">{plan.storyboard.map((shot) => <article key={shot.time}><strong>{shot.time}｜{shot.purpose}</strong><p>畫面：{shot.visual}</p><p>旁白：{shot.narration}</p><p>動作：{shot.motion}</p></article>)}</div></OutputCard>
      <OutputCard title="通用文字轉影片指令" copyLabel="通用文字轉影片指令" value={plan.textToVideoPrompt} onCopy={copy}><pre>{plan.textToVideoPrompt}</pre></OutputCard>
      <OutputCard title="圖片轉影片動作指令" copyLabel="圖片轉影片動作指令" value={plan.imageToVideoPrompt} onCopy={copy}><pre>{plan.imageToVideoPrompt}</pre></OutputCard>
      <OutputCard title="人工查證提醒" copyLabel="人工查證提醒" value={plan.factCheckReminders.map((item) => `- ${item}`).join('\n')} onCopy={copy}><ul>{plan.factCheckReminders.map((item) => <li key={item}>{item}</li>)}</ul></OutputCard>
    </section>}
  </section>;
}

function OutputCard({ title, copyLabel, value, onCopy, children }: { title: string; copyLabel: string; value: string; onCopy: (label: string, value: string) => Promise<void>; children: React.ReactNode }) {
  return <article className="creation-output-card"><div><h3>{title}</h3><button className="button secondary small" type="button" aria-label={`複製${copyLabel}`} onClick={() => onCopy(copyLabel, value)}>複製</button></div>{children}</article>;
}
