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

      <h2 id="signing">Review and signing</h2>
      <p>A connector counts as reviewed only when its <code>signature</code> verifies — never because of a flag stored anywhere. Khayt signs a manifest it has reviewed with ed25519 over the UTF-8 bytes of its canonical JSON: every key sorted, no whitespace, <code>signature</code> itself left out. Any change to a signed manifest, even to a URL, breaks the signature and needs a new review. A signature verifies against any of these published keys, so the key can rotate without un-reviewing what was signed before:</p>
      ${table('Signing keys', ['Key id', 'Public key (raw ed25519, base64)'], M.SIGNING_KEYS.map(k => [code(k.id), code(k.key)]))}

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

// ---- /developers/events/ — what a connector is sent --------------------------
// The bodies are payloadFor() of the example manifest over a sample order, so
// they are the bytes the app builds; the signature headers are the app's own
// signatureHeaders() over those bytes. The delivery rules (retries, timeouts,
// X-Khayt-Delivery) live in the platforms' transports, not in lib/, so they
// are prose here — confirmed by the Mac lane, which the desktop matches.
const P = require(path.join(ROOT, 'developers', 'vendor', 'plugin-payload.js'));
const B = require(path.join(ROOT, 'developers', 'vendor', 'webhook-bus.js'));
const WS = require(path.join(ROOT, 'developers', 'vendor', 'webhook-send.js'));
const SAMPLE_SECRET = 'example-signing-key';
const SAMPLE_MS = Date.parse('2026-11-08T09:00:00Z');
const sampleCtx = {
  order: { id: 'ORD-1042', invoiceNumber: 'INV-2026-0107', project: 'Bracket set', status: 'completed', price: 180, currency: 'SAR',
    trackingNumber: '290012345678', plugins: { [example.id]: { service: 'express' } } },
  customer: { name: 'Sara A.', company: 'Najd Robotics', phone: '+966500000000', address: 'King Fahd Rd, Riyadh' },
};
function request(trigger, label) {
  const r = P.payloadFor(example, trigger, sampleCtx);
  if (!r.ok) { console.error(`make-dev-docs: payloadFor(${JSON.stringify(trigger)}) failed: ${r.error}`); process.exit(1); }
  const name = trigger.event || trigger.action;
  const lines = [`POST ${r.url}`, 'Content-Type: application/json', `X-Khayt-Event: ${name}`, 'X-Khayt-Delivery: dlv_<a lower-case UUID, the same on every retry>'];
  if (r.auth) lines.push(`${r.auth.header}: ${r.auth.scheme ? r.auth.scheme + ' ' : ''}<the shop’s ${r.auth.secret}>`);
  if (r.signWith) for (const [k, v] of Object.entries(WS.signatureHeaders(SAMPLE_SECRET, r.body, SAMPLE_MS))) lines.push(`${k}: ${v}`);
  return `<p>${label}</p>
      <pre class="ref-code"><code>${esc(lines.join('\n') + '\n\n' + r.body)}</code></pre>`;
}
const verifyNode = `const crypto = require('crypto');

// body: the raw request body, exactly as received (before any JSON parsing).
function verify(body, headers, signingKey) {
  const ts = headers['x-khayt-timestamp'];
  const v2 = headers['x-khayt-signature-v2'];
  if (!ts || !v2) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // refuse replays
  const want = crypto.createHmac('sha256', signingKey).update(ts + '.' + body).digest('hex');
  return v2.length === want.length &&
    crypto.timingSafeEqual(Buffer.from(v2), Buffer.from(want));
}`;
// The recipe above must accept the example it is printed beside.
{
  const body = '{"khayt":"plugin-payload-v1"}';
  const h = WS.signatureHeaders(SAMPLE_SECRET, body, Date.now());
  const verify = new Function('require', verifyNode + '\nreturn verify;')(require);
  if (!verify(body, { 'x-khayt-timestamp': h['X-Khayt-Timestamp'], 'x-khayt-signature-v2': h['X-Khayt-Signature-V2'] }, SAMPLE_SECRET)) {
    console.error('make-dev-docs: the printed verification recipe rejects a real signature'); process.exit(1);
  }
}

// The reply rules printed under "Your reply", checked against applyResponse.
{
  const m = { khayt: { manifest: 1 }, id: 'com.example.check', name: { en: 'Check' }, publisher: 'x', version: '1.0.0',
    domains: ['api.check.example.com'],
    fields: [
      { key: 'n', label: { en: 'n' }, type: 'number', attach: 'order' },
      { key: 'd', label: { en: 'd' }, type: 'date', attach: 'order' },
      { key: 't', label: { en: 't' }, type: 'text', attach: 'order' },
      { key: 'b', label: { en: 'b' }, type: 'bool', attach: 'order' },
      { key: 'e', label: { en: 'e' }, type: 'enum', attach: 'order', options: [{ value: 'a', label: { en: 'a' } }] },
    ],
    actions: [{ id: 'go', label: { en: 'Go' }, placement: 'order', kind: 'post', url: 'https://api.check.example.com/x',
      response: { fields: { n: 'n', d: 'd', t: 't', b: 'b', e: 'e' } } }],
    scopes: ['fields.write'] };
  const ok = M.validateManifest(m);
  const entry = { id: m.id, version: m.version, enabled: true, manifest: m, granted: M.grantFor(m) };
  const reply = { n: '2.5', d: '2026-11-08T09:00:00Z', t: 'x'.repeat(600), b: 'true', e: 'z' };
  const got = P.applyResponse(m, 'go', reply, entry);
  // …and nothing at all without fields.write granted, as the page says.
  const ungranted = P.applyResponse(m, 'go', reply, Object.assign({}, entry, { granted: Object.assign({}, entry.granted, { scopes: [] }) }));
  if (Object.keys(ungranted).length) { console.error('make-dev-docs: a reply filled fields without fields.write'); process.exit(1); }
  const want = { n: 2.5, d: '2026-11-08', t: 'x'.repeat(500) };
  if (!ok.ok || JSON.stringify(got) !== JSON.stringify(want)) {
    console.error('make-dev-docs: "Your reply" no longer matches applyResponse: ' + JSON.stringify(ok.errors || got)); process.exit(1);
  }
}

const EVENTS_MAIN = `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">Khayt for developers</span>
    <h1>Requests your connector receives</h1>
    <p class="lede">What Khayt sends when a shop presses one of your buttons or an event happens, how to check it came from that shop, and what Khayt does with your reply.</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr"><strong>Draft.</strong> Connectors are not released yet, and this page may change before they are. The requests below are built by the app’s own code (<code>lib/plugin-payload.js</code> at ${VENDOR_SHA.slice(0, 9)}) from the <a href="../manifest/#example">example manifest</a>.</p>

      <h2 id="body">The body</h2>
      <p>Unless a trigger sets <code>body.format</code> to <code>json-template</code>, Khayt sends a <code>${esc(P.PAYLOAD_VERSION)}</code> object: your connector’s id and version, which button or event caused it, and under <code>data</code> exactly the fields the trigger lists in <code>send</code>, keyed by their names. A field with no value is <code>null</code>. Keys are sorted, and the body is sent as compact JSON, the same bytes from a Mac, a PC or an iPhone.</p>
      ${request({ event: 'order_shipped' }, 'An <code>order_shipped</code> event, with <code>signWith</code>:')}
      ${request({ action: 'book' }, 'The <code>book</code> button, with an <code>auth</code> header and no signature:')}

      <p>The bodies above are shown exactly as sent, on one line: the signatures are over these bytes, so you can check the recipe below against them with the key <code>${SAMPLE_SECRET}</code>.</p>

      <h2 id="headers">Headers</h2>
      ${table('Headers on every request', ['Header', 'When', 'Value'], [
        [code('Content-Type'), 'Always', code('application/json')],
        [code('X-Khayt-Event'), 'Always', 'The event name, or the button’s <code>id</code>.'],
        [code('X-Khayt-Delivery'), 'Always', '<code>dlv_</code> and a lower-case UUID: one per button press or event. A retry sends the same id, so you can ignore one you have already handled.'],
        ['Your <code>auth.header</code>', 'If the trigger has <code>auth</code>', 'Its <code>scheme</code>, a space, and the secret the shop typed in — or just the secret when the trigger sets no <code>scheme</code>.'],
        [code('X-Khayt-Timestamp'), 'If the trigger has <code>signWith</code>', 'Unix time in seconds.'],
        [code('X-Khayt-Signature'), 'If the trigger has <code>signWith</code>', 'HMAC-SHA256 of the body under the signing key, lowercase hex, no prefix.'],
        [code('X-Khayt-Signature-V2'), 'If the trigger has <code>signWith</code>', 'HMAC-SHA256 of <code>&lt;timestamp&gt;.&lt;body&gt;</code>, lowercase hex. Check this one: it also lets you refuse a replay.'],
      ])}

      <h2 id="verify">Checking a signature</h2>
      <p>Compute the HMAC over the raw bytes you received, not over JSON you parsed and wrote out again. This recipe is run against a real signature from the app every time this page is built.</p>
      <pre class="ref-code"><code>${esc(verifyNode)}</code></pre>

      <h2 id="delivery">Delivery</h2>
      <ul>
        <li><strong>Events</strong> are tried up to ${B.MAX_ATTEMPTS} times — at once, then after 30 seconds, 2 minutes, 10 minutes and 1 hour — until you answer with any 2xx. <code>410 Gone</code> stops the retries and switches that event off for the shop.</li>
        <li><strong>Buttons</strong> are never retried: a person pressed it and sees the result. Any 2xx is success. Anything else, a timeout (15 seconds) or a redirect (never followed) shows the shop “<em>your connector’s name</em> answered <em>status</em>” or “could not be reached”, and nothing is written.</li>
        <li>Requests go only over https, only to a host in your <code>domains</code>, and never to a private or local address.</li>
      </ul>

      <h2 id="response">Your reply</h2>
      <p>If a button declares <code>response</code>, answer with JSON of up to 64 KB. Each path it names is read from your reply and written to your connector’s own field on that record, after a check against the field’s type: a number may arrive as numeric text (<code>"2.5"</code>), a date as a full date-time (the date part is kept), and text is cut to 500 characters; a yes/no field takes only <code>true</code> or <code>false</code>, a choice only one of its option values, and anything else of the wrong type is dropped. This needs the <code>fields.write</code> scope. A reply that is not JSON, or too large, still counts as success; nothing is filled in.</p>

    </div>
   </div>
  </div>
</section>
`;

// ---- /developers/webhooks/ — the shop's own webhooks -----------------------
const BUS_DOC = {
  order_created: 'An order was created.',
  status_changed: 'An order moved to another status.',
  order_shipped: 'An order was marked shipped.',
  order_delivered: 'An order was handed over. Delivered is a date on a completed job, not a status, so there is none in the payload.',
  payment_received: 'A payment was recorded.',
  quote_created: 'A quote was created.',
  quote_approved: 'A customer approved a quote.',
  low_stock: 'A material fell below its reorder level.',
  printer_alert: 'A printer reported an error or stopped.',
  intake_submitted: 'A customer sent a request through the intake form.',
  qc_failed: 'A job failed inspection.',
  rma_opened: 'A customer reported a problem with a delivered job (desktop only).',
};
same('webhook event', B.EVENTS, BUS_DOC);
if (problems.length) { console.error('make-dev-docs:\n  ' + problems.join('\n  ')); process.exit(1); }
const CAT = B.eventCatalogue();
const busRows = CAT.events.map(e => [code(e.event), BUS_DOC[e.event],
  e.sent ? e.fields.map(f => `${code(f.key)} <span class="ref-cat">${esc(f.type)}</span>`).join('<br>') : '<em>Listed, not sent yet</em>']);
const firstSent = CAT.events.find(e => e.sent);
// The catalogue's own `wire` example: the exact object the sender signs and
// posts, so the page cannot show a body the app does not build.
for (const e of [firstSent, CAT.orderEnvelope[0]]) {
  if (!e.wire || e.wire.event !== e.event || typeof e.wire.timestamp !== 'number') {
    console.error(`make-dev-docs: eventCatalogue() has no usable wire example for ${e.event}`); process.exit(1);
  }
}
const busWire = JSON.stringify(firstSent.wire);
const envWire = JSON.stringify(CAT.orderEnvelope[0].wire);
const busAt = firstSent.wire.timestamp, envAt = CAT.orderEnvelope[0].wire.timestamp;
const wireBlock = (event, wire, at) => {
  const h = WS.signatureHeaders(SAMPLE_SECRET, wire, at);
  return `<pre class="ref-code"><code>${esc(['Content-Type: application/json', `X-Khayt-Event: ${event}`, ...Object.entries(h).map(([k, v]) => `${k}: ${v}`)].join('\n') + '\n\n' + wire)}</code></pre>`;
};

const WEBHOOKS_MAIN = `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">Khayt for developers</span>
    <h1>Shop webhooks</h1>
    <p class="lede">A shop can send its own events to any https address it sets in Settings — a Zapier or Make hook, or your own server. This is what arrives.</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr"><strong>Not a connector.</strong> These are addresses a shop types in itself, with no manifest and no review. A connector is sent <a href="../events/">a different body</a>. Everything below is generated from <code>lib/webhook-bus.js</code> at ${VENDOR_SHA.slice(0, 9)}.</p>

      <h2 id="events">Events</h2>
      ${table('Webhook events', ['Event', 'When', 'Payload'], busRows)}

      <h2 id="body">The body</h2>
      <p>The request body is an outer object — <code>event</code>, <code>payload</code> and <code>timestamp</code> in milliseconds — with the delivery inside <code>payload</code>. The delivery’s <code>id</code> stays the same on every retry and on a resend from the delivery log, so you can ignore one you have already handled.</p>
      ${wireBlock(firstSent.event, busWire, busAt)}
      ${CAT.orderEnvelope[0].example ? `<p>The older single-address <em>event webhook</em> (Settings: one URL with a switch for created, status and paid) sends the same moments in its own envelope, which its existing receivers expect byte for byte:</p>
      ${wireBlock(CAT.orderEnvelope[0].event, envWire, envAt)}` : ''}

      <h2 id="verify">Checking a signature</h2>
      <p>When the shop has set a signing secret, three headers are added: <code>X-Khayt-Signature</code> (HMAC-SHA256 of the body, lowercase hex, no prefix), <code>X-Khayt-Timestamp</code> (Unix seconds) and <code>X-Khayt-Signature-V2</code> (HMAC-SHA256 of <code>&lt;timestamp&gt;.&lt;body&gt;</code>). With no secret, none of them is sent. Check V2 with the <a href="../events/#verify">same recipe</a> connectors use.</p>

      <h2 id="delivery">Delivery</h2>
      <p>Up to ${B.MAX_ATTEMPTS} attempts — at once, then after 30 seconds, 2 minutes, 10 minutes and 1 hour — until a 2xx. <code>410 Gone</code> stops the retries and switches the subscription off. Retries wait on the shop’s computer and survive a restart, so they are only sent while it is on.</p>

    </div>
   </div>
  </div>
</section>
`;

// ---- /developers/samples/ — the signed sample connectors -------------------
// Each sample must pass validateManifest AND verify against a published
// SIGNING_KEYS entry, the same check the apps make, or the build fails.
const crypto = require('crypto');
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
function signedBy(m) {
  if (typeof m.signature !== 'string') return null;
  const msg = Buffer.from(M.canonicalJSON(m), 'utf8');
  const sig = Buffer.from(m.signature, 'base64');
  const hit = M.SIGNING_KEYS.find(k => crypto.verify(null, msg,
    crypto.createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(k.key, 'base64')]), format: 'der', type: 'spki' }), sig));
  return hit ? hit.id : null;
}
const SAMPLE_DIR = path.join(ROOT, 'developers', 'samples');
const samples = fs.readdirSync(SAMPLE_DIR).filter(f => f.endsWith('.json')).sort().map(f => {
  const m = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, f), 'utf8'));
  const v = M.validateManifest(m);
  if (!v.ok) { console.error(`make-dev-docs: developers/samples/${f} is refused: ${v.errors.join('; ')}`); process.exit(1); }
  const key = signedBy(m);
  if (!key) { console.error(`make-dev-docs: developers/samples/${f} is not signed by a published key`); process.exit(1); }
  return { f, m, key };
});
if (!samples.length) { console.error('make-dev-docs: no samples in developers/samples/'); process.exit(1); }
function sampleSection({ f, m, key }) {
  const ctx = Object.assign({}, sampleCtx, { secrets: Object.fromEntries((m.secrets || []).map(x => [x.name, 'YOUR-' + x.name.toUpperCase()])) });
  const first = (m.events || [])[0] ? { event: m.events[0].event } : { action: m.actions[0].id };
  const r = P.payloadFor(m, first, ctx);
  if (!r.ok) { console.error(`make-dev-docs: ${f}: payloadFor failed: ${r.error}`); process.exit(1); }
  const consentRows = M.consentRows(m).map(row => [code(row.host),
    row.fields.length ? row.fields.map(x => `${code(x.key)} <span class="ref-cat">${esc(DOC.categories[x.category] || x.category)}</span>`).join('<br>') : 'Nothing from the book']);
  const triggers = [...(m.events || []).map(e => `the ${code(e.event)} event`), ...(m.actions || []).map(a => `a ${code(a.id)} button`)];
  return `
      <h2 id="${esc(m.id.split('.').pop())}">${esc(m.name.en)}</h2>
      <p>${esc((m.description && m.description.en) || '')} It reacts to ${triggers.join(' and ')}. File: <a href="https://github.com/KhaytApp/Khayt/blob/${VENDOR_SHA}/plugins/samples/${esc(f)}">plugins/samples/${esc(f)}</a>, signed with <code>${esc(key)}</code>.</p>
      ${table(`What ${esc(m.name.en)} sends`, ['Host', 'Fields'], consentRows)}
      <p>The request for ${triggers[0]}, for a sample order:</p>
      <pre class="ref-code"><code>${esc(`POST ${r.url}\nContent-Type: application/json\n\n${r.body}`)}</code></pre>`;
}
const SAMPLES_MAIN = `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">Khayt for developers</span>
    <h1>Sample connectors</h1>
    <p class="lede">Connectors Khayt has written, reviewed and signed. Copy one as the start of your own.</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr"><strong>Draft.</strong> Connectors are not released yet. Each sample below is checked when this page is built: it passes the app’s validator and its signature verifies against a <a href="../manifest/#signing">published key</a>. The requests are built by the app’s own code. Secrets in a URL are shown as <code>YOUR-…</code>.</p>
${samples.map(sampleSection).join('\n')}

      <p>A copy you change is no longer signed: load it in developer mode on the Mac while you work on it, then send it for review.</p>

    </div>
   </div>
  </div>
</section>
`;

const OUT = {
  'developers/manifest/index.html': page('developers/manifest/index.html', 'Connector manifest — Khayt developers',
    'Every key a Khayt connector manifest can hold, generated from the app’s own rules.', MAIN),
  'developers/events/index.html': page('developers/events/index.html', 'Connector requests — Khayt developers',
    'What a Khayt connector is sent, how to verify it, and what Khayt does with the reply.', EVENTS_MAIN),
  'developers/samples/index.html': page('developers/samples/index.html', 'Sample connectors — Khayt developers',
    'Signed sample Khayt connectors to start your own from.', SAMPLES_MAIN),
  'developers/webhooks/index.html': page('developers/webhooks/index.html', 'Shop webhooks — Khayt developers',
    'The events a Khayt shop can send to its own https address, and how to verify them.', WEBHOOKS_MAIN),
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
