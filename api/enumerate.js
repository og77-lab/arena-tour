/* ═══ API / Enumerate ═══ Returns the full list of finite booth sentences the engine can ever say, so the
   /admin/warm.html page can iterate them and warm /api/tts for each. One response, no auth, no mutation. */

import { enumerateAllFinals } from "../src/engine/commentary.js";

export default async function handler(req, res) {
  try {
    const all = enumerateAllFinals();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      count: all.length,
      totalChars: all.reduce((s, x) => s + x.text.length, 0),
      items: all.map(x => ({ voice: x.voice, text: x.text, bank: x.bank }))
    });
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 500) });
  }
}
