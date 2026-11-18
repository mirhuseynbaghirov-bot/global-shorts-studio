"use client";

import { FormEvent, useState } from "react";

type Result = { title: string; script: string; scenes: string[] };

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function createScript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sorğu alınmadı.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Naməlum xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="topline"><span className="dot" /> AI VIDEO PRODUCTION</div>
      <section className="hero">
        <div className="brand">GLOBAL <span>SHORTS</span> STUDIO</div>
        <h1>Bir mövzu yaz.<br /><em>Qalanını AI hazırlasın.</em></h1>
        <p className="intro">YouTube Shorts üçün ssenari yaratmağa başla.</p>
        <form className="topic-form" onSubmit={createScript}>
          <label htmlFor="topic">VİDEO MÖVZUSU</label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Məsələn: Bir gün niyə Yer kürəsində ildən uzun ola bilər?"
            maxLength={500}
          />
          <div className="form-footer">
            <span>{topic.length}/500</span>
            <button disabled={!topic.trim() || loading}>
              {loading ? "HAZIRLANIR..." : "SSENARİ YARAT"} <span>↗</span>
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {result && (
          <article className="result">
            <div className="result-kicker">GENERATED SCRIPT</div>
            <h2>{result.title}</h2>
            <pre>{result.script}</pre>
            <h3>SƏHNƏLƏR</h3>
            <ol>{result.scenes.map((scene, i) => <li key={i}>{scene}</li>)}</ol>
          </article>
        )}
        <p className="footnote">İlk mərhələ: AI ssenarisi. Səs, görüntü və MP4 ixracı növbəti mərhələlərdə qoşulacaq.</p>
      </section>
    </main>
  );
}
