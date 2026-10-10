#!/usr/bin/env node
/* ============================================================
   Stamp each sitemap.xml <lastmod> from git.
   ------------------------------------------------------------
   The dates were typed by hand and nobody retyped them: the home page said
   2026-09-14 for weeks while it was edited again and again, and a crawler
   that trusts lastmod has no reason to come back for a page that says it has
   not changed. A date nobody has to remember is the only kind that stays true.

   So a page's lastmod is the day of the last commit that touched its file —
   or today, if the file has changes not yet committed, which is the state
   this runs in just before a commit.

   Two release bots commit to index.html several times a week, and only to
   swap a version number in a download URL. That is not the page changing in
   any sense a search engine cares about, and stamping it would mean every
   release leaves the sitemap stale and the next unrelated PR red. Their
   commits are skipped; BOTS below is the list.

     node scripts/stamp-sitemap.js          # write
     node scripts/stamp-sitemap.js --check  # exit 1 if a lastmod is older than its file

   --check is what CI runs. It needs the whole history (fetch-depth: 0 in
   check.yml): in a shallow clone every file's last commit is the one commit
   there is, and it refuses rather than guessing.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

const BOTS = new Set(['github-actions[bot]', 'khayt-release']);
const check = process.argv.includes('--check');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

if (git('rev-parse', '--is-shallow-repository') === 'true') {
  console.error('stamp-sitemap: this is a shallow clone, so git cannot say when a file last changed.');
  console.error('In CI, give actions/checkout `fetch-depth: 0`; locally, `git fetch --unshallow`.');
  process.exit(1);
}

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// https://khaytapp.com/blog/ -> blog/index.html, the same mapping in reverse
// that check-site.js uses to prove every page is listed.
function fileFor(loc) {
  const rel = loc.replace(/^https:\/\/khaytapp\.com\//, '');
  return rel === '' || rel.endsWith('/') ? rel + 'index.html' : rel;
}

function changed(file) {
  if (git('status', '--porcelain', '--', file)) return today();
  for (const line of git('log', '--format=%cs\t%an', '--', file).split('\n')) {
    const [date, author] = line.split('\t');
    if (date && !BOTS.has(author)) return date;
  }
  return null; // never committed by a person: nothing to say yet
}

const SITEMAP = 'sitemap.xml';
const before = fs.readFileSync(SITEMAP, 'utf8');
const stale = [];

const after = before.replace(/(<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>)(\d{4}-\d{2}-\d{2})(<\/lastmod>)/g,
  (whole, head, loc, lastmod, tail) => {
    const file = fileFor(loc);
    if (!fs.existsSync(file)) throw new Error(`stamp-sitemap: ${loc} has no file at ${file}`);
    const want = changed(file);
    if (!want || lastmod >= want) return whole;
    stale.push({ loc, file, lastmod, want });
    return head + want + tail;
  });

const urls = (before.match(/<loc>/g) || []).length;
const dated = (before.match(/<lastmod>/g) || []).length;
if (dated !== urls) {
  console.error(`stamp-sitemap: ${urls} <url>s but ${dated} <lastmod>s — every URL needs one`);
  process.exit(1);
}

// --check allows a lag of GRACE_DAYS. A squash merge is committed on the day
// it is merged, not the day the PR was stamped, so an exact comparison turned
// main red after any PR merged a day late — for a date crawlers treat as a
// hint. What this exists to catch is weeks of staleness (2026-09-14 on a page
// edited all through October), and a fortnight's grace still catches that.
const GRACE_DAYS = 14;
const lagDays = s => (Date.parse(s.want) - Date.parse(s.lastmod)) / 864e5;

if (check) {
  const late = stale.filter(s => lagDays(s) > GRACE_DAYS);
  if (late.length) {
    console.error('sitemap.xml has lastmod dates older than the pages they describe:');
    late.forEach(s => console.error(`  ${s.loc}  lastmod ${s.lastmod}, but ${s.file} last changed ${s.want}`));
    console.error('\nRun `node scripts/stamp-sitemap.js` and commit the result.');
    process.exit(1);
  }
  console.log(stale.length ? `all ${urls} lastmod dates within ${GRACE_DAYS} days` : `all ${urls} lastmod dates are current`);
  process.exit(0);
}

if (after !== before) fs.writeFileSync(SITEMAP, after);
console.log(stale.length
  ? 'stamped:\n' + stale.map(s => `  ${s.loc}  ${s.lastmod} -> ${s.want}`).join('\n')
  : `all ${urls} lastmod dates already current`);
