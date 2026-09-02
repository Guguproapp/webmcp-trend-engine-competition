export type VideoAspectRatio = '9:16' | '16:9' | '1:1';
export type VideoPace = 'fast' | 'steady' | 'story';

export interface TopicCreationSeed {
  topicId: string;
  title: string;
  summary: string;
  score: number | null;
  sourceCount: number;
  evidenceState: string;
}

export interface VideoCreationBrief extends TopicCreationSeed {
  userDirection: string;
  aspectRatio: VideoAspectRatio;
  pace: VideoPace;
  visualStyle: string;
}

export interface StoryboardShot {
  time: string;
  purpose: string;
  visual: string;
  narration: string;
  motion: string;
}

export interface VideoCreationPlan {
  topicId: string;
  topicTitle: string;
  sanitizedDirection: string;
  hooks: string[];
  voiceoverScript: string;
  storyboard: StoryboardShot[];
  textToVideoPrompt: string;
  imageToVideoPrompt: string;
  factCheckReminders: string[];
  sourceBoundary: string;
  generationMethod: 'local_template';
  generatedAt: string;
}

export const DEFAULT_CREATION_DIRECTION = '先呈現共同困擾，再用來源證據說明話題為何值得關注，最後邀請觀眾查看原始來源；所有尚未查證的數字與人物資訊保留查證標記。';
