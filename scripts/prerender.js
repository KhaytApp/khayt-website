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

     node scripts/prerender.js          # write index.html
     node scripts/prerender.js --check  # exit 1 if it would change anything

   --check is what CI runs, so a change to data.js that nobody re-rendered
   fails the build instead of silently shipping a page whose static copy and
   live copy disagree.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'index.html');

// data.js and render.js are browser files that attach to `window`; in Node
// there is no window, and both fall back to globalThis for exactly this.
require(path.join(ROOT, 'data.js'));
require(path.join(ROOT, 'render.js'));

const DATA = globalThis.KHAYT_DATA;
const RENDER = globalThis.KHAYT_RENDER;

// The English strings the table needs. app.js holds the bilingual dictionary;
// these are read out of it rather than retyped, so a change to the wording in
// one place cannot leave the prerendered table saying something else.
const APP = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function dictEn(key) {
  const re = new RegExp("'" + key.replace(/\./g, '\\.') + "':\\s*\\{[^}]*?en:\\s*'((?:[^'\\\\]|\\\\.)*)'");
  const m = APP.match(re);
  if (!m) throw new Error('prerender: no English string for ' + key + ' in app.js');
  return m[1].replace(/\\'/g, "'").replace(/\\u2014/g, '—').replace(/\\\\/g, '\\');
}

const BLOCKS = {
  featGrid: () => RENDER.features(DATA.features, 'en'),
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

function inject(html) {
  for (const [id, build] of Object.entries(BLOCKS)) {
    const start = `<!-- PRERENDER:${id}:START -->`;
    const end = `<!-- PRERENDER:${id}:END -->`;
    const i = html.indexOf(start);
    const j = html.indexOf(end);
    if (i === -1 || j === -1) {
      throw new Error(`prerender: markers for ${id} missing from index.html — ` +
        `they are the contract between this script and the page`);
    }
    if (j < i) throw new Error(`prerender: ${id} markers are inverted`);
    html = html.slice(0, i + start.length) + build() + html.slice(j);
  }
  return html;
}

const before = fs.readFileSync(PAGE, 'utf8');
const after = inject(before);
const check = process.argv.includes('--check');

if (before === after) {
  console.log('index.html is up to date with data.js');
  process.exit(0);
}

if (check) {
  console.error('index.html is STALE: its prerendered blocks do not match data.js.');
  console.error('Run `node scripts/prerender.js` and commit the result.');
  process.exit(1);
}

fs.writeFileSync(PAGE, after);
const counts = [
  `${DATA.features.length} features`,
  `${DATA.cloud.length} cloud services`,
  `${DATA.modes.reduce((a, g) => a + g.rows.length, 0)} comparison rows`
];
console.log('index.html rendered:', counts.join(', '));
