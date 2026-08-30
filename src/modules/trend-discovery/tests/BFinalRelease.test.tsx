import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { evaluateTrendFreshness, retainedExclusiveTopicIds, retainLastSuccessfulTopics, TREND_REFRESH_GRACE_MS, TREND_REFRESH_INTERVAL_MS } from '../domain/TrendFreshness';
import { growthPresentation } from '../presentation/formatters';
import styles from '../../../styles.css?raw';
import productHomeSource from '../presentation/ProductHomePage.tsx?raw';
import buildVerifier from '../../../../scripts/verify-public-build.mjs?raw';
import appSource from '../../../app/App.tsx?raw';
import trendListSource from '../presentation/TrendListPages.tsx?raw';

const updatedAt = '2026-08-29T00:00:00.000Z';

describe('B版公開測試封版', () => {
  it('審核頁依來源狀態動態顯示GDELT與YouTube已啟用', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByText('目前有 2 個真實來源正常運作：GDELT全球新聞資料與YouTube影音平台。')).toBeInTheDocument();
    expect(screen.getByText('GDELT全球新聞資料、YouTube影音平台')).toBeInTheDocument();
    expect(screen.getByText('YouTube 本輪取得 1 筆；資料量仍少，請搭配其他來源判斷。')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('YouTube 需完成官方金鑰設定後才會啟用');
  });

  it('來源失敗時審核頁與頂部狀態同步顯示失敗來源', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ topics: [], metadata: {
      dataState:'stale', lastSuccessAt:updatedAt, lastAttemptAt:'2026-08-29T00:45:00.000Z', nextRetryAt:'2026-08-29T01:00:00.000Z', nextRefreshAt:'2026-08-29T00:15:00.000Z', staleAfterAt:'2026-08-29T00:30:00.000Z', isRefreshing:false, message:'資料更新延遲｜目前顯示最近一次成功結果',
      sourceStatuses:[
        {code:'gdelt',name:'GDELT全球新聞資料',state:'temporary_failure',message:'連線暫時失敗',lastSuccessAt:updatedAt,lastAttemptAt:'2026-08-29T00:45:00.000Z',nextRetryAt:'2026-08-29T01:00:00.000Z',fetchedCount:0},
        {code:'youtube',name:'YouTube影音平台',state:'enabled',message:'運作正常',lastSuccessAt:updatedAt,lastAttemptAt:updatedAt,nextRetryAt:null,fetchedCount:1},
      ],
    } })));
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByText(/異常來源：GDELT全球新聞資料/)).toBeInTheDocument();
    expect(await screen.findByText(/● 來源異常：GDELT全球新聞資料/)).toBeInTheDocument();
  });

  it('審核頁的正常來源摘要不是容易過期的固定來源文案', () => {
    expect(productHomeSource).toContain('sourceStatuses.filter');
    expect(productHomeSource).not.toContain('YouTube 需完成官方金鑰設定後才會啟用');
  });

  it('搜尋頁上次更新採用來源API成功時間而非瀏覽器取得時間', () => {
    expect(trendListSource).toContain("metadata?.lastSuccessAt ? formatDateTime(metadata.lastSuccessAt)");
    expect(trendListSource).not.toContain('latest.refreshedAt');
  });

  it('審核頁動態列出等待官方資格的來源', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByText('Google熱門搜尋趨勢、Threads社群討論')).toBeInTheDocument();
  });

  it('資料新鮮度依15分鐘更新週期與15分鐘緩衝判定', () => {
    const start = new Date(updatedAt);
    expect(evaluateTrendFreshness(updatedAt,true,new Date(start.getTime()+TREND_REFRESH_INTERVAL_MS-1)).dataState).toBe('fresh');
    expect(evaluateTrendFreshness(updatedAt,true,new Date(start.getTime()+TREND_REFRESH_INTERVAL_MS+1))).toMatchObject({dataState:'waiting',message:'顯示最近一次成功資料'});
    expect(evaluateTrendFreshness(updatedAt,true,new Date(start.getTime()+TREND_REFRESH_INTERVAL_MS+TREND_REFRESH_GRACE_MS+1))).toMatchObject({dataState:'stale',message:'資料更新延遲｜目前顯示最近一次成功結果'});
  });

  it('單一快照只顯示建立基準，不顯示加零或熱度由X變為X', () => {
    const result=growthPresentation('baseline_pending',null,[{at:updatedAt,value:40}]);
    expect(result.label).toBe('正在建立增速基準');
    expect(`${result.summary}${result.ariaLabel}`).not.toMatch(/\+0%|熱度由 40 變為 40/u);
  });

  it('兩個相同快照顯示0%與目前無明顯變化', () => {
    const result=growthPresentation('measured',0,[{at:updatedAt,value:40},{at:'2026-08-29T00:15:00.000Z',value:40}]);
    expect(result.label).toBe('0%');
    expect(result.summary).toContain('目前無明顯變化');
  });

  it('兩個上升快照顯示正增速並可追溯時間與數值', () => {
    const result=growthPresentation('measured',25,[{at:updatedAt,value:40},{at:'2026-08-29T00:15:00.000Z',value:50}]);
    expect(result.label).toBe('+25%');
    expect(result.summary).toContain('熱度 40');
    expect(result.summary).toContain('熱度 50');
  });

  it('來源失敗且沒有新資料時保留最近一次成功主題', () => {
    const previous=[{id:'real-topic'}];
    expect(retainLastSuccessfulTopics(previous,[])).toBe(previous);
    expect(retainLastSuccessfulTopics(previous,[{id:'new-topic'}])).toEqual([{id:'new-topic'}]);
  });

  it('單一來源本輪零筆時保留該來源最近成功的獨立主題', () => {
    const previous=[
      {id:'news-old',sourcePlatforms:['gdelt_news']},
      {id:'youtube-old',sourcePlatforms:['youtube']},
      {id:'cross-old',sourcePlatforms:['gdelt_news','youtube']},
    ];
    const retained=retainedExclusiveTopicIds(previous,[{id:'news-new'}],new Set(['gdelt_news']));
    expect(retained).toEqual(['youtube-old']);
  });

  it('正式藍橘色存在且舊綠色與萊姆主要色已移除', () => {
    for (const color of ['#15243b','#243b63','#ff6b57','#3d8bff','#f5f7fb','#172033']) expect(styles.toLowerCase()).toContain(color);
    for (const color of ['#12372d','#1e5142','#cfff3d']) expect(styles.toLowerCase()).not.toContain(color);
  });

  it('公開建置檢查會拒絕舊配色、秘密名稱與測試題目', () => {
    expect(buildVerifier).toContain("['#12372d', '#1e5142', '#cfff3d']");
    expect(buildVerifier).toContain('YOUTUBE_API_KEY');
    expect(buildVerifier).toContain('已自動監控八大平台');
  });

  it('深藍白字與珊瑚橘深色字皆達WCAG AA一般文字對比', () => {
    expect(contrast('#15243B','#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#FF6B57','#172033')).toBeGreaterThanOrEqual(4.5);
  });

  it('手機導覽保持四項且沒有可水平捲動的版面規則', async () => {
    render(<MemoryRouter initialEntries={['/trends']}><App /></MemoryRouter>);
    const navigation=screen.getByRole('navigation',{name:'手機主要導覽'});
    await waitFor(()=>expect(navigation.querySelectorAll(':scope > a, :scope > button')).toHaveLength(4));
    expect(styles).toContain('grid-template-columns: repeat(4,minmax(0,1fr))');
    expect(styles).not.toMatch(/\.mobile-nav[^}]*overflow-x:\s*(auto|scroll)/u);
  });

  it('A版路由只保留產品邊界，不匯入A版頁面', () => {
    expect(appSource).toContain('ProductBoundaryPage');
    expect(appSource).not.toMatch(/Onboarding|OAuthCallback|PlatformConnections/u);
  });

  it('全站公開狀態使用正式產品文字', async () => {
    render(<MemoryRouter initialEntries={['/trends']}><App /></MemoryRouter>);
    expect(await screen.findByText('真實來源')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/審核|公開測試|測試版|候選版|RC2|Mock|工作包/u);
  });
});

function contrast(left:string,right:string){
  const luminance=(hex:string)=>{
    const values=[1,3,5].map((index)=>Number.parseInt(hex.slice(index,index+2),16)/255).map((value)=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
    return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;
  };
  const [high,low]=[luminance(left),luminance(right)].sort((a,b)=>b-a);
  return (high+0.05)/(low+0.05);
}
