#!/usr/bin/env node
/* ============================================================
   Write releases.json — the release list, served from this site.
   ------------------------------------------------------------
   The home page used to ask api.github.com for the last 30 releases on every
   visit: 192KB of JSON, mostly asset metadata and release bodies the page
   never shows, from an API that allows 60 unauthenticated requests an hour
   per IP address. Everyone behind one office or carrier NAT shared that 60,
   and once it ran out the download buttons fell back to whatever version
   index.html was last synced to.

   The sync-release workflow already runs on every release and every hour, so
   it writes this file instead, and app.js reads it from the same origin. The
   API stays in app.js as the fallback for when this file cannot be fetched.

   It reads the API's JSON on stdin, so CI and a laptop run the same code:

     gh api 'repos/khaytapp/Khayt/releases?per_page=30' | node scripts/make-releases.js

   Per release it keeps what app.js reads — tag, name, date, prerelease,
   html_url, and the first sentence of the release's first paragraph as `note` — plus the download
   assets (name, size, URL) of the two releases the download card can point
   at: the newest stable and the newest prerelease. Older releases' assets
   were most of the 192KB, and nothing reads them.

   The output carries no timestamp: the workflow commits it only when it
   changes, and a clock in it would make that every hour.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'releases.json');

// The note for a release: the first sentence of its body's first paragraph,
// as one line. The bodies are hard-wrapped markdown, so the first LINE stops
// mid-sentence ("…since 3.11.3. Individual"); a paragraph runs to the first
// blank line and is unwrapped here. Only its first sentence is kept, because
// every 3.11 body continues "Individual entries are kept below; this is what
// changed for you." — true in the release notes, meaningless repeated on
// each row of the site's list. Headings are skipped and links unwrapped to
// their text, because the page prints the result as plain text. app.js's
// releaseNote does the same for the API fallback — keep the two in step.
function releaseNote(body) {
  const paras = String(body || '').replace(/\r/g, '').split(/\n\s*\n/);
  for (const p of paras) {
    const lines = p.split('\n').map(l => l.trim()).filter(l => l && !/^#/.test(l));
    if (!lines.length) continue;
    return lines.join(' ')
      .replace(/^[-*\s]+/, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*/g, '').replace(/`/g, '')
      .replace(/\s+/g, ' ').trim()
      // A sentence ends at . ! or ? followed by a space and a capital, so
      // the dots inside "3.11.3" do not end one.
      .replace(/^(.*?[.!?])\s+[A-Z][\s\S]*$/, '$1');
  }
  return '';
}

// Same ordering as cmpVer in app.js: numeric core, then a stable release
// above a prerelease of the same core, then the prerelease number.
function parse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.?(\d+)?)?$/i.exec(String(v).replace(/^v/, ''));
  return m && { core: [+m[1], +m[2], +m[3]], isPre: !!m[4], preNum: m[5] ? +m[5] : 0 };
}
function cmpVer(a, b) {
  const pa = parse(a), pb = parse(b);
  if (!pa || !pb) return String(b).localeCompare(String(a));
  for (let i = 0; i < 3; i++) if (pa.core[i] !== pb.core[i]) return pa.core[i] - pb.core[i];
  if (pa.isPre !== pb.isPre) return pa.isPre ? -1 : 1;
  return pa.preNum - pb.preNum;
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  console.error('make-releases: stdin is not JSON — ' + e.message);
  process.exit(1);
}
// A rate-limit or error response is an object, not a list. Writing it would
// replace a good file with an empty one, so refuse and leave the file alone.
if (!Array.isArray(input) || !input.length) {
  console.error('make-releases: expected a non-empty array of releases, got ' +
    (Array.isArray(input) ? 'an empty one' : JSON.stringify(input).slice(0, 200)));
  process.exit(1);
}

// An authenticated token can see drafts; the public API cannot, and neither
// may the site.
const pub = input.filter(r => !r.draft && r.tag_name)
  .sort((a, b) => cmpVer(b.tag_name, a.tag_name));
const stable = pub.find(r => !r.prerelease);
const beta = pub.find(r => r.prerelease);

const releases = pub.map(r => {
  const out = {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    date: (r.published_at || '').slice(0, 10),
    prerelease: !!r.prerelease,
    note: releaseNote(r.body),
    html_url: r.html_url
  };
  if (r === stable || r === beta) {
    out.assets = (r.assets || []).map(a => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url }));
  }
  return out;
});

fs.writeFileSync(OUT, JSON.stringify({ releases }, null, 1) + '\n');
console.log(`releases.json: ${releases.length} releases, newest stable ${stable ? stable.tag_name : 'none'}` +
  (beta ? `, newest prerelease ${beta.tag_name}` : ''));
