"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Spinner from "../components/Spinner";
import { ExternalLink } from "lucide-react";

export default function AppPage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <MainCard />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏀</span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Social Buzz Scout</h1>
      </div>
      <a className="text-sm text-neutral-400 hover:text-neutral-200" href="https://instagram.com" target="_blank">v1.0</a>
    </div>
  );
}

function MainCard() {
  const [hours, setHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/search", { method: "POST", body: JSON.stringify({ hours }), headers: { "Content-Type": "application/json" } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "İstek başarısız");
      setData(j);
    } catch (e: any) {
      setError(e.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div layout className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm text-neutral-400 mb-1">Zaman penceresi</label>
          <div className="flex items-center gap-3">
            <input type="number" min={1} max={12} value={hours} onChange={e => setHours(Number(e.target.value))} className="w-24 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2" />
            <span className="text-sm text-neutral-400">saat (varsayılan: 2)</span>
          </div>
        </div>
        <button onClick={onSearch} disabled={loading} className="px-5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20">
          {loading ? <div className="flex items-center gap-2"><Spinner /><span>Aranıyor…</span></div> : "Search"}
        </button>
      </div>

      {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

      {data && (
        <div className="mt-6 grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4">
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-lg font-medium mb-2">Önerilen Post Metni</h3>
              <p className="whitespace-pre-wrap text-neutral-200 leading-relaxed">{data.caption || "-"}</p>
            </section>

            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-lg font-medium mb-2">Kazanan Gönderi</h3>
              {data.winner ? (
                <div className="space-y-2">
                  <a className="inline-flex items-center gap-1 text-sm text-blue-300 hover:underline" href={data.winner.url} target="_blank"><ExternalLink size={16}/>Orijinal gönderi</a>
                  <div className="text-sm text-neutral-400">@{data.winner.author} • {data.winner.platform} • {new Date(data.winner.createdAt).toLocaleString()}</div>
                  <div className="text-neutral-200">{data.winner.text || "(metin yok)"} </div>
                </div>
              ) : <div>Sonuç yok.</div>}
            </section>

            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-lg font-medium mb-3">Diğer Adaylar</h3>
              <div className="space-y-3 max-h-[360px] overflow-auto pr-2">
                {(data.posts || []).slice(1, 20).map((p: any) => (
                  <a key={p.id} href={p.url} target="_blank" className="block p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700">
                    <div className="text-sm text-neutral-400 mb-1">@{p.author} • {p.platform}</div>
                    <div className="line-clamp-2 text-neutral-200 text-sm">{p.text || "(metin yok)"}</div>
                  </a>
                ))}
              </div>
            </section>
          </div>

          <div className="md:col-span-2 space-y-4">
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-lg font-medium mb-2">Oluşturulan Görsel</h3>
              {data.imgB64 ? (
                <div className="space-y-2">
                  <img src={`data:image/png;base64,${data.imgB64}`} alt="generated" className="rounded-xl border border-neutral-800" />
                  <details className="text-xs text-neutral-400">
                    <summary className="cursor-pointer">Kullanılan görsel promptu</summary>
                    <pre className="whitespace-pre-wrap mt-2">{data.imgPrompt}</pre>
                  </details>
                </div>
              ) : (
                <div className="text-sm text-neutral-400">Görsel üretimi devre dışı (OPENAI_API_KEY ekleyin).</div>
              )}
            </section>

            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-lg font-medium mb-2">Paylaşım İçin Hızlı Kopyalar</h3>
              <div className="grid grid-cols-2 gap-2">
                <CopyField label="#1: Metin" value={data.caption || ""} />
                <CopyField label="#2: Link" value={data.winner?.url || ""} />
              </div>
            </section>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-400">{label}</div>
        {copied ? <span className="text-xs text-emerald-400">Kopyalandı</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <input readOnly value={value} className="flex-1 bg-transparent text-sm outline-none" />
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(()=>setCopied(false), 1500); }} className="px-2 py-1 text-xs rounded-lg bg-white/10 border border-white/20">Kopyala</button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-xs text-neutral-500 mt-8 text-center">
      Hazırlayan: Social Buzz Scout • Eğitim amaçlı örnek uygulama
    </div>
  );
}
