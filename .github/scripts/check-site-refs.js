#!/usr/bin/env node
/* ============================================================
   Every local reference in the assembled site resolves to a file IN it.
   ------------------------------------------------------------
   assemble-site.js copies an include list. This is the other half: it reads
   what the shipped pages actually ask for and fails if any of it was left out
   of _site, so a page can never deploy pointing at a file the deploy dropped.

   Checked, in every .html under _site (honouring <base href>):
     href, src, srcset, poster, data-src, and <meta content> on khaytapp.com;
     data-shot / data-phone bases, which app.js turns into
       <base>-<en|ar>.png plus the .webp srcset copies;
   in every .css: url(...);
   in sitemap.xml, blog/feed.xml and mac/appcast.xml: khaytapp.com URLs;
   and the files app.js builds at runtime: the gallery (PLATS), the hero
   frame and video, releases.json and mac/appcast.xml.

     node .github/scripts/check-site-refs.js _site
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const SITE = path.resolve(process.argv[2] || '_site');
const HOST = 'khaytapp.com';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
const all = walk(SITE).map(p => path.relative(SITE, p).split(path.sep).join('/'));
const have = new Set(all);

const missing = new Map();   // target -> [where it was referenced]
let checked = 0;

function miss(target, from) {
  if (!missing.has(target)) missing.set(target, []);
  missing.get(target).push(from);
}

// Does a site path (no leading "/") resolve to a served file, the way the
// Pages server resolves it?
function resolves(p) {
  if (p === '' || p.endsWith('/')) return have.has(p + 'index.html');
  if (have.has(p)) return true;
  if (!path.posix.extname(p)) return have.has(p + '.html') || have.has(p + '/index.html');
  return false;
}

// url as written on page `from` (a site path), with base directory `baseDir`.
function check(url, from, baseDir) {
  url = url.trim();
  if (!url) return;
  if (/^(mailto:|tel:|javascript:|data:|blob:|#)/i.test(url)) return;
  let p;
  const abs = url.match(/^(?:https?:)?\/\/([^/?#]+)(.*)$/i);
  if (abs) {
    if (abs[1].toLowerCase() !== HOST && abs[1].toLowerCase() !== 'www.' + HOST) return;  // external
    p = abs[2] || '/';
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return;   // some other scheme
  } else {
    p = url;
  }
  p = p.split('#')[0].split('?')[0];
  if (p === '' && !abs) return;   // "?x" or "#x" on the same page
  try { p = decodeURIComponent(p); } catch (e) { /* keep it raw */ }
  const target = p.startsWith('/') ? p.slice(1) : path.posix.normalize(path.posix.join(baseDir, p)) +
    (p.endsWith('/') && !path.posix.join(baseDir, p).endsWith('/') ? '/' : '');
  const clean = target === '.' || target === './' ? '' : target.replace(/^\.\//, '');
  if (clean.startsWith('../')) { miss(url + ' (outside the site)', from); return; }
  checked++;
  if (!resolves(clean)) miss(clean || '/', from);
}

function attrs(html, name) {
  const re = new RegExp('\\s' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'gi');
  return [...html.matchAll(re)].map(m => (m[1] !== undefined ? m[1] : m[2]));
}

const LANGS = ['en', 'ar'];

// ---- HTML -------------------------------------------------------------------
for (const f of all.filter(f => f.endsWith('.html'))) {
  // Strip inline scripts: string literals in them are not references.
  const raw = fs.readFileSync(path.join(SITE, f), 'utf8');
  const html = raw.replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '')
                  .replace(/<!--[\s\S]*?-->/g, '');
  const base = (html.match(/<base\s+href\s*=\s*["']([^"']*)["']/i) || [])[1];
  let baseDir = path.posix.dirname(f);
  if (baseDir === '.') baseDir = '';
  if (base !== undefined) {
    if (base.startsWith('/')) baseDir = base.slice(1).replace(/\/$/, '');
    else baseDir = path.posix.join(baseDir, base).replace(/\/$/, '');
    if (baseDir === '.') baseDir = '';
  }

  for (const a of ['href', 'src', 'poster', 'data-src']) {
    for (const v of attrs(html, a)) check(v, f, baseDir);
  }
  for (const v of attrs(html, 'srcset')) {
    for (const part of v.split(',')) check(part.trim().split(/\s+/)[0], f, baseDir);
  }
  for (const v of attrs(html, 'content')) {
    if (new RegExp('^https?://(www\\.)?' + HOST.replace('.', '\\.') + '/', 'i').test(v)) check(v, f, baseDir);
  }
  // app.js: shots -> <base>-<lang>.png with the landscape srcset; phones ->
  // <base>-<lang>.png with -640w/-1080w/full .webp.
  for (const [a, widths] of [['data-shot', [640, 1080, 1600]], ['data-phone', [640, 1080]]]) {
    for (const b of attrs(html, a)) {
      for (const lang of LANGS) {
        check(b + '-' + lang + '.png', f + ' [' + a + ']', baseDir);
        check(b + '-' + lang + '.webp', f + ' [' + a + ']', baseDir);
        for (const w of widths) check(b + '-' + lang + '-' + w + 'w.webp', f + ' [' + a + ']', baseDir);
      }
    }
  }
}

// ---- CSS --------------------------------------------------------------------
for (const f of all.filter(f => f.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(SITE, f), 'utf8');
  const dir = path.posix.dirname(f) === '.' ? '' : path.posix.dirname(f);
  for (const m of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/g)) {
    check(m[1] || m[2] || m[3] || '', f, dir);
  }
}

// ---- Feeds and the sitemap ----------------------------------------------------
for (const f of ['sitemap.xml', 'blog/feed.xml', 'mac/appcast.xml']) {
  if (!have.has(f)) { miss(f, '(required feed)'); continue; }
  const xml = fs.readFileSync(path.join(SITE, f), 'utf8');
  for (const m of xml.matchAll(new RegExp('https?://(?:www\\.)?' + HOST.replace('.', '\\.') + '(/[^"\'<\\s]*)?', 'gi'))) {
    check(m[0], f, '');
  }
}

// ---- What app.js builds at runtime -----------------------------------------
const RUNTIME = ['releases.json', 'mac/appcast.xml', 'CNAME', '404.html', 'robots.txt'];
for (const lang of LANGS) {
  RUNTIME.push('video/mac-demo-' + lang + '.mp4', 'screenshots/mac/demo-' + lang + '.png',
    'screenshots/mac/demo-' + lang + '.webp');
  for (const w of [640, 1080, 1600]) RUNTIME.push('screenshots/mac/demo-' + lang + '-' + w + 'w.webp');
}
const warnings = [];
if (have.has('app.js')) {
  // var PLATS = { mac: { dir: '...', w: 2160, ..., keys: [...] }, ... };
  const js = fs.readFileSync(path.join(SITE, 'app.js'), 'utf8');
  const block = (js.match(/var PLATS = \{([\s\S]*?)\n\s*\};/) || [])[1];
  const plats = block ? [...block.matchAll(/dir:\s*'([^']+)',\s*w:\s*(\d+)[\s\S]*?keys:\s*\[([^\]]*)\]/g)] : [];
  if (!plats.length) {
    warnings.push('could not read PLATS from app.js — the gallery paths were not checked');
  }
  for (const [, dir, w, keyList] of plats) {
    const keys = [...keyList.matchAll(/'([^']+)'/g)].map(k => k[1]);
    for (const key of keys) {
      for (const lang of LANGS) {
        const b = dir + key + '-' + lang;
        RUNTIME.push(b + '.png', b + '.webp');
        for (const sw of [640, 1080, 1600]) if (sw < Number(w)) RUNTIME.push(b + '-' + sw + 'w.webp');
      }
    }
  }
}
for (const f of RUNTIME) { checked++; if (!have.has(f)) miss(f, 'app.js / runtime'); }

// ----------------------------------------------------------------------------
for (const w of warnings) console.log('::warning::' + w);
if (missing.size) {
  console.error('check-site-refs: ' + missing.size + ' referenced file(s) missing from ' +
    path.basename(SITE) + '/:');
  for (const [t, from] of missing) {
    console.error('  ' + t + '   <- ' + [...new Set(from)].slice(0, 4).join(', ') +
      (new Set(from).size > 4 ? ', ...' : ''));
  }
  process.exit(1);
}
console.log('check-site-refs: ' + checked + ' references checked, all resolve (' + all.length +
  ' files in ' + path.basename(SITE) + '/)');
