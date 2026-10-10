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

// Every HTML page the site serves — shared with check-links.js.
const pages = require('./pages.js');

/* ---------- 1. Everything parses ---------- */

check('JavaScript parses', () => {
  const files = ['app.js', 'site.js', 'services.js', 'data.js', 'render.js',
    'blog/posts.js', 'scripts/prerender.js', 'scripts/check-site.js',
    'scripts/check-links.js', 'scripts/pages.js', 'scripts/stamp-posts.js',
    'scripts/stamp-sitemap.js', 'scripts/make-feed.js', 'scripts/new-post.js',
    'scripts/make-webp.js', 'scripts/make-fonts.js', 'scripts/make-releases.js'];
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

/* ---------- 2. The generated halves of index.html and blog/index.html are current ---------- */

check('index.html is rendered from data.js', () => {
  // The feature cards, the cloud cards and the comparison table are static
  // HTML in the page so crawlers that do not run JS can read them, and they
  // are generated. If data.js changes and nobody re-renders, the static copy
  // and the copy the browser writes over it on load disagree: the page
  // visibly reflows, and search engines index copy that is no longer there.
  try {
    execFileSync(process.execPath, ['scripts/prerender.js', '--check', 'index.html'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('stale. Run `node scripts/prerender.js` and commit the result.');
  }
  return 'in sync';
});

check('blog/index.html is rendered from posts.js, and links every post', () => {
  // The post cards used to exist only after JS ran: the page's HTML linked to
  // no post at all, so a crawler that does not render found an empty blog,
  // and the footer jumped down the length of the list on every load (CLS
  // 0.27). They are prerendered now; stale, the static cards and the ones the
  // browser writes over them disagree, and the page reflows again.
  try {
    execFileSync(process.execPath, ['scripts/prerender.js', '--check', 'blog/index.html'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('stale. Run `node scripts/prerender.js` and commit the result.');
  }
  // And in sync is not the same as present: an empty marker pair renders
  // nothing and still matches an empty list. Every post needs a real link.
  const html = fs.readFileSync('blog/index.html', 'utf8');
  const block = html.split('<!-- PRERENDER:postList:START -->')[1]?.split('<!-- PRERENDER:postList:END -->')[0];
  if (block === undefined) throw new Error('the PRERENDER:postList markers are missing');
  require(path.join(ROOT, 'blog', 'posts.js'));
  const slugs = (globalThis.KHAYT_POSTS || []).map(p => p.slug);
  const unlinked = slugs.filter(s => !block.includes('<a class="post-card" href="' + s + '.html">'));
  if (unlinked.length) throw new Error('no prerendered link to: ' + unlinked.join(', '));
  return slugs.length + ' post links in the HTML';
});

check('Post pages match posts.js', () => {
  // A post's title and summary live in posts.js and are stamped into its page.
  // Edited in one place and not re-stamped, the tab, the share card and the
  // heading disagree with the index that links to them — which had already
  // happened: one post's page said "What the alpha already does" while the
  // index and feed said "What it already does".
  try {
    execFileSync(process.execPath, ['scripts/stamp-posts.js', '--check'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error('stale. Run `node scripts/stamp-posts.js` and commit the result.');
  }
  return 'in sync';
});

check('No attribute is broken by an unescaped quote', () => {
  // A description beginning with a quotation mark closed its own attribute,
  // so what-the-cloud-sends.html shipped with an EMPTY meta description and
  // the rest of the sentence parsed as stray attributes. The generator that
  // wrote it interpolated values into attributes without escaping them.
  const bad = [];
  for (const p of pages()) {
    const html = fs.readFileSync(p, 'utf8');
    for (const m of html.matchAll(/<meta\b[^>]*>/g)) {
      // Inside a tag, every " should be a delimiter: an even number per tag.
      const quotes = (m[0].match(/"/g) || []).length;
      if (quotes % 2 !== 0) bad.push(p + ': ' + m[0].slice(0, 90));
    }
    // content="" immediately followed by a non-delimiter is the specific shape.
    for (const m of html.matchAll(/content=""[^>\s]/g)) bad.push(p + ': content="" then text — ' + m[0]);
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return 'attributes well-formed';
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

// Both dictionaries the site ships: app.js's DICT, and the per-page block
// services.html loads on top of it. The second one was unchecked while it
// held the whole services page — a missing `ar` there is the same bug, it
// just shows up on one page instead of all of them.
function dictionaries() {
  const found = [];
  for (const [file, marker] of [['app.js', 'var DICT = {'], ['services.js', 'window.PAGE_STRINGS = {']]) {
    const src = fs.readFileSync(file, 'utf8');
    const start = src.indexOf(marker);
    if (start === -1) throw new Error(`could not find ${marker.trim()} in ${file}`);
    const end = src.indexOf('\n  };', start);
    if (end === -1) throw new Error(`could not find the end of the dictionary in ${file}`);
    found.push({ file, body: src.slice(start, end) });
  }
  return found;
}

check('No duplicate dictionary keys', () => {
  // A duplicated key in DICT is legal JavaScript — the later one silently
  // wins. It happened once, with two different spellings of the native-Mac
  // line, and the page showed whichever came second.
  let total = 0;
  for (const { file, body } of dictionaries()) {
    const keys = [...body.matchAll(/^ {4}'([a-zA-Z0-9._]+)':/gm)].map(m => m[1]);
    const floor = file === 'app.js' ? 100 : 20;
    if (keys.length < floor) throw new Error(`only found ${keys.length} keys in ${file} — the extraction is wrong, not the dictionary`);
    const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
    if (dupes.length) throw new Error(`duplicate keys in ${file}: ` + dupes.join(', '));
    total += keys.length;
  }
  return total + ' keys';
});

check('Every dictionary entry has both languages', () => {
  const missing = [];
  for (const { file, body } of dictionaries()) {
    for (const m of body.matchAll(/^ {4}'([a-zA-Z0-9._]+)':\s*\{([\s\S]*?)\},?\s*$/gm)) {
      if (!/\ben:/.test(m[2]) || !/\bar:/.test(m[2])) missing.push(file + ' ' + m[1]);
    }
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

check('No link spells out index.html', () => {
  // https://khaytapp.com/index.html#download is the same page as the
  // canonical https://khaytapp.com/, at a second URL — and every page on the
  // site linked to it that way, nav, footer and download buttons. Links go to
  // the directory instead: ./#download, ../#download, or /#download on the
  // 404 page, which is served at any URL and so cannot be relative.
  const bad = [];
  for (const p of pages()) {
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/href="((?:\.\.?\/|\/)*index\.html[^"]*)"/g)) bad.push(p + ': ' + m[1]);
  }
  for (const f of ['data.js', 'services.js', 'app.js', 'site.js']) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/['"]((?:\.\.?\/|\/)*index\.html#[^'"]*)['"]/g)) bad.push(f + ': ' + m[1]);
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return 'directory URLs only';
});

/* ---------- 5. Nothing is unreachable ---------- */

check('Sitemap lists every page', () => {
  // It sat four months stale at one point, and a page that is not in it is a
  // page nobody is told about.
  const xml = fs.readFileSync('sitemap.xml', 'utf8');
  if (!/<\/urlset>\s*$/.test(xml.trim())) throw new Error('sitemap.xml is malformed');
  const listed = new Set([...xml.matchAll(/<loc>https:\/\/khaytapp\.com\/([^<]*)<\/loc>/g)].map(m => m[1]));
  // Derived from pages() rather than hand-listed: this check passed happily
  // while /privacy and /terms were missing from the sitemap, because the list
  // it compared against was written by hand and nobody thought to extend it.
  // 404.html is deliberately out — a sitemap advertises pages, not the error.
  const want = pages()
    .filter(p => !pages.NOINDEX.has(p))
    .map(p => p === 'index.html' ? '' : p.replace(/(^|\/)index\.html$/, '$1'));
  const missing = want.filter(w => !listed.has(w));
  if (missing.length) throw new Error('not listed: ' + missing.join(', '));
  return listed.size + ' URLs';
});

check('Sitemap lastmod dates are not older than the pages', () => {
  // The home page said 2026-09-14 for weeks while it was edited again and
  // again. stamp-sitemap.js takes the date from git, so this is its --check;
  // it ignores the release bots, which only swap a version in a URL.
  try {
    execFileSync(process.execPath, ['scripts/stamp-sitemap.js', '--check'], { stdio: 'pipe' });
  } catch (e) {
    throw new Error(String(e.stderr || e.message).trim());
  }
  return 'current';
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

check('The privacy policy is reachable from every page', () => {
  // Google's OAuth brand verification requires the app's homepage to link to a
  // privacy policy on the same domain; the footer link is what satisfies it,
  // and a page that loses it fails a review nobody here would see coming.
  // 404.html has no footer on purpose — it is an error page, not a page.
  const bad = [];
  for (const p of pages()) {
    if (pages.NOINDEX.has(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    for (const want of ['foot.privacy', 'foot.terms']) {
      if (!html.includes('data-i18n="' + want + '"')) bad.push(p + ': no ' + want + ' link');
    }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return pages().length - pages.NOINDEX.size + ' pages';
});

// Where a nav link actually lands, as a repo-relative file, so the three
// spellings the site uses for the same destination compare equal: bare
// "#screens" on index.html, root-absolute "/#screens" on 404.html (which is
// served at any URL, so it cannot use a relative one), and "./#screens"
// or "../#screens" everywhere else. The fragment is deliberately
// dropped after resolution — it is part of the destination for humans, and
// comparing it would make index.html's "#screens" differ from its own file.
function navTarget(page, href) {
  const raw = href.split('#')[0];
  let t;
  if (raw === '') t = page;                                   // same page
  else if (raw.startsWith('/')) t = raw.slice(1) || 'index.html';
  else t = path.posix.normalize(path.posix.join(path.dirname(page), raw));
  t = t.replace(/^\.\//, '');
  if (t === '' || t === '.') t = 'index.html';
  if (t.endsWith('/')) t += 'index.html';
  return t;
}

check('Policy sections are numbered and cross-referenced correctly', () => {
  // A policy page numbers its own clauses and refers to them by number, and
  // both languages must agree. Inserting a section renumbers everything below
  // it: adding Google Drive as section 4 turned "Section 9 says what those
  // contain" into a pointer at the wrong clause, and nothing noticed. Adding
  // the iPhone app as section 6 would have done it again.
  let checked = 0, refs = 0;
  for (const p of pages().filter(f => /^(privacy|terms)\//.test(f))) {
    const html = fs.readFileSync(p, 'utf8');
    const langs = {};
    for (const m of html.matchAll(/<div class="post-body policy" data-lang="(en|ar)"[^>]*>([\s\S]*?)\n    <\/div>/g)) {
      langs[m[1]] = [...m[2].matchAll(/<h2(?: [^>]*)?>(\d+)\./g)].map(h => Number(h[1]));
    }
    if (!langs.en || !langs.ar) throw new Error(p + ': could not find both language bodies');
    const run = n => Array.from({ length: n }, (_, i) => i + 1).join(',');
    if (langs.en.join(',') !== run(langs.en.length)) throw new Error(p + ' (en): sections are ' + langs.en.join(',') + ', not 1..n');
    if (langs.ar.join(',') !== langs.en.join(',')) throw new Error(p + ': en has ' + langs.en.join(',') + ' but ar has ' + langs.ar.join(','));
    // Every cross-reference is a LINK to the section it names, so the number
    // in the text can be compared against the number in the heading it points
    // at. A bare "Section 10" survives a renumber and quietly points at the
    // wrong clause — the first version of this check passed on exactly that.
    for (const m of html.matchAll(/<a href="#([a-z-]+)">(?:Section|القسم) (\d+)<\/a>/g)) {
      const [, id, said] = m;
      const target = html.match(new RegExp('<h2 id="' + id + '">(\\d+)\\.'));
      if (!target) throw new Error(p + ': links to #' + id + ', which is not a numbered section heading');
      if (target[1] !== said) {
        throw new Error(p + ': text says section ' + said + ' but #' + id + ' is section ' + target[1]);
      }
      refs++;
    }
    // And a plain number, with no link to check it against, is not allowed.
    for (const m of html.matchAll(/(?:Section|القسم) (\d+)/g)) {
      const before = html.slice(Math.max(0, m.index - 40), m.index);
      if (!/<a href="#[a-z-]+">$/.test(before)) {
        throw new Error(p + ': "' + m[0] + '" is a bare cross-reference — link it to the section so a renumber cannot break it silently');
      }
    }
    checked += langs.en.length;
  }
  if (!checked) throw new Error('found no policy pages to check — the selector is wrong, not the pages');
  return checked + ' sections, ' + refs + ' checked cross-reference(s)';
});

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
    // Labels alone are not enough: the privacy and terms pages were built from
    // the blog page's chrome, and both arrived with the blog link pointing at
    // `./` — their own directory — and marked aria-current. Every label was
    // right, every link resolved, and the nav on two pages was wrong. So
    // compare where each link GOES, resolved from the page that holds it.
    const pairs = [...nav.split('</nav>')[0].matchAll(/<a href="([^"]*)"[^>]*data-i18n="(nav\.[a-z]+)"/g)]
      .map(m => m[2] + '=' + navTarget(p, m[1]));
    navs[p] = pairs.join(' ');
  }
  const shapes = [...new Set(Object.values(navs))];
  if (shapes.length > 1) {
    throw new Error('pages disagree about the nav:\n' +
      Object.entries(navs).map(([p, n]) => '  ' + p + ': ' + n).join('\n'));
  }
  const count = shapes[0].split(' ').length;
  // Nothing outside the nav's own seven destinations may claim to be current:
  // a page not in the nav marking one of them highlights the wrong thing.
  const wrong = pages().filter(p => {
    const nav = fs.readFileSync(p, 'utf8').split('id="navLinks"')[1].split('</nav>')[0];
    const m = nav.match(/<a href="([^"]*)"[^>]*aria-current="page"/);
    if (!m) return false;
    return navTarget(p, m[1]) !== p;
  });
  if (wrong.length) throw new Error('marks a nav link aria-current that is not this page: ' + wrong.join(', '));
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

check('Sized images are not squashed by their own attributes', () => {
  // The other half of the check above, and the reason it needs one.
  //
  // width="1440" height="940" are PRESENTATION ATTRIBUTES: they set the width
  // and height properties at zero specificity. A rule like
  // `.frame img.shot { width: 100% }` beats the width one and leaves the
  // height one standing, so the image renders at its full intrinsic height
  // against a scaled width — the hero and the gallery shipped at 611x940
  // instead of 611x399, squashed and running under the next section.
  //
  // So: any selector that sets width on an <img> must also settle height.
  const css = fs.readFileSync('styles.css', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');           // comments carry example code
  const offenders = [];
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const sel = m[1].trim(), body = m[2];
    if (!/\bimg\b/.test(sel)) continue;
    if (!/(^|;|\s)width\s*:/.test(body)) continue;
    if (/(^|;|\s)height\s*:/.test(body)) continue;
    if (/(^|;|\s)aspect-ratio\s*:/.test(body)) continue;
    offenders.push(sel);
  }
  if (offenders.length) {
    throw new Error('these set width on an img without settling height ' +
      '(add `height: auto`):\n  ' + offenders.join('\n  '));
  }
  return 'width always paired with height';
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

// Pixel width of a WebP, read from its header: the simple-lossy (VP8 ),
// lossless (VP8L) and extended (VP8X) layouts keep it in different places.
function webpWidth(file) {
  const b = fs.readFileSync(file);
  if (b.slice(0, 4).toString() !== 'RIFF' || b.slice(8, 12).toString() !== 'WEBP') throw new Error(file + ' is not a WebP file');
  const kind = b.slice(12, 16).toString();
  if (kind === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
  if (kind === 'VP8L') return 1 + (b.readUInt16LE(21) & 0x3fff);
  if (kind === 'VP8X') return 1 + b.readUIntLE(24, 3);
  throw new Error(file + ': unknown WebP chunk ' + kind);
}

check('Every narrower screenshot copy exists, is current and is the width it says', () => {
  // The hero and gallery offer 640/1080/1600px copies through srcset, and a
  // phone picks one by the number in its name. A missing copy is a broken
  // image on exactly the devices nobody tests on; a stale one is last month's
  // screen; and a copy whose real width is not its descriptor makes the
  // browser pick the wrong one and scale it. make-webp.js writes them, so its
  // width list and app.js's (which builds the gallery's srcset) must agree.
  const listOf = (file, re) => {
    const m = fs.readFileSync(file, 'utf8').match(re);
    if (!m) throw new Error('could not find the width list in ' + file);
    return m[1].split(',').map(Number).join(',');
  };
  const made = listOf('scripts/make-webp.js', /const WIDTHS = \[([\d, ]+)\]/);
  const offered = listOf('app.js', /var SHOT_WIDTHS = \[([\d, ]+)\]/);
  if (made !== offered) throw new Error(`make-webp.js writes ${made} but app.js offers ${offered}`);
  const widths = made.split(',').map(Number);

  // app.js assumes 2160 except where SHOT_NARROW says otherwise, because it
  // cannot measure a file before choosing it. Hold it to the PNGs.
  const narrow = {};
  const nm = fs.readFileSync('app.js', 'utf8').match(/var SHOT_NARROW = \{([^}]*)\}/);
  if (!nm) throw new Error('could not find SHOT_NARROW in app.js');
  for (const m of nm[1].matchAll(/(\w+): (\d+)/g)) narrow[m[1]] = Number(m[2]);

  const bad = [];
  let n = 0;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'themes') walk(rel); continue; }
      if (!e.name.endsWith('.png')) continue;
      const png = fs.readFileSync(rel);
      const w = png.readUInt32BE(16);
      if (dir === 'screenshots') {
        const key = e.name.replace(/^screenshot-(ar-)?/, '').replace(/\.png$/, '');
        const said = narrow[key] || 2160;
        if (said !== w) bad.push(`${rel} is ${w}px wide but app.js describes it as ${said}w (SHOT_NARROW)`);
      }
      for (const v of widths) {
        if (v >= w) continue;
        const out = rel.replace(/\.png$/, '-' + v + 'w.webp');
        n++;
        if (!fs.existsSync(out)) { bad.push(out + ' (missing)'); continue; }
        if (fs.statSync(rel).mtimeMs > fs.statSync(out).mtimeMs + 1000) bad.push(out + ' (older than its PNG)');
        const real = webpWidth(out);
        if (real !== v) bad.push(`${out} is ${real}px wide, not ${v}`);
      }
    }
  })('screenshots');
  if (bad.length) throw new Error('run `node scripts/make-webp.js`:\n' + bad.join('\n'));
  return n + ' copies at ' + made;
});

check('Every srcset candidate exists and is the width it claims', () => {
  // The link check reads src= and href=, never srcset=, so a typo in one
  // candidate was invisible to it — and only the devices that pick that
  // candidate would see the hole.
  const bad = [];
  let n = 0;
  for (const p of pages()) {
    const dir = path.dirname(p);
    for (const tag of fs.readFileSync(p, 'utf8').matchAll(/<(?:source|img)\b[^>]*\bsrcset="([^"]+)"[^>]*>/g)) {
      const cands = tag[1].split(',').map(c => c.trim().split(/\s+/));
      if (cands.some(c => /w$/.test(c[1] || '')) && !/\bsizes="/.test(tag[0])) {
        bad.push(p + ': width descriptors with no sizes — the browser assumes 100vw: ' + tag[0].slice(0, 80));
      }
      for (const [url, desc] of cands) {
        n++;
        const file = url.startsWith('/') ? path.join(ROOT, url) : path.join(dir, url);
        if (!fs.existsSync(file)) { bad.push(p + ': missing ' + url); continue; }
        const m = /^(\d+)w$/.exec(desc || '');
        if (m && file.endsWith('.webp') && webpWidth(file) !== Number(m[1])) {
          bad.push(`${p}: ${url} is ${webpWidth(file)}px wide but is offered as ${desc}`);
        }
      }
    }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return n + ' candidates';
});

check('Every page loads the same self-hosted fonts', () => {
  // The fonts were a Google Fonts stylesheet on every page, copied by hand
  // into each new one — so the cheap way to regress is one page (a new blog
  // post, the 404) quietly going back to it, or loading a second setup
  // beside the first. Every page must load fonts/fonts.css and preload the
  // heading face, and nothing from fonts.googleapis.com.
  const want = 'preload=fonts/archivo-latin.woff2 css=fonts/fonts.css';
  const bad = [];
  for (const p of pages().concat(['scripts/post-template.html'])) {
    const html = fs.readFileSync(p, 'utf8');
    const head = html.split('</head>')[0];
    if (/fonts\.(googleapis|gstatic)\.com/.test(head)) bad.push(p + ': still loads Google Fonts');
    // post-template.html is written to blog/, so it resolves from there.
    const at = p === 'scripts/post-template.html' ? 'blog/x.html' : p;
    const preloads = [...head.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin>/g)]
      .map(m => navTarget(at, m[1]));
    const sheets = [...head.matchAll(/<link rel="stylesheet" href="([^"]*fonts[^"]*)">/g)].map(m => navTarget(at, m[1]));
    const got = preloads.map(x => 'preload=' + x).concat(sheets.map(x => 'css=' + x)).join(' ');
    if (got !== want) bad.push(`${p}: has "${got}", want "${want}"`);
    // The preload must come before any stylesheet, or it starts no earlier
    // than the @font-face that would have found the file anyway.
    if (head.indexOf('rel="preload"') > head.indexOf('rel="stylesheet"')) bad.push(p + ': the font preload comes after a stylesheet');
  }

  const css = fs.readFileSync('fonts/fonts.css', 'utf8');
  for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
    if (!fs.existsSync(path.join('fonts', m[1]))) bad.push('fonts/fonts.css names ' + m[1] + ', which is not in fonts/');
  }
  if (!css.includes('url(archivo-latin.woff2)')) bad.push('pages preload archivo-latin.woff2, but fonts.css no longer uses it');
  // Every family styles.css asks for first must be one fonts.css provides,
  // with its licence beside it.
  const families = new Set([...fs.readFileSync('styles.css', 'utf8').matchAll(/--font-[a-z]+:\s*"([^"]+)"/g)].map(m => m[1]));
  for (const f of families) {
    if (!css.includes("font-family: '" + f + "'")) bad.push('styles.css uses ' + f + ' but fonts/fonts.css does not define it');
    const ofl = 'fonts/OFL-' + f.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt';
    if (!fs.existsSync(ofl)) bad.push(ofl + ' is missing — the OFL has to ship with the font');
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return families.size + ' families, identical on ' + pages().length + ' pages and the post template';
});

check('releases.json is a usable release list', () => {
  // The home page reads it before the GitHub API, and the sync-release
  // workflow rewrites it. A file that parses but has lost its stable release
  // or its download assets would leave the download card on the version
  // index.html was last synced to, with every check green.
  const { releases } = JSON.parse(fs.readFileSync('releases.json', 'utf8'));
  if (!Array.isArray(releases) || !releases.length) throw new Error('no releases in releases.json');
  const bad = [];
  for (const r of releases) {
    for (const k of ['tag', 'name', 'date', 'html_url']) if (!r[k]) bad.push((r.tag || '?') + ': no ' + k);
    if (typeof r.prerelease !== 'boolean') bad.push(r.tag + ': prerelease is not a boolean');
    if (/\n/.test(r.note || '')) bad.push(r.tag + ': note spans lines — it should be one unwrapped paragraph');
  }
  const stable = releases.find(r => !r.prerelease);
  if (!stable) bad.push('no stable release');
  else if (!stable.assets || !stable.assets.length) bad.push(stable.tag + ' (newest stable) has no assets to link');
  if (bad.length) throw new Error(bad.join('\n') + '\nRegenerate: gh api \'repos/khaytapp/Khayt/releases?per_page=30\' | node scripts/make-releases.js');
  return releases.length + ' releases, newest stable ' + stable.tag;
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

check('robots.txt still lets crawlers in', () => {
  // The policy is deliberate and written down in the file itself; this only
  // guards against it being reversed by accident — a stray Disallow: / on the
  // wildcard agent, or the sitemap line going missing.
  //
  // It cannot see the bigger risk: Cloudflare's managed robots.txt replaces
  // this file at the edge, so a green check here does not prove the served
  // file says the same thing. That is why the file leads with where the
  // setting lives.
  const txt = fs.readFileSync('robots.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const problems = [];

  let agent = null, wildcardDisallowsAll = false;
  for (const line of lines) {
    const m = /^user-agent:\s*(.+)$/i.exec(line);
    if (m) { agent = m[1].trim(); continue; }
    if (agent === '*' && /^disallow:\s*\/\s*$/i.test(line)) wildcardDisallowsAll = true;
  }
  if (wildcardDisallowsAll) problems.push('User-agent: * is Disallow: / — that blocks the whole site');
  if (!/^sitemap:\s*https:\/\/khaytapp\.com\/sitemap\.xml$/im.test(txt)) problems.push('the Sitemap line is missing or wrong');
  if (problems.length) throw new Error(problems.join('; '));
  return 'crawlable, sitemap declared';
});

check('Every page can be linked in Arabic', () => {
  // Arabic used to be a localStorage flag with no URL, so it could not be
  // shared or indexed. Each page needs its ?lang=ar alternate declared.
  const bad = [];
  // 404.html is excluded: it is noindex, so it has no canonical to alternate.
  for (const p of pages().filter(f => !pages.NOINDEX.has(f))) {
    const html = fs.readFileSync(p, 'utf8');
    if (!/hreflang="ar"[^>]*lang=ar/.test(html)) bad.push(p);
  }
  if (bad.length) throw new Error('no Arabic alternate declared: ' + bad.join(', '));
  return 'all declared';
});

/* ---------- 7. What search engines and share cards read ---------- */

// A page's public URL, the same mapping the sitemap check uses.
function publicUrl(p) {
  return 'https://khaytapp.com/' + (p === 'index.html' ? '' : p.replace(/(^|\/)index\.html$/, '$1'));
}

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

check('Every page has one canonical, and it is its own URL', () => {
  // A canonical copied from the page a new one was built from tells Google
  // the new page is a duplicate of the old one, and it quietly drops out of
  // the index. og:url is held to the same URL, for the same copy-paste.
  //
  // 404.html is the exception the other way: it is noindex and served at
  // every mistyped URL, so a canonical on it would claim all of them are
  // /404.html. It must have none.
  const bad = [];
  for (const p of pages()) {
    const html = fs.readFileSync(p, 'utf8');
    const canon = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map(m => m[1]);
    if (pages.NOINDEX.has(p)) {
      if (canon.length) bad.push(p + ': has a canonical (' + canon[0] + ') — it is served at every missing URL');
      if (!/<meta name="robots" content="[^"]*noindex/.test(html)) bad.push(p + ': not noindex');
      continue;
    }
    const want = publicUrl(p);
    if (canon.length !== 1) bad.push(`${p}: ${canon.length} canonical links`);
    else if (canon[0] !== want) bad.push(`${p}: canonical ${canon[0]}, should be ${want}`);
    const og = html.match(/<meta property="og:url" content="([^"]*)"/);
    if (og && og[1] !== want) bad.push(`${p}: og:url ${og[1]}, should be ${want}`);
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return pages().length - pages.NOINDEX.size + ' pages self-canonical';
});

check('Titles and descriptions fit a search result, and are unique', () => {
  // Google cuts a title at about 65 characters and a description at about
  // 160, and rewrites one it finds too short to say anything. The home page's
  // description was 364 characters and the blog's title was "Blog — Khayt".
  //
  // The language switch rewrites both from data-page-*-en/ar on every page
  // but the home page (app.js does that one from its own dictionary), so the
  // Arabic pair is held to the same limits, and the English pair must be
  // exactly what the head says — otherwise the page's description changes the
  // moment the script runs, in English.
  const LIMIT = { title: [15, 65], desc: [50, 160] };
  const bad = [];
  const seen = { title: new Map(), desc: new Map() };
  const len = s => [...s].length;
  function take(p, kind, lang, value) {
    const [lo, hi] = LIMIT[kind];
    const n = len(value);
    if (n < lo || n > hi) bad.push(`${p}: ${lang} ${kind} is ${n} characters (want ${lo}-${hi}): ${value}`);
    const key = lang + ' ' + kind + ' ' + value;
    if (seen[kind].has(key)) bad.push(`${p}: same ${lang} ${kind} as ${seen[kind].get(key)}`);
    else seen[kind].set(key, p);
  }
  for (const p of pages()) {
    const html = fs.readFileSync(p, 'utf8');
    const title = html.match(/<title>([^<]*)<\/title>/);
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    if (!title || !desc) { bad.push(p + ': no <title> or no meta description'); continue; }
    take(p, 'title', 'en', decode(title[1]));
    take(p, 'desc', 'en', decode(desc[1]));
    const attr = name => { const m = html.match(new RegExp('data-page-' + name + '="([^"]*)"')); return m && decode(m[1]); };
    if (attr('title-en') !== null || attr('desc-en') !== null) {
      if (attr('title-en') !== decode(title[1])) bad.push(`${p}: data-page-title-en differs from <title>`);
      if (attr('desc-en') !== decode(desc[1])) bad.push(`${p}: data-page-desc-en differs from the meta description`);
      if (attr('title-ar') === null || attr('desc-ar') === null) bad.push(p + ': no Arabic title or description');
      else { take(p, 'title', 'ar', attr('title-ar')); take(p, 'desc', 'ar', attr('desc-ar')); }
    }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return pages().length + ' pages, both languages';
});

check('Every share image has alt text', () => {
  // og:image without og:image:alt is a picture a screen reader announces as
  // nothing at all wherever the link is shared.
  const bad = pages().filter(p => {
    const html = fs.readFileSync(p, 'utf8');
    return /property="og:image"/.test(html) && !/<meta property="og:image:alt" content="[^"]{10,}"/.test(html);
  });
  if (bad.length) throw new Error('og:image with no og:image:alt: ' + bad.join(', '));
  return 'described';
});

check('Controls that hide their text still have a name', () => {
  // Below 1060px the nav's download button hides its word and keeps the
  // icon, which left a link with no accessible name at all. And the language
  // toggle had an aria-label, "Switch language to Arabic", that replaced its
  // visible "العربية" — so a voice-control user saying the word on the button
  // matched nothing (WCAG 2.5.3). Its name is its content now, with the
  // phrase in a screen-reader-only span, so it must NOT carry an aria-label.
  const bad = [];
  for (const p of pages()) {
    const html = fs.readFileSync(p, 'utf8');
    for (const m of html.matchAll(/<(a|button)\b([^>]*)>((?:(?!<\/\1>)[\s\S])*?class="hide-sm"[\s\S]*?)<\/\1>/g)) {
      if (!/\baria-label="[^"]+"/.test(m[2])) bad.push(p + ': <' + m[1] + '> hides its text with no aria-label');
      else if (!/\bdata-i18n-aria="/.test(m[2])) bad.push(p + ': <' + m[1] + '> aria-label has no data-i18n-aria, so it stays English in Arabic');
    }
    const toggle = html.match(/<button[^>]*id="navLang"[^>]*>/);
    if (toggle && /aria-label=/.test(toggle[0])) bad.push(p + ': the language toggle has an aria-label, which hides its visible word');
  }
  for (const f of ['app.js', 'site.js']) {
    if (/navLang[\s\S]{0,800}setAttribute\('aria-label'/.test(fs.readFileSync(f, 'utf8'))) bad.push(f + ': sets an aria-label on the language toggle');
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return 'named';
});

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
