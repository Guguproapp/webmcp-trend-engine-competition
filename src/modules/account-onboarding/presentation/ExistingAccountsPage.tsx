import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_REGISTRY, type PlatformCode } from '../../../shared/domain/platform';
import { PlatformCard } from '../../../shared/presentation/PlatformCard';
import { onboardingProgressRepository, platformConnectionService } from '../../../app/services';

type Selection = 'existing' | 'signup' | 'skip';

export function ExistingAccountsPage() {
  const navigate = useNavigate();
  const saved = onboardingProgressRepository.get();
  const initial = useMemo(() => Object.fromEntries(PLATFORM_REGISTRY.map((platform) => [
    platform.code,
    saved.existingPlatforms.includes(platform.code) ? 'existing' : saved.signupPlatforms.includes(platform.code) ? 'signup' : 'skip',
  ])) as Record<PlatformCode, Selection>, [saved.existingPlatforms, saved.signupPlatforms]);
  const [selection, setSelection] = useState(initial);
  const [error, setError] = useState('');

  function submit() {
    const existingPlatforms = PLATFORM_REGISTRY.filter((p) => selection[p.code] === 'existing').map((p) => p.code);
    const signupPlatforms = PLATFORM_REGISTRY.filter((p) => selection[p.code] === 'signup').map((p) => p.code);
    if (existingPlatforms.length + signupPlatforms.length === 0) {
      setError('請至少選擇一個已有或希望開通的平台。');
      return;
    }
    onboardingProgressRepository.save({ mode: 'existing', existingPlatforms, signupPlatforms, profileCompleted: saved.profileCompleted, updatedAt: new Date().toISOString() });
    existingPlatforms.forEach((code) => platformConnectionService.setStatus(code, 'account_exists'));
    signupPlatforms.forEach((code) => platformConnectionService.setStatus(code, 'signup_required'));
    navigate('/onboarding/progress');
  }

  return (
    <section>
      <div className="step-label">首次使用設定 · 平台盤點</div>
      <h1>哪些帳號已經準備好了？</h1>
      <p className="lead">每個平台選擇一種狀態。已有帳號會進入模擬授權；缺少帳號會進入官方註冊引導。</p>
      <div className="platform-grid">
        {PLATFORM_REGISTRY.map((platform) => (
          <PlatformCard key={platform.code} platform={platform}>
            <fieldset className="segmented-control">
              <legend className="sr-only">{platform.name} 帳號狀態</legend>
              {([
                ['existing', '已有帳號'],
                ['signup', '希望開通'],
                ['skip', '這次略過'],
              ] as const).map(([value, label]) => (
                <label key={value} className={selection[platform.code] === value ? 'selected' : ''}>
                  <input type="radio" name={platform.code} value={value} checked={selection[platform.code] === value} onChange={() => setSelection({ ...selection, [platform.code]: value })} />
                  {label}
                </label>
              ))}
            </fieldset>
          </PlatformCard>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="action-row"><button className="button secondary" onClick={() => navigate('/onboarding')}>返回</button><button className="button primary" onClick={submit}>儲存並查看進度</button></div>
    </section>
  );
}
