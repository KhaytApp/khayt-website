#!/usr/bin/env node
/* ============================================================
   Version every page's own scripts and stylesheets by their content.
   ------------------------------------------------------------
   The site sits behind Cloudflare, which serves .js and .css with
   `max-age=14400` (four hours) but the HTML with `max-age=600`. So for up to
   four hours after a deploy, a returning visitor can get the NEW page running
   the OLD app.js / site.js / styles.css out of their browser cache — new
   markup, old DICT keys, old layout rules.

   This rewrites every local <script src> and <link href> to a .js or .css file
   as `file.js?v=<first 10 hex of its SHA-256>`. Change the file and its URL
   changes with it, so the browser and the edge fetch it fresh; leave it alone
   and the cached copy keeps being used.

   Fonts and images are left out: fonts.css's own url()s are not rewritten
   (the font files never change in place), and images are content-named by
   the scripts that make them.

     node scripts/stamp-assets.js          # rewrite every page
     node scripts/stamp-assets.js --check  # exit 1 if any page is stale

   Run it after anything that edits a .js or .css file, and after the page
   generators (make-ar, make-ar-pages) — though they carry the stamps through
   from the English pages, so their output is already current. It is
   idempotent, and it does not touch inline scripts, so scripts/csp.js's
   hashes are unaffected.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const pages = require('./pages.js');

const hashes = new Map();
function version(file) {
  if (!hashes.has(file)) {
    hashes.set(file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10));
  }
  return hashes.get(file);
}

// <script src="…js"> and <link … href="…css">, local only. The query, if
// any, is dropped and replaced; a #fragment would be meaningless here.
const REF = /(<(?:script|link)\b[^>]*?\s(?:src|href)=")((?!https?:|\/\/|data:)[^"?#]+\.(?:js|css))(?:\?[^"]*)?"/g;

function stamp(file, html) {
  // A page with <base href="/"> (the generated Arabic home page) resolves
  // relative URLs against the site root, not its own folder.
  const base = /<base href="\/">/.test(html) ? ROOT : path.dirname(path.join(ROOT, file));
  return html.replace(REF, (m, pre, url) => {
    const target = url.startsWith('/') ? path.join(ROOT, url) : path.join(base, url);
    if (!fs.existsSync(target)) throw new Error(`${file}: ${url} does not exist`);
    return `${pre}${url}?v=${version(target)}"`;
  });
}

const check = process.argv.includes('--check');
const stale = [];
for (const f of pages()) {
  const html = fs.readFileSync(f, 'utf8');
  const next = stamp(f, html);
  if (next === html) continue;
  if (check) stale.push(f);
  else { fs.writeFileSync(f, next); console.log('stamp-assets: ' + f); }
}
if (check && stale.length) {
  console.error('Script/stylesheet versions stale on:\n  ' + stale.join('\n  ') +
    '\nRun `node scripts/stamp-assets.js` and commit the result.');
  process.exit(1);
}
