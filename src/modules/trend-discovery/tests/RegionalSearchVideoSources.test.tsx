import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { MemoryStorage } from '../../../shared/infrastructure/storage';
import { DISCOVERY_SOURCE_REGISTRY } from '../application/PlatformSourceRegistry';
import { VideoDiscoveryService } from '../application/VideoDiscoveryService';
import {
  canCompareYouTubeBenchmarks, classifyIntelligence, DEFAULT_REGIONAL_SEARCH_FILTERS, inferYouTubeContentForm, INTELLIGENCE_TYPES, isRegionalResultMatch,
  MARKET_REGIONS, REGION_DEFAULT_PLATFORMS, type RegionalSearchFilters,
} from '../domain/RegionalDiscovery';
import { normalizeVideoUrl, VIDEO_PLATFORMS } from '../domain/VideoDiscovery';
import { LocalRegionalSearchPreferencesRepository, REGIONAL_SEARCH_STORAGE_KEY } from '../infrastructure/LocalRegionalSearchPreferencesRepository';
import { LocalVideoCandidateRepository } from '../infrastructure/LocalVideoCandidateRepository';
import appSource from '../../../app/App.tsx?raw';
import buildVerifier from '../../../../scripts/verify-public-build.mjs?raw';

describe('地區、情報類型與八平台領域規則', () => {
  it('固定提供四個市場與全部地區', () => {
    expect(MARKET_REGIONS).toEqual(['china_mainland','taiwan','hong_kong','macau','all']);
  });

  it('固定提供六種可解釋情報類型', () => {
    expect(INTELLIGENCE_TYPES).toEqual(['search_rising','video_viral','dual_viral','video_supply_gap','news_growth','insufficient_evidence']);
  });

  it('固定保留八個爆紅影音平台', () => {
    expect(VIDEO_PLATFORMS).toEqual(['youtube','tiktok','instagram','facebook','douyin','kuaishou','xiaohongshu','bilibili']);
  });

  it('各地區預設平台符合產品決策且香港不預設TikTok', () => {
    expect(REGION_DEFAULT_PLATFORMS.taiwan).toEqual(['youtube','tiktok','instagram','facebook']);
    expect(REGION_DEFAULT_PLATFORMS.hong_kong).toEqual(['youtube','instagram','facebook','xiaohongshu']);
    expect(REGION_DEFAULT_PLATFORMS.hong_kong).not.toContain('tiktok');
    expect(REGION_DEFAULT_PLATFORMS.macau).toEqual(['youtube','instagram','facebook','douyin']);
    expect(REGION_DEFAULT_PLATFORMS.china_mainland).toEqual(['douyin','kuaishou','xiaohongshu','bilibili']);
  });

  it('YouTube長影音與Shorts只算一個平台且不能跨形式比較', () => {
    expect(VIDEO_PLATFORMS.filter((platform)=>platform==='youtube')).toHaveLength(1);
    expect(canCompareYouTubeBenchmarks('long_video','long_video')).toBe(true);
    expect(canCompareYouTubeBenchmarks('shorts','shorts')).toBe(true);
    expect(canCompareYouTubeBenchmarks('long_video','shorts')).toBe(false);
    expect(canCompareYouTubeBenchmarks('unknown','shorts')).toBe(false);
    expect(inferYouTubeContentForm('https://www.youtube.com/watch?v=abcdefghijk')).toBe('long_video');
    expect(inferYouTubeContentForm('https://www.youtube.com/shorts/abcdefghijk')).toBe('shorts');
    expect(inferYouTubeContentForm('https://youtu.be/abcdefghijk')).toBe('long_video');
  });

  it('地區、情報類型與平台條件可同時判斷', () => {
    const filters:RegionalSearchFilters={keyword:'',region:'hong_kong',intelligenceType:'video_viral',platforms:['youtube','xiaohongshu'],timeRangeHours:24,youtubeContentForm:'shorts'};
    expect(isRegionalResultMatch({region:'hong_kong',intelligenceType:'video_viral',platform:'youtube',contentForm:'shorts'},filters)).toBe(true);
    expect(isRegionalResultMatch({region:'taiwan',intelligenceType:'video_viral',platform:'youtube',contentForm:'shorts'},filters)).toBe(false);
    expect(isRegionalResultMatch({region:'hong_kong',intelligenceType:'news_growth',platform:'youtube',contentForm:'shorts'},filters)).toBe(false);
    expect(isRegionalResultMatch({region:'hong_kong',intelligenceType:'video_viral',platform:'tiktok',contentForm:'short_video'},filters)).toBe(false);
  });

  it('沒有搜尋量時不得標示熱搜上升', () => {
    expect(classifyIntelligence({searchVolume:null,searchGrowthRate:90,videoGrowthRate:null,videoEvidenceReliable:false,newsGrowthRate:null,videoSupplyCount:null})).toBe('insufficient_evidence');
  });

  it('沒有兩種可靠上升訊號時不得標示雙重爆紅', () => {
    expect(classifyIntelligence({searchVolume:1200,searchGrowthRate:50,videoGrowthRate:null,videoEvidenceReliable:false,newsGrowthRate:null,videoSupplyCount:20})).toBe('search_rising');
    expect(classifyIntelligence({searchVolume:null,searchGrowthRate:null,videoGrowthRate:80,videoEvidenceReliable:true,newsGrowthRate:null,videoSupplyCount:null})).toBe('video_viral');
  });

  it('只有可靠搜尋與影音同時上升才標示雙重爆紅', () => {
    expect(classifyIntelligence({searchVolume:1200,searchGrowthRate:50,videoGrowthRate:80,videoEvidenceReliable:true,newsGrowthRate:null,videoSupplyCount:20})).toBe('dual_viral');
  });

  it('GDELT只屬新聞佐證且新聞增加不會變成熱搜', () => {
    expect(DISCOVERY_SOURCE_REGISTRY.find((source)=>source.code==='gdelt')?.group).toBe('news_evidence');
    expect(classifyIntelligence({searchVolume:null,searchGrowthRate:null,videoGrowthRate:null,videoEvidenceReliable:false,newsGrowthRate:40,videoSupplyCount:null})).toBe('news_growth');
  });
});

describe('保存、網址與公開介面', () => {
  it('新增三維條件使用獨立命名空間且不清除舊資料', () => {
    const storage=new MemoryStorage(); storage.setItem('trend-engine.filters.v1','keep');
    const repository=new LocalRegionalSearchPreferencesRepository(storage);
    repository.save({keyword:'物價',region:'macau',intelligenceType:'video_viral',platforms:['youtube','douyin'],timeRangeHours:72,youtubeContentForm:'long_video'});
    expect(repository.read()).toMatchObject({keyword:'物價',region:'macau',platforms:['youtube','douyin'],youtubeContentForm:'long_video'});
    expect(storage.getItem(REGIONAL_SEARCH_STORAGE_KEY)).toContain('macau');
    expect(storage.getItem('trend-engine.filters.v1')).toBe('keep');
  });

  it.each(['token=NOT_A_REAL_SECRET','Bearer NOT_A_REAL_SECRET','https://example.com/file?signature=NOT_A_REAL_SECRET'])('敏感搜尋字不原樣寫入瀏覽器儲存：%s', (keyword) => {
    const storage=new MemoryStorage(); storage.setItem('unrelated.owner.data','keep');
    const repository=new LocalRegionalSearchPreferencesRepository(storage);
    repository.save({...DEFAULT_REGIONAL_SEARCH_FILTERS,keyword});
    expect(storage.getItem(REGIONAL_SEARCH_STORAGE_KEY)).not.toContain('NOT_A_REAL_SECRET');
    expect(repository.read().keyword).toBe('');
    expect(storage.getItem('unrelated.owner.data')).toBe('keep');
  });

  it('舊儲存的敏感搜尋字會清空但保留其他篩選條件', () => {
    const storage=new MemoryStorage(); const repository=new LocalRegionalSearchPreferencesRepository(storage);
    storage.setItem(REGIONAL_SEARCH_STORAGE_KEY,JSON.stringify({...DEFAULT_REGIONAL_SEARCH_FILTERS,keyword:'accessToken=NOT_A_REAL_SECRET',region:'hong_kong',platforms:['youtube','xiaohongshu'],timeRangeHours:72}));
    const result=repository.read();
    expect(result).toMatchObject({keyword:'',region:'hong_kong',platforms:['youtube','xiaohongshu'],timeRangeHours:72});
    expect(storage.getItem(REGIONAL_SEARCH_STORAGE_KEY)).not.toContain('NOT_A_REAL_SECRET');
  });

  it.each([
    ['https://www.douyin.com/video/1234567890','douyin'],
    ['https://www.kuaishou.com/short-video/abcDEF123','kuaishou'],
    ['https://www.xiaohongshu.com/explore/abc123def456','xiaohongshu'],
    ['https://www.bilibili.com/video/BV1abc123','bilibili'],
  ] as const)('安全辨識中國大陸平台網址：%s', (url,platform) => {
    expect(normalizeVideoUrl(url).platform).toBe(platform);
  });

  it.each([
    'https://www.douyin.com.evil.example/video/1234567890',
    'https://www.kuaishou.com.evil.example/short-video/abcDEF123',
    'https://www.xiaohongshu.com.evil.example/explore/abc123def456',
    'https://www.bilibili.com.evil.example/video/BV1abc123',
  ])('拒絕偽造的中國大陸平台主機：%s', (url) => {
    expect(()=>normalizeVideoUrl(url)).toThrow('只接受八個指定影音平台的官方網域');
  });

  it('YouTube匯入在網址正規化前判斷長影音與Shorts', () => {
    const storage=new MemoryStorage();
    const service=new VideoDiscoveryService(new LocalVideoCandidateRepository(storage),()=>new Date('2026-08-30T00:00:00Z'));
    const longVideo=service.importCandidate({url:'https://www.youtube.com/watch?v=abcdefghijk',title:'長影音',acquisitionMethod:'user_shared'}).candidate;
    const shortVideo=service.importCandidate({url:'https://www.youtube.com/shorts/lmnopqrstuv',title:'短影音',acquisitionMethod:'user_shared'}).candidate;
    expect(longVideo.contentForm).toBe('long_video');
    expect(shortVideo.contentForm).toBe('shorts');
    expect(shortVideo.normalizedUrl).toBe('https://www.youtube.com/watch?v=lmnopqrstuv');
  });

  it('地區切換會套用預設平台，套用後重新進入頁面仍保留', async () => {
    const first=render(<MemoryRouter initialEntries={['/trends/video-search']}><App /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText('選擇地區'),{target:{value:'hong_kong'}});
    await waitFor(()=>{
      expect(screen.getByRole('checkbox',{name:'小紅書'})).toBeChecked();
      expect(screen.getByRole('checkbox',{name:'TikTok'})).not.toBeChecked();
    });
    fireEvent.change(screen.getByLabelText('選擇情報類型'),{target:{value:'video_viral'}});
    fireEvent.click(screen.getByRole('button',{name:'套用篩選'}));
    expect(await screen.findByText(/已套用並保存/u)).toBeInTheDocument();
    first.unmount();
    render(<MemoryRouter initialEntries={['/trends/video-search']}><App /></MemoryRouter>);
    await waitFor(()=>{
      expect(screen.getByLabelText('選擇地區')).toHaveValue('hong_kong');
      expect(screen.getByLabelText('選擇情報類型')).toHaveValue('video_viral');
    });
  });

  it('來源頁分成熱搜、爆紅影音與新聞佐證三群', async () => {
    render(<MemoryRouter initialEntries={['/trends/sources']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'熱搜來源'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'爆紅影音來源'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'新聞佐證來源'})).toBeInTheDocument();
  });

  it('A版路由與模組仍隔離且Build掃描保護秘密與假資料', () => {
    expect(appSource).not.toMatch(/Onboarding|OAuthCallback|PlatformConnections/u);
    expect(buildVerifier).toContain('YOUTUBE_API_KEY');
    expect(buildVerifier).toContain('已自動監控八大平台');
  });
});
