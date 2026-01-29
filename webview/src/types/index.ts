export interface Message {
  command: string;
  payload?: unknown;
}

export interface VSCodeAPI {
  postMessage(message: Message): void;
  getState(): unknown;
  setState(state: unknown): void;
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

export type ViewMode = 'interview' | 'writer';
