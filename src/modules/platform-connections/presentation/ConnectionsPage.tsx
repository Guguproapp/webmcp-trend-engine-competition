import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditLogRepository, platformConnectionRepository, platformConnectionService } from '../../../app/services';
import { PLATFORM_REGISTRY, type PlatformCode } from '../../../shared/domain/platform';
import { PlatformCard } from '../../../shared/presentation/PlatformCard';

export function ConnectionsPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState(() => platformConnectionRepository.getAll());
  const refresh = () => setConnections(platformConnectionRepository.getAll());
  const authorize = async (code: PlatformCode) => navigate(await platformConnectionService.beginAuthorization(code));
  const disconnect = async (code: PlatformCode) => { await platformConnectionService.disconnect(code); refresh(); };
  return <section><div className="step-label">設定</div><h1>平台連接管理</h1><p className="lead">集中查看模擬授權狀態、重新授權或解除連接。</p><div className="mock-banner"><strong>模擬資料</strong><span>所有狀態皆為開發測試，沒有儲存任何正式 Token。</span></div><div className="platform-grid">{PLATFORM_REGISTRY.map((platform) => { const connection = connections.find((item) => item.platformCode === platform.code); const status = connection?.status ?? 'not_started'; return <PlatformCard key={platform.code} platform={platform} status={status}><p className="status-message">{connection?.statusMessage ?? '尚未加入開通流程。'}</p><div className="card-actions">{status === 'authorized' && <><button className="button secondary small" onClick={() => { platformConnectionService.setStatus(platform.code, 'token_expired', '模擬 Token 已到期。'); refresh(); }}>模擬過期</button><button className="button danger small" onClick={() => disconnect(platform.code)}>解除連接</button></>}{status !== 'authorized' && status !== 'not_started' && <button className="button primary small" onClick={() => authorize(platform.code)}>重新授權</button>}{status === 'not_started' && <button className="button secondary small" onClick={() => navigate('/onboarding')}>開始設定</button>}</div></PlatformCard>; })}</div><details className="audit-panel"><summary>查看最近稽核紀錄</summary><ul>{auditLogRepository.list().slice(0, 12).map((entry) => <li key={entry.id}><time>{new Date(entry.createdAt).toLocaleString('zh-TW')}</time><strong>{entry.action}</strong><span>{entry.detail}</span></li>)}</ul></details></section>;
}
