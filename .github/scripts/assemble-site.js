#!/usr/bin/env node
/* ============================================================
   Assemble _site: the files khaytapp.com serves, and nothing else.
   ------------------------------------------------------------
   Pages used to ship the whole checkout (build_type "legacy"): the build
   scripts, .design-sync, the workflow files, the README. This copies an
   explicit list instead. The list is an INCLUDE list on purpose: a file that
   is served today and then left out breaks the live site, so nothing ships by
   accident and nothing is dropped by accident either —

     every file git tracks must be either SERVED or NOT_SERVED below.

   A new top-level page, folder or asset that is in neither list fails the
   build with its name, rather than silently going missing from the site.
   (Untracked files never ship: the list comes from `git ls-files`.)

   Run it locally the same way the workflow does:

     node .github/scripts/assemble-site.js            # writes ./_site
     node .github/scripts/check-site-refs.js _site    # every local link resolves
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(ROOT, process.argv[2] || '_site');

// ---- What the site serves -------------------------------------------------
// Single files, each of which MUST exist (a missing one fails the build).
const FILES = [
  // Pages
  'index.html', 'services.html',
  '404.html', 'success.html', 'cancel.html', 'failure.html',
  'privacy/index.html', 'terms/index.html',
  // Scripts and styles the pages load
  'app.js', 'data.js', 'render.js', 'site.js', 'services.js', 'styles.css',
  'blog/posts.js',
  // Icons and social cards. og-image-mark.png is not linked from any page
  // today, but it has been served at that URL and may be shared elsewhere.
  'favicon.ico', 'khayt-apple-icon.png', 'khayt-favicon-16.png',
  'khayt-favicon-32.png', 'khayt-icon-128.png', 'khayt-icon.png',
  'og-image.png', 'og-image-ar.png', 'og-image-mark.png',
  // Machine-read files
  'robots.txt', 'sitemap.xml', 'blog/feed.xml',
  'releases.json',      // fetched by app.js for the release list
  'mac/appcast.xml',    // the Sparkle update feed — the Mac app polls this URL
  'CNAME',
];

// Whole folders, limited to these extensions. Every screenshot is served:
// app.js builds the gallery's paths from PLATS (dir + key + '-' + lang) and
// a srcset of -640w/-1080w/-1600w .webp copies beside each .png.
const DIRS = [
  { dir: 'ar/', ext: ['.html'] },
  { dir: 'blog/', ext: ['.html'] },
  { dir: 'fonts/', ext: ['.woff2', '.css', '.txt'] },   // .txt = the OFL licences
  { dir: 'screenshots/', ext: ['.png', '.webp'] },
  { dir: 'video/', ext: ['.mp4'] },
  // The connector list the apps poll once a day, and the signed manifests it
  // names. Static JSON only: GitHub Pages sends application/json and an ETag,
  // sets no cookies, and no page script runs on these paths.
  { dir: 'connectors/', ext: ['.json'] },
];

// ---- What it does not -------------------------------------------------------
// Prefixes (a trailing "/" means the whole folder) and exact paths.
const NOT_SERVED = [
  'scripts/',          // the local build tooling
  '.design-sync/',     // design-token sync working files
  '.github/',          // workflows and their helpers
  '.gitignore',
  'blog/README.md',    // how to write a post — for authors, not visitors
  // Connector developer docs and the manifest schema: built and checked, but
  // NOT served until connectors v1 ships (developers/README.md says how to
  // switch them on). Until then they must not reach khaytapp.com at all.
  'developers/',
  'schemas/',
];

// ----------------------------------------------------------------------------

function tracked() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0').filter(Boolean);
}

function served(f) {
  if (FILES.includes(f)) return true;
  return DIRS.some(d => f.startsWith(d.dir) && d.ext.includes(path.extname(f).toLowerCase()));
}

function notServed(f) {
  return NOT_SERVED.some(p => (p.endsWith('/') ? f.startsWith(p) : f === p));
}

const files = tracked();
const problems = [];

for (const f of FILES) {
  if (!files.includes(f)) problems.push('listed in FILES but not tracked by git: ' + f);
}
for (const d of DIRS) {
  if (!files.some(f => f.startsWith(d.dir))) problems.push('listed in DIRS but empty: ' + d.dir);
}
const unclassified = files.filter(f => !served(f) && !notServed(f));
for (const f of unclassified) {
  problems.push('not classified — add it to SERVED (FILES/DIRS) or NOT_SERVED in ' +
    path.relative(ROOT, __filename) + ': ' + f);
}
const cname = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
if (cname !== 'khaytapp.com') problems.push('CNAME is "' + cname + '", expected "khaytapp.com"');

if (problems.length) {
  console.error('assemble-site: ' + problems.length + ' problem(s)\n  ' + problems.join('\n  '));
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let bytes = 0;
const ship = files.filter(served);
for (const f of ship) {
  const dest = path.join(OUT, f);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), dest);
  bytes += fs.statSync(dest).size;
}
// Served as-is, with no Jekyll pass (the Actions deploy runs none anyway).
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'CNAME'), cname + '\n');

const left = files.filter(notServed);
console.log('assemble-site: ' + ship.length + ' files, ' + (bytes / 1048576).toFixed(1) +
  ' MB -> ' + path.relative(ROOT, OUT) + '/ (+ .nojekyll)');
console.log('  left out: ' + left.length + ' tracked files under ' + NOT_SERVED.join(', '));
