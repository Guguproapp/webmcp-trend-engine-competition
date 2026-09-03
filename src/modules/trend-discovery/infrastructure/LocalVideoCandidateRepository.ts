import type { VideoCandidateRepository } from '../application/VideoCandidateRepository';
import { normalizeVideoUrl, type VideoCandidate } from '../domain/VideoDiscovery';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import { sanitizeUntrustedPublicData } from '../../../shared/security/PublicUrlSafety';

export const VIDEO_CANDIDATE_STORAGE_KEY = 'trend-engine.video-candidates.v1';

export class LocalVideoCandidateRepository implements VideoCandidateRepository {
  private readonly store: JsonStore<VideoCandidate[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, VIDEO_CANDIDATE_STORAGE_KEY, []); }
  list() {
    const stored = this.store.read();
    const safe = stored.flatMap((candidate): VideoCandidate[] => {
      try {
        const sanitized = sanitizeUntrustedPublicData(candidate) as VideoCandidate;
        const normalized = normalizeVideoUrl(sanitized.normalizedUrl);
        return [{ ...sanitized, platform: normalized.platform, originalUrl: normalized.originalUrl, normalizedUrl: normalized.normalizedUrl }];
      } catch {
        return [];
      }
    });
    if (JSON.stringify(safe) !== JSON.stringify(stored)) this.store.write(safe);
    return safe;
  }
  findByNormalizedUrl(normalizedUrl: string) { return this.list().find((candidate) => candidate.normalizedUrl === normalizedUrl); }
  save(candidate: VideoCandidate) {
    const sanitized = sanitizeUntrustedPublicData(candidate) as VideoCandidate;
    const normalized = normalizeVideoUrl(sanitized.normalizedUrl);
    const safeCandidate = { ...sanitized, platform: normalized.platform, originalUrl: normalized.originalUrl, normalizedUrl: normalized.normalizedUrl };
    this.store.write([safeCandidate, ...this.list().filter((item) => item.normalizedUrl !== safeCandidate.normalizedUrl)]);
  }
}
