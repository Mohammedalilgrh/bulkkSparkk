export type Position = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type TextEffect = 'none' | 'glow' | 'outline';

export type TextMotion = 'none' | 'pan-up' | 'pan-down' | 'drift-left' | 'drift-right' | 'zoom-in';

export interface GeneratedVideo {
  id: string;
  quote: string;
  videoUrl: string;
  videoBlob: Blob;
}

export interface BulkItem {
  id: string;
  title: string;
  body: string;
}

export type TextPayload = string | { title: string; body: string };

export interface WordTiming {
    text: string;
    start: number;
    end: number;
}

export interface LineTiming {
  text: string;
  start: number;
  end: number;
  words?: WordTiming[];
}