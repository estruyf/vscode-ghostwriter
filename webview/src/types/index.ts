export interface Message {
  command: string;
  payload?: any;
}

export interface VSCodeAPI {
  postMessage(message: Message): void;
  getState(): any;
  setState(state: any): void;
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
