#!/usr/bin/env node
/* ============================================================
   A Content-Security-Policy on every page, as a <meta> tag.
   ------------------------------------------------------------
   GitHub Pages sets no headers we control, so the policy rides in the HTML.
   The site loads nothing from anywhere else: its own scripts, styles, fonts,
   images and video, plus two fetches — the GitHub releases API (download
   versions) and Khayt Cloud (the beta sign-up). Everything else is refused,
   so a script injected into a page, or a page framed into a form-stealing
   lookalike, has nowhere to load from or post to.

   Inline <script> blocks (PAGE_STRINGS, the Arabic redirect) are allowed by
   their SHA-256, computed here, so editing one means re-running this.
   JSON-LD blocks are data, not scripts, and are left out. style-src keeps
   'unsafe-inline' for the style="" attributes the pages use; styles cannot
   run code.

   Not settable from a meta tag, so not here: frame-ancestors, report-to.

     node scripts/csp.js          # write the tag into every page
     node scripts/csp.js --check  # exit 1 if any page's tag is missing or stale

   Run it LAST — after prerender, make-ar and make-ar-pages — since those
   rewrite pages. It is idempotent.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const pages = require('./pages.js');

const CONNECT = ['https://api.github.com', 'https://cloud.khaytapp.com'];

function policy(html) {
  const hashes = [];
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs)) continue;
    hashes.push("'sha256-" + crypto.createHash('sha256').update(m[2], 'utf8').digest('base64') + "'");
  }
  return [
    "default-src 'self'",
    "script-src 'self'" + (hashes.length ? ' ' + [...new Set(hashes)].join(' ') : ''),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "font-src 'self'",
    "connect-src 'self' " + CONNECT.join(' '),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

const TAG = /<meta http-equiv="Content-Security-Policy" content="[^"]*">\n/;

function apply(html) {
  const tag = '<meta http-equiv="Content-Security-Policy" content="' + policy(html) + '">\n';
  if (TAG.test(html)) return html.replace(TAG, tag);
  const at = html.search(/<meta charset="[^"]*">\n/i);
  if (at < 0) throw new Error('no <meta charset> line to put the policy after');
  const end = html.indexOf('\n', at) + 1;
  return html.slice(0, end) + tag + html.slice(end);
}

const check = process.argv.includes('--check');
const stale = [];
for (const f of pages()) {
  const html = fs.readFileSync(f, 'utf8');
  let next;
  try { next = apply(html); } catch (e) { throw new Error(f + ': ' + e.message); }
  if (next === html) continue;
  if (check) stale.push(f);
  else { fs.writeFileSync(f, next); console.log('csp: ' + f); }
}
if (check && stale.length) {
  console.error('Content-Security-Policy missing or stale on:\n  ' + stale.join('\n  ') + '\nRun `node scripts/csp.js` and commit the result.');
  process.exit(1);
}
