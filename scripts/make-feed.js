#!/usr/bin/env node
/* ============================================================
   Generate blog/feed.xml from blog/posts.js.
   ------------------------------------------------------------
   A blog with nothing to subscribe to is a page people have to remember to
   come back to, and the audience here — makers who already follow half a
   dozen printer and firmware projects — mostly reads feeds.

   Atom rather than RSS: it requires the language on each entry, which matters
   for a bilingual blog, and its dates are unambiguous.

   Both languages go in one feed, as two <entry> per post with xml:lang set,
   rather than two feeds nobody would know to choose between. A reader shows
   both; that is the honest representation of a site that is written twice.

     node scripts/make-feed.js          # write blog/feed.xml
     node scripts/make-feed.js --check  # exit 1 if it would change

   --check is what CI runs, so adding a post without regenerating the feed
   fails the build rather than quietly publishing to nobody.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://khaytapp.com';
const OUT = path.join(ROOT, 'blog', 'feed.xml');

require(path.join(ROOT, 'blog', 'posts.js'));
const POSTS = globalThis.KHAYT_POSTS || [];
if (!POSTS.length) {
  console.error('make-feed: blog/posts.js exported no posts');
  process.exit(1);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Atom wants a full timestamp. The posts carry a date, because a release
// happened on a day rather than at a minute, so noon UTC it is — far enough
// from either midnight that no reader's timezone moves it to another day.
function stamp(date) { return date + 'T12:00:00Z'; }

const updated = stamp(POSTS.map(p => p.date).sort().reverse()[0]);

let xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Khayt — blog</title>
  <subtitle>Release notes, what changed and why, and how Khayt's parts actually work.</subtitle>
  <link href="${SITE}/blog/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/blog/" rel="alternate" type="text/html"/>
  <id>${SITE}/blog/</id>
  <updated>${updated}</updated>
  <author><name>Khayt</name><uri>${SITE}/</uri></author>
  <rights>FSL-1.1-Apache-2.0 · © 2026 Khayt</rights>
`;

for (const p of POSTS) {
  for (const lang of ['en', 'ar']) {
    const url = `${SITE}/blog/${p.slug}.html` + (lang === 'ar' ? '?lang=ar' : '');
    xml += `
  <entry xml:lang="${lang}">
    <title>${esc(p.t[lang])}</title>
    <link href="${esc(url)}" rel="alternate" type="text/html"/>
    <id>tag:khaytapp.com,${p.date}:/blog/${p.slug}/${lang}</id>
    <published>${stamp(p.date)}</published>
    <updated>${stamp(p.date)}</updated>
    <category term="${esc(p.tag[lang])}"/>
    <summary type="text">${esc(p.d[lang])}</summary>
  </entry>
`;
  }
}

xml += '</feed>\n';

const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;

if (before === xml) {
  console.log('blog/feed.xml is up to date');
  process.exit(0);
}

if (process.argv.includes('--check')) {
  console.error('blog/feed.xml is STALE: it does not match blog/posts.js.');
  console.error('Run `node scripts/make-feed.js` and commit the result.');
  process.exit(1);
}

fs.writeFileSync(OUT, xml);
console.log(`blog/feed.xml written — ${POSTS.length} posts, ${POSTS.length * 2} entries (en + ar)`);
