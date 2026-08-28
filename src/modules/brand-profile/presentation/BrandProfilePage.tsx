import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { brandProfileRepository, onboardingProgressRepository } from '../../../app/services';
import { profileCompletion, validateBrandProfile, type BrandProfile, type BrandProfileErrors } from '../domain/BrandProfile';

export function BrandProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => brandProfileRepository.get());
  const [errors, setErrors] = useState<BrandProfileErrors>({});
  const progress = onboardingProgressRepository.get();
  const completion = profileCompletion(profile);

  function update<K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) {
    const next = { ...profile, [key]: value };
    setProfile(next);
    brandProfileRepository.save(next);
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  }

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logoDataUrl: '圖片請小於 2 MB。' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update('logoDataUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateBrandProfile(profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    onboardingProgressRepository.save({ ...progress, mode: 'new', existingPlatforms: [], profileCompleted: true, updatedAt: new Date().toISOString() });
    navigate('/onboarding/new-accounts');
  }

  const field = (key: keyof BrandProfile, label: string, help: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} value={String(profile[key] ?? '')} onChange={(event) => update(key, event.target.value as BrandProfile[typeof key])} aria-invalid={Boolean(errors[key])} aria-describedby={`${key}-help ${key}-error`} />
      <small id={`${key}-help`}>{help}</small>
      {errors[key] && <em id={`${key}-error`} className="field-error">{errors[key]}</em>}
    </label>
  );

  return (
    <section>
      <div className="profile-header">
        <div><div className="step-label">共同資料 · 自動分段儲存</div><h1>建立你的品牌基本資料</h1><p className="lead">每次修改都會保存在這台裝置；重新整理後可繼續。</p></div>
        <div className="completion" aria-label={`完成 ${completion}%`}><strong>{completion}%</strong><span>資料完成度</span><div><i style={{ width: `${completion}%` }} /></div></div>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="form-section">
          <h2><span>1</span> 頻道識別</h2>
          <div className="form-grid">
            {field('brandName', '品牌／頻道名稱 *', '各平台顯示的主要名稱。', { autoComplete: 'organization' })}
            {field('handle', '頻道代稱 *', '建議使用英數字，未來仍以平台可用性為準。', { placeholder: '@trendengine' })}
            {field('industry', '產業類型 *', '例如：室內裝修、生活、科技。')}
            {field('contentTopics', '內容主題 *', '可填多個方向，例如：AI 工具、空間改造。')}
            {field('targetAudience', '目標觀眾 *', '描述主要觀眾及他們的需求。')}
            <label className="form-field full"><span>品牌簡介 *</span><textarea value={profile.bio} onChange={(event) => update('bio', event.target.value)} rows={4} aria-invalid={Boolean(errors.bio)} /><small>這段文字會用於平台簡介預覽。</small>{errors.bio && <em className="field-error">{errors.bio}</em>}</label>
          </div>
        </div>
        <div className="form-section">
          <h2><span>2</span> 聯絡與視覺</h2>
          <div className="form-grid">
            {field('contactEmail', '聯絡 Email *', '只作品牌聯絡資料，不會代收平台驗證信。', { type: 'email', autoComplete: 'email' })}
            {field('contactPhone', '聯絡電話（選填）', '不會用於接收或代填平台驗證碼。', { type: 'tel', autoComplete: 'tel' })}
            {field('website', '官方網站（選填）', '請包含 https://。', { type: 'url', placeholder: 'https://example.com' })}
            <label className="form-field"><span>頭像或 Logo *</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} aria-invalid={Boolean(errors.logoDataUrl)} /><small>PNG、JPG 或 WebP，最多 2 MB；開發版以資料網址保存在本機。</small>{profile.logoDataUrl && <span className="file-success">✓ 已保存圖片</span>}{errors.logoDataUrl && <em className="field-error">{errors.logoDataUrl}</em>}</label>
            <label className="form-field"><span>品牌主要顏色 *</span><div className="color-row"><input type="color" value={profile.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} /><code>{profile.primaryColor}</code></div><small>用於預覽識別，不會覆蓋平台品牌規範。</small></label>
          </div>
        </div>
        <div className="form-section">
          <h2><span>3</span> 發布偏好</h2>
          <div className="form-grid">
            <label className="form-field"><span>慣用語言 *</span><select value={profile.language} onChange={(event) => update('language', event.target.value)}><option>繁體中文</option><option>英文</option><option>日文</option></select></label>
            <label className="form-field"><span>所在地區 *</span><select value={profile.region} onChange={(event) => update('region', event.target.value)}><option>台灣</option><option>香港</option><option>日本</option><option>其他</option></select></label>
            <BooleanField label="是否屬於商業帳號？" value={profile.isBusinessAccount} error={errors.isBusinessAccount} onChange={(value) => update('isBusinessAccount', value)} />
            <BooleanField label="是否需要發布 AI 生成內容？" value={profile.publishesAiContent} error={errors.publishesAiContent} onChange={(value) => update('publishesAiContent', value)} />
          </div>
        </div>
        <div className="action-row sticky-actions"><button type="button" className="button secondary" onClick={() => navigate('/onboarding')}>返回</button><span className="autosave">✓ 已自動保存本段進度</span><button className="button primary" type="submit">驗證並選擇平台</button></div>
      </form>
    </section>
  );
}

function BooleanField({ label, value, error, onChange }: { label: string; value: boolean | null; error?: string; onChange: (value: boolean) => void }) {
  return <fieldset className="form-field boolean-field"><legend>{label} *</legend><div><label className={value === true ? 'selected' : ''}><input type="radio" checked={value === true} onChange={() => onChange(true)} />是</label><label className={value === false ? 'selected' : ''}><input type="radio" checked={value === false} onChange={() => onChange(false)} />否</label></div>{error && <em className="field-error">{error}</em>}</fieldset>;
}
