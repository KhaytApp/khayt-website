#!/usr/bin/env node
/* The comparison table in #why names FoxTrack, PrintMate and Watchtower and is dated.
   Every cell was read from their own pages on that day, and those pages
   change: a price or a feature we state about another product goes stale
   silently. This fails the daily scheduled run (links.yml) once the date is
   older than MAX_DAYS, which is the prompt to re-read their pages, correct the
   cells, and move the date in app.js (why.cmp.col0 and why.cmp.note, EN + AR).
   It is not in check-site.js on purpose: a PR should go red because its
   author broke something, not because a month passed. */
'use strict';
const fs = require('fs');
const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const MAX_DAYS = 35;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const src = fs.readFileSync('app.js', 'utf8');
const m = src.match(/'why\.cmp\.col0':\s*\{\s*en:\s*'As of (\d{1,2}) (\w+) (\d{4})'/);
if (!m || MONTHS.indexOf(m[2]) === -1) {
  console.error("check-freshness: could not read the comparison date from app.js's why.cmp.col0");
  process.exit(1);
}
const asOf = Date.UTC(+m[3], MONTHS.indexOf(m[2]), +m[1]);
const age = Math.floor((Date.now() - asOf) / 86400000);
if (age > MAX_DAYS) {
  console.error(`The FoxTrack/PrintMate/Watchtower comparison is ${age} days old (as of ${m[1]} ${m[2]} ${m[3]}; limit ${MAX_DAYS}).`);
  console.error('Re-read https://foxtrack.studio/pricing, the PrintMate App Store listing and https://watchtower3d.com/pricing (+ /faq; it needs JavaScript, so read it with headless Chrome), fix the cells in app.js (why.*), and move the date.');
  process.exit(1);
}
console.log(`comparison is ${age} day(s) old (limit ${MAX_DAYS})`);
