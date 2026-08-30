import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { humanConfirmationCoordinator, webMcpActivityStore, webMcpToolDefinitions } from '../../../app/services';
import { registerWebMcpTools } from '../infrastructure/registerWebMcpTools';

const toolLabels: Record<string, string> = {
  search_trends: '搜尋熱門 / Search trends', get_trend_evidence: '取得證據 / Get evidence', get_source_status: '來源狀態 / Source status',
  add_trend_to_watchlist: '加入觀察 / Add watch', exclude_trend: '排除主題 / Exclude trend',
};

export function AgentWorkspacePage() {
  const [nativeStatus, setNativeStatus] = useState<'checking' | 'supported' | 'unsupported' | 'failed'>('checking');
  const [activity, setActivity] = useState(() => webMcpActivityStore.getSnapshot());
  const [confirmation, setConfirmation] = useState(() => humanConfirmationCoordinator.getState());
  const confirmButton = useRef<HTMLButtonElement>(null); const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const unsubscribeActivity = webMcpActivityStore.subscribe(() => setActivity(webMcpActivityStore.getSnapshot()));
    const unsubscribeConfirmation = humanConfirmationCoordinator.subscribe(() => setConfirmation(humanConfirmationCoordinator.getState()));
    let active = true; let unregister: () => void = () => undefined;
    registerWebMcpTools({ document, tools: webMcpToolDefinitions }).then((result) => {
      if (!active) { result.unregister(); return; }
      unregister = result.unregister; setNativeStatus(result.supported ? 'supported' : 'unsupported');
    }).catch(() => { if (active) setNativeStatus('failed'); });
    return () => { active = false; unregister(); humanConfirmationCoordinator.abortPending(); unsubscribeActivity(); unsubscribeConfirmation(); };
  }, []);

  useEffect(() => { if (confirmation.status === 'pending') confirmButton.current?.focus(); }, [confirmation.status]);
  const pending = confirmation.status === 'pending' ? confirmation.operation : null;
  const evidenceSources = Array.isArray(activity.evidence?.official_source_data) ? activity.evidence.official_source_data as Array<Record<string, unknown>> : [];

  async function undo() { if (!confirmation.operation) return; await humanConfirmationCoordinator.undo(confirmation.operation.id); heading.current?.focus(); }

  return <section className="agent-workspace" aria-labelledby="agent-workspace-title">
    <div className="agent-workspace-hero"><div><span className="workspace-kicker">Human-in-the-loop WebMCP</span><h1 id="agent-workspace-title" ref={heading} tabIndex={-1}>代理協作工作區 <small>Agent Workspace</small></h1><p>代理負責搜尋與整理；加入觀察或排除主題，一定要由真人在此確認。</p></div><Link className="button secondary" to="/trends">前往熱門精選</Link></div>

    <div className="workspace-status-grid">
      <article className={`workspace-status status-${nativeStatus}`}><span>Native tool status / 原生工具狀態</span><strong>{nativeStatus === 'supported' ? '原生 WebMCP 已就緒' : nativeStatus === 'checking' ? '正在檢查原生 WebMCP' : nativeStatus === 'unsupported' ? '安全降級：瀏覽器未支援原生 WebMCP' : '原生 WebMCP 註冊失敗'}</strong><p>{nativeStatus === 'supported' ? '五個工具已透過 document.modelContext.registerTool() 註冊。' : '原網站搜尋、證據、觀察與排除功能仍可正常使用；沒有建立假 Polyfill。'}</p></article>
      <article className="workspace-status"><span>Registered tools / 核准工具</span><strong>3 read-only + 2 human-confirmed writes</strong><p>寫入工具沒有代理可自行送出的確認參數。</p></article>
      <article className="workspace-status"><span>Anonymous session / 匿名工作階段</span><strong>Per-browser isolated / 個別瀏覽器隔離</strong><p>不保存完整 Prompt、Cookie、Token 或個人資料。</p></article>
    </div>

    <section className="workspace-panel" aria-labelledby="recent-tool-heading"><div className="workspace-panel-heading"><div><span>STEP 1</span><h2 id="recent-tool-heading">最近一次真正工具呼叫 <small>Latest native tool call</small></h2></div>{activity.lastCall && <span className={`tool-call-state state-${activity.lastCall.status}`}>{activity.lastCall.status === 'running' ? '執行中' : activity.lastCall.status === 'success' ? '成功' : '失敗'}</span>}</div>
      {activity.lastCall ? <dl className="tool-call-summary"><div><dt>工具</dt><dd>{toolLabels[activity.lastCall.toolName]}</dd></div><div><dt>狀態</dt><dd>{activity.lastCall.message}</dd></div><div><dt>開始時間</dt><dd>{new Date(activity.lastCall.startedAt).toLocaleTimeString('zh-TW')}</dd></div></dl> : <p className="workspace-empty">等待 ChatGPT 內建瀏覽器或支援 WebMCP 的 Chrome 呼叫工具。一般頁面點擊不會冒充工具證據。</p>}
    </section>

    <div className="workspace-columns">
      <section className="workspace-panel" aria-labelledby="candidate-heading"><div className="workspace-panel-heading"><div><span>STEP 2</span><h2 id="candidate-heading">三個候選主題 <small>Top 3 candidates</small></h2></div></div>
        {activity.candidates.length ? <div className="workspace-candidate-list">{activity.candidates.map((candidate, index) => <article key={candidate.trend_id}><div><span className="candidate-rank">#{index + 1}</span><span>{candidate.data_status}</span></div><h3>{candidate.title}</h3><p>{candidate.region}｜{candidate.platforms.join('、')}</p><strong>{candidate.total_score} 分</strong><small>{candidate.limitation}</small><Link to={`/trends/${candidate.trend_id}`}>在網站查看證據</Link></article>)}</div> : <p className="workspace-empty">尚無搜尋結果。請代理呼叫 <code>search_trends</code>，工具最多回傳三項。</p>}
      </section>

      <section className="workspace-panel" aria-labelledby="evidence-heading"><div className="workspace-panel-heading"><div><span>STEP 3</span><h2 id="evidence-heading">證據與限制 <small>Evidence & limits</small></h2></div></div>
        {activity.evidence ? <div className="workspace-evidence"><p><strong>系統計算分數：</strong>{String((activity.evidence.system_calculated_score as Record<string, unknown> | undefined)?.total_score ?? '—')} 分</p><p><strong>資料狀態：</strong>{String(activity.evidence.data_status ?? '—')}</p><p className="untrusted-note">外部未受信任內容 / External untrusted content</p>{evidenceSources.slice(0, 3).map((source) => <article key={String(source.source_id)}><strong>{String(source.source_name)}</strong><span>{String(source.title)}</span><small>取得：{String(source.fetched_at)}</small></article>)}<p><strong>來源限制：</strong>{Array.isArray(activity.evidence.source_limitations) ? activity.evidence.source_limitations.map(String).join('；') : '—'}</p></div> : <p className="workspace-empty">選定候選後，請代理呼叫 <code>get_trend_evidence</code>。外部標題與摘要永遠不會成為操作指令。</p>}
      </section>
    </div>

    <section className="workspace-panel confirmation-zone" aria-labelledby="confirmation-heading"><div className="workspace-panel-heading"><div><span>STEP 4</span><h2 id="confirmation-heading">真人確認與撤銷 <small>Human confirmation & undo</small></h2></div></div>
      {pending ? <div className="human-confirmation" role="dialog" aria-modal="false" aria-label="真人確認" onKeyDown={(event) => { if (event.key === 'Escape') humanConfirmationCoordinator.cancel(pending.id); }}><span className="confirmation-warning">WAITING FOR HUMAN / 等待真人</span><h3>{pending.actionLabel}：{pending.topicTitle}</h3><p><strong>影響：</strong>{pending.impact}</p><p><strong>撤銷方式：</strong>{pending.undoDescription}</p><div><button ref={confirmButton} type="button" className="button trend-primary" onClick={() => humanConfirmationCoordinator.confirm(pending.id)}>確認{pending.actionLabel}</button><button type="button" className="button secondary" onClick={() => humanConfirmationCoordinator.cancel(pending.id)}>取消，不變更資料</button></div></div> : <div className={`confirmation-result result-${confirmation.status}`} role="status" aria-live="polite"><strong>{confirmation.status === 'idle' ? '目前沒有待確認操作' : confirmation.message}</strong><span>{confirmation.status === 'idle' ? '代理寫入呼叫會先停在這裡，真人確認前資料完全不變。' : `狀態：${confirmation.status}`}</span>{confirmation.status === 'confirmed' && <button type="button" className="button secondary" onClick={undo}>撤銷操作 / Undo</button>}</div>}
    </section>
  </section>;
}
