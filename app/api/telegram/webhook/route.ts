
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ATTEMPTS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash"
];

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
  return new Promise(resolve => setTimeout(resolve, ms));
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
      console.error("Telegram xətası:", res.status);
    }
  } catch {
    console.error("Telegram şəbəkə xətası");
  }
}

async function callGemini(key: string, prompt: string) {
  const deadline = Date.now() + 52000;
  const log: string[] = [];

  for (const model of ATTEMPTS) {
    const remaining = deadline - Date.now();

    if (remaining < 5000) break;

    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      Math.min(22000, remaining - 1500)
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
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              thinkingConfig: {
                thinkingLevel: "low"
              },
              maxOutputTokens: 1200,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        }
      );

      const data = await res.json();

      if (res.ok) {
        const result = data.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("")
          .trim();

        if (result) return result;

        log.push(`${model}: boş cavab`);
        continue;
      }

      const msg = (
        data.error?.message || "Naməlum xəta"
      ).slice(0, 150);

      log.push(`${model}: kod ${res.status} - ${msg}`);

      if ([429, 500, 502, 503, 504, 404].includes(res.status)) {
        await sleep(1000);
        continue;
      }

      throw new Error(
        `Gemini xətası:\n${log.join("\n")}`
      );

    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        log.push(`${model}: vaxt limiti keçildi`);
        continue;
      }

      throw error;

    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Gemini cavab vermədi.\n${log.join("\n")}\nBir az sonra yenidən yoxla.`
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

    await sendMessage(
      chatId,
      "Mövzu qəbul edildi. Hazırlanır..."
    );

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error(
        "GEMINI_API_KEY Vercel-də tapılmadı."
      );
    }

    const prompt = "Yalnız OK yaz.";

Azərbaycan dilində 45-60 saniyəlik maraqlı YouTube Shorts ssenarisi hazırla.

Mövzu: ${message}

Tələblər:
1. Güclü və maraqlı başlıq yaz.
2. İlk saniyələrdə izləyicinin diqqətini çəkən giriş hazırla.
3. Sadə, axıcı və təbii Azərbaycan dilindən istifadə et.
4. Faktları uydurma.
5. Ssenarini 45-60 saniyəlik danışıq müddətinə uyğun hazırla.
6. Sonda 4 vizual səhnə təsviri ver.
7. Ssenari ilə vizual təsvirləri ayrı bölmələrdə təqdim et.

Format:

BAŞLIQ:
...

SSENARİ:
...

VİZUAL SƏHNƏLƏR:
1. ...
2. ...
3. ...
4. ...`;

    const result = await callGemini(key, prompt);

    await sendMessage(chatId, result);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);

    const reason =
      error instanceof Error
        ? error.message
        : "Naməlum xəta";

    if (chatId) {
      await sendMessage(
        chatId,
        "❌ Xəta baş verdi:\n" + clean(reason)
      );
    }

    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "GLOBAL SHORTS STUDIO hazırdır",
    models: ATTEMPTS
  });
}
