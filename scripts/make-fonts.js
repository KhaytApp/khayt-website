#!/usr/bin/env node
/* ============================================================
   Self-host the site's fonts.
   ------------------------------------------------------------
   Every page used to load one Google Fonts stylesheet for five families and
   eighteen weights. On a phone that stylesheet was the slowest thing in the
   critical path: a render-blocking request to a second origin, which then
   names the woff2 files on a third, so no text could paint until two
   extra connections had been opened in series. Lighthouse put it at ~1s of a
   4.5s first paint.

   This writes the same faces into fonts/ instead, with fonts/fonts.css
   carrying the @font-face rules, so the files come from the origin the page
   is already talking to and the heading face can be preloaded.

   What it asks Google for is what the pages were MEASURED to use — every
   text node on every page, both languages, at phone and desktop width, read
   back through getComputedStyle — not what the old URL listed:

     Archivo                700 800 900     (500 and 600 were never used)
     Hanken Grotesk         400 500 600 700
     JetBrains Mono         400 600         (500 was never used; the 700
                                             some labels ask for was never
                                             loaded either, and still is not,
                                             so they keep drawing at 600)
     IBM Plex Sans Arabic   400 500 600 700
     Almarai                700, and ONLY the three letters of the wordmark.
                            It draws nothing on this site but خيط, so it is
                            fetched with Google's own text= subsetter: a
                            single small file where the arabic subset was
                            a whole alphabet.

   Only the latin, latin-ext and arabic subsets are kept. Google also returns
   cyrillic, greek and vietnamese ranges; a scan of every page and script
   found one character in them (the Δ in "ΔE"), and it sits in body copy set
   in Hanken Grotesk, which has no greek subset, so it was never drawn from a
   webfont in the first place. Each kept block keeps Google's unicode-range,
   so a browser still downloads only the subsets a page's text touches.

   Google serves variable fonts for most of these, so several weights point
   at the same file; each file is downloaded once and named for its family
   and subset (plus its weight when the family is static, as Plex Arabic is).

   The OFL.txt for each family is fetched alongside — the licence requires
   it to travel with the fonts.

     node scripts/make-fonts.js

   It needs the network and is not run in CI. check-site.js verifies what it
   produced: every url() in fonts.css exists, and every page loads the same
   font setup.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'fonts');

const FAMILIES = 'family=Archivo:wght@700;800;900' +
  '&family=Hanken+Grotesk:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;600' +
  '&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700';
const WORDMARK = 'خيط';
const KEEP = new Set(['latin', 'latin-ext', 'arabic']);

// The repository directory for each family's licence in google/fonts.
const LICENCES = {
  'Archivo': 'archivo',
  'Hanken Grotesk': 'hankengrotesk',
  'JetBrains Mono': 'jetbrainsmono',
  'IBM Plex Sans Arabic': 'ibmplexsansarabic',
  'Almarai': 'almarai'
};

// Google sniffs the user agent to pick a format; anything current gets woff2
// with unicode-range subsets, which is the only shape this script handles.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

async function get(url, binary) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.text();
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

(async () => {
  const main = await get('https://fonts.googleapis.com/css2?' + FAMILIES + '&display=swap');
  const mark = await get('https://fonts.googleapis.com/css2?family=Almarai:wght@700&display=swap&text=' +
    encodeURIComponent(WORDMARK));

  // Each block in Google's CSS is preceded by a "/* subset */" comment. The
  // text= response has none — it is one block, labelled here as the wordmark.
  const blocks = [];
  for (const m of main.matchAll(/\/\* ([a-z-]+) \*\/\s*@font-face \{([\s\S]*?)\}/g)) {
    if (KEEP.has(m[1])) blocks.push({ subset: m[1], body: m[2] });
  }
  const markBlock = mark.match(/@font-face \{([\s\S]*?)\}/);
  if (!markBlock) throw new Error('no @font-face in the Almarai text= response');
  blocks.push({ subset: 'wordmark', body: markBlock[1] });

  const field = (body, name) => {
    const m = body.match(new RegExp(name + ':\\s*([^;]+);'));
    return m ? m[1].trim() : '';
  };
  for (const b of blocks) {
    b.family = field(b.body, 'font-family').replace(/'/g, '');
    b.style = field(b.body, 'font-style');
    b.weight = field(b.body, 'font-weight');
    b.range = field(b.body, 'unicode-range');
    b.url = (b.body.match(/url\(([^)]+)\)/) || [])[1];
    if (!b.family || !b.url) throw new Error('could not read a block:\n' + b.body);
  }

  // One file per distinct URL. A family whose weights share one URL is a
  // variable font and gets no weight in its name.
  const names = new Map();
  for (const b of blocks) {
    if (names.has(b.url)) continue;
    const siblings = new Set(blocks.filter(x => x.family === b.family && x.subset === b.subset && x.style === b.style).map(x => x.url));
    let name = slug(b.family) + '-' + b.subset;
    if (b.style === 'italic') name += '-italic';
    if (siblings.size > 1) name += '-' + b.weight;
    names.set(b.url, name + '.woff2');
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  let bytes = 0;
  for (const [url, name] of names) {
    const buf = await get(url, true);
    if (buf.slice(0, 4).toString() !== 'wOF2') throw new Error(url + ' is not a woff2 file');
    fs.writeFileSync(path.join(OUT, name), buf);
    bytes += buf.length;
  }

  for (const [family, dir] of Object.entries(LICENCES)) {
    const txt = await get('https://raw.githubusercontent.com/google/fonts/main/ofl/' + dir + '/OFL.txt');
    fs.writeFileSync(path.join(OUT, 'OFL-' + slug(family) + '.txt'), txt);
  }

  const css = [
    '/* Generated by scripts/make-fonts.js — edit that, not this.',
    '   The faces are Google Fonts, self-hosted; each OFL-*.txt beside this',
    '   file is its family\'s licence. unicode-range is Google\'s own, so a',
    '   page downloads only the subsets its text uses. */'
  ];
  // A variable file named by several weight blocks becomes ONE rule with a
  // weight range, which matches exactly what the separate rules matched.
  const rules = [];
  for (const b of blocks) {
    const same = rules.find(r => r.url === b.url && r.family === b.family && r.style === b.style && r.range === b.range);
    if (same) { same.weights.push(Number(b.weight)); continue; }
    rules.push(Object.assign({}, b, { weights: [Number(b.weight)] }));
  }
  for (const b of rules) {
    const lo = Math.min(...b.weights), hi = Math.max(...b.weights);
    b.weight = lo === hi ? String(lo) : lo + ' ' + hi;
  }
  for (const b of rules) {
    css.push('', '/* ' + b.family + ' ' + b.weight + (b.style === 'italic' ? ' italic' : '') + ' — ' + b.subset + ' */',
      '@font-face {',
      "  font-family: '" + b.family + "';",
      '  font-style: ' + b.style + ';',
      '  font-weight: ' + b.weight + ';',
      '  font-display: swap;',
      "  src: url(" + names.get(b.url) + ") format('woff2');",
      '  unicode-range: ' + b.range + ';',
      '}');
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), css.join('\n') + '\n');

  console.log(`${names.size} woff2 files (${(bytes / 1024).toFixed(0)}KB in all), ${rules.length} @font-face rules → fonts/`);
})().catch(e => {
  console.error('make-fonts failed:', e.message);
  process.exit(1);
});
