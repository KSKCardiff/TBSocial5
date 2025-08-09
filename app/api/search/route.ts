import { NextRequest, NextResponse } from "next/server";
import { addHours } from "date-fns";
import { rank } from "../../../lib/engagement";
import { draftCaption, generateImagePrompt, createImageBase64 } from "../../../lib/summarise";

export const runtime = "edge";

// 🔴 Buraya istediğin IG hesaplarını ekle
const INSTAGRAM_PROFILES = [
  "https://www.instagram.com/eurohoops_turkiye",
  "https://www.instagram.com/eurohoops_official",
  "https://www.instagram.com/basketnews",
];

type RawPost = {
  id: string;
  platform: "instagram";
  author: string;
  url: string;
  text?: string;
  createdAt: string; // ISO
  metrics: { likes: number; comments: number };
};

async function fetchInstagramPostsSince(sinceISO: string): Promise<RawPost[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return [];

  // Apify instagram-profile-scraper'ı run-sync ile çalıştır (tek request, direkt item'lar döner)
  const url = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Dikkat: run-sync-get-dataset-items'ta body, actor input'udur (input:{} sarması yok)
    body: JSON.stringify({
      directUrls: INSTAGRAM_PROFILES,
      resultsLimit: 30,          // daha çok post getir
      searchType: "posts",
    }),
    // Edge runtime'da cache kapalı
    cache: "no-store",
  });

  if (!res.ok) {
    // İsteğe bağlı: hatayı client'a göstermek için mesaj döndürebilirsin
    return [];
  }

  const items = await res.json();
  const since = new Date(sinceISO).getTime();

  const posts: RawPost[] = (items || []).map((it: any) => {
    // Zaman damgası bazı item'larda "timestamp" veya "takenAt" olarak gelebilir
    const ts = it.timestamp || it.takenAt || Date.now();
    const author = (it.ownerUsername || it.username || "").replace(/^@/, "") || "unknown";

    return {
      id: String(it.id || it.shortCode || it.url),
      platform: "instagram",
      author,
      url: it.url,
      text: it.caption,
      createdAt: new Date(ts).toISOString(),
      metrics: {
        likes: it.likesCount ?? 0,
        comments: it.commentsCount ?? 0,
      },
    } as RawPost;
  });

  // Son X saat filtresi
  return posts.filter((p) => new Date(p.createdAt).getTime() >= since);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initialHours = Math.max(1, Math.min(12, Number(body.hours) || 2));

    async function collect(hours: number) {
      const sinceISO = addHours(new Date(), -hours).toISOString();
      const posts = await fetchInstagramPostsSince(sinceISO);
      return { posts, sinceISO, hours };
    }

    // 2 saat → 6 saat → 24 saat dene
    let pass = await collect(initialHours);
    if (!pass.posts.length) pass = await collect(Math.max(6, initialHours));
    if (!pass.posts.length) pass = await collect(24);

    if (!pass.posts.length) {
      return NextResponse.json(
        { posts: [], winner: null, note: "Son 24 saatte içerik bulunamadı." },
        { status: 200 }
      );
    }

    const ranked = rank(pass.posts as any);
    const winner = ranked[0];

    const caption = await draftCaption(winner as any);
    const imgPrompt = await generateImagePrompt(winner as any);
    const imgB64 = await createImageBase64(imgPrompt);

    return NextResponse.json(
      { posts: ranked, winner, caption, imgPrompt, imgB64, usedHours: pass.hours },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
  }
}
