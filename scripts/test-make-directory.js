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
// A second publisher, so a listing can try to claim Khayt's namespace.
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory', 'publishers.json'), 'utf8'));
registry.publishers.push({ slug: 'acme', name: 'Acme', namespaces: ['com.acme.'], support: 'help@acme.example' });
const regFile = path.join(tmp, 'publishers.json');
fs.writeFileSync(regFile, JSON.stringify(registry));
function run(listing, out) {
  const f = path.join(tmp, 'listings.json');
  fs.writeFileSync(f, JSON.stringify(listing));
  const args = [path.join(__dirname, 'make-directory.js'), '--dry', '--listings', f, '--publishers', regFile].concat(out ? ['--out', out] : []);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
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
  ['another publisher listing a signed Khayt connector as theirs', withItem('slack', it => { it.publisher_slug = 'acme'; }), /in Khayt's namespace, not Acme's/],
  ['another publisher claiming the app.khayt namespace for its own item', withItem('orcaslicer', it => { it.publisher_slug = 'acme'; it.id = 'app.khayt.acme-orca'; }), /in Khayt's namespace, not Acme's/],
  ['an id in no registered namespace', withItem('orcaslicer', it => { it.id = 'org.stranger.orca'; }), /in no registered publisher's namespace/],
  ['a publisher that is not in the registry', withItem('slack', it => { it.publisher_slug = 'nobody'; }), /no publisher nobody in the registry/],
  ['a listing that sets its own verified domain', withItem('slack', it => { it.verifiedDomain = 'khaytapp.com'; }), /"verifiedDomain" is not a key a listing may set/],
  ['a listing file that brings its own publishers', (() => { const l = clone(real); l.publishers = registry.publishers; return l; })(), /"publishers" is not a key a listing file may set/],
  ['a source link that is not https', withItem('slack', it => { it.source = 'javascript:alert(1)'; }), /source is an https URL/],
  ['a support address that is not an email', withItem('slack', it => { it.support = 'x" onmouseover="alert(1)'; }), /support is an email address/],
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
// Listing text is shown, never run: markup in it comes out escaped.
const nasty = withItem('orcaslicer', it => {
  it.name = { en: '<img src=x onerror=alert(1)> Orca', ar: '<b>"خيط"</b>' };
  it.description = { en: 'Fast <script>alert("x")</script> & "quoted" \'text\'' };
});
const out = path.join(tmp, 'out');
const r = run(nasty, out);
if (!r.ok) { console.error('listing text with markup was refused instead of escaped:\n' + r.out); bad++; }
else {
  for (const rel of ['directory/index.html', 'directory/orcaslicer/index.html', 'ar/directory/orcaslicer/index.html', 'directory/publisher/khayt/index.html']) {
    const html = fs.readFileSync(path.join(out, rel), 'utf8');
    if (/<script>alert|<img src=x|<b>"خيط"/.test(html)) { console.error(`${rel}: listing markup is not escaped`); bad++; }
    if (!/&lt;script&gt;alert\(&quot;x&quot;\)|&lt;img src=x/.test(html)) { console.error(`${rel}: the escaped text is missing`); bad++; }
  }
  // Downloads are https links on khaytapp.com.
  const lamha = fs.readFileSync(path.join(out, 'directory/lamha/index.html'), 'utf8');
  const dl = [...lamha.matchAll(/class="dir-dl" href="([^"]+)"/g)].map(m => m[1]);
  if (!dl.length || dl.some(u => !u.startsWith('https://khaytapp.com/'))) { console.error('a download link is not https on khaytapp.com: ' + dl.join(', ')); bad++; }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (bad) process.exit(1);
console.log(`test-make-directory: the real listing builds; ${cases.length} tampered ones are refused; markup in listing text is escaped; downloads are https on khaytapp.com`);
