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
  // Every link to somewhere else carries rel="noopener noreferrer".
  const item = fs.readFileSync(path.join(out, 'directory/orcaslicer/index.html'), 'utf8');
  const main = item.slice(item.indexOf('<main'), item.indexOf('</main>'));
  const ext = [...main.matchAll(/<a href="(https?:|mailto:)[^"]*"([^>]*)>/g)];
  if (!ext.length || ext.some(m => !/rel="noopener noreferrer"/.test(m[2]))) { console.error('an outside link has no rel="noopener noreferrer"'); bad++; }
  // Downloads are https links on khaytapp.com.
  const lamha = fs.readFileSync(path.join(out, 'directory/lamha/index.html'), 'utf8');
  const dl = [...lamha.matchAll(/class="dir-dl" href="([^"]+)"/g)].map(m => m[1]);
  if (!dl.length || dl.some(u => !u.startsWith('https://khaytapp.com/'))) { console.error('a download link is not https on khaytapp.com: ' + dl.join(', ')); bad++; }
}
// "Install in Khayt" (KhaytApp/Khayt#2622): exactly id and version, and only
// for a connector the verified index lists at that version, not withdrawn.
{
  const { installHref } = require('./directory-install.js');
  const it = { kind: 'connector', id: 'app.khayt.samples.lamha', version: '1.1.1' };
  const row = { kind: 'connector', id: it.id, version: it.version, url: 'https://khaytapp.com/connectors/app.khayt.samples.lamha/1.1.1.json', sha256: 'a'.repeat(64) };
  const ix = rows => ({ entries: rows });
  const want = 'khayt://plugin/install?id=app.khayt.samples.lamha&version=1.1.1';
  const got = installHref(it, ix([row]));
  if (got !== want) { console.error(`install link is ${got}, want ${want}`); bad++; }
  const none = [
    ['no verified index', installHref(it, null)],
    ['not listed', installHref(it, ix([]))],
    ['another version listed', installHref(it, ix([Object.assign({}, row, { version: '1.1.2' })]))],
    ['this version withdrawn', installHref(it, ix([Object.assign({}, row, { revoked: [{ version: '1.1.1', reason: 'x' }] })]))],
    ['a slicer row, not a connector', installHref(it, ix([Object.assign({}, row, { kind: 'slicer' })]))],
    ['a slicer item', installHref(Object.assign({}, it, { kind: 'slicer' }), ix([row]))],
    ['an id that would add a field', installHref(Object.assign({}, it, { id: 'app.khayt.x&url=https://evil' }), ix([Object.assign({}, row, { id: 'app.khayt.x&url=https://evil' })]))],
    ['a version that is not a version', installHref(Object.assign({}, it, { version: '1.1.1&x=1' }), ix([Object.assign({}, row, { version: '1.1.1&x=1' })]))],
  ];
  for (const [why, v] of none) if (v !== null) { console.error(`install link offered when ${why}: ${v}`); bad++; }
  // Switched off (today), no page carries a khayt:// link at all.
  for (const rel of ['directory/lamha/index.html', 'ar/directory/lamha/index.html', 'directory/index.html']) {
    if (fs.existsSync(path.join(out, rel)) && /khayt:\/\//.test(fs.readFileSync(path.join(out, rel), 'utf8'))) { console.error(`${rel}: an install link while the switch is off`); bad++; }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (bad) process.exit(1);
console.log(`test-make-directory: the real listing builds; ${cases.length} tampered ones are refused; markup in listing text is escaped; downloads are https on khaytapp.com; the install link is id and version only, for a listed version`);
