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
