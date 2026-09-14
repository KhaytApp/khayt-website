#!/usr/bin/env node
/* ============================================================
   Stamp each post's metadata from blog/posts.js into its HTML.
   ------------------------------------------------------------
   A post's title and summary appear in eight places in its own page — the
   <title>, the description, three og: tags, the JSON-LD, the two <h1>s —
   and again in blog/posts.js, which is what the index and the feed render.
   Written by hand that is nine copies of one sentence, in two languages.

   So posts.js owns them, and this stamps them in. The prose stays in the HTML
   where prose belongs; only the metadata is generated.

     node scripts/stamp-posts.js          # write
     node scripts/stamp-posts.js --check  # exit 1 if any page is out of date

   --check is what CI runs, so editing a title in posts.js and forgetting to
   re-stamp fails the build instead of shipping a page whose tab, share card
   and heading disagree with the index that links to it.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

require(path.join(ROOT, 'blog', 'posts.js'));
const POSTS = globalThis.KHAYT_POSTS || [];
if (!POSTS.length) { console.error('stamp-posts: blog/posts.js exported no posts'); process.exit(1); }

const check = process.argv.includes('--check');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

// Replace the contents of a tag, or the value of an attribute, leaving
// everything else in the line alone. Throws rather than silently doing
// nothing, because a quiet no-op here is a page that keeps an old title.
function sub(html, label, re, replacement) {
  re.lastIndex = 0;
  if (!re.test(html)) throw new Error(`${label}: no match for ${re}`);
  re.lastIndex = 0;
  return html.replace(re, replacement);
}

let changed = [], stale = [];

for (const p of POSTS) {
  const file = path.join('blog', p.slug + '.html');
  if (!fs.existsSync(file)) {
    console.error(`stamp-posts: blog/posts.js lists "${p.slug}" but ${file} does not exist`);
    process.exit(1);
  }
  const before = fs.readFileSync(file, 'utf8');
  let h = before;

  const titleEn = esc(p.t.en), titleAr = esc(p.t.ar);
  const descEn = esc(p.d.en), descAr = esc(p.d.ar);

  h = sub(h, p.slug + ' <title>', /<title>[\s\S]*?<\/title>/, `<title>${titleEn} — Khayt</title>`);

  // These are matched to the END OF THE LINE rather than to the closing quote,
  // so a tag whose attribute is already broken can be repaired rather than
  // skipped. It was: a description beginning with a quotation mark closed its
  // own attribute, and what-the-cloud-sends.html shipped with an empty
  // description and the rest of the sentence parsed as stray attributes.
  // Matching [^"]* would have found nothing there and left it broken.
  const metaLine = (attr, val) => [
    new RegExp('^<meta ' + attr + ' content="[^\\n]*$', 'm'),
    `<meta ${attr} content="${val}">`
  ];
  h = sub(h, p.slug + ' description', ...metaLine('name="description"', escAttr(p.d.en)));
  h = sub(h, p.slug + ' og:title', ...metaLine('property="og:title"', escAttr(p.t.en) + ' — Khayt'));
  h = sub(h, p.slug + ' og:description', ...metaLine('property="og:description"', escAttr(p.d.en)));
  h = sub(h, p.slug + ' published_time', ...metaLine('property="article:published_time"', p.date));

  h = sub(h, p.slug + ' page-title-en', /(data-page-title-en=")[^"]*(")/, `$1${escAttr(p.t.en)} — Khayt$2`);
  h = sub(h, p.slug + ' page-title-ar', /(data-page-title-ar=")[^"]*(")/, `$1${escAttr(p.t.ar)} — خيط$2`);
  h = sub(h, p.slug + ' page-desc-en', /(data-page-desc-en=")[^"]*(")/, `$1${escAttr(p.d.en)}$2`);
  h = sub(h, p.slug + ' page-desc-ar', /(data-page-desc-ar=")[^"]*(")/, `$1${escAttr(p.d.ar)}$2`);

  h = sub(h, p.slug + ' h1 en', /<h1 data-lang="en">[\s\S]*?<\/h1>/, `<h1 data-lang="en">${titleEn}</h1>`);
  h = sub(h, p.slug + ' h1 ar', /<h1 data-lang="ar" hidden>[\s\S]*?<\/h1>/, `<h1 data-lang="ar" hidden>${titleAr}</h1>`);

  h = sub(h, p.slug + ' tag en', /(<span class="tag" data-lang="en">)[^<]*(<\/span>)/, `$1${esc(p.tag.en)}$2`);
  h = sub(h, p.slug + ' tag ar', /(<span class="tag" data-lang="ar" hidden>)[^<]*(<\/span>)/, `$1${esc(p.tag.ar)}$2`);

  const longDate = new Intl.DateTimeFormat('en-GB',
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(p.date + 'T12:00:00Z'));
  h = sub(h, p.slug + ' time', /<time datetime="[^"]*">[^<]*<\/time>/, `<time datetime="${p.date}">${longDate}</time>`);

  // The JSON-LD block is regenerated whole rather than patched field by field.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.t.en,
    description: p.d.en,
    datePublished: p.date,
    inLanguage: ['en', 'ar'],
    image: 'https://khaytapp.com/og-image.png',
    mainEntityOfPage: `https://khaytapp.com/blog/${p.slug}.html`,
    author: { '@type': 'Organization', name: 'Khayt', url: 'https://github.com/KhaytApp' },
    publisher: { '@type': 'Organization', name: 'Khayt', url: 'https://khaytapp.com/' }
  };
  h = sub(h, p.slug + ' JSON-LD', /(<script type="application\/ld\+json">\n)[\s\S]*?(\n<\/script>)/,
    `$1${JSON.stringify(ld, null, 2)}$2`);

  if (h !== before) {
    if (check) stale.push(file);
    else { fs.writeFileSync(file, h); changed.push(file); }
  }
}

if (check) {
  if (stale.length) {
    console.error('These post pages do not match blog/posts.js:');
    stale.forEach(f => console.error('  ' + f));
    console.error('\nRun `node scripts/stamp-posts.js` and commit the result.');
    process.exit(1);
  }
  console.log(`${POSTS.length} posts match blog/posts.js`);
  process.exit(0);
}

console.log(changed.length
  ? `stamped ${changed.length} of ${POSTS.length} posts:\n  ` + changed.join('\n  ')
  : `all ${POSTS.length} posts already match blog/posts.js`);
