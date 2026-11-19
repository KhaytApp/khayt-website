#!/usr/bin/env node
/* ============================================================
   The directory build must REFUSE what a shop could be misled by.
   ------------------------------------------------------------
   Runs scripts/make-directory.js --dry against tampered copies of the real
   listing, each of which must be refused, plus the real one, which must
   pass. Nothing is written. check-site.js runs this.
   ============================================================ */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const real = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory', 'listings.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'khayt-dir-'));
const clone = x => JSON.parse(JSON.stringify(x));
const sample = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'developers', 'samples', f), 'utf8'));
function writeManifest(name, m) { const f = path.join(tmp, name); fs.writeFileSync(f, JSON.stringify(m, null, 2)); return f; }
function run(listing) {
  const f = path.join(tmp, 'listings.json');
  fs.writeFileSync(f, JSON.stringify(listing));
  const r = spawnSync(process.execPath, [path.join(__dirname, 'make-directory.js'), '--dry', '--listings', f], { encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout + r.stderr).trim() };
}
function withItem(slug, change) { const l = clone(real); change(l.items.find(i => i.slug === slug), l); return l; }

const cases = [
  ['a manifest edited after signing (one more field sent)', withItem('slack', it => {
    const m = sample('slack-notifier.json'); m.events[0].body.template.text += ' {customer.phone}';
    it.manifest = writeManifest('slack-more.json', m);
  }), /not signed by a published key/],
  ['a manifest with its signature removed', withItem('slack', it => {
    const m = sample('slack-notifier.json'); delete m.signature; it.manifest = writeManifest('slack-unsigned.json', m);
  }), /not signed by a published key/],
  ['a listing that names a different publisher than the signed manifest', withItem('slack', (it, l) => {
    l.publishers.push({ slug: 'acme', name: 'Acme', domain: 'acme.example' }); it.publisher_slug = 'acme';
  }), /signed manifest says publisher/],
  ['a slicer plugin with a download but no signed index row', withItem('orcaslicer', it => {
    it.package = { file: 'directory/listings.json' }; delete it.status;
  }), /no signed connectors\/index.json row/],
  ['a slicer plugin with no download that does not say not-released', withItem('orcaslicer', it => { it.status = 'released'; }), /must say status "not-released"/],
  ['a slicer plugin asking for a scope the Mac does not show', withItem('orcaslicer', it => { it.scopes = ['slices:send', 'printer:send']; }), /printer:send is not a scope/],
  ['two items with one slug', withItem('slack', it => { it.slug = 'discord'; }), /two items use the slug discord/],
];

let bad = 0;
const base = run(real);
if (!base.ok) { console.error('the real listing is refused:\n' + base.out); bad++; }
for (const [name, listing, want] of cases) {
  const r = run(listing);
  if (r.ok) { console.error(`NOT refused: ${name}`); bad++; }
  else if (!want.test(r.out)) { console.error(`refused for the wrong reason: ${name}\n  ${r.out}`); bad++; }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (bad) process.exit(1);
console.log(`test-make-directory: the real listing builds; ${cases.length} tampered ones are refused`);
