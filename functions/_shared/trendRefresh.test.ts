import { describe, expect, it, vi } from 'vitest';
import { collectGdelt, type ProviderCollectionResult, type RealSourceRecord } from './providers';
import { applySecureGdeltAvailability, refreshTrendData } from './trendRefresh';
import { buildTrendTopics, type PreviousTopicSnapshot } from './topicBuilder';
import type { TrendTopic } from '../../src/modules/trend-discovery/domain/TrendTopic';

const now=new Date('2026-08-29T00:00:00.000Z');
const gdeltPayload={articles:[{url:'https://news.example/tw/1',title:'快訊｜台灣午餐價格再成焦點',seendate:'20260828T230000Z',domain:'news.example',language:'Chinese',sourcecountry:'Taiwan'}]};
const response=(body:unknown,status=200)=>Response.json(body,{status});
const sourceRecord:RealSourceRecord={provider:'gdelt',originalId:'one',title:'台灣午餐價格變化引發討論',publisher:'a.example',url:'https://a.example/one',publishedAt:'2026-08-28T23:00:00Z',fetchedAt:now.toISOString(),viewCount:null,likeCount:null,commentCount:null,reportCount:null,language:'Chinese',sourceCountry:'Taiwan'};

function refreshRepository(previousTopics:TrendTopic[]) {
  return {
    acquireRefreshLock:vi.fn(async(current:Date)=>{void current;return true;}), releaseRefreshLock:vi.fn(async()=>undefined),
    listTopics:vi.fn(async()=>previousTopics), latestSnapshots:vi.fn(async()=>new Map<string,PreviousTopicSnapshot>()),
    listTopicsForProvider:vi.fn(async(provider:'gdelt'|'youtube')=>provider==='gdelt'?previousTopics:[]),
    saveProviderRun:vi.fn(async(run:ProviderCollectionResult,added:number,merged:number)=>{void run;void added;void merged;}),
    saveTopics:vi.fn(async(topics:TrendTopic[],records:RealSourceRecord[],signalTopicIds:Map<string,string>,updatedAt:string)=>{void topics;void records;void signalTopicIds;void updatedAt;}),
    retainTopics:vi.fn(async(topicIds:string[],updatedAt:string)=>{void topicIds;void updatedAt;}),
  };
}

function environment():Env {
  return {TREND_DB:{} as D1Database,YOUTUBE_API_KEY:'',REFRESH_ADMIN_TOKEN:''};
}

describe('GDELT安全失敗與最近安全資料保留',()=>{
  const failedRun:ProviderCollectionResult={provider:'gdelt',state:'failed',message:'GDELT新聞來源目前無法安全連線。',records:[],attemptedAt:now.toISOString(),completedAt:now.toISOString(),nextRetryAt:'2026-08-29T00:15:00.000Z',errorType:'Error'};

  it('有最近安全資料時來源狀態為delayed',()=>{expect(applySecureGdeltAvailability(failedRun,true).state).toBe('delayed');});
  it('有最近安全資料時顯示指定安全延遲文字',()=>{expect(applySecureGdeltAvailability(failedRun,true).message).toBe('目前顯示最近一次安全取得的資料。');});
  it('沒有最近安全資料時來源狀態為failed',()=>{expect(applySecureGdeltAvailability(failedRun,false).state).toBe('failed');});
  it('沒有最近安全資料時顯示指定安全失敗文字',()=>{expect(applySecureGdeltAvailability(failedRun,false).message).toBe('GDELT新聞來源目前無法安全連線。');});
  it('安全失敗政策永遠清空來源紀錄且不冒充成功',()=>{const result=applySecureGdeltAvailability({...failedRun,records:[sourceRecord]},true);expect(result.records).toEqual([]);expect(result.state).not.toBe('enabled');});
  it('HTTPS成功結果不會被安全失敗政策改寫',async()=>{const success=await collectGdelt(vi.fn(async()=>response(gdeltPayload)) as typeof fetch,now);expect(applySecureGdeltAvailability(success,true)).toBe(success);});
  it('沒有安全舊資料時不寫入主題、快照或證據並回傳誠實空狀態',async()=>{
    const repository=refreshRepository([]); const result=await refreshTrendData(environment(),vi.fn().mockRejectedValue(new Error('certificate')) as typeof fetch,now,()=>repository);
    expect(repository.saveTopics).not.toHaveBeenCalled(); expect(result.topics).toEqual([]); expect(repository.saveProviderRun.mock.calls[0][0]).toMatchObject({provider:'gdelt',state:'failed',records:[]});
  });
  it('有安全舊資料時只保留原主題且不建立新快照或新證據',async()=>{
    const previous=buildTrendTopics([sourceRecord],new Map(),new Date('2026-08-28T23:30:00.000Z')).topics;
    const repository=refreshRepository(previous); const result=await refreshTrendData(environment(),vi.fn().mockRejectedValue(new Error('certificate')) as typeof fetch,now,()=>repository);
    expect(repository.saveTopics).not.toHaveBeenCalled(); expect(repository.retainTopics).toHaveBeenCalled(); expect(result.topics).toEqual(previous);
  });
  it('保留安全舊資料時保存delayed狀態與本次失敗時間',async()=>{
    const previous=buildTrendTopics([sourceRecord],new Map(),new Date('2026-08-28T23:30:00.000Z')).topics;
    const repository=refreshRepository(previous); await refreshTrendData(environment(),vi.fn().mockRejectedValue(new Error('certificate')) as typeof fetch,now,()=>repository);
    expect(repository.saveProviderRun.mock.calls[0][0]).toMatchObject({provider:'gdelt',state:'delayed',attemptedAt:now.toISOString(),message:'目前顯示最近一次安全取得的資料。'});
  });
  it('來源失敗不會改寫舊排名、增速或最後安全成功時間',async()=>{
    const previous=buildTrendTopics([sourceRecord],new Map(),new Date('2026-08-28T23:30:00.000Z')).topics;
    const repository=refreshRepository(previous); const result=await refreshTrendData(environment(),vi.fn().mockRejectedValue(new Error('certificate')) as typeof fetch,now,()=>repository);
    expect(result.topics[0]).toMatchObject({id:previous[0].id,growthRate:previous[0].growthRate,calculatedAt:'2026-08-28T23:30:00.000Z'});
  });
});
