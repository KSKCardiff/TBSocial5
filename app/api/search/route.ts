import { NextRequest, NextResponse } from "next/server";
import { addHours } from "date-fns";
import { DEFAULT_ACCOUNTS } from "../../../lib/accounts";
import { fetchIGPosts } from "../../../lib/fetch-ig";
import { rank } from "../../../lib/engagement";
import { draftCaption, generateImagePrompt, createImageBase64 } from "../../../lib/summarise";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hours = Math.max(1, Math.min(12, Number(body.hours) || 2));
    const sinceISO = addHours(new Date(), -hours).toISOString();
    const posts = (
      await Promise.all(DEFAULT_ACCOUNTS.map(async (acc) => fetchIGPosts(acc.handle, sinceISO)))
    ).flat();
    if (!posts.length) return NextResponse.json({ posts: [], winner: null }, { status: 200 });
    const ranked = rank(posts);
    const winner = ranked[0];
    const caption = await draftCaption(winner);
    const imgPrompt = await generateImagePrompt(winner);
    const imgB64 = await createImageBase64(imgPrompt);
    return NextResponse.json({ posts: ranked, winner, caption, imgPrompt, imgB64 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "unknown" }, { status: 500 });
  }
}
