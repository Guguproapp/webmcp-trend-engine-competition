export interface PlatformPublisher {
  createDraft(input: unknown): Promise<{ externalId: string }>;
  uploadVideo(input: unknown): Promise<{ externalId: string }>;
  schedule(input: unknown): Promise<void>;
  getStatus(externalId: string): Promise<string>;
  retry(externalId: string): Promise<void>;
  withdraw(externalId: string): Promise<void>;
}
