import OpenAI from "openai";
import { RawPost } from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function draftCaption(winner: RawPost): Promise<string> {
  const base = `Günün en çok ilgi gören paylaşımı @${winner.author} (${winner.platform})\n\n`;
  const naive = base + (winner.text ? (winner.text.slice(0, 180) + (winner.text.length > 180 ? "…" : "")) : "Gündemde öne çıkan konu hakkında sen de fikrini yaz!") + "\n#basketbol #EuroLeague";
  if (!client) return naive;
  try {
    const sys = "You are a social media copywriter who writes catchy, concise Turkish captions for sports audiences.";
    const user = `Aşağıdaki gönderiyi özetle, 1-2 cümlelik vurucu bir Türkçe paylaşım metni yaz. Hashtag olarak #basketbol ve #EuroLeague dışına 2 alakalı etiket ekle. İşte gönderi:\n\n${winner.text || "(metin yok)"}`;
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.7,
      max_tokens: 120
    });
    const out = resp.choices?.[0]?.message?.content?.trim();
    return out ? out : naive;
  } catch {
    return naive;
  }
}

export async function generateImagePrompt(winner: RawPost): Promise<string> {
  return `Minimal, modern bir spor sosyal medya görseli. Basketbol teması, güçlü tipografi, koyu arka plan, kontrast vurgular. Metin: "EuroLeague Gündemi". İnce çizgiler, hafif gren; 1:1 oran.`;
}

export async function createImageBase64(prompt: string): Promise<string | null> {
  if (!client) return null;
  try {
    const img = await client.images.generate({ model: "gpt-image-1", prompt, size: "1024x1024" });
    const b64 = img.data?.[0]?.b64_json;
    return b64 || null;
  } catch {
    return null;
  }
}
