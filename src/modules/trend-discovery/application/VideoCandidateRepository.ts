import type { VideoCandidate } from '../domain/VideoDiscovery';

export interface VideoCandidateRepository {
  list(): VideoCandidate[];
  findByNormalizedUrl(normalizedUrl: string): VideoCandidate | undefined;
  save(candidate: VideoCandidate): void;
}
