import type { TrendApiMetadata } from '../../src/modules/trend-discovery/application/TrendSourceProvider';
import type { TrendTopic } from '../../src/modules/trend-discovery/domain/TrendTopic';
import { D1TrendRepository } from './D1TrendRepository';
import { collectGdelt, collectYouTube, type ProviderCollectionResult } from './providers';
import { buildTrendTopics, clusterSourceRecords, trendTokens } from './topicBuilder';

const CACHE_TTL_MS=15*60*1000;

function failure(provider:'gdelt'|'youtube', error:unknown, now:Date):ProviderCollectionResult {
  const message=error instanceof Error?error.message:'未知來源錯誤';
  return {provider,state:'temporary_failure',message:`${provider==='gdelt'?'GDELT':'YouTube'}來源暫時失敗：${message}`,records:[],attemptedAt:now.toISOString(),completedAt:new Date().toISOString(),nextRetryAt:new Date(now.getTime()+15*60*1000).toISOString(),errorType:error instanceof Error?error.name:'unknown'};
}

function queriesFromRecords(records: Awaited<ReturnType<typeof collectGdelt>>['records']) {
  return clusterSourceRecords(records).slice(0,3).map((cluster)=>[...trendTokens(cluster[0].title)].slice(0,3).join(' ')).filter(Boolean);
}

export async function refreshTrendData(env:Env, fetcher:typeof fetch=fetch, now=new Date()) {
  const repository=new D1TrendRepository(env.TREND_DB);
  const acquired=await repository.acquireRefreshLock(now);
  if(!acquired) return {topics:await repository.listTopics(),refreshed:false,locked:true};
  try{
    const previous=await repository.latestSnapshots();
    let gdelt:ProviderCollectionResult;
    try{gdelt=await collectGdelt(fetcher,now);}catch(error){gdelt=failure('gdelt',error,now);}
    const youtube=await collectYouTube(fetcher,env.YOUTUBE_API_KEY,queriesFromRecords(gdelt.records),now);
    await repository.saveProviderRun(gdelt,gdelt.records.length,0);
    await repository.saveProviderRun(youtube,youtube.records.length,0);
    const records=[...gdelt.records,...youtube.records];
    if(!records.length) return {topics:await repository.listTopics(),refreshed:false,locked:false};
    const built=buildTrendTopics(records,previous,now);
    await repository.saveTopics(built.topics,records,built.signalTopicIds,now.toISOString());
    return {topics:built.topics,refreshed:true,locked:false};
  }finally{await repository.releaseRefreshLock();}
}

export async function trendResponse(env:Env, execution:{waitUntil(promise:Promise<unknown>):void}, fetcher:typeof fetch=fetch, now=new Date()) {
  const repository=new D1TrendRepository(env.TREND_DB);
  let topics=await repository.listTopics();
  let latestAt=topics[0]?.calculatedAt??null;
  let stale=!latestAt||now.getTime()-new Date(latestAt).getTime()>CACHE_TTL_MS;
  let isRefreshing=false;
  if(!topics.length){
    const refreshed=await refreshTrendData(env,fetcher,now);
    topics=refreshed.topics;
    latestAt=topics[0]?.calculatedAt??null;
    stale=!latestAt||now.getTime()-new Date(latestAt).getTime()>CACHE_TTL_MS;
  }
  else if(stale){isRefreshing=true;execution.waitUntil(refreshTrendData(env,fetcher,now).then(()=>undefined));}
  const statuses=await repository.providerStatuses();
  const lastSuccessAt=topics[0]?.calculatedAt??null;
  const lastAttemptAt=statuses.map((item)=>item.lastAttemptAt).filter((value):value is string=>Boolean(value)).sort().at(-1)??null;
  const nextRetryAt=statuses.map((item)=>item.nextRetryAt).filter((value):value is string=>Boolean(value)).sort()[0]??null;
  const metadata:TrendApiMetadata={
    dataState:topics.length?(stale?'stale':'fresh'):'empty',lastSuccessAt,lastAttemptAt,nextRetryAt,isRefreshing,sourceStatuses:statuses,
    message:topics.length?(stale?'資料更新延遲｜目前顯示最近一次成功結果':'真實來源資料已更新'):'目前沒有可用的真實熱門資料，請查看來源狀態。',
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
