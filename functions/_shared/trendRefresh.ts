import type { TrendApiMetadata } from '../../src/modules/trend-discovery/application/TrendSourceProvider';
import type { TrendTopic } from '../../src/modules/trend-discovery/domain/TrendTopic';
import { D1TrendRepository } from './D1TrendRepository';
import { collectGdelt, collectYouTube, type ProviderCollectionResult } from './providers';
import { buildTrendTopics, clusterSourceRecords, trendTokens } from './topicBuilder';
import { evaluateTrendFreshness, retainedExclusiveTopicIds, retainLastSuccessfulTopics, TREND_REFRESH_INTERVAL_MS } from '../../src/modules/trend-discovery/domain/TrendFreshness';

interface TrendRefreshRepository {
  acquireRefreshLock(now: Date): Promise<boolean>;
  releaseRefreshLock(): Promise<void>;
  listTopics(): Promise<TrendTopic[]>;
  listTopicsForProvider(provider: 'gdelt' | 'youtube'): Promise<TrendTopic[]>;
  latestSnapshots(): ReturnType<D1TrendRepository['latestSnapshots']>;
  saveProviderRun(run: ProviderCollectionResult, addedCount: number, mergedCount: number): Promise<void>;
  saveTopics: D1TrendRepository['saveTopics'];
  retainTopics(topicIds: string[], updatedAt: string): Promise<void>;
}

type TrendRefreshRepositoryFactory = (db: D1Database) => TrendRefreshRepository;

export function applySecureGdeltAvailability(run: ProviderCollectionResult, hasLastSafeData: boolean): ProviderCollectionResult {
  if (run.provider !== 'gdelt' || run.state === 'enabled') return run;
  return {
    ...run,
    state: hasLastSafeData ? 'delayed' : 'failed',
    message: hasLastSafeData ? '目前顯示最近一次安全取得的資料。' : 'GDELT新聞來源目前無法安全連線。',
    records: [],
  };
}

function failure(provider:'gdelt'|'youtube', error:unknown, now:Date):ProviderCollectionResult {
  const message=error instanceof Error?error.message:'未知來源錯誤';
  return {provider,state:'temporary_failure',message:`${provider==='gdelt'?'GDELT':'YouTube'}來源暫時失敗：${message}`,records:[],attemptedAt:now.toISOString(),completedAt:new Date().toISOString(),nextRetryAt:new Date(now.getTime()+15*60*1000).toISOString(),errorType:error instanceof Error?error.name:'unknown'};
}

function queriesFromRecords(records: Awaited<ReturnType<typeof collectGdelt>>['records']) {
  return clusterSourceRecords(records).slice(0,3).map((cluster)=>[...trendTokens(cluster[0].title)].slice(0,3).join(' ')).filter(Boolean);
}

export async function refreshTrendData(env:Env, fetcher:typeof fetch=fetch, now=new Date(), createRepository:TrendRefreshRepositoryFactory=(db)=>new D1TrendRepository(db)) {
  const repository=createRepository(env.TREND_DB);
  const acquired=await repository.acquireRefreshLock(now);
  if(!acquired) return {topics:await repository.listTopics(),refreshed:false,locked:true};
  try{
    const previousTopics=await repository.listTopics();
    const previous=await repository.latestSnapshots();
    let gdelt:ProviderCollectionResult;
    try{gdelt=await collectGdelt(fetcher,now);}catch(error){gdelt=failure('gdelt',error,now);}
    const youtube=await collectYouTube(fetcher,env.YOUTUBE_API_KEY,queriesFromRecords(gdelt.records),now);
    const records=[...gdelt.records,...youtube.records];
    const missingProviders=(['gdelt','youtube'] as const).filter((provider)=>!records.some((record)=>record.provider===provider));
    const retainedByProvider=new Map(await Promise.all(missingProviders.map(async(provider)=>[provider,await repository.listTopicsForProvider(provider)] as const)));
    const retainedProviderTopics=[...retainedByProvider.values()].flat();
    gdelt=applySecureGdeltAvailability(gdelt,(retainedByProvider.get('gdelt')?.length??0)>0);
    await repository.saveProviderRun(gdelt,gdelt.records.length,0);
    await repository.saveProviderRun(youtube,youtube.records.length,0);
    const previousCandidates=[...new Map([...previousTopics,...retainedProviderTopics].map((topic)=>[topic.id,topic])).values()];
    const updatedAt=now.toISOString();
    if(!records.length) {
      const retainedIds=retainedExclusiveTopicIds(previousCandidates,[],new Set());
      await repository.retainTopics(retainedIds,updatedAt);
      return {topics:retainLastSuccessfulTopics(await repository.listTopics(),[]),refreshed:false,locked:false};
    }
    const built=buildTrendTopics(records,previous,now);
    await repository.saveTopics(built.topics,records,built.signalTopicIds,updatedAt);
    const refreshedPlatforms=new Set(records.map((record)=>record.provider==='youtube'?'youtube':'gdelt_news'));
    await repository.retainTopics(retainedExclusiveTopicIds(previousCandidates,built.topics,refreshedPlatforms),updatedAt);
    return {topics:await repository.listTopics(),refreshed:true,locked:false};
  }finally{await repository.releaseRefreshLock();}
}

export async function trendResponse(env:Env, execution:{waitUntil(promise:Promise<unknown>):void}, fetcher:typeof fetch=fetch, now=new Date()) {
  const repository=new D1TrendRepository(env.TREND_DB);
  let topics=await repository.listTopics();
  const latestAt=topics.map((topic)=>topic.calculatedAt).sort().at(-1)??null;
  const dueForRefresh=!latestAt||now.getTime()-new Date(latestAt).getTime()>TREND_REFRESH_INTERVAL_MS;
  let isRefreshing=false;
  if(!topics.length){
    const refreshed=await refreshTrendData(env,fetcher,now);
    topics=refreshed.topics;
  }
  else if(dueForRefresh){isRefreshing=true;execution.waitUntil(refreshTrendData(env,fetcher,now).then(()=>undefined));}
  const statuses=await repository.providerStatuses();
  const lastSuccessAt=topics.map((topic)=>topic.calculatedAt).sort().at(-1)??null;
  const lastAttemptAt=statuses.map((item)=>item.lastAttemptAt).filter((value):value is string=>Boolean(value)).sort().at(-1)??null;
  const nextRetryAt=statuses.map((item)=>item.nextRetryAt).filter((value):value is string=>Boolean(value)).sort()[0]??null;
  const freshness=evaluateTrendFreshness(lastSuccessAt,topics.length>0,now);
  const metadata:TrendApiMetadata={
    ...freshness,lastSuccessAt,lastAttemptAt,nextRetryAt,isRefreshing,sourceStatuses:statuses,
  };
  return {topics,metadata};
}

export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'}});}

export async function secureTokenMatches(received:string|undefined,expected:string|undefined){
  if(!received||!expected)return false;
  const encoder=new TextEncoder();
  const [left,right]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(received)),crypto.subtle.digest('SHA-256',encoder.encode(expected))]);
  const leftBytes=new Uint8Array(left); const rightBytes=new Uint8Array(right); let difference=0;
  for(let index=0;index<leftBytes.length;index+=1)difference|=leftBytes[index]^rightBytes[index];
  return difference===0;
}

export function topicById(topics:TrendTopic[],id:string){return topics.find((topic)=>topic.id===id);}
