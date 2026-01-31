export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  domain: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface PromptConfigInput {
  name: string;
  description: string;
  domain: string;
  systemPrompt: string;
  tags?: string[];
}

export interface TranscriptFile {
  path: string;
  name: string;
  date?: string;
}

export interface VoiceFile {
  path: string;
  name: string;
}

export interface AgentFile {
  name: string;
  path: string;
  content: string;
}

export type ViewMode = "interview" | "writer";
