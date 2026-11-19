import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_MODEL = "gemini-3.8-flash";

function clean(text: string) {
  let out = text;
  for (const secret of [
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.GEMINI_API_KEY
  ]) {
    if (secret) out = out.split(secret).join("***");
  }
  return out;
}

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4000)
        })
      }
    );
    if (!res.ok) {
      console.error("Telegram sendMessage xətası:", res.status);
    }
  } catch (e) {
    console.error("Telegram şəbəkə xətası");
  }
}

export async function POST(request: Request) {
  let chatId: number | undefined;

  try {
    const update = await request.json();
    chatId = update.message?.chat?.id;
    const message = update.message?.text?.trim();

    if (!chatId || !message) {
      return NextResponse.json({ ok: true });
    }

    if (message === "/start") {
      await sendMessage(
        chatId,
        "GLOBAL SHORTS STUDIO hazırdır! Mövzunu göndər."
      );
      return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, "Mövzu qəbul edildi. Hazırlanır...");

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY Vercel-də tapılmadı.");
    }

    const prompt = `Azərbaycan dilində 45-60 saniyəlik maraqlı YouTube Shorts ssenarisi hazırla.
Mövzu: ${message}
Başlıq, ssenari və 4 vizual səhnə təsviri ver. Fakt uydurma.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Gemini xətası (kod ${response.status}): ` +
          (data.error?.message || "naməlum")
      );
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gemini boş cavab qaytardı.";

    await sendMessage(chatId, result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    let reason = "Naməlum xəta";
    if (error instanceof Error) {
      reason =
        error.name === "AbortError"
          ? "Gemini 50 saniyə ərzində cavab vermədi (vaxt bitdi)."
          : error.message;
    }

    if (chatId) {
      await sendMessage(chatId, "❌ Xəta baş verdi:\n" + clean(reason));
    }
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook hazırdır",
    model: GEMINI_MODEL
  });
}
