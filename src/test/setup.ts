import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { MockTrendSourceProvider } from '../modules/trend-discovery/infrastructure/MockTrendSourceProvider';
import { mergeTrendSignals } from '../modules/trend-discovery/application/TrendDiscoveryService';
import { TrendScoreCalculator } from '../modules/trend-discovery/domain/TrendScoreCalculator';

function createTestStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}

Object.defineProperty(window, 'localStorage', { value: createTestStorage(), configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: createTestStorage(), configurable: true });

beforeEach(async () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  const now=new Date(); const provider=new MockTrendSourceProvider(); const signals=await provider.collectSignals({refreshedAt:now.toISOString()}); const topics=mergeTrendSignals(signals,new TrendScoreCalculator(),now).sort((a,b)=>b.totalScore-a.totalScore);
  vi.stubGlobal('fetch',vi.fn(async (input:RequestInfo|URL)=>{
    const url=String(input);
    if(url==='/api/trends')return Response.json({topics,metadata:{dataState:'fresh',lastSuccessAt:now.toISOString(),lastAttemptAt:now.toISOString(),nextRetryAt:null,nextRefreshAt:new Date(now.getTime()+15*60*1000).toISOString(),staleAfterAt:new Date(now.getTime()+30*60*1000).toISOString(),isRefreshing:false,message:'資料已更新',sourceStatuses:[{code:'gdelt',name:'GDELT全球新聞資料',state:'enabled',message:'運作正常',lastSuccessAt:now.toISOString(),lastAttemptAt:now.toISOString(),nextRetryAt:null,fetchedCount:100},{code:'youtube',name:'YouTube影音平台',state:'enabled',message:'運作正常',lastSuccessAt:now.toISOString(),lastAttemptAt:now.toISOString(),nextRetryAt:null,fetchedCount:1},{code:'google_trends',name:'Google熱門搜尋趨勢',state:'waiting_authorization',message:'等待Google官方API存取資格',lastSuccessAt:null,lastAttemptAt:null,nextRetryAt:null,fetchedCount:0},{code:'threads',name:'Threads社群討論',state:'waiting_authorization',message:'等待Threads官方權限',lastSuccessAt:null,lastAttemptAt:null,nextRetryAt:null,fetchedCount:0}]}});
    return Response.json({message:'not found'},{status:404});
  }));
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
