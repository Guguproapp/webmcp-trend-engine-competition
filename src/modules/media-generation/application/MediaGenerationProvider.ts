export interface MediaGenerationProvider {
  generateImage(input: unknown): Promise<{ jobId: string }>;
  generateVoice(input: unknown): Promise<{ jobId: string }>;
  generateVideoClip(input: unknown): Promise<{ jobId: string }>;
}
