import type { VideoCandidateRepository } from '../application/VideoCandidateRepository';
import type { VideoCandidate } from '../domain/VideoDiscovery';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';

export const VIDEO_CANDIDATE_STORAGE_KEY = 'trend-engine.video-candidates.v1';

export class LocalVideoCandidateRepository implements VideoCandidateRepository {
  private readonly store: JsonStore<VideoCandidate[]>;
  constructor(storage: KeyValueStorage) { this.store = new JsonStore(storage, VIDEO_CANDIDATE_STORAGE_KEY, []); }
  list() { return this.store.read(); }
  findByNormalizedUrl(normalizedUrl: string) { return this.list().find((candidate) => candidate.normalizedUrl === normalizedUrl); }
  save(candidate: VideoCandidate) { this.store.write([candidate, ...this.list().filter((item) => item.normalizedUrl !== candidate.normalizedUrl)]); }
}
