#!/usr/bin/env node
/* ============================================================
   Generate the connector developer docs (/developers/).
   ------------------------------------------------------------
   Everything a reference table says comes from developers/vendor/
   plugin-manifest.js — the app's own validator, copied in by
   scripts/sync-plugin-manifest.js. The prose lives here, in DOC below,
   keyed by the names the module exports, and the two are held together
   both ways:

     - a key, scope, event, type… the module has and DOC does not describe
       fails the build (an undocumented part of the contract);
     - a name DOC describes that the module does not have fails the build
       (documentation for something a developer cannot use).

   The example manifest (developers/examples/*.json) must pass the module's
   own validateManifest(), and the consent rows shown under it are
   consentRows() of that example, so the page cannot show a manifest the app
   would refuse.

   HIDDEN UNTIL CONNECTORS v1 SHIPS: developers/ is NOT_SERVED in
   .github/scripts/assemble-site.js and the pages carry noindex. Making them
   public is a separate, deliberate change (see developers/README.md).

     node scripts/make-dev-docs.js          # write
     node scripts/make-dev-docs.js --check  # fail if a page is stale
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const M = require(path.join(ROOT, 'developers', 'vendor', 'plugin-manifest.js'));
const VENDOR_SHA = (/at ([0-9a-f]{40})\./.exec(
  fs.readFileSync(path.join(ROOT, 'developers', 'vendor', 'plugin-manifest.js'), 'utf8')) || [])[1] || '';

// ---- Prose, keyed by the module's names -------------------------------------
const DOC = {
  top: {
    khayt: 'Always <code>{"manifest": 1}</code>. Tells the app which version of these rules the file is written to.',
    id: 'Your connector’s permanent identifier, reverse-DNS in lower case, for example <code>com.example.courier</code>. It never changes between versions.',
    name: 'The name shops see, as a label: <code>{"en": "…", "ar": "…"}</code>. English is required; other languages are optional.',
    publisher: 'Who makes the connector, as shops will see it.',
    version: 'Your version, <code>major.minor.patch</code>. Shops are asked again only when a new version asks for more.',
    description: 'One or two sentences on what the connector does, as a label.',
    homepage: 'An https page about the connector, including your privacy policy.',
    domains: 'Every host the connector sends to or opens, lower case, no scheme. Each must be used by an action or event, and each is shown to the shop before it agrees.',
    secrets: 'Values the shop types in once and the device keeps in its own protected storage: API keys, tokens, signing keys. Never synced, never sent to Khayt Cloud.',
    fields: 'Fields the connector adds to a record, which the shop can fill in and the connector can send or fill from a reply.',
    actions: 'Buttons the connector adds beside an order or a customer.',
    events: 'Things that happen in the shop that the connector is told about, as they happen.',
    scopes: 'What the connector may do to the shop, beyond sending the fields it lists.',
    signature: 'Added by Khayt when a connector passes review: an ed25519 signature over the canonical JSON of everything else. Leave it out while you develop.',
  },
  scopes: {
    'orders.read': 'Read orders.',
    'customers.read': 'Read customers.',
    'fields.write': 'Fill in the connector’s own fields — and nothing else — for example a tracking number from a reply.',
    'jobs.status': 'Move a job to another status.',
  },
  events: {
    order_created: 'An order was created.',
    status_changed: 'An order’s status changed.',
    order_shipped: 'An order was marked shipped.',
    order_delivered: 'An order was marked delivered.',
    payment_received: 'A payment was recorded against an order.',
    quote_created: 'A quote was created.',
    quote_approved: 'A customer approved a quote.',
  },
  fieldTypes: { text: 'Free text.', number: 'A number.', bool: 'Yes or no.', enum: 'One of 1–30 <code>options</code>, each <code>{"value", "label"}</code>.', date: 'A calendar date.' },
  attach: { order: 'An order (job).', customer: 'A customer.', machine: 'A printer or other machine.', spool: 'A spool of filament.' },
  actionKinds: {
    post: 'Sends the listed fields to a URL on one of your domains, and can fill your own fields from the reply.',
    open: 'Opens a URL in the browser. It sends nothing else, and a secret can never appear in it.',
  },
  secretKinds: { apiKey: 'An API key.', token: 'An access token.', password: 'A password.', signingKey: 'A key the device signs requests with (<code>signWith</code>).', url: 'A private URL, for example one with a key in it.' },
  bodyFormats: {
    'khayt-v1': 'The default: a JSON object with the fields you listed in <code>send</code>.',
    'json-template': 'Your own JSON shape, up to 4 levels deep, with <code>{placeholders}</code> naming sendable fields.',
  },
  categories: {
    'purchase.history': 'Purchases › Purchase History',
    'contact.name': 'Contact Info › Name',
    'contact.phone': 'Contact Info › Phone Number',
    'contact.email': 'Contact Info › Email Address',
    'contact.address': 'Contact Info › Physical Address',
    'contact.other': 'Contact Info › Other User Contact Info',
    'content.other': 'User Content › Other User Content',
  },
  limits: {
    domains: 'hosts in <code>domains</code>', secrets: 'entries in <code>secrets</code>', fields: 'entries in <code>fields</code>',
    actions: 'entries in <code>actions</code>', events: 'entries in <code>events</code>', send: 'fields one action or event sends',
    label: 'characters in any label, and in <code>publisher</code>', description: 'characters in <code>description</code>', url: 'characters in a URL',
  },
};

// ---- Both directions --------------------------------------------------------
const problems = [];
function same(what, have, documented) {
  const h = new Set(have), d = new Set(Object.keys(documented));
  for (const k of h) if (!d.has(k)) problems.push(`${what}: "${k}" is in plugin-manifest.js but not documented`);
  for (const k of d) if (!h.has(k)) problems.push(`${what}: "${k}" is documented but plugin-manifest.js has no such thing`);
}
same('top-level key', M.TOP_KEYS, DOC.top);
same('scope', M.SCOPES, DOC.scopes);
same('event', M.EVENTS, DOC.events);
same('field type', M.FIELD_TYPES, DOC.fieldTypes);
same('attach', M.FIELD_ATTACH, DOC.attach);
same('action kind', M.ACTION_KINDS, DOC.actionKinds);
same('secret kind', M.SECRET_KINDS, DOC.secretKinds);
same('body format', M.BODY_FORMATS, DOC.bodyFormats);
same('limit', Object.keys(M.LIMITS), DOC.limits);
same('privacy category',
  [...new Set(Object.values(M.SENDABLE_FIELDS).map(f => f.category).concat(M.OWN_FIELD_CATEGORY))], DOC.categories);

const EXAMPLE_FILE = 'developers/examples/courier.json';
const example = JSON.parse(fs.readFileSync(path.join(ROOT, EXAMPLE_FILE), 'utf8'));
const verdict = M.validateManifest(example);
if (!verdict.ok) problems.push(`${EXAMPLE_FILE} is refused by validateManifest: ${verdict.errors.join('; ')}`);

if (problems.length) {
  console.error('make-dev-docs: the docs and plugin-manifest.js disagree:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ---- HTML -------------------------------------------------------------------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const code = s => `<code>${esc(s)}</code>`;
const required = new Set(M.manifestJsonSchema().required);

let tableN = 0;
function table(caption, head, rows) {
  const id = `ref-t${++tableN}`;
  return `<div class="ref-scroll" tabindex="0" role="region" aria-labelledby="${id}">
        <table class="ref-table">
          <caption id="${id}">${caption}</caption>
          <thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
          <tbody>
${rows.map(r => `            <tr><th scope="row">${r[0]}</th>${r.slice(1).map((c, i) => `<td data-label="${esc(head[i + 1])}">${c}</td>`).join('')}</tr>`).join('\n')}
          </tbody>
        </table>
      </div>`;
}
const enumTable = (caption, doc) => table(caption, ['Value', 'Meaning'], Object.entries(doc).map(([k, v]) => [code(k), v]));

const topRows = M.TOP_KEYS.map(k => [code(k), required.has(k) ? 'Required' : 'Optional', DOC.top[k]]);
const sendRows = Object.entries(M.SENDABLE_FIELDS).map(([k, f]) =>
  [code(k), f.from === 'order' ? 'The order' : 'The order’s customer', f.type, DOC.categories[f.category]]);
sendRows.push([code('field.<key>'), 'One of your own <code>fields</code>', 'its type', DOC.categories[M.OWN_FIELD_CATEGORY]]);
const placeRows = Object.entries(M.PLACEMENT_SOURCES).map(([p, src]) =>
  [code(p), src.map(s => code(s + '.*')).join(', ')]);
const limitRows = Object.entries(M.LIMITS).map(([k, n]) => [String(n), DOC.limits[k]]);
const consent = M.consentRows(example).map(r =>
  [code(r.host), r.fields.length ? r.fields.map(f => `${code(f.key)} <span class="ref-cat">${esc(DOC.categories[f.category] || f.category)}</span>`).join('<br>') : 'Nothing from the book: the shop is only sent there']);

const MAIN = `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">Khayt for developers</span>
    <h1>Connector manifest</h1>
    <p class="lede">A connector is a JSON file the app reads, not a program it runs. This page is every key that file can hold, generated from the app’s own rules.</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr"><strong>Draft.</strong> Connectors are not released yet, and this page may change before they are. The rules below are generated from <code>lib/plugin-manifest.js</code> at <a href="https://github.com/KhaytApp/Khayt/blob/${VENDOR_SHA}/lib/plugin-manifest.js">${VENDOR_SHA.slice(0, 9)}</a>, and the JSON Schema is at <a href="../../schemas/plugin-manifest-v1.json">/schemas/plugin-manifest-v1.json</a>.</p>

      <h2 id="shape">The file</h2>
      <p>A manifest is one JSON object. Keys the app does not know are refused, not ignored, so a typo fails loudly. Labels — <code>name</code>, a field’s or a button’s <code>label</code> — are objects keyed by language, <code>{"en": "Book pickup", "ar": "…"}</code>; English is required and is shown wherever a translation is missing.</p>
      ${table('Top-level keys', ['Key', 'Required', 'What it is'], topRows)}

      <h2 id="sendable">Fields a connector can send</h2>
      <p>A connector names what it sends from this list; it cannot ask for anything else. Each field is declared under a fixed privacy category, which the shop sees on the consent screen and which Apple’s App Privacy label for the iPhone app covers. You cannot choose the category.</p>
      ${table('Sendable fields', ['Name', 'Read from', 'Type', 'Privacy category'], sendRows)}
      <p>Which of them a button can reach depends on where it sits: a customer has no single order, so a button on a customer cannot send <code>order.*</code>.</p>
      ${table('Where a button can sit', ['Placement', 'Can send'], placeRows)}

      <h2 id="actions">Buttons (<code>actions</code>)</h2>
      ${enumTable('Kinds of button', DOC.actionKinds)}
      <p>A URL must start <code>https://</code> followed by one of your <code>domains</code>, written literally: a placeholder can appear in the path or query, never in the host, so a value from the book can never choose where data goes. A <code>post</code> button can authenticate with <code>auth</code> (a header filled from one of your <code>secrets</code>) and sign the request with <code>signWith</code>. Its <code>response</code> can copy values from your reply into your own fields — <code>{"fields": {"tracking": "data.trackingNumber"}}</code> — and only into fields on the same kind of record as the button.</p>
      ${enumTable('Body formats', DOC.bodyFormats)}

      <h2 id="events">Events (<code>events</code>)</h2>
      <p>Each entry names an event, the URL it is sent to, and the fields it sends, with the same <code>send</code>, <code>body</code>, <code>auth</code> and <code>signWith</code> as a button. Every event carries one order. The <a href="../events/">event reference</a> describes each payload.</p>
      ${enumTable('Events', DOC.events)}

      <h2 id="fields">Your own fields (<code>fields</code>)</h2>
      ${enumTable('Field types', DOC.fieldTypes)}
      ${enumTable('Records a field can be added to', DOC.attach)}

      <h2 id="secrets">Secrets (<code>secrets</code>)</h2>
      ${enumTable('Kinds of secret', DOC.secretKinds)}
      <p>A secret can be used in a <code>post</code> URL, an <code>auth</code> header or <code>signWith</code>. It can never be sent as a field, put in a body template, or appear in an <code>open</code> link, which a browser would keep in its history.</p>

      <h2 id="scopes">Scopes (<code>scopes</code>)</h2>
      ${enumTable('Scopes', DOC.scopes)}

      <h2 id="limits">Limits</h2>
      ${table('Limits', ['At most', 'Of'], limitRows)}

      <h2 id="consent">What the shop agrees to</h2>
      <p>Before a connector is switched on, the shop sees one row per host with the fields that go there. When a new version asks for another field, another host or another scope, the connector pauses on every device until the shop agrees again; asking for less never does. For the example below, the shop sees:</p>
      ${table('Consent screen for the example', ['Host', 'Fields sent there'], consent)}

      <h2 id="example">Example</h2>
      <p>A courier connector: a button that books a pickup and keeps the tracking number from the reply, a link to the tracking page, and an event when an order ships. It passes the app’s validator as written.</p>
      <pre class="ref-code"><code>${esc(JSON.stringify(example, null, 2))}</code></pre>

    </div>
   </div>
  </div>
</section>
`;

// ---- Page chrome, borrowed from /privacy/ so it never drifts ----------------
function page(rel, title, desc, main) {
  const src = fs.readFileSync(path.join(ROOT, 'privacy', 'index.html'), 'utf8');
  const head = src.slice(0, src.indexOf('<main id="top">'));
  const foot = src.slice(src.indexOf('</main>'));
  const depth = rel.split('/').length - 1;
  const up = '../'.repeat(depth);
  const url = `https://khaytapp.com/${rel.replace(/index\.html$/, '')}`;
  let h = head
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
    .replace(/<link rel="canonical"[^>]*>\n/, '')
    .replace(/<link rel="alternate" hreflang[^>]*>\n/g, '')
    .replace('<meta name="viewport"', '<meta name="robots" content="noindex">\n<meta name="viewport"')
    .replace(/<span hidden\s+data-page-title-en[\s\S]*?><\/span>\n/, '');
  const fixPaths = s => s.replace(/(href|src)="\.\.\//g, `$1="${up}`);
  return fixPaths(h) + '<main id="top">\n' + main + fixPaths(foot);
}

const OUT = {
  'developers/manifest/index.html': page('developers/manifest/index.html', 'Connector manifest — Khayt developers',
    'Every key a Khayt connector manifest can hold, generated from the app’s own rules.', MAIN),
};

let stale = 0;
for (const [rel, html] of Object.entries(OUT)) {
  const file = path.join(ROOT, rel);
  const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (now === html) { console.log(`${rel} is up to date`); continue; }
  if (CHECK) { console.error(`${rel} is stale: run node scripts/make-dev-docs.js`); stale++; continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`wrote ${rel}`);
}
if (stale) process.exit(1);
