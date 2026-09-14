#!/usr/bin/env node
/* ============================================================
   The checks that can actually fail on this site.
   ------------------------------------------------------------
   It is three hand-written HTML pages and five scripts on GitHub Pages, with
   no build step, so nothing was checking any of it — a syntax error in app.js
   or a stale prerender shipped and was noticed by a visitor.

   Everything below has caught a real mistake, or guards one that has already
   happened once. Run it locally the same way CI does:

     node scripts/check-site.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

let failed = 0;
function check(name, fn) {
  try {
    const note = fn();
    console.log('  ok    ' + name + (note ? '  — ' + note : ''));
  } catch (e) {
    console.error('  FAIL  ' + name + '\n        ' + String(e.message).split('\n').join('\n        '));
    failed++;
  }
}

function blogPosts() {
  return fs.readdirSync('blog').filter(f => f.endsWith('.html') && f !== 'index.html');
}

// Every HTML page the site serves. 404.html is one of them — GitHub Pages
// hands it to anyone who mistypes a URL, and it was not being checked.
function pages() {
  return ['index.html', 'services.html', '404.html', 'blog/index.html',
    ...blogPosts().map(b => 'blog/' + b)];
}

/* ---------- 1. Everything parses ---------- */

check('JavaScript parses', () => {
  const files = ['app.js', 'site.js', 'services.js', 'data.js', 'render.js',
    'blog/posts.js', 'scripts/prerender.js', 'scripts/check-site.js'];
  for (const f of files) execFileSync(process.execPath, ['--check', f]);
  return files.length + ' files';
});

check('JSON-LD parses', () => {
  let n = 0;
  for (const f of pages()) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      JSON.parse(m[1]);
      n++;
    }
  }
  if (!n) throw new Error('no JSON-LD found at all — index.html should carry a SoftwareApplication block');
  return n + ' blocks';
});

/* ---------- 2. The generated half of index.html is current ---------- */

check('index.html is rendered from data.js', () => {
  // The feature cards, the cloud cards and the comparison table are static
  // HTML in the page so crawlers that do not run JS can read them, and they
  // are generated. If data.js changes and nobody re-renders, the static copy
  // and the copy the browser writes over it on load disagree: the page
  // visibly reflows, and search engines index copy that is no longer there.
  try {
    execFileSync(process.execPath, ['scripts/prerender.js', '--check'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('stale. Run `node scripts/prerender.js` and commit the result.');
  }
  return 'in sync';
});

check('blog/feed.xml matches posts.js', () => {
  // A post added without regenerating the feed is a post published to nobody
  // who subscribed.
  try {
    execFileSync(process.execPath, ['scripts/make-feed.js', '--check'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('stale. Run `node scripts/make-feed.js` and commit the result.');
  }
  return 'in sync';
});

check('The feed is discoverable from every page', () => {
  const bad = pages().filter(p => !/application\/atom\+xml/.test(fs.readFileSync(p, 'utf8')));
  if (bad.length) throw new Error('no feed autodiscovery link: ' + bad.join(', '));
  return pages().length + ' pages';
});

/* ---------- 3. The dictionary ---------- */

check('No duplicate dictionary keys', () => {
  // A duplicated key in DICT is legal JavaScript — the later one silently
  // wins. It happened once, with two different spellings of the native-Mac
  // line, and the page showed whichever came second.
  const src = fs.readFileSync('app.js', 'utf8');
  const start = src.indexOf('var DICT = {');
  if (start === -1) throw new Error('could not find DICT in app.js');
  const body = src.slice(start, src.indexOf('\n  };', start));
  const keys = [...body.matchAll(/^ {4}'([a-zA-Z0-9._]+)':/gm)].map(m => m[1]);
  if (keys.length < 100) throw new Error(`only found ${keys.length} keys — the extraction is wrong, not the dictionary`);
  const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  if (dupes.length) throw new Error('duplicate keys: ' + dupes.join(', '));
  return keys.length + ' keys';
});

check('Every dictionary entry has both languages', () => {
  const src = fs.readFileSync('app.js', 'utf8');
  const start = src.indexOf('var DICT = {');
  const body = src.slice(start, src.indexOf('\n  };', start));
  const missing = [];
  for (const m of body.matchAll(/^ {4}'([a-zA-Z0-9._]+)':\s*\{([\s\S]*?)\},?\s*$/gm)) {
    if (!/\ben:/.test(m[2]) || !/\bar:/.test(m[2])) missing.push(m[1]);
  }
  if (missing.length) throw new Error('entries missing en or ar: ' + missing.join(', '));
  return 'all bilingual';
});

/* ---------- 4. Links ---------- */

check('Every internal link resolves', () => {
  const bad = [];
  let n = 0;
  for (const p of pages()) {
    const dir = path.dirname(p);
    const html = fs.readFileSync(p, 'utf8');
    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const u = m[1];
      if (/^(https?:|mailto:|data:)/.test(u)) continue;
      // Skip anything built by a script rather than written in the page.
      if (u.includes("' +") || u.includes('${')) continue;
      n++;
      if (u.startsWith('#')) {
        const a = u.slice(1);
        if (a && a !== 'top' && !ids.has(a)) bad.push(`${p}: dead anchor ${u}`);
        continue;
      }
      const clean = u.split('#')[0].split('?')[0];
      // A leading slash is site-root-relative, not filesystem-absolute.
      let t = clean.startsWith('/') ? path.join(ROOT, clean) : path.join(dir, clean);
      if (!clean || t === dir || t === '.' || t === ROOT) continue;
      if (clean.endsWith('/')) t = path.join(t, 'index.html');
      if (!fs.existsSync(t)) bad.push(`${p}: missing ${u}`);
    }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return n + ' references';
});

/* ---------- 5. Nothing is unreachable ---------- */

check('Sitemap lists every page', () => {
  // It sat four months stale at one point, and a page that is not in it is a
  // page nobody is told about.
  const xml = fs.readFileSync('sitemap.xml', 'utf8');
  if (!/<\/urlset>\s*$/.test(xml.trim())) throw new Error('sitemap.xml is malformed');
  const listed = new Set([...xml.matchAll(/<loc>https:\/\/khaytapp\.com\/([^<]*)<\/loc>/g)].map(m => m[1]));
  const want = ['', 'services.html', 'blog/', ...blogPosts().map(b => 'blog/' + b)];
  const missing = want.filter(w => !listed.has(w));
  if (missing.length) throw new Error('not listed: ' + missing.join(', '));
  return listed.size + ' URLs';
});

check('Every blog post is in the index', () => {
  // A post file with no entry in posts.js is a post nobody can reach.
  require(path.join(ROOT, 'blog', 'posts.js'));
  const listed = new Set((globalThis.KHAYT_POSTS || []).map(p => p.slug));
  const files = blogPosts().map(f => f.replace(/\.html$/, ''));
  const orphans = files.filter(f => !listed.has(f));
  const ghosts = [...listed].filter(s => !files.includes(s));
  const problems = [];
  if (orphans.length) problems.push('post files not listed in posts.js: ' + orphans.join(', '));
  if (ghosts.length) problems.push('posts.js entries with no file: ' + ghosts.join(', '));
  if (problems.length) throw new Error(problems.join('\n'));
  return files.length + ' posts';
});

/* ---------- 6. The things a review already found once ---------- */

check('Every page carries the same nav', () => {
  // Two failures at once, both of which happened. index.html drifted to nine
  // links while every other page had seven, so the site had two navigations.
  // And nine did not fit: the row absorbed the overflow by collapsing the
  // download button's icon to zero width rather than wrapping, so it looked
  // fine. A count is the cheap half of that guard; the layout half needs a
  // browser, and the CSS comment above .nav-burger records the measurement.
  const navs = {};
  for (const p of pages()) {
    const html = fs.readFileSync(p, 'utf8');
    const nav = html.split('id="navLinks"')[1];
    if (!nav) throw new Error(p + ' has no nav');
    const labels = [...nav.split('</nav>')[0].matchAll(/data-i18n="(nav\.[a-z]+)"/g)].map(m => m[1]);
    navs[p] = labels.join(' ');
  }
  const shapes = [...new Set(Object.values(navs))];
  if (shapes.length > 1) {
    throw new Error('pages disagree about the nav:\n' +
      Object.entries(navs).map(([p, n]) => '  ' + p + ': ' + n).join('\n'));
  }
  const count = shapes[0].split(' ').length;
  // Seven is what was measured to fit down to 901px. Eight has not been.
  if (count > 7) throw new Error(count + ' nav links — only seven have been measured to fit; re-measure before adding another');
  return count + ' links, identical everywhere';
});

check('Images carry intrinsic dimensions', () => {
  // Without width/height the page reflows when each one loads.
  const bad = [];
  for (const p of pages()) {
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/<img\b[^>]*>/g)) {
      if (!/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) bad.push(p + ': ' + m[0].slice(0, 70));
    }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return 'all sized';
});

check('Every screenshot has an up-to-date WebP', () => {
  // <picture> asks for the WebP first. A PNG with no sibling, or with one
  // older than itself after a re-capture, means visitors are served either a
  // 404 fallback or last month's screenshot under this month's caption.
  const pngs = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.png')) pngs.push(rel);
    }
  })('screenshots');
  const stale = [];
  for (const png of pngs) {
    const webp = png.replace(/\.png$/, '.webp');
    if (!fs.existsSync(webp)) { stale.push(webp + ' (missing)'); continue; }
    if (fs.statSync(png).mtimeMs > fs.statSync(webp).mtimeMs + 1000) stale.push(webp + ' (older than its PNG)');
  }
  if (stale.length) {
    throw new Error('run `node scripts/make-webp.js`:\n' + stale.slice(0, 10).join('\n') +
      (stale.length > 10 ? `\n...and ${stale.length - 10} more` : ''));
  }
  return pngs.length + ' pairs';
});

check('Focus and reduced-motion rules exist', () => {
  // There were none in 45KB of CSS: keyboard users got the UA default outline
  // on custom dark buttons, and nineteen transitions ran regardless.
  const css = fs.readFileSync('styles.css', 'utf8');
  const problems = [];
  if (!css.includes(':focus-visible')) problems.push('no :focus-visible rule');
  if (!css.includes('prefers-reduced-motion')) problems.push('no prefers-reduced-motion block');
  if (problems.length) throw new Error(problems.join('; '));
  return 'present';
});

check('Every page can be linked in Arabic', () => {
  // Arabic used to be a localStorage flag with no URL, so it could not be
  // shared or indexed. Each page needs its ?lang=ar alternate declared.
  const bad = [];
  // 404.html is excluded: it is noindex, so it has no canonical to alternate.
  for (const p of pages().filter(f => f !== '404.html')) {
    const html = fs.readFileSync(p, 'utf8');
    if (!/hreflang="ar"[^>]*lang=ar/.test(html)) bad.push(p);
  }
  if (bad.length) throw new Error('no Arabic alternate declared: ' + bad.join(', '));
  return 'all declared';
});

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
