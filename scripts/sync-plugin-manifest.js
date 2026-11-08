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
const SRC = 'lib/plugin-manifest.js';

const git = (...a) => execFileSync('git', ['-C', APP, ...a], { encoding: 'utf8' });
const sha = git('rev-parse', REF).trim();
const body = git('show', `${sha}:${SRC}`);

const header = `// COPIED from KhaytApp/Khayt ${SRC} at ${sha}.\n` +
  `// Do not edit here: run scripts/sync-plugin-manifest.js. The docs under\n` +
  `// developers/ are generated from this file by scripts/make-dev-docs.js.\n`;

const vendor = path.join(ROOT, 'developers', 'vendor', 'plugin-manifest.js');
fs.mkdirSync(path.dirname(vendor), { recursive: true });
fs.writeFileSync(vendor, header + body);

delete require.cache[vendor];
const M = require(vendor);
const schema = M.manifestJsonSchema();
const want = 'https://khaytapp.com/schemas/plugin-manifest-v1.json';
if (schema.$id !== want) throw new Error(`schema $id is ${schema.$id}, expected ${want}`);
const out = path.join(ROOT, 'schemas', 'plugin-manifest-v1.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(schema, null, 2) + '\n');

console.log(`plugin-manifest.js @ ${sha.slice(0, 9)} -> developers/vendor/, schemas/plugin-manifest-v1.json`);
