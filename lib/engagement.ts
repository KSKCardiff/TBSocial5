import { RawPost } from "./types";

export function score(p: RawPost): number {
  const { likes, comments } = p.metrics;
  const s = likes * 1 + comments * 2;
  return Math.round(s * 100) / 100;
}

export function rank(posts: RawPost[]): RawPost[] {
  return [...posts].sort((a, b) => score(b) - score(a));
}
