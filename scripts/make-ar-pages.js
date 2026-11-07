#!/usr/bin/env node
/* ============================================================
   Write the Arabic copies of the sub-pages: ar/services.html, ar/privacy/,
   ar/terms/, ar/blog/ and ar/blog/<post>.html.
   ------------------------------------------------------------
   The sub-pages carry both languages already — the prose as two [data-lang]
   blocks, the short strings in site.js's CHROME and the page's PAGE_STRINGS —
   and switch between them in place. Their Arabic URL was the same file with
   ?lang=ar, whose canonical is the English URL, so a search engine folded it
   into the English page and never indexed the Arabic at all. The home page
   had the same problem and got its own file (scripts/make-ar.js); this does
   the same for every other page, from the English file, so the two can never
   say different things:

     · every data-i18n / data-i18n-aria element takes its Arabic from CHROME
       or the page's PAGE_STRINGS (site.js's own lookup order);
     · [data-lang="en"] blocks are hidden and [data-lang="ar"] ones shown;
     · <time datetime> shows the Arabic date, formatted as site.js formats it;
     · services' three grids and the blog's post cards are rendered in Arabic
       from the same functions the browser calls;
     · <html lang dir>, <body dir>, <title>, description, Open Graph, the
       JSON-LD of a post, and the canonical point at the /ar/ URL;
     · every relative URL is made root-absolute, and a link to a page that
       has an Arabic copy points at that copy (/ar/...). In-page "#x" links
       are left alone: there is no <base>, so they stay on this page.

   It also writes the English page's own hreflang="ar" alternate, so the pair
   always names each other (en <-> ar, x-default = en).

   site.js still runs on the copy, starts it in Arabic because it is under
   /ar/, and its language button navigates to the English page.

     node scripts/make-ar-pages.js           # write every copy
     node scripts/make-ar-pages.js --check   # exit 1 if any copy is stale

   Nothing the release bots edit lives on these pages, so unlike make-ar.js
   --check compares byte for byte.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const SITE = 'https://khaytapp.com';
const pages = require('./pages.js');

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = t => esc(t).replace(/"/g, '&quot;');
const unattr = t => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

require(path.join(ROOT, 'data.js'));
require(path.join(ROOT, 'render.js'));
require(path.join(ROOT, 'blog', 'posts.js'));
require(path.join(ROOT, 'services.js'));
const DATA = globalThis.KHAYT_DATA;
const RENDER = globalThis.KHAYT_RENDER;
const POSTS = globalThis.KHAYT_POSTS;
const SERVICES = globalThis.KHAYT_SERVICES;

// The object literal that follows `marker` in `src`, evaluated. Braces are
// counted outside string literals, so a "{n}" inside a string is not one.
function literalAfter(src, marker, where) {
  const at = src.indexOf(marker);
  if (at === -1) return null;
  const open = src.indexOf('{', at);
  let depth = 0, quote = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return vm.runInNewContext('(' + src.slice(open, i + 1) + ')');
  }
  throw new Error('make-ar-pages: unterminated ' + marker + ' in ' + where);
}

const CHROME = literalAfter(fs.readFileSync('site.js', 'utf8'), 'var CHROME = {', 'site.js');

// A page's own strings: an inline `window.PAGE_STRINGS = {` in the page, or —
// for services.html — the one in services.js, which it loads.
function pageStrings(file, html) {
  return literalAfter(html, 'window.PAGE_STRINGS = {', file) ||
    (/<script src="services\.js(?:\?v=[0-9a-f]+)?">/.test(html) ? literalAfter(fs.readFileSync('services.js', 'utf8'), 'window.PAGE_STRINGS = {', 'services.js') : {});
}

function one(html, re, fn, what, file) {
  let n = 0;
  const out = html.replace(re, (...m) => { n++; return fn(...m); });
  if (n !== 1) throw new Error(`make-ar-pages: ${file}: expected exactly one ${what}, found ${n}`);
  return out;
}

// https://khaytapp.com/privacy/ for privacy/index.html, and so on.
const publicPath = file => file.replace(/(^|\/)index\.html$/, '$1');
const enUrl = file => SITE + '/' + publicPath(file);
const arUrl = file => SITE + '/ar/' + publicPath(file);

// The English page's alternates: itself, its Arabic copy, and itself again
// as the default. Written here so the pair can never disagree.
function alternates(file) {
  return `<link rel="alternate" hreflang="en" href="${enUrl(file)}">\n` +
    `<link rel="alternate" hreflang="ar" href="${arUrl(file)}">\n` +
    `<link rel="alternate" hreflang="x-default" href="${enUrl(file)}">`;
}
function withAlternates(file, html) {
  return one(html,
    /<link rel="alternate" hreflang="en" href="[^"]*">\n<link rel="alternate" hreflang="ar" href="[^"]*">\n<link rel="alternate" hreflang="x-default" href="[^"]*">/g,
    () => alternates(file), 'hreflang trio', file);
}

function build(file, en) {
  const dict = Object.assign({}, pageStrings(file, en), CHROME); // CHROME wins, as in site.js's t()
  const ar = key => {
    const e = dict[key];
    if (!e || typeof e.ar !== 'string') throw new Error(`make-ar-pages: ${file}: no Arabic for ${key}`);
    return e.ar;
  };
  let html = en;

  // Every data-i18n element must be a leaf: site.js sets its textContent, so
  // markup inside one would be thrown away in the browser anyway.
  for (const m of html.matchAll(/<(\w+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>(?![^<]*<\/\1>)/g)) {
    throw new Error(`make-ar-pages: ${file}: data-i18n="${m[2]}" holds markup; it must be plain text`);
  }
  html = html.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)</g, (whole, open, key) => open + esc(ar(key)) + '<');
  html = html.replace(/<[^>]*\sdata-i18n-aria="([^"]+)"[^>]*>/g, (tag, key) =>
    tag.replace(/aria-label="[^"]*"/, 'aria-label="' + attr(ar(key)) + '"'));

  // Prose blocks: the Arabic one shows, the English one hides.
  html = html.replace(/<(\w+)\b([^>]*\sdata-lang="(en|ar)"[^>]*)>/g, (tag, name, rest, lang) => {
    const bare = rest.replace(/\shidden(?=\s|$)/g, '');
    return '<' + name + bare + (lang === 'en' ? ' hidden' : '') + '>';
  });

  // Dates, as site.js writes them in Arabic.
  html = html.replace(/(<time datetime="(\d{4}-\d{2}-\d{2})"[^>]*>)[^<]*(<\/time>)/g,
    (m, a, iso, b) => a + esc(RENDER.postDate(iso, 'ar')) + b);

  // The language button names the language you switch TO.
  html = one(html, /(<button class="lang-toggle" id="navLang">)[\s\S]*?(<\/button>)/g,
    (m, a, b) => a + '<span aria-hidden="true">🌐</span> <span class="sr-only">' + esc(ar('a11y.lang')) + ' </span><span lang="en">English</span>' + b,
    'language button', file);

  // Head and document.
  const pageAttr = name => {
    const m = html.match(new RegExp('data-page-' + name + '="([^"]*)"'));
    if (!m) throw new Error(`make-ar-pages: ${file}: no data-page-${name}`);
    return unattr(m[1]);
  };
  const title = pageAttr('title-ar'), desc = pageAttr('desc-ar');
  html = one(html, /<html lang="en">/g, () => '<html lang="ar" dir="rtl">', '<html>', file);
  html = one(html, /<body class="([^"]*)">/g, (m, cls) => `<body class="${cls}" dir="rtl">`, '<body>', file);
  html = one(html, /<title>[^<]*<\/title>/g, () => `<title>${esc(title)}</title>`, '<title>', file);
  html = one(html, /<meta name="description" content="[^"]*">/g, () => `<meta name="description" content="${attr(desc)}">`, 'description', file);
  html = one(html, /<meta property="og:title" content="[^"]*">/g, () => `<meta property="og:title" content="${attr(title)}">`, 'og:title', file);
  html = one(html, /<meta property="og:description" content="[^"]*">/g, () => `<meta property="og:description" content="${attr(desc)}">`, 'og:description', file);
  html = one(html, /<meta property="og:url" content="[^"]*">/g, () => `<meta property="og:url" content="${arUrl(file)}">`, 'og:url', file);
  html = one(html, /<meta property="og:type" content="[^"]*">\n/g,
    m => m + '<meta property="og:locale" content="ar">\n<meta property="og:locale:alternate" content="en">\n', 'og:type', file);
  html = one(html, /<link rel="canonical" href="[^"]*">/g, () => `<link rel="canonical" href="${arUrl(file)}">`, 'canonical', file);

  // A post's structured data describes the Arabic page.
  html = html.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/g, (m, a, json, b) => {
    const ld = JSON.parse(json);
    if (ld['@type'] === 'BlogPosting') {
      const post = POSTS.find(p => file === 'blog/' + p.slug + '.html');
      if (!post) throw new Error(`make-ar-pages: ${file}: BlogPosting with no entry in posts.js`);
      ld.headline = post.t.ar;
      ld.description = post.d.ar;
      ld.inLanguage = 'ar';
      ld.mainEntityOfPage = arUrl(file);
    }
    return a + JSON.stringify(ld, null, 2) + b;
  });

  // URLs: root-absolute, and onto the Arabic copy where there is one. No
  // <base>, so "#x" stays on this page and the relative links the page's
  // scripts build at runtime (a post card's "slug.html", a plan's
  // "./#download") resolve from /ar/ to the Arabic page as well.
  const dir = path.posix.dirname(file);
  html = html.replace(/(\s(?:href|src)=")(?!https?:|mailto:|data:|#)([^"]+)"/g, (m, a, url) => {
    const [, p, rest] = /^([^?#]*)(.*)$/.exec(url);
    let t = p.startsWith('/') ? p.slice(1) : path.posix.normalize(path.posix.join(dir, p));
    if (t === '.' || t === './') t = '';
    if (p.endsWith('/') && t && !t.endsWith('/')) t += '/';
    return a + pages.arHref(t + rest) + '"';
  });
  if (/\ssrcset="/.test(html)) throw new Error(`make-ar-pages: ${file}: has a srcset, which this does not rewrite yet`);

  // Fonts: preload the Arabic body face, not the Latin one.
  html = html.replace(/<link rel="preload" href="([^"]*?)fonts\/archivo-latin\.woff2" as="font" type="font\/woff2" crossorigin>/,
    (m, pre) => `<link rel="preload" href="${pre}fonts/ibm-plex-sans-arabic-arabic-400.woff2" as="font" type="font/woff2" crossorigin>`);

  // The prerendered blocks, in Arabic — after the URL pass, so the static
  // markup is exactly what the page's own script writes over it.
  const S = key => ar(key);
  const blocks = {
    planGrid: () => SERVICES.plans(DATA, 'ar', SERVICES.INITIAL_AR.cycle, SERVICES.INITIAL_AR.cur),
    svcGrid: () => SERVICES.services(DATA.cloud, 'ar', {}),
    sendsBody: () => SERVICES.sends(DATA.cloud, 'ar'),
    postList: () => RENDER.postCards(POSTS, 'ar', { more: S('bl.more'), latest: S('bl.latest') })
  };
  for (const m of html.matchAll(/<!-- PRERENDER:(\w+):START -->/g)) {
    if (!blocks[m[1]]) throw new Error(`make-ar-pages: ${file}: no Arabic renderer for PRERENDER:${m[1]}`);
  }
  for (const [id, fn] of Object.entries(blocks)) {
    const a = `<!-- PRERENDER:${id}:START -->`, b = `<!-- PRERENDER:${id}:END -->`;
    const i = html.indexOf(a), j = html.indexOf(b);
    if (i === -1) continue;
    if (j < i) throw new Error(`make-ar-pages: ${file}: ${id} markers are inverted`);
    html = html.slice(0, i + a.length) + fn() + html.slice(j);
  }
  // The currency switch starts on the riyal here, matching the plan grid.
  html = html.replace('<button type="button" class="seg-btn is-on" data-cur="USD" aria-pressed="true">', '<button type="button" class="seg-btn" data-cur="USD" aria-pressed="false">')
             .replace('<button type="button" class="seg-btn" data-cur="SAR" aria-pressed="false">', '<button type="button" class="seg-btn is-on" data-cur="SAR" aria-pressed="true">');

  html = one(html, /<!DOCTYPE html>\n/gi, m => m +
    `<!-- GENERATED by scripts/make-ar-pages.js from ${file}. Do not edit: edit that and re-run it. -->\n`, 'doctype', file);
  return html;
}

const check = process.argv.includes('--check');
const stale = [];
for (const file of pages.AR_SOURCES()) {
  const before = fs.readFileSync(file, 'utf8');
  const en = withAlternates(file, before);
  const out = 'ar/' + file;
  const want = build(file, en);
  const have = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (check) {
    if (en !== before) stale.push(file + ' (its hreflang alternates)');
    if (have !== want) stale.push(out);
    continue;
  }
  if (en !== before) { fs.writeFileSync(file, en); console.log('updated ' + file + ' (hreflang)'); }
  if (have !== want) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, want);
    console.log('wrote ' + out);
  }
}
if (check) {
  if (stale.length) {
    console.error('STALE: ' + stale.join(', ') + '\nRun `node scripts/make-ar-pages.js` and commit the result.');
    process.exit(1);
  }
  console.log(pages.AR_SOURCES().length + ' Arabic copies are up to date');
} else {
  console.log(pages.AR_SOURCES().length + ' Arabic copies current');
}
