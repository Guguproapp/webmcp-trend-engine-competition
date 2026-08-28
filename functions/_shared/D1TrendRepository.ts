import type { TrendTopic } from '../../src/modules/trend-discovery/domain/TrendTopic';
import type { TrendProviderStatus } from '../../src/modules/trend-discovery/application/TrendSourceProvider';
import type { ProviderCollectionResult, RealSourceRecord } from './providers';
import type { PreviousTopicSnapshot } from './topicBuilder';

interface TopicRow { id:string; canonical_key:string; title:string; summary:string; category:string; keywords_json:string; metrics_json:string; score_json:string; status:string; tier:string; first_seen_at:string; last_seen_at:string; calculated_at:string; updated_at:string; }
interface SignalRow { id:string; provider:string; original_title:string; publisher:string; original_url:string; published_at:string; fetched_at:string; view_count:number|null; like_count:number|null; comment_count:number|null; report_count:number|null; engagement_count:number|null; growth_delta:number|null; growth_status:string; confidence:number; heat_history_json:string; }
interface SnapshotRow { topic_id:string; captured_at:string; report_count:number; view_count:number; like_count:number; comment_count:number; heat_value:number; }
interface ProviderRow { provider:string; state:string; attempted_at:string; completed_at:string|null; fetched_count:number; error_message:string|null; next_retry_at:string|null; }

const sourcePlatform = (provider:string) => provider==='youtube'?'youtube':'gdelt_news';

export class D1TrendRepository {
  constructor(private readonly db: D1Database) {}

  async listTopics(): Promise<TrendTopic[]> {
    const rows = await this.db.prepare('SELECT * FROM trend_topics WHERE updated_at = (SELECT MAX(updated_at) FROM trend_topics) ORDER BY json_extract(score_json, \'$.totalScore\') DESC').all<TopicRow>();
    const topics: TrendTopic[]=[];
    for (const row of rows.results) {
      const signals = await this.db.prepare('SELECT s.* FROM trend_signals s JOIN trend_topic_signals ts ON ts.signal_id=s.id WHERE ts.topic_id=? ORDER BY s.published_at DESC').bind(row.id).all<SignalRow>();
      const metrics = JSON.parse(row.metrics_json) as Omit<TrendTopic,'id'|'canonicalKey'|'title'|'summary'|'category'|'keywords'|'sourceItems'|'status'|'tier'|'scoreDetails'|'firstSeenAt'|'lastSeenAt'|'calculatedAt'>;
      const scoreDetails = JSON.parse(row.score_json) as TrendTopic['scoreDetails'];
      topics.push({
        ...metrics,id:row.id,canonicalKey:row.canonical_key,title:row.title,summary:row.summary,category:row.category as TrendTopic['category'],keywords:JSON.parse(row.keywords_json) as string[],
        sourceItems:signals.results.map((signal)=>({ id:signal.id,platform:sourcePlatform(signal.provider),title:signal.original_title,publisher:signal.publisher,originalUrl:signal.original_url,
          discoveredAt:signal.fetched_at,publishedAt:signal.published_at,fetchedAt:signal.fetched_at,viewCount:signal.view_count,likeCount:signal.like_count,commentCount:signal.comment_count,
          reportCount:signal.report_count,engagementCount:signal.engagement_count,growthDelta:signal.growth_delta,growthStatus:signal.growth_status as TrendTopic['growthStatus'],isMock:false,
          confidence:signal.confidence,heatHistory:JSON.parse(signal.heat_history_json) as TrendTopic['sourceItems'][number]['heatHistory'] })),
        status:row.status as TrendTopic['status'],tier:row.tier as TrendTopic['tier'],scoreDetails,firstSeenAt:row.first_seen_at,lastSeenAt:row.last_seen_at,calculatedAt:row.calculated_at,
      });
    }
    return topics;
  }

  async latestSnapshots() {
    const rows = await this.db.prepare('SELECT s.* FROM trend_snapshots s JOIN (SELECT topic_id, MAX(captured_at) captured_at FROM trend_snapshots GROUP BY topic_id) latest ON latest.topic_id=s.topic_id AND latest.captured_at=s.captured_at').all<SnapshotRow>();
    return new Map(rows.results.map((row):[string,PreviousTopicSnapshot]=>[row.topic_id,{topicId:row.topic_id,capturedAt:row.captured_at,reportCount:row.report_count,viewCount:row.view_count,likeCount:row.like_count,commentCount:row.comment_count,heatValue:row.heat_value}]));
  }

  async saveTopics(topics: TrendTopic[], records: RealSourceRecord[], signalTopicIds: Map<string,string>, updatedAt: string) {
    const recordBySignalId = new Map(records.map((record)=>[`signal-${stableHash(`${record.provider}:${record.originalId}`)}`,record]));
    const statements: D1PreparedStatement[]=[];
    for (const topic of topics) {
      const {id,canonicalKey,title,summary,category,keywords,sourceItems,status,tier,scoreDetails,firstSeenAt,lastSeenAt,calculatedAt,...metrics}=topic;
      statements.push(this.db.prepare(`INSERT INTO trend_topics (id,canonical_key,title,summary,category,keywords_json,metrics_json,score_json,status,tier,first_seen_at,last_seen_at,calculated_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,summary=excluded.summary,category=excluded.category,keywords_json=excluded.keywords_json,metrics_json=excluded.metrics_json,score_json=excluded.score_json,status=excluded.status,tier=excluded.tier,last_seen_at=excluded.last_seen_at,calculated_at=excluded.calculated_at,updated_at=excluded.updated_at`)
        .bind(id,canonicalKey,title,summary,category,JSON.stringify(keywords),JSON.stringify(metrics),JSON.stringify(scoreDetails),status,tier,firstSeenAt,lastSeenAt,calculatedAt,updatedAt));
      statements.push(this.db.prepare('DELETE FROM trend_topic_signals WHERE topic_id=?').bind(id));
      const reportCount=sourceItems.find((item)=>item.reportCount!==null)?.reportCount ?? 0;
      const viewCount=sourceItems.reduce((sum,item)=>sum+(item.viewCount??0),0); const likeCount=sourceItems.reduce((sum,item)=>sum+(item.likeCount??0),0); const commentCount=sourceItems.reduce((sum,item)=>sum+(item.commentCount??0),0);
      statements.push(this.db.prepare('INSERT OR IGNORE INTO trend_snapshots (id,topic_id,captured_at,provider_count,signal_count,report_count,view_count,like_count,comment_count,heat_value,growth_rate) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .bind(crypto.randomUUID(),id,updatedAt,topic.sourcePlatforms.length,sourceItems.length,reportCount,viewCount,likeCount,commentCount,topic.currentHeat,topic.growthStatus==='measured'?topic.growthRate:null));
    }
    for (const [signalId,topicId] of signalTopicIds) {
      const record=recordBySignalId.get(signalId); const item=topics.find((topic)=>topic.id===topicId)?.sourceItems.find((source)=>source.id===signalId);
      if (!record || !item) continue;
      statements.push(this.db.prepare(`INSERT INTO trend_signals (id,provider,original_content_id,original_title,publisher,original_url,published_at,fetched_at,view_count,like_count,comment_count,report_count,engagement_count,growth_delta,growth_status,taiwan_relevant,confidence,provider_state,heat_history_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET original_title=excluded.original_title,publisher=excluded.publisher,published_at=excluded.published_at,fetched_at=excluded.fetched_at,view_count=excluded.view_count,like_count=excluded.like_count,comment_count=excluded.comment_count,report_count=excluded.report_count,engagement_count=excluded.engagement_count,growth_delta=excluded.growth_delta,growth_status=excluded.growth_status,confidence=excluded.confidence,provider_state=excluded.provider_state,heat_history_json=excluded.heat_history_json`)
        .bind(signalId,record.provider,record.originalId,record.title,record.publisher,record.url,record.publishedAt,record.fetchedAt,record.viewCount,record.likeCount,record.commentCount,item.reportCount,item.engagementCount,item.growthDelta,item.growthStatus,1,item.confidence,'enabled',JSON.stringify(item.heatHistory)));
      statements.push(this.db.prepare('INSERT OR IGNORE INTO trend_topic_signals (topic_id,signal_id) VALUES (?,?)').bind(topicId,signalId));
    }
    if (statements.length) await this.db.batch(statements);
  }

  async saveProviderRun(run: ProviderCollectionResult, addedCount:number, mergedCount:number) {
    await this.db.prepare('INSERT INTO trend_provider_runs (id,provider,state,attempted_at,completed_at,fetched_count,added_count,merged_count,error_type,error_message,next_retry_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(),run.provider,run.state,run.attemptedAt,run.completedAt,run.records.length,addedCount,mergedCount,run.errorType,run.message,run.nextRetryAt).run();
  }

  async providerStatuses(): Promise<TrendProviderStatus[]> {
    const rows=await this.db.prepare('SELECT r.* FROM trend_provider_runs r JOIN (SELECT provider,MAX(attempted_at) attempted_at FROM trend_provider_runs GROUP BY provider) latest ON latest.provider=r.provider AND latest.attempted_at=r.attempted_at').all<ProviderRow>();
    const byProvider=new Map(rows.results.map((row)=>[row.provider,row]));
    const specs:Array<[TrendProviderStatus['code'],string,string]>=[['gdelt','GDELT全球新聞資料','已啟用'],['youtube','YouTube影音平台','等待YouTube官方API金鑰設定'],['google_trends','Google熱門搜尋趨勢','等待Google官方API存取資格'],['threads','Threads社群討論','等待Threads官方權限']];
    return specs.map(([code,name,fallback])=>{const row=byProvider.get(code);return {code,name,state:row?.state as TrendProviderStatus['state'] ?? (code==='gdelt'?'temporary_failure':'waiting_authorization'),message:row?.error_message??fallback,lastSuccessAt:row?.state==='enabled'?row.completed_at:null,lastAttemptAt:row?.attempted_at??null,nextRetryAt:row?.next_retry_at??null,fetchedCount:row?.fetched_count??0};});
  }

  async acquireRefreshLock(now: Date, ttlSeconds=120) {
    await this.db.prepare('DELETE FROM trend_refresh_locks WHERE expires_at <= ?').bind(now.toISOString()).run();
    const result=await this.db.prepare('INSERT OR IGNORE INTO trend_refresh_locks (lock_name,acquired_at,expires_at) VALUES (?,?,?)').bind('global',now.toISOString(),new Date(now.getTime()+ttlSeconds*1000).toISOString()).run();
    return (result.meta.changes ?? 0)>0;
  }
  async releaseRefreshLock() { await this.db.prepare('DELETE FROM trend_refresh_locks WHERE lock_name=?').bind('global').run(); }
}

function stableHash(value:string) { let hash=2166136261; for(const char of value){hash^=char.codePointAt(0)??0;hash=Math.imul(hash,16777619);} return (hash>>>0).toString(36); }
