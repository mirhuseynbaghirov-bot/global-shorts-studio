import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Mövzu daxil et." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY serverdə təyin edilməyib." },
        { status: 500 }
      );
    }

    const prompt = `Sən peşəkar YouTube Shorts ssenari müəllifisən. Azərbaycan dilində, sadə və maraqlı dildə 45-60 saniyəlik video ssenarisi hazırla. İlk cümlə güclü diqqətçəkən giriş olsun. Fakt uydurma. Mövzu: ${topic}

Cavabı yalnız bu JSON formatında qaytar:
{"title":"qısa başlıq","script":"tam danışıq mətni","scenes":["səhnə 1 üçün vizual təsvir","səhnə 2 üçün vizual təsvir","səhnə 3 üçün vizual təsvir","səhnə 4 üçün vizual təsvir"]}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        })
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || "Gemini sorğusu uğursuz oldu." },
        { status: response.status }
      );
    }

    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Gemini boş cavab qaytardı.");
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      title: parsed.title || "Yeni Shorts ssenarisi",
      script: parsed.script || "",
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server xətası.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
