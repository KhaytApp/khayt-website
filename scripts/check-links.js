#!/usr/bin/env node
/* ============================================================
   Do the links on this site actually go anywhere?
   ------------------------------------------------------------
   check-site.js is deliberately offline: it is the gate on every PR and a
   flaky network must never fail a commit. So nothing here has ever asked the
   one question that matters about a download button — does the file exist?

   Every serious fault found on this site in one week was exactly that:

     · the macOS .dmg 404ed for two releases, because the sync invented a URL
       for an artifact that had deliberately not been built
     · every download size was 10-16MB wrong, hand-written beside a URL a
       script rewrites each release
     · the sync itself had never matched a URL — REPO is spelled
       "khaytapp/Khayt" and the page says "KhaytApp/Khayt" — so it reported
       success while changing nothing

   None of it was visible from the HTML. All of it was one HTTP request away.

   Runs on a schedule rather than on pull requests, for the reason above: a
   red PR should mean the author broke something, not that GitHub was slow.

     node scripts/check-links.js            # every external link
     node scripts/check-links.js --downloads  # just the release assets
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

const DOWNLOADS_ONLY = process.argv.includes('--downloads');

const pages = require('./pages.js');

// Anchored to real href/src attributes: a URL inside a comment or a code
// sample is not a link this site offers anyone.
const HREF = /(?:href|src)="(https?:\/\/[^"]+)"/g;

const found = new Map(); // url -> Set(pages)
for (const p of pages()) {
  const html = fs.readFileSync(p, 'utf8');
  for (const m of html.matchAll(HREF)) {
    const url = m[1].replace(/&amp;/g, '&');
    if (DOWNLOADS_ONLY && !url.includes('/releases/download/')) continue;
    if (!found.has(url)) found.set(url, new Set());
    found.get(url).add(p);
  }
}

// Fonts and the like are third-party infrastructure; if Google Fonts is down
// that is not this repository's problem and not worth a red run.
const SKIP = [/^https:\/\/fonts\.(googleapis|gstatic)\.com/];

const urls = [...found.keys()].filter(u => !SKIP.some(re => re.test(u))).sort();

async function check(url) {
  // HEAD first — a 170MB installer should not be downloaded to prove it is
  // there. Some hosts refuse HEAD, so fall back to a ranged GET.
  for (const init of [{ method: 'HEAD' }, { method: 'GET', headers: { Range: 'bytes=0-0' } }]) {
    try {
      const res = await fetch(url, { ...init, redirect: 'follow',
                                     signal: AbortSignal.timeout(30000) });
      if (res.status !== 405 && res.status !== 501) return res.status;
    } catch (e) {
      if (init.method === 'GET') return 'ERR ' + (e.cause?.code || e.name);
    }
  }
  return 'ERR';
}

// A REFUSAL IS NOT AN ABSENCE.
//
// reddit.com answers this check with 403 from a GitHub runner and 200 from a
// laptop: it is turning away a datacenter IP, not saying the subreddit is
// gone. Failing on that would make a daily job that cries wolf, and a check
// people learn to ignore is worse than no check — it was red on its very
// first scheduled run for exactly this.
//
// So only an answer that proves the thing is NOT THERE fails: 404, 410, and
// the 5xx range where the host is broken. 401/403/429 mean the server
// responded and declined to serve US, which the download buttons — the whole
// reason this exists — can never do: GitHub returns a plain 404 for an asset
// that was never built.
const BLOCKED = new Set([401, 403, 429]);

(async () => {
  const bad = [], blocked = [];
  for (const url of urls) {
    let status = await check(url);
    // One retry: a single timeout is weather, not a broken link.
    if (typeof status !== 'number' || status >= 400) status = await check(url);
    const isBlocked = BLOCKED.has(status);
    const ok = (typeof status === 'number' && status < 400) || isBlocked;
    if (isBlocked) blocked.push({ url, status });
    else if (!ok) bad.push({ url, status, pages: [...found.get(url)] });
    const tag = isBlocked ? 'bot? ' : ok ? 'ok   ' : 'FAIL ';
    console.log(`  ${tag} ${String(status).padEnd(5)} ${url}`);
  }

  console.log(`\n${urls.length} link(s) checked, ${bad.length} broken` +
              (blocked.length ? `, ${blocked.length} refused us (not counted)` : ''));
  for (const b of blocked) console.log(`  note: ${b.status} from ${b.url} — reachable, declined to serve a bot`);
  if (bad.length) {
    console.error('\nBroken links:');
    for (const b of bad) console.error(`  ${b.status}  ${b.url}\n        on: ${b.pages.join(', ')}`);
    process.exit(1);
  }
})();
