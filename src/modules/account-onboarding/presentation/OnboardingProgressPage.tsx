import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingProgressRepository, platformConnectionService, platformConnectionRepository } from '../../../app/services';
import { PLATFORM_REGISTRY, type PlatformCode, type PlatformConnectionStatus } from '../../../shared/domain/platform';
import { PlatformCard } from '../../../shared/presentation/PlatformCard';

export function OnboardingProgressPage() {
  const navigate = useNavigate();
  const progress = onboardingProgressRepository.get();
  const selectedCodes = [...new Set([...progress.existingPlatforms, ...progress.signupPlatforms])];
  const [connections, setConnections] = useState(() => platformConnectionRepository.getAll());
  const refresh = () => setConnections(platformConnectionRepository.getAll());

  function statusOf(code: PlatformCode): PlatformConnectionStatus {
    return connections.find((item) => item.platformCode === code)?.status ?? 'not_started';
  }

  async function authorize(code: PlatformCode) {
    const url = await platformConnectionService.beginAuthorization(code);
    navigate(url);
  }

  function advanceSignup(code: PlatformCode, status: PlatformConnectionStatus) {
    platformConnectionService.setStatus(code, status);
    refresh();
  }

  if (!selectedCodes.length) return <section className="empty-state"><span>◎</span><h1>尚未選擇平台</h1><p>請先完成帳號現況選擇。</p><button className="button primary" onClick={() => navigate('/onboarding')}>回到首次設定</button></section>;

  return (
    <section>
      <div className="step-label">帳號開通進度</div><h1>一步一步完成平台連接</h1><p className="lead">註冊、驗證與條款同意皆由你在官方平台完成；回來後再進行模擬 OAuth 授權。</p>
      <div className="mock-banner" role="status"><strong>模擬授權環境</strong><span>目前為模擬授權，尚未連接正式平台。</span></div>
      <div className="progress-list">
        {PLATFORM_REGISTRY.filter((platform) => selectedCodes.includes(platform.code)).map((platform) => {
          const status = statusOf(platform.code);
          const connection = connections.find((item) => item.platformCode === platform.code);
          return <PlatformCard key={platform.code} platform={platform} status={status}>
            <p className="status-message">{connection?.statusMessage}</p>
            <div className="card-actions">
              {status === 'signup_required' && <><a className="button secondary small" href={platform.registrationUrl} target="_blank" rel="noreferrer" onClick={() => advanceSignup(platform.code, 'signup_in_progress')}>開啟官方註冊頁 ↗</a><button className="button link" onClick={() => advanceSignup(platform.code, 'signup_in_progress')}>我已開始註冊</button></>}
              {status === 'signup_in_progress' && <button className="button primary small" onClick={() => advanceSignup(platform.code, 'awaiting_user_verification')}>我已填完，等待本人驗證</button>}
              {status === 'awaiting_user_verification' && <button className="button primary small" onClick={() => advanceSignup(platform.code, 'ready_for_authorization')}>我已完成註冊與本人驗證</button>}
              {status === 'account_exists' && <button className="button primary small" onClick={() => authorize(platform.code)}>進入模擬官方授權</button>}
              {['ready_for_authorization', 'permission_incomplete', 'token_expired', 'connection_error', 'disconnected'].includes(status) && <button className="button primary small" onClick={() => authorize(platform.code)}>{status === 'ready_for_authorization' ? '開始模擬授權' : '重新授權'}</button>}
              {status === 'authorized' && <span className="success-text">✓ 模擬連接測試成功</span>}
            </div>
            <details><summary>平台條件與支援能力</summary><p>{platform.accountRequirement}</p><ul><li>影片發布：{platform.supportsVideoPublishing ? '支援（未實作）' : '不支援'}</li><li>草稿：{platform.supportsDrafts ? '平台能力可用（未實作）' : '不支援'}</li><li>排程：{platform.supportsScheduling ? '平台能力可用（未實作）' : '尚未支援'}</li></ul>{platform.unsupportedHint && <p>{platform.unsupportedHint}</p>}</details>
          </PlatformCard>;
        })}
      </div>
      <div className="action-row"><button className="button secondary" onClick={() => navigate(progress.mode === 'new' ? '/onboarding/new-accounts' : '/onboarding/existing-accounts')}>返回修改</button><button className="button primary" onClick={() => navigate('/dashboard')}>前往主控台</button></div>
    </section>
  );
}
