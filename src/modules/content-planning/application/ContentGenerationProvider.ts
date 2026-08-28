export interface ContentGenerationProvider {
  generateTopics(input: unknown): Promise<unknown[]>;
  generateScript(input: unknown): Promise<string>;
  generateMetadata(input: unknown): Promise<{ title: string; description: string; tags: string[]; cta: string }>;
}
