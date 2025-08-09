import { RawPost } from "./types";

const APIFY_TOKEN = process.env.APIFY_TOKEN;

export async function fetchIGPosts(username: string, sinceISO: string): Promise<RawPost[]> {
  if (!APIFY_TOKEN) return [];
  const run = await fetch("https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${APIFY_TOKEN}` },
    body: JSON.stringify({
      input: {
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsLimit: 10,
        searchType: "posts",
        addCommens: false
      },
      timeoutSecs: 60
    })
  });
  const runData = await run.json();
  const runId = runData.data?.id;
  if (!runId) return [];
  let datasetId: string | undefined;
  for (let i = 0; i < 6; i++) {
    await new Promise(res => setTimeout(res, 2500));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } });
    const status = await statusRes.json();
    datasetId = status.data?.defaultDatasetId;
    if (status.data?.status === "SUCCEEDED" && datasetId) break;
  }
  if (!datasetId) return [];
  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } });
  const items = await itemsRes.json();
  const since = new Date(sinceISO).getTime();
  const posts: RawPost[] = (items || []).map((it: any) => ({
    id: String(it.id || it.shortCode || it.url),
    platform: "instagram",
    author: username,
    url: it.url,
    text: it.caption,
    createdAt: new Date(it.timestamp || it.takenAt || Date.now()).toISOString(),
    metrics: {
      likes: it.likesCount ?? 0,
      comments: it.commentsCount ?? 0
    }
  })).filter((p: RawPost) => new Date(p.createdAt).getTime() >= since);
  return posts;
}
