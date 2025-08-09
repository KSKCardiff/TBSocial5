export type SourcePlatform = "instagram";

export interface Account {
  platform: SourcePlatform;
  handle: string;
  url: string;
}

export interface RawPost {
  id: string;
  platform: SourcePlatform;
  author: string;
  url: string;
  text?: string;
  createdAt: string;
  metrics: { likes: number; comments: number };
}

export interface RankedResult {
  winner: RawPost | null;
  candidates: RawPost[];
}
