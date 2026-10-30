#!/usr/bin/env node
/* ============================================================
   Write ar/index.html: the home page, in Arabic, as HTML.
   ------------------------------------------------------------
   Arabic was a client-side switch: https://khaytapp.com/?lang=ar served the
   English HTML and app.js rewrote it after load. A crawler that does not run
   JavaScript — and a Saudi shop searching in Arabic is exactly who finds
   Khayt through one — read that URL as an English page. So the Arabic page
   is its own file now, at /ar/, generated from index.html and the same DICT
   app.js applies, so the two can never say different things:

     · every data-i18n / data-i18n-html / data-i18n-aria element takes DICT's
       Arabic (the inverse of scripts/sync-static-text.js);
     · the prerendered blocks are rendered from data.js in Arabic;
     · the iPhone and queue screenshots are the Arabic captures;
     · <html lang dir>, <title>, description, Open Graph, canonical and the
       hreflang pair point at /ar/;
     · every relative URL is made root-absolute, and a <base href="/"> covers
       the paths app.js builds at runtime; in-page "#x" links become
       "/ar/#x" so they stay on this page under that base.

   app.js still runs here and applies Arabic on load (it knows it is on /ar/),
   so the page looks exactly as ?lang=ar always did.

     node scripts/make-ar.js           # write ar/index.html
     node scripts/make-ar.js --check   # exit 1 if it is stale

   The release bots (sync-release.yml, and the Mac lane's feed publish) edit
   version numbers and download sizes in index.html several times a week.
   --check masks those, so a release does not leave every next PR red; the
   page's versions are refreshed by app.js on load either way, and
   sync-release.yml regenerates this file when it commits.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const OUT = 'ar/index.html';
const SITE = 'https://khaytapp.com';

const src = fs.readFileSync('app.js', 'utf8');
const start = src.indexOf('var DICT = {');
const dict = vm.runInNewContext('(' + src.slice(src.indexOf('{', start), src.indexOf('\n  };', start)) + '\n})');
const ar = key => {
  const e = dict[key];
  if (!e || typeof e.ar !== 'string') throw new Error('make-ar: no Arabic for ' + key);
  return e.ar;
};
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = t => esc(t).replace(/"/g, '&quot;');

require(path.join(ROOT, 'data.js'));
require(path.join(ROOT, 'render.js'));
const DATA = globalThis.KHAYT_DATA;
const RENDER = globalThis.KHAYT_RENDER;

function one(html, re, fn, what) {
  let n = 0;
  const out = html.replace(re, (...m) => { n++; return fn(...m); });
  if (n !== 1) throw new Error(`make-ar: expected exactly one ${what}, found ${n}`);
  return out;
}

function build() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Text, markup and accessible names, from the dictionary.
  html = html.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)</g, (whole, open, key) =>
    dict[key] ? open + esc(ar(key)) + '<' : whole);
  html = html.replace(/(<(\w+)[^>]*\sdata-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (whole, open, tag, key, inner, close) =>
    dict[key] ? open + ar(key) + close : whole);
  html = html.replace(/<[^>]*\sdata-i18n-aria="([^"]+)"[^>]*>/g, (tag, key) =>
    dict[key] ? tag.replace(/aria-label="[^"]*"/, 'aria-label="' + attr(ar(key)) + '"') : tag);

  // The prerendered blocks, in Arabic.
  const blocks = {
    featGrid: () => RENDER.features(DATA.features, 'ar'),
    flowSteps: () => RENDER.flow(DATA.flow, 'ar'),
    betaGrid: () => RENDER.cloud(DATA.cloud, 'ar', ar('beta.pill')),
    modesTable: () => RENDER.modesTable(DATA.modes, 'ar', {
      simple: ar('modes.sim.pill'), professional: ar('modes.pro.pill'), caption: ar('modes.cmp.caption'),
      featcol: ar('modes.cmp.featcol'), yes: ar('modes.cmp.yes'), no: ar('modes.cmp.no')
    })
  };
  for (const [id, fn] of Object.entries(blocks)) {
    const a = `<!-- PRERENDER:${id}:START -->`, b = `<!-- PRERENDER:${id}:END -->`;
    const i = html.indexOf(a), j = html.indexOf(b);
    if (i === -1 || j < i) throw new Error('make-ar: prerender markers for ' + id + ' missing');
    html = html.slice(0, i + a.length) + fn() + html.slice(j);
  }

  // Screenshots: the Arabic captures, as applyLang picks them.
  html = html.replace(/<img\b[^>]*\bdata-phone="([^"]+)"[^>]*>/g, (tag, base) => {
    const key = (tag.match(/\bdata-alt="([^"]+)"/) || [])[1];
    return tag.replace(/\bsrc="[^"]*"/, `src="${base}-ar.png"`)
      .replace(/\balt="[^"]*"/, key ? `alt="${attr(ar(key))}"` : '$&');
  });
  html = html.replace(/(<source\b[^>]*\bsrcset=")screenshots\/iphone\/([a-z]+)-([a-z]+)-en-/g, '$1screenshots/iphone/$2-$3-ar-')
    .replace(/screenshots\/iphone\/([a-z]+)-([a-z]+)-en(-\d+w)?\.(webp|png)/g, 'screenshots/iphone/$1-$2-ar$3.$4');
  // Policy links: the Arabic section. An -en anchor opens /privacy in English.
  html = html.replace(/(href="[^"]*(?:privacy|terms)\/#[a-z-]+)-en"/g, '$1-ar"');
  // The hero: the Arabic take of the Mac demo, its first frame and its alt.
  for (const id of ['heroSrc', 'heroShot', 'heroVid']) {
    html = one(html, new RegExp(`<(?:source|img|video)\\b[^>]*\\bid="${id}"[^>]*>`, 'g'),
      tag => tag.replace(/(screenshots\/mac\/demo|video\/mac-demo)-en/g, '$1-ar')
        .replace(/\balt="[^"]*"/, () => `alt="${attr(ar('hero.vid'))}"`), '#' + id);
  }
  for (const id of ['galSrc', 'galImg']) {
    html = one(html, new RegExp(`<(?:source|img)\\b[^>]*\\bid="${id}"[^>]*>`, 'g'),
      tag => tag.replace(/screenshots\/screenshot-queue/g, 'screenshots/screenshot-ar-queue'), '#' + id);
  }

  // The gallery caption, which paintCaption() fills from SCREENS, not DICT.
  const sAt = src.indexOf('var SCREENS = {');
  const screens = vm.runInNewContext('(' + src.slice(src.indexOf('{', sAt), src.indexOf('\n  };', sAt)) + '\n})');
  html = one(html, /(<h3 id="capTitle">)[^<]*(<\/h3>)/g, (m, a, b) => a + esc(screens.queue.cap.ar) + b, '#capTitle');
  html = one(html, /(<p id="capText">)[^<]*(<\/p>)/g, (m, a, b) => a + esc(screens.queue.text.ar) + b, '#capText');

  // The language button names the language you switch TO.
  html = one(html, /(<button class="lang-toggle" id="navLang">)[\s\S]*?(<\/button>)/g,
    (m, a, b) => a + '<span aria-hidden="true">🌐</span> <span class="sr-only">' + esc(ar('a11y.lang')) + ' </span><span lang="en">English</span>' + b,
    'language button');

  // Head and document.
  html = one(html, /<html lang="en">/g, () => '<html lang="ar" dir="rtl">', '<html>');
  html = one(html, /<body class="deep">/g, () => '<body class="deep" dir="rtl">', '<body>');
  html = one(html, /<title>[^<]*<\/title>/g, () => `<title>${esc(ar('meta.title'))}</title>`, '<title>');
  html = one(html, /<meta name="description" content="[^"]*">/g, () => `<meta name="description" content="${attr(ar('meta.desc'))}">`, 'description');
  html = one(html, /<meta property="og:title" content="[^"]*">/g, () => `<meta property="og:title" content="${attr(ar('meta.title'))}">`, 'og:title');
  html = one(html, /<meta property="og:description" content="[^"]*">/g, () => `<meta property="og:description" content="${attr(ar('meta.desc'))}">`, 'og:description');
  html = one(html, /<meta property="og:url" content="[^"]*">/g, () => `<meta property="og:url" content="${SITE}/ar/">`, 'og:url');
  html = one(html, /<meta property="og:locale" content="en">\n<meta property="og:locale:alternate" content="ar">/g,
    () => '<meta property="og:locale" content="ar">\n<meta property="og:locale:alternate" content="en">', 'og:locale');
  html = one(html, /<link rel="canonical" href="[^"]*">/g, () => `<link rel="canonical" href="${SITE}/ar/">`, 'canonical');
  html = one(html, /<link rel="alternate" hreflang="ar" href="[^"]*">/g, () => `<link rel="alternate" hreflang="ar" href="${SITE}/ar/">`, 'hreflang ar');

  // URLs: root-absolute in the HTML; a base for what app.js builds.
  html = html.replace(/(\s(?:href|src)=")(?!https?:|mailto:|data:|\/|#)([^"]+)"/g, '$1/$2"');
  html = html.replace(/(\s(?:href|src)=")#([^"]*)"/g, '$1/ar/#$2"');
  html = html.replace(/(\ssrcset=")([^"]+)"/g, (m, a, list) =>
    a + list.split(',').map(c => c.trim().replace(/^(?!https?:|\/)/, '/')).join(', ') + '"');
  html = html.replace(/(\sdata-phone=")(?!\/)/g, '$1/');
  html = one(html, /<meta charset="UTF-8">\n/g, m => m + '<base href="/">\n', 'charset');
  html = one(html, /<!DOCTYPE html>\n/gi, m => m +
    '<!-- GENERATED by scripts/make-ar.js from index.html and app.js\'s DICT. Do not edit: edit those and re-run it. -->\n', 'doctype');
  return html;
}

// Versions and sizes the release bots rewrite in index.html between PRs.
const mask = s => s.replace(/v?\d+\.\d+\.\d+(?:-[a-z]+\.\d+)?/g, 'V').replace(/\d+(?:\.\d+)? MB/g, 'N MB');

const want = build();
if (process.argv.includes('--check')) {
  const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (mask(have) !== mask(want)) {
    console.error(`${OUT} is STALE: it does not match index.html and app.js. Run \`node scripts/make-ar.js\` and commit it.`);
    process.exit(1);
  }
  console.log(OUT + ' is up to date');
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, want);
  console.log('wrote ' + OUT);
}
