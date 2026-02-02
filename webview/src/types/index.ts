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

export interface DraftRevision {
  id: string;
  content: string;
  prompt?: string;
  timestamp: number;
}

export interface Draft {
  id: string;
  title: string;
  transcript: string;
  voice?: string;
  currentRevisionId: string;
  revisions: DraftRevision[];
  createdAt: number;
  updatedAt: number;
  options?: {
    style?: "formal" | "casual" | "conversational";
    includeHeadings?: boolean;
    includeSEO?: boolean;
    keywords?: string;
  };
  frontmatter?: string;
  writerAgentPath?: string;
}

export type ViewMode = "interview" | "writer";
