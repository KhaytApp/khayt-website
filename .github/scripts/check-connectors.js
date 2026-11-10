#!/usr/bin/env node
/* ============================================================
   Check connectors/: the public list the Khayt apps poll once a day
   (khaytapp.com/connectors/index.json) and the manifests it names.
   ------------------------------------------------------------
   - every .json under connectors/ parses;
   - every manifest the list names exists, and nothing under connectors/
     is left unlisted;
   - each manifest's id and version match its entry.
   TODO (Mac lane): run `sign-connector.js verify` on the list and on every
   manifest, once its command and the final JSON shape arrive. Until then
   the list carries "_placeholder" and only parsing is checked.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'connectors');
const problems = [];

const all = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else all.push(path.relative(DIR, p).split(path.sep).join('/'));
  }
})(DIR);

const parsed = {};
for (const f of all) {
  if (!f.endsWith('.json')) { problems.push(`connectors/${f}: only .json files belong here`); continue; }
  try { parsed[f] = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { problems.push(`connectors/${f}: not valid JSON (${e.message})`); }
}

const list = parsed['index.json'];
if (!list) problems.push('connectors/index.json is missing or invalid');
else if (list._placeholder) {
  console.log('check-connectors: index.json is still the placeholder; only parsing was checked');
} else {
  const named = new Set();
  for (const c of list.connectors || []) {
    named.add(c.manifest);
    const m = parsed[c.manifest];
    if (!m) { problems.push(`connectors/index.json names ${c.manifest}, which is not here`); continue; }
    if (m.id !== c.id || m.version !== c.version) problems.push(`connectors/${c.manifest} is ${m.id}@${m.version}, listed as ${c.id}@${c.version}`);
  }
  for (const f of Object.keys(parsed)) if (f !== 'index.json' && !named.has(f)) problems.push(`connectors/${f} is not in index.json`);
}

if (problems.length) { console.error('check-connectors:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check-connectors: ${Object.keys(parsed).length} file(s) OK`);
