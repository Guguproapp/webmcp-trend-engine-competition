import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_REGISTRY, type PlatformCode } from '../../../shared/domain/platform';
import { PlatformCard } from '../../../shared/presentation/PlatformCard';
import { brandProfileRepository, onboardingProgressRepository, platformConnectionService } from '../../../app/services';

export function NewAccountsPage() {
  const navigate = useNavigate();
  const saved = onboardingProgressRepository.get();
  const profile = brandProfileRepository.get();
  const [selected, setSelected] = useState<PlatformCode[]>(saved.signupPlatforms);
  const [error, setError] = useState('');

  function toggle(code: PlatformCode) {
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  function submit() {
    if (!selected.length) return setError('請至少選擇一個希望建立的平台。');
    onboardingProgressRepository.save({ mode: 'new', existingPlatforms: [], signupPlatforms: selected, profileCompleted: true, updatedAt: new Date().toISOString() });
    selected.forEach((code) => platformConnectionService.setStatus(code, 'signup_required'));
    navigate('/onboarding/progress');
  }

  return (
    <section>
      <div className="step-label">首次使用設定 · 共同資料已保存</div>
      <h1>你想先建立哪些平台？</h1>
      <p className="lead">選擇平台後，我們會以剛才保存的共同資料產生平台預覽，再進入官方註冊引導。</p>
      <div className="platform-grid selectable-grid">
        {PLATFORM_REGISTRY.map((platform) => (
          <label key={platform.code} className={`select-card ${selected.includes(platform.code) ? 'selected' : ''}`}>
            <input type="checkbox" checked={selected.includes(platform.code)} onChange={() => toggle(platform.code)} />
            <PlatformCard platform={platform} />
            <span className="check-label">{selected.includes(platform.code) ? '✓ 已選擇' : '選擇此平台'}</span>
          </label>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {selected.length > 0 && <div className="preview-section account-preview"><h2>平台資料預覽</h2><p>下列內容只是註冊資料參考，不代表帳號已建立。</p><div className="preview-grid">{PLATFORM_REGISTRY.filter((platform) => selected.includes(platform.code)).map((platform) => <article key={platform.code} className="preview-card"><span className={`platform-icon platform-${platform.code}`}>{platform.icon}</span><div><strong>{profile.brandName}</strong><span>{profile.handle}</span><p>{profile.bio}</p></div></article>)}</div></div>}
      <div className="action-row"><button className="button secondary" onClick={() => navigate('/onboarding/profile')}>返回修改共同資料</button><button className="button primary" onClick={submit}>儲存平台並查看開通進度</button></div>
    </section>
  );
}
