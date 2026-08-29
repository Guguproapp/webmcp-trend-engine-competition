import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { DISCOVERY_SOURCE_REGISTRY, resolveDiscoverySources } from '../application/PlatformSourceRegistry';
import { VideoDiscoveryService } from '../application/VideoDiscoveryService';
import {
  buildPlatformSearchLinks,
  normalizeVideoUrl,
  SOURCE_ACQUISITION_LABELS,
  VIDEO_PLATFORMS,
  VideoUrlValidationError,
} from '../domain/VideoDiscovery';
import { AwaitingPlatformContentProvider, DisabledWebSearchProvider } from '../infrastructure/DisabledVideoProviders';
import { LocalVideoCandidateRepository, VIDEO_CANDIDATE_STORAGE_KEY } from '../infrastructure/LocalVideoCandidateRepository';
import appSource from '../../../app/App.tsx?raw';
import servicesSource from '../../../app/services.ts?raw';
import buildVerifier from '../../../../scripts/verify-public-build.mjs?raw';

const clock = (() => {
  const times = ['2026-08-29T01:00:00.000Z', '2026-08-29T02:00:00.000Z', '2026-08-29T03:00:00.000Z'];
  let index = 0;
  return () => new Date(times[Math.min(index++, times.length - 1)]);
})();

function createService(storage = new MemoryStorage()) {
  return { storage, service: new VideoDiscoveryService(new LocalVideoCandidateRepository(storage), clock) };
}

describe('四大平台搜尋與狀態邊界', () => {
  it('四大平台固定存在且順序一致', () => {
    expect(VIDEO_PLATFORMS).toEqual(['youtube', 'facebook', 'instagram', 'tiktok']);
    expect(DISCOVERY_SOURCE_REGISTRY.slice(0, 4).map((source) => source.code)).toEqual(VIDEO_PLATFORMS);
  });

  it('YouTube官方來源沿用API狀態，其他平台沒有權限時不會假裝已連線', () => {
    const sources = resolveDiscoverySources([{ code:'youtube', name:'YouTube影音平台', state:'enabled', message:'運作正常', lastSuccessAt:'2026-08-29T00:00:00.000Z', lastAttemptAt:'2026-08-29T00:00:00.000Z', nextRetryAt:null, fetchedCount:3 }]);
    expect(sources.find((source) => source.code === 'youtube')).toMatchObject({ state:'enabled', fetchedCount:3 });
    expect(sources.find((source) => source.code === 'facebook')?.state).toBe('not_applied');
    expect(sources.find((source) => source.code === 'instagram')?.state).toBe('not_applied');
    expect(sources.find((source) => source.code === 'tiktok')).toMatchObject({ state:'enabled', acquisitionMethod:'official_site_assisted' });
  });

  it('等待權限的Facebook、Instagram及TikTok提供者回傳空集合', async () => {
    for (const platform of ['facebook', 'instagram', 'tiktok'] as const) {
      const provider = new AwaitingPlatformContentProvider(platform);
      expect(provider.getPermissionState()).toBe('not_applied');
      await expect(provider.searchPublicContent()).resolves.toEqual([]);
    }
  });

  it('尚未啟用的網頁搜尋提供者不產生假搜尋結果', async () => {
    const provider = new DisabledWebSearchProvider();
    expect(provider.isEnabled()).toBe(false);
    expect(provider.getStatusMessage()).toBe('尚未啟用自動網頁搜尋');
    await expect(provider.search()).resolves.toEqual([]);
  });

  it('平台與搜尋引擎輔助連結正確編碼關鍵字', () => {
    const links = buildPlatformSearchLinks('台灣 物價');
    expect(links.official.youtube).toContain('search_query=%E5%8F%B0%E7%81%A3%20%E7%89%A9%E5%83%B9');
    expect(links.official.facebook).toContain('q=%E5%8F%B0%E7%81%A3%20%E7%89%A9%E5%83%B9');
    expect(decodeURIComponent(new URL(links.webSearch.instagram).searchParams.get('q') ?? '')).toContain('site:instagram.com/reel');
    expect(links.creativeCenter).toMatch(/^https:\/\/ads\.tiktok\.com\//u);
  });

  it('公開路由可開啟爆款影音搜尋且顯示YouTube官方快取結果區', async () => {
    render(<MemoryRouter initialEntries={['/trends/video-search']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name:'爆款影音搜尋' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'YouTube官方自動搜尋結果' })).toBeInTheDocument();
    expect(screen.getAllByText('YouTube影音平台').length).toBeGreaterThan(0);
  });

  it('資料來源頁固定顯示四平台與取得方式', async () => {
    render(<MemoryRouter initialEntries={['/trends/sources']}><App /></MemoryRouter>);
    await screen.findByRole('heading', { name:'資料來源' });
    for (const name of ['YouTube影音平台', 'Facebook社群平台', 'Instagram圖文與短影音平台', 'TikTok短影音平台']) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText(SOURCE_ACQUISITION_LABELS.official_api)).toBeInTheDocument();
    expect(screen.getByText(SOURCE_ACQUISITION_LABELS.official_site_assisted)).toBeInTheDocument();
    expect(screen.getAllByText(SOURCE_ACQUISITION_LABELS.waiting_review)).toHaveLength(2);
  });

  it('公開介面明確說明不是四平台全自動搜尋', async () => {
    render(<MemoryRouter initialEntries={['/review']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name:'不是四平台全自動搜尋' })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('四平台全部自動搜尋');
  });
});

describe('影音網址安全與正規化', () => {
  it.each([
    ['https://youtu.be/abcDEF123?si=tracking', 'youtube', 'https://www.youtube.com/watch?v=abcDEF123'],
    ['https://www.facebook.com/sample/videos/12345/?fbclid=tracking', 'facebook', 'https://www.facebook.com/sample/videos/12345/'],
    ['https://www.instagram.com/reel/ABC_123/?igshid=tracking', 'instagram', 'https://www.instagram.com/reel/ABC_123/'],
    ['https://www.tiktok.com/@creator/video/1234567890?is_from_webapp=1', 'tiktok', 'https://www.tiktok.com/@creator/video/1234567890'],
    ['https://vm.tiktok.com/ZM123abc/', 'tiktok', 'https://vm.tiktok.com/ZM123abc/'],
  ] as const)('辨識並正規化%s', (url, platform, normalizedUrl) => {
    expect(normalizeVideoUrl(url)).toMatchObject({ platform, normalizedUrl });
  });

  it.each([
    'http://www.youtube.com/watch?v=abcDEF123',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://tiktok.com.evil.example/@creator/video/1234567890',
    'https://youtube.com.evil.example/watch?v=abcDEF123',
    'https://user:password@www.instagram.com/reel/ABC_123/',
  ])('拒絕危險或偽造網址：%s', (url) => {
    expect(() => normalizeVideoUrl(url)).toThrow(VideoUrlValidationError);
  });
});

describe('本機影音候選保存與增速保護', () => {
  it('匯入資料標示為未驗證且第一次快照只建立基準', () => {
    const { service } = createService();
    const result = service.importCandidate({ url:'https://youtu.be/abcDEF123', title:'使用者分享影片', acquisitionMethod:'user_shared', metrics:{ viewCount:100 } });
    expect(result.candidate).toMatchObject({ verified:false, evidenceConfidence:'low', acquisitionMethod:'user_shared' });
    expect(service.getGrowthPresentation(result.candidate)).toMatchObject({ status:'baseline_pending', label:'正在建立增速基準', growthRate:null });
  });

  it('重複網址合併而不是新增第二筆', () => {
    const { service } = createService();
    service.importCandidate({ url:'https://youtu.be/abcDEF123?si=one', title:'第一次', acquisitionMethod:'user_shared', metrics:{ viewCount:100 } });
    const second = service.importCandidate({ url:'https://www.youtube.com/watch?v=abcDEF123&utm_source=test', title:'第二次', acquisitionMethod:'user_shared', metrics:{ viewCount:120 } });
    expect(second.merged).toBe(true);
    expect(service.listCandidates()).toHaveLength(1);
    expect(second.candidate.snapshots).toHaveLength(2);
    expect(service.getGrowthPresentation(second.candidate)).toMatchObject({ status:'measured', growthRate:20, label:'+20%' });
  });

  it('兩次相同的使用者快照只顯示0%及目前無明顯變化', () => {
    const { service } = createService();
    service.importCandidate({ url:'https://www.tiktok.com/@creator/video/1234567890', title:'候選', acquisitionMethod:'official_site_assisted', metrics:{ viewCount:100 } });
    const second = service.importCandidate({ url:'https://www.tiktok.com/@creator/video/1234567890', title:'候選', acquisitionMethod:'official_site_assisted', metrics:{ viewCount:100 } });
    expect(service.getGrowthPresentation(second.candidate)).toMatchObject({ label:'0%｜目前無明顯變化', growthRate:0 });
  });

  it('B版保存只寫入影音候選命名空間，不清除其他資料', () => {
    const storage = new MemoryStorage();
    storage.setItem('unrelated.owner.data', 'keep-me');
    const { service } = createService(storage);
    service.importCandidate({ url:'https://www.instagram.com/reel/ABC_123/', title:'候選', acquisitionMethod:'user_shared' });
    expect(storage.getItem('unrelated.owner.data')).toBe('keep-me');
    expect(storage.getItem(VIDEO_CANDIDATE_STORAGE_KEY)).toContain('ABC_123');
  });

  it('頁面對偽造網域顯示中文錯誤且不保存', async () => {
    render(<MemoryRouter initialEntries={['/trends/video-search']}><App /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText('影音網址（必填）'), { target:{ value:'https://tiktok.com.evil.example/video/123' } });
    fireEvent.click(screen.getByRole('button', { name:'加入影音候選' }));
    expect(await screen.findByText('只接受YouTube、Facebook、Instagram及TikTok官方網域。')).toBeInTheDocument();
  });
});

describe('產品、建置與A版隔離', () => {
  it('爆款影音路由只匯入B版頁面且A版模組仍隔離', () => {
    expect(appSource).toContain('/trends/video-search');
    expect(appSource).not.toMatch(/Onboarding|OAuthCallback|PlatformConnections/u);
    expect(servicesSource).not.toMatch(/account-onboarding|platform-connections/u);
  });

  it('Production Build檢查涵蓋秘密與四平台誤導文案', () => {
    for (const secret of ['YOUTUBE_API_KEY', 'REFRESH_ADMIN_TOKEN', 'PRIVATE KEY']) expect(buildVerifier).toContain(secret);
    expect(buildVerifier).toContain('四平台全部自動搜尋');
  });

  it('手機主要導覽仍固定四項，影音搜尋位於更多選單', async () => {
    render(<MemoryRouter initialEntries={['/trends/video-search']}><App /></MemoryRouter>);
    const navigation = screen.getByRole('navigation', { name:'手機主要導覽' });
    expect(navigation.querySelectorAll(':scope > a, :scope > button')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name:'更多' }));
    await waitFor(() => expect(screen.getByRole('menuitem', { name:/爆款影音搜尋/ })).toHaveAttribute('href', '/trends/video-search'));
  });
});
