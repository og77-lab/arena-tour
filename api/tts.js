/* ═══ API / TTS ═══ Vercel serverless function that turns a line of booth dialogue into an audio URL.
   Flow: hash(text + voiceId) → check Vercel Blob for a cached mp3 → return its URL if present;
   otherwise call ElevenLabs TTS, store the mp3 in Blob under the hash, return the fresh URL.
   First render of a line costs one ElevenLabs call; every repeat for every player, forever, is free.

   Required Vercel env vars:
     ELEVENLABS_API_KEY   — your ElevenLabs API key (Vercel → Project → Settings → Environment Variables)
     BLOB_READ_WRITE_TOKEN — auto-set when a Vercel Blob store is attached to the project
*/

import { put, head } from "@vercel/blob";
import crypto from "node:crypto";

/* The two voices we saved in ElevenLabs earlier. These IDs are fixed to the "Sir Barry Pecksworth" and
   "Reggie Clutter" voices in this workspace. */
const VOICES = {
  barry:  "N0MMaeC3jnhGtziBoB6F",
  reggie: "jGQrEnhgmrVxLUXiPjIz",
  /* Nigel Parple, Voiceover Veteran — the sleazy British infomercial announcer. Reads the parody mobile
     pop-up ads that appear between tabs. */
  nigel:  "0nf1c1TUyMzCpCyjphIL"
};

/* eleven_flash_v2_5 is ElevenLabs' low-latency model — ~1s per short line, versus 3-5s on eleven_v3. The
   expressiveness drop is minor on the two British elderly voices and the UX win is dramatic. We'll flip back to
   v3 for the one-time batch generation of the final sound bank; this is the dev model. */
const MODEL_ID = "eleven_flash_v2_5";
/* How long to let the ElevenLabs call run before we give up and return an error (the client falls back to
   subtitles-only timing). */
const TTS_TIMEOUT_MS = 15000;

function hashKey(text, voiceId) {
  return crypto.createHash("sha256").update(voiceId + "|" + text).digest("hex").slice(0, 24);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }
  const { text, voice } = (req.body && typeof req.body === "object") ? req.body : {};
  if (!text || typeof text !== "string" || text.length > 800) return res.status(400).json({ error: "bad text" });
  const voiceId = VOICES[voice] || null;
  if (!voiceId) return res.status(400).json({ error: "unknown voice" });
  if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ error: "ELEVENLABS_API_KEY not set" });

  const key = "studio/" + voice + "/" + hashKey(text, voiceId) + ".mp3";

  /* Cache hit — return the existing URL immediately. */
  try {
    const meta = await head(key);
    if (meta && meta.url) return res.status(200).json({ url: meta.url, cached: true });
  } catch (e) { /* 404 = not cached yet, fall through */ }

  /* Cache miss — generate via ElevenLabs. */
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TTS_TIMEOUT_MS);
  let audioBuf;
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({ text: text, model_id: MODEL_ID, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return res.status(502).json({ error: "elevenlabs " + r.status, detail: body.slice(0, 200) });
    }
    audioBuf = Buffer.from(await r.arrayBuffer());
  } catch (e) {
    return res.status(504).json({ error: "tts timeout or network", detail: String(e).slice(0, 200) });
  } finally { clearTimeout(timer); }

  /* Store in Blob under the key — later requests from any player, any device, any browser hit the cache. If Blob
     storage is unconfigured or down, fall back to a data: URL so the audio still plays this time (not cached). */
  try {
    const blob = await put(key, audioBuf, { access: "public", contentType: "audio/mpeg", addRandomSuffix: false });
    return res.status(200).json({ url: blob.url, cached: false });
  } catch (e) {
    const dataUrl = "data:audio/mpeg;base64," + audioBuf.toString("base64");
    return res.status(200).json({ url: dataUrl, cached: false, blobError: String(e).slice(0, 300) });
  }
}
