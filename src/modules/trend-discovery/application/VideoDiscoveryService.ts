import { normalizeVideoUrl, type SourceAcquisitionMethod, type VideoCandidate, type VideoCandidateMetrics } from '../domain/VideoDiscovery';
import { inferYouTubeContentForm, type SpecificMarketRegion, type VideoContentForm } from '../domain/RegionalDiscovery';
import type { VideoCandidateRepository } from './VideoCandidateRepository';

export interface ImportVideoCandidateInput {
  url: string;
  title: string;
  author?: string;
  metrics?: Partial<VideoCandidateMetrics>;
  acquisitionMethod: Extract<SourceAcquisitionMethod, 'official_site_assisted' | 'user_shared' | 'search_engine_candidate'>;
  notes?: string;
  region?: SpecificMarketRegion;
  contentForm?: VideoContentForm;
}

const metricValue = (value: number | null | undefined) => value === undefined || value === null || !Number.isFinite(value) ? null : Math.max(0, Math.round(value));
const hasMetrics = (metrics: VideoCandidateMetrics) => Object.values(metrics).some((value) => value !== null);

export class VideoDiscoveryService {
  constructor(private readonly repository: VideoCandidateRepository, private readonly now: () => Date = () => new Date()) {}

  listCandidates() { return this.repository.list(); }

  importCandidate(input: ImportVideoCandidateInput) {
    const normalized = normalizeVideoUrl(input.url);
    const timestamp = this.now().toISOString();
    const metrics: VideoCandidateMetrics = {
      viewCount: metricValue(input.metrics?.viewCount), likeCount: metricValue(input.metrics?.likeCount),
      commentCount: metricValue(input.metrics?.commentCount), shareCount: metricValue(input.metrics?.shareCount),
    };
    const existing = this.repository.findByNormalizedUrl(normalized.normalizedUrl);
    const snapshot = hasMetrics(metrics) ? [{ ...metrics, capturedAt:timestamp, source:'user_provided' as const }] : [];
    const inferredContentForm = normalized.platform === 'youtube' ? inferYouTubeContentForm(input.url) : 'short_video';
    const selectedContentForm = input.contentForm && input.contentForm !== 'unknown' ? input.contentForm : inferredContentForm;
    const candidate: VideoCandidate = existing ? {
      ...existing, originalUrl:input.url.trim(), title:input.title.trim() || existing.title,
      author:input.author?.trim() || existing.author, acquisitionMethod:input.acquisitionMethod,
      notes:input.notes?.trim() || existing.notes, updatedAt:timestamp, snapshots:[...existing.snapshots, ...snapshot],
      region:input.region ?? existing.region ?? 'taiwan', intelligenceType:'insufficient_evidence',
      contentForm:normalized.platform==='youtube'
        ? selectedContentForm === 'unknown' ? existing.contentForm ?? 'unknown' : selectedContentForm
        : existing.contentForm ?? 'short_video',
    } : {
      id:crypto.randomUUID(), platform:normalized.platform, originalUrl:input.url.trim(), normalizedUrl:normalized.normalizedUrl,
      title:input.title.trim() || '尚未命名的影音候選', author:input.author?.trim() ?? '', acquiredAt:timestamp, updatedAt:timestamp,
      acquisitionMethod:input.acquisitionMethod, evidenceConfidence:'low', verified:false, notes:input.notes?.trim() ?? '', snapshots:snapshot,
      region:input.region ?? 'taiwan', intelligenceType:'insufficient_evidence',
      contentForm:selectedContentForm,
    };
    this.repository.save(candidate);
    return { candidate, merged:Boolean(existing) };
  }

  getGrowthPresentation(candidate: VideoCandidate) {
    const snapshots = candidate.snapshots;
    if (snapshots.length < 2) return { status:'baseline_pending' as const, label:'正在建立增速基準', growthRate:null };
    const first=snapshots.at(-2)!; const latest=snapshots.at(-1)!;
    const total=(snapshot:VideoCandidateMetrics)=>(snapshot.viewCount??0)+(snapshot.likeCount??0)+(snapshot.commentCount??0)+(snapshot.shareCount??0);
    const before=total(first); const after=total(latest);
    const growthRate=before===0 ? (after>0?null:0) : Math.round(((after-before)/before)*100);
    return growthRate===null
      ? { status:'insufficient_evidence' as const, label:'缺少可比較的前次數據', growthRate:null }
      : { status:'measured' as const, label:growthRate===0?'0%｜目前無明顯變化':`${growthRate>0?'+':''}${growthRate}%`, growthRate };
  }
}
