#!/usr/bin/env node
/* ============================================================
   Copy the connector manifest rules in from the app repo.
   ------------------------------------------------------------
   The developer docs (/developers/) describe lib/plugin-manifest.js in
   KhaytApp/Khayt. They are generated from it, never written by hand, so a
   field the app does not accept cannot be documented. This site's CI has no
   checkout of the app, so the file is copied here at a pinned commit:

     developers/vendor/plugin-manifest.js   the module, unchanged but for a header
     schemas/plugin-manifest-v1.json        manifestJsonSchema(), at the URL its
                                            $id names (https://khaytapp.com/schemas/…)

   Run it when the app's manifest changes, then `node scripts/make-dev-docs.js`:

     node scripts/sync-plugin-manifest.js [path/to/Khayt] [git-ref]

   Defaults: ../ (this repo sits inside the Khayt checkout) and origin/main.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.resolve(process.argv[2] || path.join(ROOT, '..'));
const REF = process.argv[3] || 'origin/main';
// plugin-manifest.js: the rules. plugin-payload.js: the exact bytes a
// connector is sent, so the docs show requests the app really builds.
// webhook-bus.js, webhooks.js, webhook-send.js (+ host-ranges.js, which it
// requires): the shop's own webhooks, for /developers/webhooks/.
const SRCS = ['lib/plugin-manifest.js', 'lib/plugin-payload.js',
  'lib/webhook-bus.js', 'lib/webhooks.js', 'lib/webhook-send.js', 'lib/host-ranges.js'];

const git = (...a) => execFileSync('git', ['-C', APP, ...a], { encoding: 'utf8' });
const sha = git('rev-parse', REF).trim();
fs.mkdirSync(path.join(ROOT, 'developers', 'vendor'), { recursive: true });
for (const SRC of SRCS) {
  const header = `// COPIED from KhaytApp/Khayt ${SRC} at ${sha}.\n` +
    `// Do not edit here: run scripts/sync-plugin-manifest.js. The docs under\n` +
    `// developers/ are generated from this file by scripts/make-dev-docs.js.\n`;
  fs.writeFileSync(path.join(ROOT, 'developers', 'vendor', path.basename(SRC)), header + git('show', `${sha}:${SRC}`));
}
const vendor = path.join(ROOT, 'developers', 'vendor', 'plugin-manifest.js');

// The signed sample connectors (plugins/samples/ in the app repo), for
// /developers/samples/. Copied as they are: their signatures cover these bytes'
// canonical form, and make-dev-docs.js verifies each one.
const SAMPLES = path.join(ROOT, 'developers', 'samples');
fs.rmSync(SAMPLES, { recursive: true, force: true });
fs.mkdirSync(SAMPLES, { recursive: true });
for (const f of git('ls-tree', '--name-only', `${sha}:plugins/samples/`).split('\n').filter(n => n.endsWith('.json'))) {
  fs.writeFileSync(path.join(SAMPLES, f), git('show', `${sha}:plugins/samples/${f}`));
}

delete require.cache[vendor];
const M = require(vendor);
const schema = M.manifestJsonSchema();
const want = 'https://khaytapp.com/schemas/plugin-manifest-v1.json';
if (schema.$id !== want) throw new Error(`schema $id is ${schema.$id}, expected ${want}`);
const out = path.join(ROOT, 'schemas', 'plugin-manifest-v1.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(schema, null, 2) + '\n');

console.log(`${SRCS.map(f => path.basename(f)).join(', ')} @ ${sha.slice(0, 9)} -> developers/vendor/, schemas/plugin-manifest-v1.json`);
