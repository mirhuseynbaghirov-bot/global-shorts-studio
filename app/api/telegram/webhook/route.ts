
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000)
    })
  });
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const chatId = update.message?.chat?.id;
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
      throw new Error("Gemini API açarı tapılmadı.");
    }

    const prompt = `Azərbaycan dilində 45-60 saniyəlik maraqlı YouTube Shorts ssenarisi hazırla.
Mövzu: ${message}
Başlıq, ssenari və 4 vizual səhnə təsviri ver. Fakt uydurma.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(key),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini xətası");
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Cavab alınmadı.";

    await sendMessage(chatId, result);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook hazırdır"
  });
}
