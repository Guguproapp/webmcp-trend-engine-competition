import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { platformConnectionService } from '../../../app/services';
import { findPlatform, STATUS_LABELS, type PlatformConnection, type PlatformCode } from '../../../shared/domain/platform';

const validOutcomes = ['success', 'cancelled', 'permission_incomplete', 'token_expired', 'platform_error'] as const;
type Outcome = typeof validOutcomes[number];

export function OAuthCallbackPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const processed = useRef(false);
  const [result, setResult] = useState<PlatformConnection | null>(null);
  const platform = findPlatform(search.get('platform'));

  useEffect(() => {
    if (processed.current || !platform) return;
    processed.current = true;
    const rawOutcome = search.get('outcome');
    const outcome: Outcome = validOutcomes.includes(rawOutcome as Outcome) ? rawOutcome as Outcome : 'platform_error';
    platformConnectionService.completeAuthorization(platform.code as PlatformCode, search.get('state') ?? '', outcome).then(setResult);
  }, [platform, search]);

  if (!platform) return <section className="empty-state"><h1>Callback 資料不完整</h1><button className="button primary" onClick={() => navigate('/onboarding/progress')}>返回進度</button></section>;
  if (!result) return <section className="empty-state"><span className="spinner">◌</span><h1>正在驗證模擬授權結果</h1><p>正在檢查 state 與連接狀態。</p></section>;
  const success = result.status === 'authorized';
  return <section className="result-page"><div className={`result-icon ${success ? 'success' : 'warning'}`}>{success ? '✓' : '!'}</div><span className="badge badge-gold">模擬結果</span><h1>{platform.name}：{STATUS_LABELS[result.status]}</h1><p>{result.statusMessage}</p><p className="muted">目前為模擬授權，尚未連接正式平台。</p><div className="action-row centered"><button className="button secondary" onClick={() => navigate('/onboarding/progress')}>返回開通進度</button><button className="button primary" onClick={() => navigate('/settings/connections')}>查看連接管理</button></div></section>;
}
