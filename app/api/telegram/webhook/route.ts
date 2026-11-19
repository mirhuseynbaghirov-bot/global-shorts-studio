import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Əvvəl əsas model, məşğuldursa ehtiyat modellər
const ATTEMPTS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash"
];

const RETRY_STATUS = [429, 500, 502, 503, 504];

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  } catch {
    console.error("Telegram şəbəkə xətası");
  }
}

async function callGemini(key: string, prompt: string) {
  const deadline = Date.now() + 52000;
  let lastError = "Gemini cavab vermədi.";
  const tried: string[] = [];

  for (const model of ATTEMPTS) {
    const remaining = deadline - Date.now();
    if (remaining < 6000) break;

    tried.push(model);
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(25000, remaining - 2000)
    );

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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

      const data = await res.json();

      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text as string;
        lastError = `${model}: boş cavab qaytardı.`;
        continue;
      }

      const msg = data.error?.message || "naməlum";
      lastError = `${model} (kod ${res.status}): ${msg}`;

      if (RETRY_STATUS.includes(res.status) || res.status === 404) {
        await sleep(1500);
        continue;
      }

      // 400, 401, 403 kimi xətalar təkrarla düzəlmir
      throw new Error(`Gemini xətası, ${lastError}`);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        lastError = `${model}: cavab gec gəldi.`;
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Gemini hazırda məşğuldur. Sınanan modellər: ${tried.join(", ")}.\nSon xəta: ${lastError}\nBir az sonra yenidən cəhd et.`
  );
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

    const result = await callGemini(key, prompt);

    await sendMessage(chatId, result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    const reason =
      error instanceof Error ? error.message : "Naməlum xəta";

    if (chatId) {
      await sendMessage(chatId, "❌ Xəta baş verdi:\n" + clean(reason));
    }
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook hazırdır",
    models: ATTEMPTS
  });
}
