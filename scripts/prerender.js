#!/usr/bin/env node
/* ============================================================
   Put the JS-built content into the HTML.
   ------------------------------------------------------------
   Three of index.html's richest blocks shipped as empty divs that app.js
   filled after load: the nine feature cards, the nine cloud cards, and the
   whole Simple/Professional comparison table. That is most of the page's real
   copy — and the keywords a print shop would actually search for.

   Googlebot renders JavaScript on a second pass. Bing, social scrapers,
   archives and the crawlers behind AI answers largely do not, and this is a
   static site on GitHub Pages whose content is already sitting in a literal.
   There was never a reason it needed JS to be readable.

   So: render the English markup at build time between HTML comment markers,
   and let app.js write over it on load exactly as before. The browser's copy
   and this one come from render.js, so they are byte-identical and the page
   does not reflow; switching to Arabic replaces them the same as it always did.

   blog/index.html had the same shape, worse: its post cards were the whole
   page, built from blog/posts.js after load, so its HTML linked to no post at
   all and the footer jumped down the length of the list (CLS 0.27). It is
   rendered the same way now, from the same render.js the page calls.

     node scripts/prerender.js                          # write both pages
     node scripts/prerender.js --check                  # exit 1 if either is stale
     node scripts/prerender.js --check blog/index.html  # just the one

   --check is what CI runs, so a change to data.js or posts.js that nobody
   re-rendered fails the build instead of silently shipping a page whose
   static copy and live copy disagree.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// data.js and render.js are browser files that attach to `window`; in Node
// there is no window, and both fall back to globalThis for exactly this.
require(path.join(ROOT, 'data.js'));
require(path.join(ROOT, 'render.js'));
require(path.join(ROOT, 'blog', 'posts.js'));

const DATA = globalThis.KHAYT_DATA;
const RENDER = globalThis.KHAYT_RENDER;
const POSTS = globalThis.KHAYT_POSTS;

// The English strings the table needs. app.js holds the bilingual dictionary;
// these are read out of it rather than retyped, so a change to the wording in
// one place cannot leave the prerendered table saying something else.
// The blog index keeps its two card labels in its own inline PAGE_STRINGS,
// which is read the same way.
const SOURCES = {};
function dictEn(key, file = 'app.js') {
  const src = SOURCES[file] || (SOURCES[file] = fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const re = new RegExp("'" + key.replace(/\./g, '\\.') + "':\\s*\\{[^}]*?en:\\s*'((?:[^'\\\\]|\\\\.)*)'");
  const m = src.match(re);
  if (!m) throw new Error('prerender: no English string for ' + key + ' in ' + file);
  return m[1].replace(/\\'/g, "'").replace(/\\u2014/g, '—').replace(/\\\\/g, '\\');
}

const PAGES = {};

PAGES['index.html'] = {
  featGrid: () => RENDER.features(DATA.features, 'en'),
  flowSteps: () => RENDER.flow(DATA.flow, 'en'),
  betaGrid: () => RENDER.cloud(DATA.cloud, 'en', dictEn('beta.pill')),
  modesTable: () => RENDER.modesTable(DATA.modes, 'en', {
    simple: dictEn('modes.sim.pill'),
    professional: dictEn('modes.pro.pill'),
    caption: dictEn('modes.cmp.caption'),
    featcol: dictEn('modes.cmp.featcol'),
    yes: dictEn('modes.cmp.yes'),
    no: dictEn('modes.cmp.no')
  })
};

PAGES['blog/index.html'] = {
  postList: () => RENDER.postCards(POSTS, 'en', {
    more: dictEn('bl.more', 'blog/index.html'),
    latest: dictEn('bl.latest', 'blog/index.html')
  })
};

function inject(page, html) {
  for (const [id, build] of Object.entries(PAGES[page])) {
    const start = `<!-- PRERENDER:${id}:START -->`;
    const end = `<!-- PRERENDER:${id}:END -->`;
    const i = html.indexOf(start);
    const j = html.indexOf(end);
    if (i === -1 || j === -1) {
      throw new Error(`prerender: markers for ${id} missing from ${page} — ` +
        `they are the contract between this script and the page`);
    }
    if (j < i) throw new Error(`prerender: ${id} markers are inverted`);
    html = html.slice(0, i + start.length) + build() + html.slice(j);
  }
  return html;
}

const check = process.argv.includes('--check');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
for (const p of only) {
  if (!PAGES[p]) { console.error(`prerender: ${p} is not a prerendered page (${Object.keys(PAGES).join(', ')})`); process.exit(2); }
}

const SOURCE_OF = { 'index.html': 'data.js', 'blog/index.html': 'blog/posts.js' };
let stale = 0;
for (const page of only.length ? only : Object.keys(PAGES)) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, 'utf8');
  const after = inject(page, before);
  if (before === after) {
    console.log(`${page} is up to date with ${SOURCE_OF[page]}`);
    continue;
  }
  if (check) {
    console.error(`${page} is STALE: its prerendered blocks do not match ${SOURCE_OF[page]}.`);
    stale++;
    continue;
  }
  fs.writeFileSync(file, after);
  console.log(page + ' rendered:', page === 'index.html' ? [
    `${DATA.features.length} features`,
    `${DATA.cloud.length} cloud services`,
    `${DATA.modes.reduce((a, g) => a + g.rows.length, 0)} comparison rows`
  ].join(', ') : `${POSTS.length} post cards`);
}

if (stale) {
  console.error('Run `node scripts/prerender.js` and commit the result.');
  process.exit(1);
}
