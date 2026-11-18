# GLOBAL SHORTS STUDIO

Next.js starter for the first stage of the Shorts automation workflow.

## Included
- Azerbaijani topic-entry interface
- Server-side Gemini script generation endpoint
- Gemini API key read only from `GEMINI_API_KEY`
- No ElevenLabs or Google Cloud Text-to-Speech dependency

## Run locally
1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Gemini API key to `.env.local`.
5. Run `npm run dev`.

This starter currently generates a script and scene descriptions. Voice generation, footage sourcing, editing, subtitles, and MP4 export are not implemented yet.
