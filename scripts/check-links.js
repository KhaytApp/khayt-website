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

   And a 200 is not a download. This followed redirects and read only the
   last status, so the Mac button — github.com/…/khayt-mac/releases/latest —
   passed as 200 while GitHub was sending everyone to the plain /releases
   list, because a repository whose releases are all pre-releases has no
   "latest". So a DOWNLOAD link (an a.dl-link button, or any GitHub
   /releases/download/ or /releases/latest URL) now has its redirects walked
   one hop at a time, and fails if it ends on an HTML page instead of a file.

   Runs on a schedule rather than on pull requests, for the reason above: a
   red PR should mean the author broke something, not that GitHub was slow.

     node scripts/check-links.js            # every external link
     node scripts/check-links.js --downloads  # just the download links
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

// What counts as a download: the page says so with class="dl-link", or the
// URL is one of GitHub's two release-file shapes. A plain /releases page link
// in a footer is a page on purpose and is only checked for existing.
const DOWNLOAD_URL = /\/releases\/(download|latest)(\/|$)/;
const DL_TAG = /<a\b[^>]*\bclass="[^"]*\bdl-link\b[^"]*"[^>]*\bhref="(https?:\/\/[^"]+)"|<a\b[^>]*\bhref="(https?:\/\/[^"]+)"[^>]*\bclass="[^"]*\bdl-link\b/g;

const found = new Map(); // url -> Set(pages)
const downloads = new Set();
for (const p of pages()) {
  const html = fs.readFileSync(p, 'utf8');
  for (const m of html.matchAll(DL_TAG)) downloads.add((m[1] || m[2]).replace(/&amp;/g, '&'));
  for (const m of html.matchAll(HREF)) {
    const url = m[1].replace(/&amp;/g, '&');
    if (DOWNLOAD_URL.test(url)) downloads.add(url);
    if (DOWNLOADS_ONLY && !downloads.has(url)) continue;
    if (!found.has(url)) found.set(url, new Set());
    found.get(url).add(p);
  }
}

// Fonts and the like are third-party infrastructure; if Google Fonts is down
// that is not this repository's problem and not worth a red run.
const SKIP = [/^https:\/\/fonts\.(googleapis|gstatic)\.com/];

const urls = [...found.keys()].filter(u => !SKIP.some(re => re.test(u))).sort();

// Redirects are walked by hand rather than followed, so the answer says
// where the link ENDED and what it was, not just how the last hop went.
async function walk(url, init) {
  let at = url;
  for (let hop = 0; hop < 10; hop++) {
    const res = await fetch(at, { ...init, redirect: 'manual', signal: AbortSignal.timeout(30000) });
    const next = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && next) { at = new URL(next, at).href; continue; }
    return { status: res.status, final: at, type: (res.headers.get('content-type') || '').toLowerCase() };
  }
  return { status: 'ERR redirect loop', final: at, type: '' };
}

async function check(url) {
  // HEAD first — a 170MB installer should not be downloaded to prove it is
  // there. Some hosts refuse HEAD, so fall back to a ranged GET.
  for (const init of [{ method: 'HEAD' }, { method: 'GET', headers: { Range: 'bytes=0-0' } }]) {
    try {
      const r = await walk(url, init);
      if (r.status !== 405 && r.status !== 501) return r;
    } catch (e) {
      if (init.method === 'GET') return { status: 'ERR ' + (e.cause?.code || e.name), final: url, type: '' };
    }
  }
  return { status: 'ERR', final: url, type: '' };
}

// Why a download link that answered still is not a download, or null.
function notAFile(url, r) {
  if (!downloads.has(url) || typeof r.status !== 'number' || r.status >= 400) return null;
  if (/\/releases\/latest\/?$/.test(new URL(url).pathname) && /\/releases\/?$/.test(new URL(r.final).pathname)) {
    return 'releases/latest redirects to the releases LIST — the repository has no ' +
      'published non-prerelease release, so there is no "latest" to download';
  }
  if (r.type.startsWith('text/html')) return 'ends on an HTML page (' + r.final + '), not a file';
  return null;
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
    let r = await check(url);
    // One retry: a single timeout is weather, not a broken link.
    if (typeof r.status !== 'number' || r.status >= 400) r = await check(url);
    const status = r.status;
    const isBlocked = BLOCKED.has(status);
    const why = notAFile(url, r);
    const ok = !why && ((typeof status === 'number' && status < 400) || isBlocked);
    if (isBlocked && !why) blocked.push({ url, status });
    else if (!ok) bad.push({ url, status: why ? status + ' — ' + why : status, pages: [...found.get(url)] });
    const tag = isBlocked ? 'bot? ' : ok ? 'ok   ' : 'FAIL ';
    console.log(`  ${tag} ${String(status).padEnd(5)} ${url}${why ? '\n          ' + why : ''}`);
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
