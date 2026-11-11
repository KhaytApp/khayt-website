#!/usr/bin/env node
/* ============================================================
   Check connectors/: the public list the Khayt apps poll once a day
   (khaytapp.com/connectors/index.json) and the manifests it names.
   ------------------------------------------------------------
   - every .json under connectors/ parses;
   - every entry's file is at connectors/<id>/<version>.json, its url is
     https://khaytapp.com/connectors/<id>/<version>.json, and its bytes match
     the index's size and sha256 (so it must never be reformatted);
   - nothing under connectors/ is left unlisted.
   The signatures are checked in the workflows by the Khayt app's own
   `sign-connector.js verify-index` (public keys only). While the list is
   still the "_placeholder" seed, only parsing is checked here, and the
   deploy refuses to serve it.
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

const crypto = require('crypto');
const list = parsed['index.json'];
if (!list) problems.push('connectors/index.json is missing or invalid');
else if (list._placeholder) {
  console.log('check-connectors: index.json is still the placeholder; only parsing was checked');
} else {
  // A cross-check needing no key; sign-connector.js verify-index (in the workflows)
  // is the authority and also checks the signature, serial, expiry and keys.
  const named = new Set(['index.json']);
  for (const e of list.entries || []) {
    if (e.kind !== 'connector') continue;  // devices ignore kinds they do not know
    const rel = `${e.id}/${e.version}.json`;
    named.add(rel);
    if (e.url !== `https://khaytapp.com/connectors/${rel}`) problems.push(`${e.id}@${e.version}: url is ${e.url}`);
    let bytes;
    try { bytes = fs.readFileSync(path.join(DIR, rel)); } catch (_) { problems.push(`connectors/${rel} is listed but not here`); continue; }
    if (bytes.length !== e.size) problems.push(`connectors/${rel}: ${bytes.length} bytes, index says ${e.size}`);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== e.sha256) problems.push(`connectors/${rel}: sha256 differs from the index (was it reformatted?)`);
  }
  for (const f of Object.keys(parsed)) if (!named.has(f)) problems.push(`connectors/${f} is not in index.json`);
}

if (problems.length) { console.error('check-connectors:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check-connectors: ${Object.keys(parsed).length} file(s) OK`);
