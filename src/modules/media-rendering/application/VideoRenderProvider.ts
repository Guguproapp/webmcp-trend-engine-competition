export interface VideoRenderProvider {
  renderSubtitles(input: unknown): Promise<{ jobId: string }>;
  mixAudio(input: unknown): Promise<{ jobId: string }>;
  renderVariants(input: unknown): Promise<{ jobId: string }>;
  getRenderStatus(jobId: string): Promise<'queued' | 'running' | 'completed' | 'failed'>;
}
