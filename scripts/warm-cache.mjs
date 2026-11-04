#!/usr/bin/env node
/* ═══ scripts/warm-cache.mjs ═══ One-time batch generation of every booth sentence.
   Enumerates every possible final text (across every bank × every placeholder combination), posts each one
   to the deployed /api/tts endpoint (which calls ElevenLabs and uploads to Vercel Blob), and tracks progress
   so the run resumes if it stops. After this script completes, every line the booth can ever say is cached
   in Vercel Blob — zero ElevenLabs calls from runtime matches for any player, forever.

   Prerequisites:
     1. Deploy the latest main to Vercel (so /api/tts is live).
     2. ELEVENLABS_API_KEY and BLOB_READ_WRITE_TOKEN must be set as Vercel env vars (not local).
     3. Node 18+ on the machine running this script (fetch is built in).

   Usage:
     node scripts/warm-cache.mjs                       # posts to https://arena-tour.vercel.app
     node scripts/warm-cache.mjs https://my.app.url    # custom host
     node scripts/warm-cache.mjs --dry                 # count sentences only, no network calls
     node scripts/warm-cache.mjs --limit 50            # generate the first 50 only (sanity check)

   The script is idempotent: Vercel Blob hits are instant for already-cached sentences, so re-running after
   a partial failure costs nothing extra. */

import { enumerateAllFinals } from "../src/engine/commentary.js";
import fs from "node:fs/promises";
import path from "node:path";

const HOST = process.argv.find(a => a.startsWith("http")) || "https://arena-tour.vercel.app";
const DRY = process.argv.includes("--dry");
const LIMIT_FLAG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_FLAG > -1 ? parseInt(process.argv[LIMIT_FLAG + 1], 10) : 0;
const PROGRESS_FILE = ".warm-cache.progress.json";
const DELAY_MS = 400;  /* serialize ElevenLabs calls to stay well under tier concurrency */

async function main() {
  const all = enumerateAllFinals();
  /* Preserve the enumeration's tier order — allBanks() returns banks in priority order (common first). */
  const todo = LIMIT ? all.slice(0, LIMIT) : all;

  console.log(`Total unique sentences: ${all.length}`);
  console.log(`Across ${new Set(all.map(x => x.bank)).size} banks`);
  const totalChars = all.reduce((s, x) => s + x.text.length, 0);
  console.log(`Total characters: ${totalChars.toLocaleString()}`);
  console.log(`Estimated ElevenLabs credits (eleven_v3): ~${totalChars.toLocaleString()}`);
  console.log(`Estimated ElevenLabs credits (eleven_flash_v2_5): ~${Math.round(totalChars/2).toLocaleString()}`);
  console.log(`Posting to: ${HOST}/api/tts`);
  console.log(`Mode: ${DRY ? "DRY RUN (no network)" : "LIVE"}${LIMIT ? `, LIMIT ${LIMIT}` : ""}`);
  console.log("");

  if (DRY) {
    sorted.slice(0, 20).forEach((x, i) => console.log(`${i+1}. [${x.voice}] (${x.bank}) ${x.text}`));
    console.log(sorted.length > 20 ? `... and ${sorted.length - 20} more` : "");
    return;
  }

  let done = {}; try { done = JSON.parse(await fs.readFile(PROGRESS_FILE, "utf8")); } catch (e) {}
  let okCount = 0, cachedCount = 0, errCount = 0, start = Date.now();

  for (let i = 0; i < todo.length; i++) {
    const item = todo[i];
    const key = `${item.voice}|${item.text}`;
    if (done[key]) { cachedCount++; continue; }

    try {
      const r = await fetch(`${HOST}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text, voice: item.voice })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) {
        okCount++;
        done[key] = { url: j.url, cached: !!j.cached };
        if (okCount % 25 === 0) {
          await fs.writeFile(PROGRESS_FILE, JSON.stringify(done, null, 1));
          const rate = okCount / ((Date.now() - start) / 1000);
          const remaining = (todo.length - i - 1) / Math.max(rate, 0.1);
          console.log(`[${i+1}/${todo.length}] ok ${okCount} cached ${cachedCount} err ${errCount} · ${rate.toFixed(1)}/s · ~${Math.round(remaining/60)}min left`);
        }
      } else {
        errCount++;
        console.warn(`[${i+1}] ERROR ${r.status}: ${j.error || j.detail || "unknown"} · "${item.text.slice(0, 60)}..."`);
      }
    } catch (e) {
      errCount++;
      console.warn(`[${i+1}] FETCH FAILED: ${e.message} · "${item.text.slice(0, 60)}..."`);
    }

    if (i < todo.length - 1) await new Promise(res => setTimeout(res, DELAY_MS));
  }

  await fs.writeFile(PROGRESS_FILE, JSON.stringify(done, null, 1));
  console.log("");
  console.log(`Done. ok: ${okCount}, already cached: ${cachedCount}, errors: ${errCount}`);
  console.log(`Progress saved to ${PROGRESS_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
