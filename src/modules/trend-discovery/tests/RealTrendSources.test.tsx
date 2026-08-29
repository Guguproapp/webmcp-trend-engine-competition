import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { collectGdelt, collectYouTube, type RealSourceRecord } from '../../../../functions/_shared/providers';
import { buildTrendTopics, clusterSourceRecords, normalizeTrendTitle, titleSimilarity, type PreviousTopicSnapshot } from '../../../../functions/_shared/topicBuilder';
import migration from '../../../../migrations/0001_real_trend_schema.sql?raw';
import repositorySource from '../../../../functions/_shared/D1TrendRepository.ts?raw';

const now=new Date('2026-08-29T00:00:00.000Z');
const gdeltPayload={articles:[{url:'https://news.example/tw/1',title:'快訊｜台灣午餐價格再成焦點',seendate:'20260828T230000Z',domain:'news.example',language:'Chinese',sourcecountry:'Taiwan'}]};
const response=(body:unknown,status=200)=>Response.json(body,{status});

describe('真實來源提供者',()=>{
  it('將GDELT官方欄位轉成可追溯來源且不保存全文',async()=>{
    const fetcher=vi.fn(async()=>response(gdeltPayload)); const result=await collectGdelt(fetcher as typeof fetch,now);
    expect(result.state).toBe('enabled'); expect(result.records).toHaveLength(1); expect(result.records[0]).toMatchObject({provider:'gdelt',publisher:'news.example',url:'https://news.example/tw/1',viewCount:null}); expect(JSON.stringify(result.records)).not.toContain('content');
  });
  it('GDELT相同網址的預設連接埠變體只保存一次',async()=>{const fetcher=vi.fn(async()=>response({articles:[gdeltPayload.articles[0],{...gdeltPayload.articles[0],url:'https://news.example:443/tw/1'}]}));const result=await collectGdelt(fetcher as typeof fetch,now);expect(result.records).toHaveLength(1);expect(result.records[0].url).toBe('https://news.example/tw/1');});
  it('HTTPS失敗時只向GDELT官方備援網址取公開索引',async()=>{
    const fetcher=vi.fn().mockRejectedValueOnce(new Error('certificate')).mockResolvedValueOnce(response(gdeltPayload)); const result=await collectGdelt(fetcher as typeof fetch,now);
    expect(fetcher).toHaveBeenCalledTimes(2); expect(String(fetcher.mock.calls[1][0])).toMatch(/^http:\/\/api\.gdeltproject\.org/u); expect(result.errorType).toBe('tls_fallback');
  });
  it('GDELT單次查詢限制100筆以控制來源負載與伺服器CPU',async()=>{const fetcher=vi.fn(async(input:RequestInfo|URL)=>{void input;return response(gdeltPayload);});await collectGdelt(fetcher as typeof fetch,now);expect(String(fetcher.mock.calls[0][0])).toContain('maxrecords=100');});
  it('YouTube先搜尋識別碼再批次取得官方統計',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(response({items:[{id:{videoId:'abc123'}}]})).mockResolvedValueOnce(response({items:[{id:'abc123',snippet:{title:'台灣午餐價格討論',channelTitle:'測試頻道',publishedAt:'2026-08-28T22:00:00Z'},statistics:{viewCount:'1200',likeCount:'80',commentCount:'12'}}]}));
    const result=await collectYouTube(fetcher as typeof fetch,'secret',['午餐 價格'],now);
    expect(result.state).toBe('enabled'); expect(result.records[0]).toMatchObject({provider:'youtube',viewCount:1200,likeCount:80,commentCount:12}); expect(String(fetcher.mock.calls[0][0])).toContain('regionCode=TW'); expect(String(fetcher.mock.calls[0][0])).toContain('relevanceLanguage=zh-Hant');
  });
  it('沒有YouTube金鑰時回報等待授權且不發出請求',async()=>{const fetcher=vi.fn();const result=await collectYouTube(fetcher as typeof fetch,undefined,['測試'],now);expect(result.state).toBe('waiting_authorization');expect(fetcher).not.toHaveBeenCalled();});
  it('YouTube配額用完會明確標示且不建立假資料',async()=>{const fetcher=vi.fn(async()=>response({error:{errors:[{reason:'quotaExceeded'}],message:'quota'}},403));const result=await collectYouTube(fetcher as typeof fetch,'secret',['測試'],now);expect(result.state).toBe('quota_exceeded');expect(result.records).toHaveLength(0);});
});

const record=(overrides:Partial<RealSourceRecord>={}):RealSourceRecord=>({provider:'gdelt',originalId:'one',title:'台灣午餐價格變化引發討論',publisher:'a.example',url:'https://a.example/one',publishedAt:'2026-08-28T23:00:00Z',fetchedAt:now.toISOString(),viewCount:null,likeCount:null,commentCount:null,reportCount:null,language:'Chinese',sourceCountry:'Taiwan',...overrides});

describe('真實事件合併與快照評分',()=>{
  it('正規化宣傳前綴並以可解釋詞組比較相同事件',()=>{expect(normalizeTrendTitle('快訊：台灣午餐價格變化')).toBe(normalizeTrendTitle('台灣午餐價格變化'));expect(titleSimilarity('午餐價格變化引發討論','外食午餐價格變化引發網友討論')).toBeGreaterThan(.36);});
  it('相同網址或影片識別碼不會重複',()=>{expect(clusterSourceRecords([record(),record()]).flat()).toHaveLength(1);});
  it('相同事件在合理時間內合併並保留不同來源',()=>{const clusters=clusterSourceRecords([record(),record({originalId:'two',url:'https://b.example/two',publisher:'b.example',title:'外食午餐價格變化引發網友討論'})]);expect(clusters[0]).toHaveLength(2);});
  it('候選群組達上限時仍保留已成功取得的每個真實來源',()=>{const news=Array.from({length:31},(_,index)=>record({originalId:`news-${index}`,url:`https://news.example/${index}`,title:`event${index.toString(36)} marker${(index*997).toString(36)}`,publishedAt:new Date(now.getTime()-index*60000).toISOString()}));const youtube=record({provider:'youtube',originalId:'video-retained',url:'https://youtube.com/watch?v=video-retained',title:'完全不同的影音觀察主題',publishedAt:new Date(now.getTime()-48*3600000).toISOString(),viewCount:100});const clusters=clusterSourceRecords([...news,youtube]);expect(clusters).toHaveLength(30);expect(clusters.flat().some((item)=>item.provider==='youtube')).toBe(true);});
  it('相同媒體版型文字不會把不同事件錯誤合併',()=>{const clusters=clusterSourceRecords([record({title:'《TAIPEI TIMES》Prosecutors indict nine in camera case'}),record({originalId:'two',url:'https://b.example/two',title:'《TAIPEI TIMES》Population to plummet council warns'})]);expect(clusters).toHaveLength(2);});
  it('媒體名稱與版面欄位不會把不同英文新聞誤合併',()=>{const clusters=clusterSourceRecords([record({title:'《 TAIPEI TIMES 》 Population to plummet, council warns - 焦點'}),record({originalId:'two',url:'https://b.example/two',title:'《 TAIPEI TIMES 》 Groups urge accuracy at US museum - 焦點'})]);expect(clusters).toHaveLength(2);});
  it('固定專欄名稱不會把不同人物專訪誤合併',()=>{const first='職場達人 － 堯平靠甜點 闖出一片天 - 專題周報';const second='職場達人 － 黃炳璋協助民眾 重拾健康生活力 - 專題周報';expect(titleSimilarity(first,second)).toBeLessThan(.42);const clusters=clusterSourceRecords([record({title:first}),record({originalId:'two',url:'https://b.example/two',title:second})]);expect(clusters).toHaveLength(2);});
  it('第一次快照不顯示假增速並限制為證據不足',()=>{const built=buildTrendTopics([record()],new Map(),now);expect(built.topics[0].growthStatus).toBe('baseline_pending');expect(built.topics[0].growthRate).toBe(0);expect(built.topics[0].status).toBe('insufficient_evidence');expect(built.topics[0].scoreDetails.missingData).toContain('正在建立增速基準');});
  it('相同時間的快照不視為第二次有效快照',()=>{const first=buildTrendTopics([record()],new Map(),now).topics[0];const prior:PreviousTopicSnapshot={topicId:first.id,capturedAt:now.toISOString(),reportCount:1,viewCount:0,likeCount:0,commentCount:0,heatValue:first.currentHeat};const built=buildTrendTopics([record()],new Map([[first.id,prior]]),now);expect(built.topics[0].growthStatus).toBe('baseline_pending');expect(built.topics[0].status).toBe('insufficient_evidence');});
  it('第二次快照以真實活動差異及經過時間計算增速',()=>{const first=buildTrendTopics([record()],new Map(),now).topics[0];const prior:PreviousTopicSnapshot={topicId:first.id,capturedAt:'2026-08-28T23:30:00Z',reportCount:0,viewCount:0,likeCount:0,commentCount:0,heatValue:10};const built=buildTrendTopics([record(),record({originalId:'two',url:'https://b.example/two',publisher:'b.example'})],new Map([[first.id,prior]]),now);expect(built.topics[0].growthStatus).toBe('measured');expect(built.topics[0].growthRate).toBe(100);});
  it('跨來源程度只計算真正不同提供者',()=>{const youtube=record({provider:'youtube',originalId:'video',url:'https://youtube.com/watch?v=video',viewCount:5000,likeCount:100,commentCount:10});const topic=buildTrendTopics([record(),youtube],new Map(),now).topics[0];expect(topic.sourcePlatforms).toEqual(expect.arrayContaining(['gdelt_news','youtube']));expect(topic.crossPlatformResonance).toBeGreaterThan(0);});
  it('媒體名中的字母組合不會誤判科技分類且洪災會標示自然事件',()=>{const media=buildTrendTopics([record({title:'TAIPEI TIMES Groups urge accuracy at museum'})],new Map(),now).topics[0];expect(media.category).not.toBe('科技與AI');const flood=buildTrendTopics([record({title:'尼泊爾與中國邊境洪災失聯逾千人'})],new Map(),now).topics[0];expect(flood.isNaturalDisaster).toBe(true);expect(flood.isPolitical).toBe(false);});
});

describe('公開介面真實資料邊界',()=>{
  it('D1 Repository涵蓋六張必要資料表、參數綁定、批次保存與依來源取回最近成功主題',()=>{for(const table of ['trend_topics','trend_signals','trend_topic_signals','trend_snapshots','trend_provider_runs','trend_refresh_locks'])expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);expect(repositorySource).toContain('.bind(');expect(repositorySource).toContain('this.db.batch');expect(repositorySource).toContain('retainTopics');expect(repositorySource).toContain('listTopicsForProvider');});
  it('手機主要導覽固定只有熱門、搜尋、觀察、更多四項',()=>{render(<MemoryRouter initialEntries={['/trends']}><App/></MemoryRouter>);const nav=screen.getByRole('navigation',{name:'手機主要導覽'});expect(nav.querySelectorAll(':scope > a, :scope > button')).toHaveLength(4);expect(nav).toHaveTextContent('熱門');expect(nav).toHaveTextContent('搜尋');expect(nav).toHaveTextContent('觀察');expect(nav).toHaveTextContent('更多');});
  it('更多選單具有展開語意、焦點移入並可用Escape關閉後回焦',async()=>{render(<MemoryRouter initialEntries={['/trends']}><App/></MemoryRouter>);const more=screen.getByRole('button',{name:/更多/});fireEvent.click(more);expect(more).toHaveAttribute('aria-expanded','true');const first=screen.getByRole('menuitem',{name:/審核說明/});await waitFor(()=>expect(first).toHaveFocus());fireEvent.keyDown(screen.getByRole('menu'),{key:'Escape'});await waitFor(()=>expect(more).toHaveFocus());expect(more).toHaveAttribute('aria-expanded','false');});
  it('前端服務只呼叫同網域API且Production入口不匯入展示Provider',async()=>{const services=await import('../../../app/services?raw');const provider=await import('../infrastructure/ApiTrendSourceProvider?raw');expect(services.default).not.toContain('MockTrendSourceProvider');expect(provider.default).toContain("'/api/trends'");expect(provider.default).not.toContain('YOUTUBE_API_KEY');});
});
