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
    settings: 'Values the shop fills in when it sets the connector up — a sender’s name, an account number — which the connector can send as <code>config.&lt;key&gt;</code>.',
    fields: 'Fields the connector adds to a record, which the shop can fill in and the connector can send or fill from a reply.',
    actions: 'Buttons the connector adds beside an order or a customer.',
    events: 'Things that happen in the shop that the connector is told about, as they happen.',
    refresh: 'At most one: a regular check with your service for news on open jobs your connector already handles, such as delivery status.',
    scopes: 'What the connector may change in the shop. In this version that is only its own fields.',
    signature: 'Added by Khayt when a connector passes review: an ed25519 signature over the canonical JSON of everything else. Leave it out while you develop.',
  },
  scopes: {
    'fields.write': 'Fill in the connector’s own fields — and nothing else — for example a tracking number from a reply. Required by any button with a <code>response</code>.',
  },
  // Names kept for the Cloud relay: the validator refuses them until it ships.
  reservedScopes: {
    'orders.read': 'Reading the shop’s orders.',
    'customers.read': 'Reading the shop’s customers.',
    'jobs.status': 'Moving a job to another status.',
  },
  settingTypes: { text: 'Free text, up to the setting value limit.', number: 'A number.', bool: 'Yes or no.', enum: 'One of 1–30 <code>options</code>, each <code>{"value", "label"}</code>.' },
  settingKinds: {
    name: 'A person’s or business’s name.', phone: 'A phone number.', email: 'An email address.',
    address: 'A postal address.', text: 'Anything else. The default when <code>kind</code> is left out.',
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
    'json-template': 'Your own JSON shape, up to 4 levels deep, with <code>{placeholders}</code> naming sendable fields or <a href="#time">the time</a>.',
  },
  authEncodings: {
    basic: 'HTTP Basic: the secret, as <code>user:password</code>, in base64 of its UTF-8 bytes, after the scheme <code>Basic</code> unless you name another. A secret with no colon is taken as the user name with an empty password, so a colon is added — the form a payment provider’s secret key usually takes.',
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
    settings: 'entries in <code>settings</code>', settingValue: 'characters in a text setting’s value',
  },
};

// The same prose in Arabic, for the /ar/developers/ copies. Held to the module
// exactly as DOC is (below), so neither language can document a different
// contract. Terms follow the app's own Arabic (renderer/locales/ar.js "plg.*"):
// موصل connector, دفتر the shop's book, عمل a job, حقول fields.
const DOC_AR = {
  top: {
    khayt: 'دائماً <code>{"manifest": 1}</code>. يخبر التطبيق بإصدار القواعد الذي كُتب الملف وفقه.',
    id: 'المعرّف الدائم لموصلك، بصيغة DNS معكوسة وبأحرف صغيرة، مثل <code>com.example.courier</code>. لا يتغير بين الإصدارات.',
    name: 'الاسم الذي تراه المطابع، كتسمية: <code>{"en": "…", "ar": "…"}</code>. الإنجليزية مطلوبة وباقي اللغات اختيارية.',
    publisher: 'صانع الموصل كما ستراه المطابع.',
    version: 'إصدارك بصيغة <code>major.minor.patch</code>. لا تُسأل المطبعة من جديد إلا حين يطلب إصدار جديد أكثر مما سبق.',
    description: 'جملة أو جملتان عمّا يفعله الموصل، كتسمية.',
    homepage: 'صفحة https عن الموصل، تتضمن سياسة الخصوصية لديك.',
    domains: 'كل مضيف يرسل إليه الموصل أو يفتحه، بأحرف صغيرة ودون بروتوكول. يجب أن يستخدم كلَّ واحد منها زرٌّ أو حدث، ويُعرض كلٌّ منها على المطبعة قبل أن توافق.',
    secrets: 'قيم تكتبها المطبعة مرة واحدة ويحفظها الجهاز في مخزنه المحمي: مفاتيح API ورموز الوصول ومفاتيح التوقيع. لا تُزامَن أبداً ولا تُرسل إلى سحابة خيط.',
    settings: 'قيم تعبّئها المطبعة عند إعداد الموصل — اسم المرسل أو رقم الحساب — ويمكن للموصل إرسالها بصيغة <code>config.&lt;key&gt;</code>.',
    fields: 'حقول يضيفها الموصل إلى سجلّ، تعبّئها المطبعة ويمكن للموصل إرسالها أو تعبئتها من الرد.',
    actions: 'أزرار يضيفها الموصل بجانب طلب أو عميل.',
    events: 'أمور تحدث في المطبعة يُبلَّغ بها الموصل لحظة حدوثها.',
    refresh: 'واحد على الأكثر: سؤال منتظم لخدمتك عن مستجدات الأعمال المفتوحة التي يتولاها موصلك، مثل حالة التوصيل.',
    scopes: 'ما يحق للموصل تغييره في المطبعة. وهو في هذا الإصدار حقوله الخاصة فقط.',
    signature: 'تضيفه خيط حين يجتاز الموصل المراجعة: توقيع ed25519 على JSON القانوني لكل ما عداه. اتركه أثناء التطوير.',
  },
  scopes: {
    'fields.write': 'تعبئة حقول الموصل الخاصة — ولا شيء غيرها — كرقم تتبّع من الرد. يحتاجها أي زر له <code>response</code>.',
  },
  reservedScopes: {
    'orders.read': 'قراءة طلبات المطبعة.',
    'customers.read': 'قراءة عملاء المطبعة.',
    'jobs.status': 'نقل عمل إلى حالة أخرى.',
  },
  settingTypes: { text: 'نص حر، حتى حدّ قيمة الإعداد.', number: 'رقم.', bool: 'نعم أو لا.', enum: 'واحد من 1 إلى 30 خياراً في <code>options</code>، كلٌّ منها <code>{"value", "label"}</code>.' },
  settingKinds: {
    name: 'اسم شخص أو منشأة.', phone: 'رقم هاتف.', email: 'عنوان بريد إلكتروني.',
    address: 'عنوان بريدي.', text: 'أي شيء آخر. هو الافتراضي حين لا يُذكر <code>kind</code>.',
  },
  events: {
    order_created: 'أُنشئ طلب.',
    status_changed: 'تغيّرت حالة طلب.',
    order_shipped: 'عُلِّم طلب بأنه شُحن.',
    order_delivered: 'عُلِّم طلب بأنه سُلِّم.',
    payment_received: 'سُجّلت دفعة على طلب.',
    quote_created: 'أُنشئ عرض سعر.',
    quote_approved: 'وافق عميل على عرض سعر.',
  },
  fieldTypes: { text: 'نص حر.', number: 'رقم.', bool: 'نعم أو لا.', enum: 'واحد من 1 إلى 30 خياراً في <code>options</code>، كلٌّ منها <code>{"value", "label"}</code>.', date: 'تاريخ في التقويم.' },
  attach: { order: 'طلب (عمل).', customer: 'عميل.', machine: 'طابعة أو آلة أخرى.', spool: 'بكرة خيوط طباعة.' },
  actionKinds: {
    post: 'يرسل الحقول المذكورة إلى رابط على أحد نطاقاتك، ويمكنه تعبئة حقولك الخاصة من الرد.',
    open: 'يفتح رابطاً في المتصفح. لا يرسل شيئاً غيره، ولا يمكن أن يظهر فيه سرّ.',
  },
  secretKinds: { apiKey: 'مفتاح API.', token: 'رمز وصول.', password: 'كلمة مرور.', signingKey: 'مفتاح يوقّع به الجهاز الطلبات (<code>signWith</code>).', url: 'رابط خاص، كرابط يحمل مفتاحاً.' },
  bodyFormats: {
    'khayt-v1': 'الافتراضي: كائن JSON فيه الحقول التي ذكرتها في <code>send</code>.',
    'json-template': 'شكل JSON خاص بك، بعمق 4 مستويات على الأكثر، فيه <code>{placeholders}</code> تسمّي حقولاً قابلة للإرسال أو <a href="#time">الوقت</a>.',
  },
  authEncodings: {
    basic: 'مصادقة HTTP Basic: السرّ بصيغة <code>user:password</code>، مرمّزاً بـ base64 من بايتات UTF-8، بعد المخطط <code>Basic</code> ما لم تسمِّ غيره. السرّ الذي لا نقطتين فيه يُعدّ اسم مستخدم بكلمة مرور فارغة، فتُضاف النقطتان — وهو الشكل الذي يأخذه عادةً المفتاح السري لمزوّد الدفع.',
  },
  categories: {
    'purchase.history': 'المشتريات › سجل الشراء',
    'contact.name': 'معلومات التواصل › الاسم',
    'contact.phone': 'معلومات التواصل › رقم الهاتف',
    'contact.email': 'معلومات التواصل › البريد الإلكتروني',
    'contact.address': 'معلومات التواصل › العنوان',
    'contact.other': 'معلومات التواصل › بيانات تواصل أخرى',
    'content.other': 'محتوى المستخدم › محتوى آخر',
  },
  limits: {
    domains: 'مضيفاً في <code>domains</code>', secrets: 'مدخلاً في <code>secrets</code>', fields: 'مدخلاً في <code>fields</code>',
    actions: 'مدخلاً في <code>actions</code>', events: 'مدخلاً في <code>events</code>', send: 'حقلاً يرسله زر أو حدث واحد',
    label: 'حرفاً في أي تسمية، وفي <code>publisher</code>', description: 'حرفاً في <code>description</code>', url: 'حرفاً في الرابط',
    settings: 'مدخلاً في <code>settings</code>', settingValue: 'حرفاً في قيمة إعداد نصي',
  },
};

// ---- Both directions --------------------------------------------------------
const problems = [];
function same(what, have, documented) {
  const h = new Set(have), d = new Set(Object.keys(documented));
  for (const k of h) if (!d.has(k)) problems.push(`${what}: "${k}" is in plugin-manifest.js but not documented`);
  for (const k of d) if (!h.has(k)) problems.push(`${what}: "${k}" is documented but plugin-manifest.js has no such thing`);
}
same('refresh method', M.REFRESH_METHODS, { GET: 1, POST: 1 });
same('refresh limit', Object.keys(M.REFRESH), { minEvery: 1, maxEvery: 1, jobsPerRun: 1 });
for (const [L, D] of [['', DOC], ['Arabic ', DOC_AR]]) {
  same(L + 'top-level key', M.TOP_KEYS, D.top);
  same(L + 'scope', M.SCOPES, D.scopes);
  same(L + 'reserved scope', M.RESERVED_SCOPES, D.reservedScopes);
  same(L + 'setting type', M.SETTING_TYPES, D.settingTypes);
  same(L + 'setting kind', Object.keys(M.SETTING_KINDS), D.settingKinds);
  same(L + 'event', M.EVENTS, D.events);
  same(L + 'field type', M.FIELD_TYPES, D.fieldTypes);
  same(L + 'attach', M.FIELD_ATTACH, D.attach);
  same(L + 'action kind', M.ACTION_KINDS, D.actionKinds);
  same(L + 'secret kind', M.SECRET_KINDS, D.secretKinds);
  same(L + 'body format', M.BODY_FORMATS, D.bodyFormats);
  same(L + 'auth encoding', M.AUTH_ENCODINGS, D.authEncodings);
  same(L + 'limit', Object.keys(M.LIMITS), D.limits);
  same(L + 'privacy category',
    [...new Set(Object.values(M.SENDABLE_FIELDS).map(f => f.category).concat(M.OWN_FIELD_CATEGORY, Object.values(M.SETTING_KINDS)))], D.categories);
}
// A reserved scope must be refused, with the reason, not merely absent.
for (const sc of M.RESERVED_SCOPES) {
  const v = M.validateManifest(Object.assign({}, JSON.parse(fs.readFileSync(path.join(ROOT, 'developers/examples/courier.json'), 'utf8')), { scopes: ['fields.write', sc] }));
  if (v.ok || !v.errors.some(e => e.includes('Cloud relay'))) problems.push(`reserved scope "${sc}" is not refused as reserved`);
}

const EXAMPLE_FILE = 'developers/examples/courier.json';
const example = JSON.parse(fs.readFileSync(path.join(ROOT, EXAMPLE_FILE), 'utf8'));
const verdict = M.validateManifest(example);
if (!verdict.ok) problems.push(`${EXAMPLE_FILE} is refused by validateManifest: ${verdict.errors.join('; ')}`);

{ // The Time, Amount due and auth "encode" sections, checked against payloadFor.
  const PAY = require(path.join(ROOT, 'developers', 'vendor', 'plugin-payload.js'));
  const m = JSON.parse(JSON.stringify(example));
  const book = m.actions.find(a => a.kind === 'post');
  book.send = ['order.amountDue', 'order.amountDueMinor', 'order.amountDueCurrency', 'now.epochMs', `now.plusDays.${M.NOW_MAX_DAYS}.epochMs`];
  book.auth = { header: 'Authorization', secret: book.auth.secret, encode: 'basic' };
  delete book.response;
  const v = M.validateManifest(m);
  if (!v.ok) problems.push(`the Time/Amount due sections: a manifest using them is refused: ${v.errors.join('; ')}`);
  if (M.validateManifest(Object.assign({}, m, { actions: [Object.assign({}, book, { send: [`now.plusDays.${M.NOW_MAX_DAYS + 1}.epochMs`] })] })).ok) problems.push(`the Time section says ${M.NOW_MAX_DAYS} days at most; validateManifest takes more`);
  if (M.permissionsOf && JSON.stringify(M.permissionsOf(m)).includes('now.')) problems.push('the Time section says the time is not shop data; permissionsOf lists it');
  const t0 = Date.parse('2026-11-08T09:00:00Z');
  const ctx = { order: { id: 'o', price: 1.5, currency: 'KWD', plugins: {} }, customer: {}, settings: {}, nowMs: t0 };
  const r = PAY.payloadFor(m, { action: book.id }, ctx);
  const d = r.ok && JSON.parse(r.body).data;
  if (!d || d['order.amountDue'] !== 1.5 || d['order.amountDueMinor'] !== 1500) problems.push('the Amount due section says 1.5 KWD is 1500 minor units; payloadFor disagrees');
  if (!d || d['order.amountDueCurrency'] !== 'KWD') problems.push('the Amount due section says amountDueCurrency is the job’s currency; payloadFor disagrees');
  { // "the job’s own currency, else its customer’s, else the shop’s"
    const cur = (order, customer) => { const x = PAY.payloadFor(m, { action: book.id }, Object.assign({}, ctx, { order: Object.assign({ id: 'o', price: 10, plugins: {} }, order), customer, settings: { currency: 'SAR' } })); return x.ok && JSON.parse(x.body).data['order.amountDueCurrency']; };
    if (cur({ currency: 'USD', clientId: 'c1' }, { id: 'c1', currency: 'KWD' }) !== 'USD' || cur({ clientId: 'c1' }, { id: 'c1', currency: 'KWD' }) !== 'KWD' || cur({}, {}) !== 'SAR')
      problems.push('the Amount due section’s currency order (job, customer, shop) no longer matches payloadFor');
  }
  if (!d || d['now.epochMs'] !== t0 || d[`now.plusDays.${M.NOW_MAX_DAYS}.epochMs`] !== t0 + M.NOW_MAX_DAYS * 86400000) problems.push('the Time section’s arithmetic no longer matches payloadFor');
  const later = PAY.payloadFor(m, { action: book.id }, Object.assign({}, ctx, { nowMs: t0 + 1000 }));
  if (!later.ok || later.body === r.body) problems.push('the Time section says a retry’s body differs; payloadFor builds the same bytes');
  if (PAY.payloadFor(m, { action: book.id }, Object.assign({}, ctx, { nowMs: undefined })).ok) problems.push('the Time section says nothing is sent without a clock');
  if (PAY.payloadFor(m, { action: book.id }, Object.assign({}, ctx, { settings: undefined })).ok) problems.push('the Amount due section says nothing is sent without the shop settings');
  const jpy = PAY.payloadFor(m, { action: book.id }, Object.assign({}, ctx, { order: { id: 'o', price: 1200, currency: 'JPY', plugins: {} } }));
  if (!jpy.ok || JSON.parse(jpy.body).data['order.amountDueMinor'] !== 1200) problems.push('the Amount due section says JPY has no minor unit; payloadFor disagrees');
  const b64 = x => Buffer.from(x, 'utf8').toString('base64');
  if (!r.ok || r.auth.scheme !== 'Basic' || PAY.authHeaderValue(r.auth, 'sk_test_1') !== 'Basic ' + b64('sk_test_1:')
      || PAY.authHeaderValue(r.auth, 'user:pässword') !== 'Basic ' + b64('user:pässword')) problems.push('the auth "encode" description no longer matches authHeaderValue');
}

// "Open job", as the Refresh section words it, checked against the app's own test.
const H = require(path.join(ROOT, 'developers', 'vendor', 'plugin-host.js'));
for (const [job, open] of [
  [{ id: 'a', status: 'printing' }, true], [{ id: 'a', status: 'completed' }, true],
  [{ id: 'a', status: 'cancelled' }, false], [{ id: 'a', status: 'completed', deliveredAt: '2026-11-08' }, false],
  [{ id: 'a', status: 'delivered' }, false], [{ id: 'a', status: 'printing', archived: true }, false],
  [{ id: 'a', status: 'printing', voidedAt: '2026-11-08' }, false],
]) if (H.isOpenJob(job) !== open) problems.push(`the Refresh section says ${JSON.stringify(job)} is ${open ? '' : 'not '}open; isOpenJob disagrees`);
if (!example.refresh || !M.refreshConsent(example, 'en')) problems.push(`${EXAMPLE_FILE} should show a refresh`);
{ // "Adding a refresh, or shortening its every, pauses the connector until the shop agrees again."
  const without = Object.assign({}, example); delete without.refresh;
  const faster = Object.assign({}, example, { refresh: Object.assign({}, example.refresh, { every: example.refresh.every - 15 }) });
  const slower = Object.assign({}, example, { refresh: Object.assign({}, example.refresh, { every: example.refresh.every + 15 }) });
  const widens = (from, to) => M.diffPermissions(M.grantFor(from), to).widened;
  if (!widens(without, example) || !widens(example, faster) || widens(example, slower)) problems.push('the Refresh section’s re-consent rule no longer matches diffPermissions');
}

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
// Each page is a function of its language: lang 'en' writes /developers/…,
// 'ar' the hidden Arabic copy at /ar/developers/…. `t(en, ar)` picks the
// sentence; everything the module decides (names, numbers, examples, keys) is
// shared, so the two copies differ only in their prose.
const tFor = lang => (en, ar) => (lang === 'ar' ? ar : en);
const DOC_FOR = { en: DOC, ar: DOC_AR };
const enumTable = (lang, caption, doc) => table(caption, lang === 'ar' ? ['القيمة', 'المعنى'] : ['Value', 'Meaning'], Object.entries(doc).map(([k, v]) => [code(k), v]));

function mainPage(lang) {
const t = tFor(lang), D = DOC_FOR[lang];
const topRows = M.TOP_KEYS.map(k => [code(k), required.has(k) ? t('Required', 'مطلوب') : t('Optional', 'اختياري'), D.top[k]]);
const sendRows = Object.entries(M.SENDABLE_FIELDS).map(([k, f]) =>
  [code(k), f.from === 'order' ? t('The order', 'الطلب') : t('The order’s customer', 'عميل الطلب'), f.type, D.categories[f.category]]);
sendRows.push([code('field.<key>'), t('One of your own <code>fields</code>', 'أحد حقولك الخاصة في <code>fields</code>'), t('its type', 'نوعه'), D.categories[M.OWN_FIELD_CATEGORY]]);
sendRows.push([code('config.<key>'), t('One of your <code>settings</code>', 'أحد إعداداتك في <code>settings</code>'), t('its type', 'نوعه'), t('Set by its <code>kind</code> (<a href="#settings">below</a>)', 'يحدّدها <code>kind</code> (<a href="#settings">أدناه</a>)')]);
const placeRows = Object.entries(M.PLACEMENT_SOURCES).map(([p, src]) =>
  [code(p), src.map(s => code(s + '.*')).join(', ')]);
const limitRows = Object.entries(M.LIMITS).map(([k, n]) => [String(n), D.limits[k]]);
const consent = M.consentRows(example).map(r =>
  [code(r.host), r.fields.length ? r.fields.map(f => `${code(f.key)} <span class="ref-cat">${esc(D.categories[f.category] || f.category)}</span>`).join('<br>') : t('Nothing from the book: the shop is only sent there', 'لا شيء من الدفتر: تُنقل المطبعة إلى هناك فقط')]);
const rc = M.refreshConsent(example, lang);
const refreshLine = t(`Every ${rc.every} min, while this computer has your book open, it checks ${esc(rc.host)} for updates on open jobs that have “${esc(rc.fieldLabel)}”, and fills in its own fields from the reply.`,
  `كل ${rc.every} دقيقة، ما دام هذا الحاسوب يفتح دفترك، يتحقق من ${esc(rc.host)} من تحديثات الأعمال المفتوحة التي فيها «${esc(rc.fieldLabel)}»، ويملأ حقوله الخاصة من الرد.`);
return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Khayt for developers', 'خيط للمطوّرين')}</span>
    <h1>${t('Connector manifest', 'ملف تعريف الموصل')}</h1>
    <p class="lede">${t('A connector is a JSON file the app reads, not a program it runs. This page is every key that file can hold, generated from the app’s own rules.',
      'الموصل ملف JSON يقرؤه التطبيق، وليس برنامجاً يشغّله. في هذه الصفحة كل مفتاح يمكن أن يحمله هذا الملف، مولَّدةً من قواعد التطبيق نفسه.')}</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr">${t('<strong>Draft.</strong> Connectors are not released yet, and this page may change before they are.', '<strong>مسودة.</strong> الموصلات لم تصدر بعد، وقد تتغير هذه الصفحة قبل صدورها.')}</p>

      <h2 id="shape">${t('The file', 'الملف')}</h2>
      <p>${t('A manifest is one JSON object. Keys the app does not know are refused, not ignored, so a typo fails loudly. Labels — <code>name</code>, a field’s or a button’s <code>label</code> — are objects keyed by language, <code>{"en": "Book pickup", "ar": "…"}</code>; English is required and is shown wherever a translation is missing.',
        'ملف التعريف كائن JSON واحد. المفاتيح التي لا يعرفها التطبيق تُرفض ولا تُتجاهل، فيظهر الخطأ المطبعي فوراً. والتسميات — <code>name</code>، و<code>label</code> للحقل أو الزر — كائنات مفاتيحها اللغات، <code>{"en": "Book pickup", "ar": "…"}</code>؛ الإنجليزية مطلوبة، وتظهر حيثما غابت الترجمة.')}</p>
      ${table(t('Top-level keys', 'المفاتيح العليا'), t(['Key', 'Required', 'What it is'], ['المفتاح', 'مطلوب', 'ما هو']), topRows)}

      <h2 id="sendable">${t('Fields a connector can send', 'الحقول التي يمكن للموصل إرسالها')}</h2>
      <p>${t('A connector names what it sends from this list; it cannot ask for anything else. Each field is declared under a fixed privacy category, which the shop sees on the consent screen and which Apple’s App Privacy label for the iPhone app covers. You cannot choose the category.',
        'يسمّي الموصل ما يرسله من هذه القائمة، ولا يمكنه طلب أي شيء آخر. لكل حقل فئة خصوصية ثابتة تراها المطبعة في شاشة الموافقة، ويغطيها ملصق الخصوصية لتطبيق الآيفون على متجر Apple. لا يمكنك اختيار الفئة.')}</p>
      ${table(t('Sendable fields', 'الحقول القابلة للإرسال'), t(['Name', 'Read from', 'Type', 'Privacy category'], ['الاسم', 'يُقرأ من', 'النوع', 'فئة الخصوصية']), sendRows)}
      <p id="amount-due">${t('<code>order.amountDue</code>, <code>order.amountDueMinor</code> and <code>order.amountDueCurrency</code> are worked out when they are sent, not stored: what the customer still owes on the job, in the job’s own currency — the bill as the shop charges it, tax included where the shop adds it, less payments, gift cards and credit notes, and never below zero. <code>amountDueMinor</code> is the same amount as a whole number of the currency’s minor unit (halalas, cents), the integer most payment APIs take: three decimals for currencies such as KWD, BHD and OMR, and none for JPY or KRW. <code>amountDueCurrency</code> is the ISO 4217 code both are in: the job’s own currency, else its customer’s, else the shop’s. Send it rather than <code>order.currency</code>, which is empty on a job priced in the shop’s currency. All three need the shop’s settings: if the app cannot read them, the request is not sent rather than sent with the wrong amount.',
        '<code>order.amountDue</code> و<code>order.amountDueMinor</code> و<code>order.amountDueCurrency</code> تُحسب عند الإرسال ولا تُخزَّن: ما بقي على العميل في هذا العمل، بعملة العمل نفسه — الفاتورة كما تحتسبها المطبعة، شاملة الضريبة حيث تضيفها، مطروحاً منها الدفعات وبطاقات الهدايا والإشعارات الدائنة، ولا تقل أبداً عن صفر. <code>amountDueMinor</code> هو المبلغ نفسه عدداً صحيحاً بأصغر وحدة للعملة (الهللة، السنت)، وهو العدد الذي تأخذه أغلب واجهات الدفع: ثلاث خانات عشرية لعملات مثل KWD وBHD وOMR، ولا شيء لـ JPY أو KRW. و<code>amountDueCurrency</code> رمز ISO 4217 للعملة التي بها الاثنان: عملة العمل نفسه، وإلا فعملة عميله، وإلا فعملة المطبعة. أرسله بدلاً من <code>order.currency</code>، الفارغ في عمل مسعَّر بعملة المطبعة. وتحتاج الثلاثة إلى إعدادات المطبعة: فإن لم يستطع التطبيق قراءتها لم يُرسَل الطلب، بدلاً من إرساله بمبلغ خاطئ.')}</p>
      <p>${t('Which of them a button can reach depends on where it sits: a customer has no single order, so a button on a customer cannot send <code>order.*</code>.',
        'ما يصل إليه الزر منها يتوقف على مكانه: ليس للعميل طلب واحد، فلا يستطيع زر على العميل إرسال <code>order.*</code>.')}</p>
      ${table(t('Where a button can sit', 'أين يمكن أن يوضع الزر'), t(['Placement', 'Can send'], ['المكان', 'يمكنه إرسال']), placeRows)}

      <h2 id="time">${t('The time', 'الوقت')}</h2>
      <p>${t(`For a link that expires — a payment link, say — a URL, a body template or <code>send</code> can use <code>{now.epochMs}</code>, the time in milliseconds since 1970 (UTC), or <code>{now.plusDays.N.epochMs}</code>, N whole days later, N from 1 to ${M.NOW_MAX_DAYS}. The time is not shop data, so the shop does not grant it and it is not on the consent screen. It is read when each attempt is sent: a retry carries a later time, so its body is not the same bytes as the first attempt’s. Recognise a repeat by its <code>X-Khayt-Delivery</code> id, which every retry keeps, never by comparing bodies. An expiry N days ahead counts from the attempt that reached you, so it always gets its full N days.`,
        `لرابط تنتهي صلاحيته — رابط دفع مثلاً — يمكن للرابط أو قالب الجسم أو <code>send</code> استخدام <code>{now.epochMs}</code>، أي الوقت بالمللي ثانية منذ 1970 (UTC)، أو <code>{now.plusDays.N.epochMs}</code>، أي بعده بـ N يوماً كاملاً، وN من 1 إلى ${M.NOW_MAX_DAYS}. الوقت ليس من بيانات المطبعة، فلا تمنحه المطبعة ولا يظهر في شاشة الموافقة. ويُقرأ عند إرسال كل محاولة: فالمحاولة المعادة تحمل وقتاً أحدث، وجسمها ليس البايتات نفسها التي حملتها الأولى. تعرّف على التكرار بمعرّف <code>X-Khayt-Delivery</code> الذي تحتفظ به كل إعادة، لا بمقارنة الأجسام. والصلاحية بعد N يوماً تُحسب من المحاولة التي وصلتك، فتنال دائماً أيامها الـ N كاملة.`)}</p>

      <h2 id="actions">${t('Buttons', 'الأزرار')} (<code>actions</code>)</h2>
      ${enumTable(lang, t('Kinds of button', 'أنواع الأزرار'), D.actionKinds)}
      <p>${t('A URL must start <code>https://</code> followed by one of your <code>domains</code>, written literally: a placeholder can appear in the path or query, never in the host, so a value from the book can never choose where data goes. A <code>post</code> button can authenticate with <code>auth</code> (a header filled from one of your <code>secrets</code>) and sign the request with <code>signWith</code>. <code>auth</code> is <code>{"header", "scheme", "secret"}</code>, plus <code>"encode": "basic"</code> when your API takes HTTP Basic (table below). Its <code>response</code> can copy values from your reply into your own fields — <code>{"fields": {"tracking": "data.trackingNumber"}}</code> — and only into fields on the same kind of record as the button.',
        'يجب أن يبدأ الرابط بـ <code>https://</code> يليه أحد نطاقاتك في <code>domains</code> مكتوباً حرفياً: يمكن أن يظهر عنصر نائب في المسار أو الاستعلام، لا في المضيف أبداً، فلا تستطيع قيمة من الدفتر أن تختار وجهة البيانات. ويمكن لزر <code>post</code> أن يصادق بـ <code>auth</code> (ترويسة تُملأ من أحد أسرارك في <code>secrets</code>) وأن يوقّع الطلب بـ <code>signWith</code>. و<code>auth</code> هو <code>{"header", "scheme", "secret"}</code>، مع <code>"encode": "basic"</code> حين تأخذ واجهتك HTTP Basic (الجدول أدناه). ويمكن لـ <code>response</code> أن ينسخ قيماً من ردك إلى حقولك الخاصة — <code>{"fields": {"tracking": "data.trackingNumber"}}</code> — وإلى حقول على نوع السجل نفسه الذي عليه الزر فقط.')}</p>
      ${enumTable(lang, t('Auth encodings (<code>auth.encode</code>)', 'ترميزات المصادقة (<code>auth.encode</code>)'), D.authEncodings)}
      ${enumTable(lang, t('Body formats', 'صيغ الجسم'), D.bodyFormats)}

      <h2 id="events">${t('Events', 'الأحداث')} (<code>events</code>)</h2>
      <p>${t('Each entry names an event, the URL it is sent to, and the fields it sends, with the same <code>send</code>, <code>body</code>, <code>auth</code>, <code>signWith</code> and <code>response</code> as a button; a reply can fill your own fields on that order. Every event carries one order. The <a href="../events/">event reference</a> describes each payload.',
        'يسمّي كل مدخل حدثاً، والرابط الذي يُرسل إليه، والحقول التي يرسلها، بالمفاتيح نفسها التي للزر: <code>send</code> و<code>body</code> و<code>auth</code> و<code>signWith</code> و<code>response</code>؛ ويمكن للرد أن يملأ حقولك الخاصة على ذلك الطلب. كل حدث يحمل طلباً واحداً. ويصف <a href="../events/">مرجع الطلبات</a> كل حمولة.')}</p>
      ${enumTable(lang, t('Events', 'الأحداث'), D.events)}

      <h2 id="refresh">${t('Refresh', 'التحديث')} (<code>refresh</code>)</h2>
      <p>${t('A refresh asks your service, on a schedule, about jobs your connector already handles — say, a parcel’s delivery status — and fills your own fields from the reply. It runs only on the computer that has the shop’s book open, never on a phone, and only while the connector is switched on. It needs the <code>fields.write</code> scope.',
        'التحديث يسأل خدمتك، وفق جدول، عن أعمال يتولاها موصلك أصلاً — حالة توصيل طرد مثلاً — ويملأ حقولك الخاصة من الرد. لا يعمل إلا على الحاسوب الذي يفتح دفتر المطبعة، ولا يعمل على الهاتف أبداً، ولا يعمل إلا والموصل مشغَّل. ويحتاج إلى الصلاحية <code>fields.write</code>.')}</p>
      ${table(t('Refresh keys', 'مفاتيح التحديث'), t(['Key', 'What it is'], ['المفتاح', 'ما هو']), [
        [code('every'), t(`Minutes between runs, a whole number from ${M.REFRESH.minEvery} to ${M.REFRESH.maxEvery}.`, `الدقائق بين كل تشغيل والذي يليه، عدد صحيح من ${M.REFRESH.minEvery} إلى ${M.REFRESH.maxEvery}.`)],
        [code('when'), t('One of your own fields on an order. Only jobs where it is filled in are asked about — for example a tracking number your <code>book</code> button stored.', 'أحد حقولك الخاصة على الطلب. لا يُسأل إلا عن الأعمال التي عُبّئ فيها — رقم تتبّع حفظه زر <code>book</code> مثلاً.')],
        [code('method'), t(`${M.REFRESH_METHODS.map(code).join(' or ')}; <code>POST</code> if left out. A <code>GET</code> has no body.`, `${M.REFRESH_METHODS.map(code).join(' أو ')}؛ و<code>POST</code> إن لم يُذكر. وطلب <code>GET</code> لا جسم له.`)],
        [code('url'), t('As for a button: https, a host in your <code>domains</code>, placeholders only in the path or query.', 'كما في الزر: https، ومضيف من <code>domains</code>، والعناصر النائبة في المسار أو الاستعلام فقط.')],
        [`${code('send')}, ${code('body')}, ${code('auth')}, ${code('signWith')}`, t('As for a button. Everything a refresh sends is on the consent screen.', 'كما في الزر. كل ما يرسله التحديث يظهر في شاشة الموافقة.')],
        [code('response'), t('Required: the reason a refresh exists. Which of your own order fields to fill, and from which path in your reply.', 'مطلوب: فهو سبب وجود التحديث. أيّ حقولك الخاصة على الطلب يُملأ، ومن أي مسار في ردك.')],
      ])}
      <p>${t(`Each run asks about open jobs — not cancelled, not archived, not voided and not yet delivered — one request per job, at most ${M.REFRESH.jobsPerRun} a run, the ones asked about least recently first. A refresh is not retried; the job comes round again on a later run. Adding a refresh, or shortening its <code>every</code>, pauses the connector until the shop agrees again.`,
        `يسأل كل تشغيل عن الأعمال المفتوحة — غير الملغاة وغير المؤرشفة وغير المبطلة ولم تُسلَّم بعد — بطلب واحد لكل عمل، و${M.REFRESH.jobsPerRun} على الأكثر في كل تشغيل، يبدأ بالأقدم سؤالاً. ولا يُعاد التحديث؛ يعود العمل في تشغيل لاحق. وإضافة تحديث، أو تقصير <code>every</code>، يوقف الموصل مؤقتاً حتى توافق المطبعة من جديد.`)}</p>

      <h2 id="fields">${t('Your own fields', 'حقولك الخاصة')} (<code>fields</code>)</h2>
      ${enumTable(lang, t('Field types', 'أنواع الحقول'), D.fieldTypes)}
      ${enumTable(lang, t('Records a field can be added to', 'السجلات التي يمكن إضافة حقل إليها'), D.attach)}

      <h2 id="settings">${t('Settings', 'الإعدادات')} (<code>settings</code>)</h2>
      <p>${t('Each entry is <code>{"key", "label", "type"}</code>, with <code>options</code> for an enum, <code>required</code> if the connector cannot work without it, and, for a text setting, a <code>kind</code> saying what the value is. The kind decides the privacy category — a sender’s phone is a phone number, whoever’s it is — so you never name a category. A button or event that uses a required setting the shop has not filled in is not sent, and the error names the missing setting. A value of the wrong type, or text over the limit, is sent as <code>null</code>.',
        'كل مدخل هو <code>{"key", "label", "type"}</code>، مع <code>options</code> للقائمة، و<code>required</code> إن كان الموصل لا يعمل دونه، و<code>kind</code> للإعداد النصي يبيّن ماهية القيمة. والنوع هو ما يحدد فئة الخصوصية — فهاتف المرسل رقم هاتف أياً كان صاحبه — فلا تسمّي أنت فئةً أبداً. والزر أو الحدث الذي يستخدم إعداداً مطلوباً لم تعبّئه المطبعة لا يُرسَل، وتسمّي رسالة الخطأ الإعداد الناقص. والقيمة من نوع خاطئ، أو النص الأطول من الحد، تُرسل <code>null</code>.')}</p>
      ${enumTable(lang, t('Setting types', 'أنواع الإعدادات'), D.settingTypes)}
      ${table(t('Kinds of text setting', 'أنواع الإعداد النصي'), t(['Kind', 'Meaning', 'Privacy category'], ['النوع', 'المعنى', 'فئة الخصوصية']), Object.entries(D.settingKinds).map(([k, v]) => [code(k), v, D.categories[M.SETTING_KINDS[k]]]))}

      <h2 id="secrets">${t('Secrets', 'الأسرار')} (<code>secrets</code>)</h2>
      ${enumTable(lang, t('Kinds of secret', 'أنواع الأسرار'), D.secretKinds)}
      <p>${t('A secret can be used in a <code>post</code> URL, an <code>auth</code> header or <code>signWith</code>. It can never be sent as a field, put in a body template, or appear in an <code>open</code> link, which a browser would keep in its history.',
        'يمكن استخدام السرّ في رابط <code>post</code> أو ترويسة <code>auth</code> أو <code>signWith</code>. ولا يمكن أبداً إرساله حقلاً، ولا وضعه في قالب جسم، ولا ظهوره في رابط <code>open</code> يحفظه المتصفح في سجله.')}</p>

      <h2 id="scopes">${t('Scopes', 'الصلاحيات')} (<code>scopes</code>)</h2>
      ${enumTable(lang, t('Scopes', 'الصلاحيات'), D.scopes)}
      <p>${t('A connector is told only the fields it sends; that needs no scope. These names are kept for when connectors can reach the shop through Khayt Cloud, and a manifest that asks for one is refused until then:',
        'لا يُبلَّغ الموصل إلا بالحقول التي يرسلها، وهذا لا يحتاج صلاحية. هذه الأسماء محجوزة لحين تستطيع الموصلات الوصول إلى المطبعة عبر سحابة خيط، ويُرفض حتى ذلك الحين كل ملف تعريف يطلب أحدها:')}</p>
      ${enumTable(lang, t('Reserved scopes', 'الصلاحيات المحجوزة'), D.reservedScopes)}

      <h2 id="limits">${t('Limits', 'الحدود')}</h2>
      ${table(t('Limits', 'الحدود'), t(['At most', 'Of'], ['على الأكثر', 'من']), limitRows)}

      <h2 id="signing">${t('Review and signing', 'المراجعة والتوقيع')}</h2>
      <p>${t('A connector counts as reviewed only when its <code>signature</code> verifies — never because of a flag stored anywhere. Khayt signs a manifest it has reviewed with ed25519 over the UTF-8 bytes of its canonical JSON: every key sorted, no whitespace, <code>signature</code> itself left out. Any change to a signed manifest, even to a URL, breaks the signature and needs a new review. A signature verifies against any of these published keys, so the key can rotate without un-reviewing what was signed before:',
        'لا يُعدّ الموصل مراجَعاً إلا حين يصحّ توقيعه في <code>signature</code> — لا بسبب علامة مخزّنة في أي مكان. توقّع خيط ملف التعريف الذي راجعته بـ ed25519 على بايتات UTF-8 لـ JSON القانوني الخاص به: كل المفاتيح مرتبة، بلا مسافات، ودون <code>signature</code> نفسه. وأي تغيير في ملف موقَّع، ولو في رابط، يكسر التوقيع ويحتاج مراجعة جديدة. ويصحّ التوقيع مقابل أيٍّ من هذه المفاتيح المنشورة، فيمكن تبديل المفتاح دون إسقاط مراجعة ما وُقّع من قبل:')}</p>
      ${table(t('Signing keys', 'مفاتيح التوقيع'), t(['Key id', 'Public key (raw ed25519, base64)'], ['معرّف المفتاح', 'المفتاح العام (ed25519 خام، base64)']), M.SIGNING_KEYS.map(k => [code(k.id), code(k.key)]))}

      <h2 id="consent">${t('What the shop agrees to', 'ما توافق عليه المطبعة')}</h2>
      <p>${t('Before a connector is switched on, the shop sees one row per host with the fields that go there. When a new version asks for another field, another host or another scope, the connector pauses on every device until the shop agrees again; asking for less never does. For the example below, the shop sees:',
        'قبل تشغيل الموصل، ترى المطبعة سطراً لكل مضيف مع الحقول التي تذهب إليه. وحين يطلب إصدار جديد حقلاً آخر أو مضيفاً آخر أو صلاحية أخرى، يتوقف الموصل مؤقتاً على كل جهاز حتى توافق المطبعة من جديد؛ أما طلب أقل فلا يوقفه أبداً. في المثال أدناه ترى المطبعة:')}</p>
      ${table(t('Consent screen for the example', 'شاشة الموافقة للمثال'), t(['Host', 'Fields sent there'], ['المضيف', 'الحقول المرسلة إليه']), consent)}
      <p>${t('A connector with a refresh adds one line below the hosts. For the example:', 'والموصل الذي له تحديث يضيف سطراً واحداً تحت المضيفين. في المثال:')} ${t('“', '«')}${refreshLine}${t('”', '»')}</p>

      <h2 id="example">${t('Example', 'مثال')}</h2>
      <p>${t('A courier connector: a button that books a pickup and keeps the tracking number from the reply, a link to the tracking page, and an event when an order ships. It passes the app’s validator as written.',
        'موصل شحن: زر يحجز استلام الطلب ويحفظ رقم التتبّع من الرد، ورابط إلى صفحة التتبّع، وحدث عند شحن الطلب. يجتاز مدقّق التطبيق كما هو مكتوب، وكل القيم فيه أمثلة.')}</p>
      <pre class="ref-code" data-file="${esc(example.id.split('.').pop())}.json"><code>${esc(JSON.stringify(example, null, 2))}</code></pre>

    </div>
   </div>
  </div>
</section>
`;
}

// ---- Docs layout (Figma: khaytapp.com library, page "Developers (hidden)") ---
// Every page gets the same frame: tabs between the four pages under the title,
// an "On this page" list built from the page's own h2s (a sticky column on a
// wide screen, a disclosure on a phone), dark code blocks with a copy button,
// and a link to the next page. The pages' own text is not touched here.
const DOCS = [
  { rel: 'developers/manifest/index.html', tab: 'Manifest', title: 'Connector manifest',
    tabAr: 'ملف التعريف', titleAr: 'ملف تعريف الموصل',
    source: () => `Generated from <code>lib/plugin-manifest.js</code> at <a href="https://github.com/KhaytApp/Khayt/blob/${VENDOR_SHA}/lib/plugin-manifest.js">${VENDOR_SHA.slice(0, 9)}</a>`,
    sourceAr: () => `مولَّدة من <code>lib/plugin-manifest.js</code> عند <a href="https://github.com/KhaytApp/Khayt/blob/${VENDOR_SHA}/lib/plugin-manifest.js">${VENDOR_SHA.slice(0, 9)}</a>`,
    extra: '<a class="docs-schema" href="../../schemas/plugin-manifest-v1.json">JSON Schema <span aria-hidden="true">→</span></a>',
    extraAr: '<a class="docs-schema" href="/schemas/plugin-manifest-v1.json">مخطط JSON <span aria-hidden="true">←</span></a>' },
  { rel: 'developers/events/index.html', tab: 'Requests', title: 'Requests your connector receives',
    tabAr: 'الطلبات الواردة', titleAr: 'الطلبات التي يستقبلها موصلك',
    source: () => `Built by <code>lib/plugin-payload.js</code> at ${VENDOR_SHA.slice(0, 9)}`,
    sourceAr: () => `يبنيها <code>lib/plugin-payload.js</code> عند ${VENDOR_SHA.slice(0, 9)}` },
  { rel: 'developers/webhooks/index.html', tab: 'Shop webhooks', title: 'Shop webhooks',
    tabAr: 'خطافات الويب', titleAr: 'خطافات الويب للمطبعة',
    source: () => `Generated from <code>lib/webhook-bus.js</code> at ${VENDOR_SHA.slice(0, 9)}`,
    sourceAr: () => `مولَّدة من <code>lib/webhook-bus.js</code> عند ${VENDOR_SHA.slice(0, 9)}` },
  { rel: 'developers/samples/index.html', tab: 'Samples', title: 'Sample connectors',
    tabAr: 'أمثلة', titleAr: 'موصلات للبدء منها',
    source: () => `From <code>plugins/samples/</code> at ${VENDOR_SHA.slice(0, 9)}`,
    sourceAr: () => `من <code>plugins/samples/</code> عند ${VENDOR_SHA.slice(0, 9)}` },
];
const tabHref = (from, to) => '../' + to.rel.split('/')[1] + '/';
let codeN = 0;
// Colour JSON keys and strings in already-escaped code. Keys are strings
// followed by a colon; everything else in quotes is a value.
function highlight(escaped) {
  return escaped.replace(/&quot;(?:\\.|(?!&quot;)[^\n\\])*&quot;(\s*:)?/g, (m, colon) =>
    colon ? `<span class="tk">${m.slice(0, m.length - colon.length)}</span>${colon}` : `<span class="ts">${m}</span>`);
}
function codeLabel(text) {
  const first = text.trimStart();
  if (/^(POST|GET|PUT|PATCH|DELETE) |^Content-Type:/.test(first)) return 'HTTP';
  if (/^[{[]/.test(first)) return 'JSON';
  return 'JavaScript';
}
// `rel` is always the English page's path; lang 'ar' dresses its Arabic copy.
function docsChrome(rel, main, lang = 'en') {
  const i = DOCS.findIndex(d => d.rel === rel);
  if (i < 0) return main;
  const t = tFor(lang);
  const d = DOCS[i];
  const tab = x => t(x.tab, x.tabAr), title = x => t(x.title, x.titleAr);
  const tabs = `<nav class="docs-tabs" aria-label="${t('Developer docs', 'وثائق المطوّرين')}">
      ${DOCS.map(x => `<a href="${tabHref(d, x)}"${x === d ? ' aria-current="page"' : ''}>${tab(x)}</a>`).join('\n      ')}
    </nav>`;
  main = main.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1\n    ${tabs}`);
  const heads = [...main.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
  const label = h => h.replace(/\s*\(<code>[^<]*<\/code>\)\s*$/, '').replace(/<[^>]+>/g, '');
  const onPage = t('On this page', 'في هذه الصفحة');
  const extra = t(d.extra, d.extraAr);
  const toc = `<aside class="docs-aside">
      <details class="docs-toc">
        <summary>${onPage}</summary>
        <nav aria-label="${onPage}"><ol>
${heads.map(([, id, h]) => `          <li><a href="#${id}">${label(h)}</a></li>`).join('\n')}
        </ol></nav>
      </details>
      <p class="docs-source">${extra ? extra + '<br>' : ''}${t(d.source(), d.sourceAr())}</p>
    </aside>`;
  main = main.replace(/<h2 id="/g, '<h2 tabindex="-1" id="');
  main = main.replace(/<div class="post-in">\s*<div class="post-body policy">/, `<div class="docs-layout">\n    ${toc}\n    <div class="post-body policy docs-body">`);
  main = main.replace(/<pre class="ref-code"(?: data-file="([^"]*)")?><code>([\s\S]*?)<\/code><\/pre>/g, (m, file, body) => {
    const id = `code-${++codeN}`;
    const name = file || codeLabel(body.replace(/&quot;/g, '"'));
    return `<div class="code-block">
        <div class="code-head"><span class="code-file">${name}</span><span class="copy"><button type="button" class="copy-button" command="--copy" commandfor="${id}">${t('Copy', 'نسخ')}<span class="sr-only"> ${name}</span></button><span class="tip" role="status"></span></span></div>
        <pre class="ref-code" tabindex="0" aria-label="${name}"><code id="${id}">${highlight(body)}</code></pre>
      </div>`;
  });
  const next = DOCS[i + 1], prev = DOCS[i - 1];
  // The arrows are drawn left-to-right and mirrored by CSS on an Arabic page.
  const pager = next
    ? `<nav class="docs-pager" aria-label="${t('Next page', 'الصفحة التالية')}"><a href="${tabHref(d, next)}" rel="next"><span class="docs-pager-k">${t('Next', 'التالي')}</span><span class="docs-pager-t">${title(next)}</span><span class="docs-pager-a" aria-hidden="true">→</span></a></nav>`
    : `<nav class="docs-pager prev" aria-label="${t('Previous page', 'الصفحة السابقة')}"><a href="${tabHref(d, prev)}" rel="prev"><span class="docs-pager-k">${t('Previous', 'السابق')}</span><span class="docs-pager-t">${title(prev)}</span><span class="docs-pager-a" aria-hidden="true">←</span></a></nav>`;
  const tail = /(\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n<\/section>\n?)\s*$/;
  if (!tail.test(main)) throw new Error(`make-dev-docs: ${rel} does not end the way docsChrome expects`);
  return main.replace(tail, `\n      ${pager}$1`);
}

// ---- Page chrome, borrowed from /privacy/ so it never drifts ----------------
// The Arabic copy borrows /ar/privacy/ (scripts/make-ar-pages.js), whose links
// are already root-absolute and whose nav and footer are already in Arabic.
// Each pair names the other as its hreflang alternate, so the language button
// (site.js) goes from one to the other; both stay noindex with no canonical.
function page(rel, title, desc, main, lang = 'en') {
  const ar = lang === 'ar';
  const src = fs.readFileSync(path.join(ROOT, ar ? 'ar/privacy/index.html' : 'privacy/index.html'), 'utf8');
  const head = src.slice(0, src.indexOf('<main id="top">'));
  const foot = src.slice(src.indexOf('</main>'));
  const depth = rel.split('/').length - 1;
  const up = '../'.repeat(depth);
  const enUrl = `https://khaytapp.com/${rel.replace(/index\.html$/, '')}`;
  const arUrl = `https://khaytapp.com/ar/${rel.replace(/index\.html$/, '')}`;
  const url = ar ? arUrl : enUrl;
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
  h = h.replace('</head>', `<link rel="alternate" hreflang="en" href="${enUrl}">\n<link rel="alternate" hreflang="ar" href="${arUrl}">\n</head>`);
  if (ar) {
    if (!/<html lang="ar" dir="rtl">/.test(h)) throw new Error('make-dev-docs: ar/privacy/index.html is not an Arabic page');
    // Root-absolute like the rest of the borrowed chrome: docs.js is served once, under /developers/.
    return h.replace('</head>', '<script src="/developers/docs.js" type="module"></script>\n</head>') +
      '<main id="top">\n' + docsChrome(rel, main, 'ar') + foot;
  }
  const fixPaths = s => s.replace(/(href|src)="\.\.\//g, `$1="${up}`);
  // After fixPaths: docs.js sits one level up from every docs page.
  const docsJs = '<script src="../docs.js" type="module"></script>\n</head>';
  return fixPaths(h).replace('</head>', docsJs) + '<main id="top">\n' + docsChrome(rel, main) + fixPaths(foot);
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
    trackingNumber: '290012345678', plugins: { [example.id]: { service: 'express', tracking: 'CX-88412' } } },
  customer: { name: 'Sara A.', company: 'Najd Robotics', phone: '+966500000000', address: 'King Fahd Rd, Riyadh' },
};
function request(trigger, label) {
  const r = P.payloadFor(example, trigger, sampleCtx);
  if (!r.ok) { console.error(`make-dev-docs: payloadFor(${JSON.stringify(trigger)}) failed: ${r.error}`); process.exit(1); }
  const name = trigger.event || trigger.action || 'refresh';
  const get = r.method === 'GET';
  const lines = [`${get ? 'GET' : 'POST'} ${r.url}`, ...(get ? [] : ['Content-Type: application/json']), `X-Khayt-Event: ${name}`,
    `X-Khayt-Delivery: dlv_<a lower-case UUID${trigger.refresh ? '' : ', the same on every retry'}>`];
  if (r.auth) lines.push(`${r.auth.header}: ${r.auth.scheme ? r.auth.scheme + ' ' : ''}<the shop’s ${r.auth.secret}${r.auth.encode === 'basic' ? ', in base64' : ''}>`);
  if (r.signWith) for (const [k, v] of Object.entries(WS.signatureHeaders(SAMPLE_SECRET, r.body, SAMPLE_MS))) lines.push(`${k}: ${v}`);
  return `<p>${label}</p>
      <pre class="ref-code"><code>${esc(lines.join('\n') + (r.body ? '\n\n' + r.body : ''))}</code></pre>`;
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

function eventsPage(lang) {
const t = tFor(lang);
return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Khayt for developers', 'خيط للمطوّرين')}</span>
    <h1>${t('Requests your connector receives', 'الطلبات التي يستقبلها موصلك')}</h1>
    <p class="lede">${t('What Khayt sends when a shop presses one of your buttons or an event happens, how to check it came from that shop, and what Khayt does with your reply.',
      'ما يرسله خيط حين تضغط المطبعة أحد أزرارك أو يقع حدث، وكيف تتحقق من أنه جاء من تلك المطبعة، وما يفعله خيط بردك.')}</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr">${t(`<strong>Draft.</strong> Connectors are not released yet, and this page may change before they are. The requests below are built by the app’s own code (<code>lib/plugin-payload.js</code> at ${VENDOR_SHA.slice(0, 9)}) from the <a href="../manifest/#example">example manifest</a>.`,
        `<strong>مسودة.</strong> الموصلات لم تصدر بعد، وقد تتغير هذه الصفحة قبل صدورها. يبني الطلبات أدناه كودُ التطبيق نفسه (<code>lib/plugin-payload.js</code> عند ${VENDOR_SHA.slice(0, 9)}) من <a href="../manifest/#example">ملف التعريف المثال</a>.`)}</p>

      <h2 id="body">${t('The body', 'الجسم')}</h2>
      <p>${t(`Unless a trigger sets <code>body.format</code> to <code>json-template</code>, Khayt sends a <code>${esc(P.PAYLOAD_VERSION)}</code> object: your connector’s id and version, which button or event caused it, and under <code>data</code> exactly the fields the trigger lists in <code>send</code>, keyed by their names. A field with no value is <code>null</code>. Keys are sorted, and the body is sent as compact JSON, the same bytes from a Mac, a PC or an iPhone.`,
        `ما لم يضبط المشغّل <code>body.format</code> على <code>json-template</code>، يرسل خيط كائن <code>${esc(P.PAYLOAD_VERSION)}</code>: معرّف موصلك وإصداره، وأي زر أو حدث تسبّب فيه، وتحت <code>data</code> الحقول التي يذكرها المشغّل في <code>send</code> بالضبط، مفاتيحها أسماؤها. والحقل الذي لا قيمة له يكون <code>null</code>. المفاتيح مرتبة، ويُرسل الجسم JSON مضغوطاً، بالبايتات نفسها من ماك أو حاسوب شخصي أو آيفون.`)}</p>
      ${request({ event: 'order_shipped' }, t('An <code>order_shipped</code> event, with <code>signWith</code>:', 'حدث <code>order_shipped</code>، مع <code>signWith</code>:'))}
      ${request({ action: 'book' }, t('The <code>book</code> button, with an <code>auth</code> header and no signature:', 'زر <code>book</code>، مع ترويسة <code>auth</code> ودون توقيع:'))}
      ${request({ refresh: true }, t('The refresh, for one job, as a <code>GET</code> with no body:', 'التحديث لعمل واحد، طلب <code>GET</code> دون جسم:'))}

      <p>${t(`The bodies above are shown exactly as sent, on one line: the signatures are over these bytes, so you can check the recipe below against them with the key <code>${SAMPLE_SECRET}</code>.`,
        `تظهر الأجسام أعلاه كما تُرسل تماماً، في سطر واحد: فالتوقيعات على هذه البايتات، ويمكنك اختبار الوصفة أدناه عليها بالمفتاح <code>${SAMPLE_SECRET}</code>.`)}</p>

      <h2 id="headers">${t('Headers', 'الترويسات')}</h2>
      ${table(t('Headers', 'الترويسات'), t(['Header', 'When', 'Value'], ['الترويسة', 'متى', 'القيمة']), [
        [code('Content-Type'), t('On a POST', 'في طلب POST'), code('application/json')],
        [code('X-Khayt-Event'), t('Always', 'دائماً'), t('The event name, the button’s <code>id</code>, or <code>refresh</code>.', 'اسم الحدث، أو <code>id</code> الزر، أو <code>refresh</code>.')],
        [code('X-Khayt-Delivery'), t('Always', 'دائماً'), t('<code>dlv_</code> and a lower-case UUID: one per button press or event. A retry sends the same id, so you can ignore one you have already handled. Compare ids, not bodies: a body that carries <a href="../manifest/#time">the time</a> changes on each attempt.',
          '<code>dlv_</code> ثم UUID بأحرف صغيرة: واحد لكل ضغطة زر أو حدث. والمحاولة المعادة ترسل المعرّف نفسه، فيمكنك تجاهل ما عالجته من قبل. قارن المعرّفات لا الأجسام: فالجسم الذي يحمل <a href="../manifest/#time">الوقت</a> يتغيّر في كل محاولة.')],
        [t('Your <code>auth.header</code>', '<code>auth.header</code> الخاص بك'), t('If the trigger has <code>auth</code>', 'إن كان للمشغّل <code>auth</code>'), t('Its <code>scheme</code>, a space, and the secret the shop typed in — or just the secret when the trigger sets no <code>scheme</code>. With <code>"encode": "basic"</code>, <code>Basic</code> and the secret in base64 (<a href="../manifest/#actions">see the manifest</a>).',
          'قيمة <code>scheme</code> ثم مسافة ثم السرّ الذي كتبته المطبعة — أو السرّ وحده إن لم يضبط المشغّل <code>scheme</code>. ومع <code>"encode": "basic"</code>، تكون <code>Basic</code> والسرّ بترميز base64 (<a href="../manifest/#actions">انظر ملف التعريف</a>).')],
        [code('X-Khayt-Timestamp'), t('If the trigger has <code>signWith</code>', 'إن كان للمشغّل <code>signWith</code>'), t('Unix time in seconds.', 'وقت Unix بالثواني.')],
        [code('X-Khayt-Signature'), t('If the trigger has <code>signWith</code>', 'إن كان للمشغّل <code>signWith</code>'), t('HMAC-SHA256 of the body under the signing key, lowercase hex, no prefix.', 'HMAC-SHA256 للجسم بمفتاح التوقيع، بنظام ست عشري بأحرف صغيرة، دون بادئة.')],
        [code('X-Khayt-Signature-V2'), t('If the trigger has <code>signWith</code>', 'إن كان للمشغّل <code>signWith</code>'), t('HMAC-SHA256 of <code>&lt;timestamp&gt;.&lt;body&gt;</code>, lowercase hex. Check this one: it also lets you refuse a replay.', 'HMAC-SHA256 لـ <code>&lt;timestamp&gt;.&lt;body&gt;</code>، بنظام ست عشري بأحرف صغيرة. تحقق من هذا: فهو يتيح لك أيضاً رفض طلب قديم أُعيد إرساله.')],
      ])}

      <h2 id="verify">${t('Checking a signature', 'التحقق من التوقيع')}</h2>
      <p>${t('Compute the HMAC over the raw bytes you received, not over JSON you parsed and wrote out again. This recipe is run against a real signature from the app every time this page is built.',
        'احسب HMAC على البايتات الخام التي استقبلتها، لا على JSON حلّلته ثم كتبته من جديد. تُختبر هذه الوصفة على توقيع حقيقي من التطبيق في كل مرة تُبنى فيها هذه الصفحة.')}</p>
      <pre class="ref-code"><code>${esc(verifyNode)}</code></pre>

      <h2 id="delivery">${t('Delivery', 'التسليم')}</h2>
      <ul>
        <li>${t(`<strong>Events</strong> are tried up to ${B.MAX_ATTEMPTS} times — at once, then after 30 seconds, 2 minutes, 10 minutes and 1 hour — until you answer with any 2xx. <code>410 Gone</code> stops the retries and switches that event off for the shop.`,
          `<strong>الأحداث</strong> تُجرَّب حتى ${B.MAX_ATTEMPTS} مرات — فوراً، ثم بعد 30 ثانية، ودقيقتين، و10 دقائق، وساعة — حتى تجيب بأي رمز 2xx. والرد <code>410 Gone</code> يوقف المحاولات ويطفئ ذلك الحدث لدى المطبعة.`)}</li>
        <li>${t('<strong>Buttons</strong> are never retried: a person pressed it and sees the result. Any 2xx is success. Anything else, a timeout (15 seconds) or a redirect (never followed) shows the shop “<em>your connector’s name</em> answered <em>status</em>” or “could not be reached”, and nothing is written.',
          '<strong>الأزرار</strong> لا تُعاد أبداً: فقد ضغطها شخص ويرى النتيجة. أي رمز 2xx نجاح. وما عداه، أو انتهاء المهلة (15 ثانية)، أو إعادة التوجيه (التي لا تُتّبع أبداً)، يُظهر للمطبعة «ردّ <em>اسم موصلك</em> بـ <em>الحالة</em>» أو «تعذّر الوصول إليه»، ولا يُكتب شيء.')}</li>
        <li>${t('<strong>A refresh</strong> is never retried: the job is asked about again on a later run.', '<strong>التحديث</strong> لا يُعاد أبداً: يُسأل عن العمل مجدداً في تشغيل لاحق.')}</li>
        <li>${t('Requests go only over https, only to a host in your <code>domains</code>, and never to a private or local address.', 'تُرسل الطلبات عبر https فقط، وإلى مضيف من <code>domains</code> فقط، ولا تُرسل أبداً إلى عنوان خاص أو محلي.')}</li>
      </ul>

      <h2 id="response">${t('Your reply', 'ردّك')}</h2>
      <p>${t('If a button, an event or the refresh declares <code>response</code>, answer with JSON of up to 64 KB. Each path it names is read from your reply and written to your connector’s own field on that record, after a check against the field’s type: a number may arrive as numeric text (<code>"2.5"</code>), a date as a full date-time (the date part is kept), and text is cut to 500 characters; a yes/no field takes only <code>true</code> or <code>false</code>, a choice only one of its option values, and anything else of the wrong type is dropped. This needs the <code>fields.write</code> scope. A reply that is not JSON, or too large, still counts as success; nothing is filled in.',
        'إن صرّح زر أو حدث أو التحديث بـ <code>response</code>، فأجب بـ JSON حجمه 64 KB على الأكثر. يُقرأ كل مسار يسمّيه من ردك، ويُكتب في حقل موصلك الخاص على ذلك السجل، بعد مطابقته لنوع الحقل: قد يصل الرقم نصاً رقمياً (<code>"2.5"</code>)، والتاريخ تاريخاً ووقتاً كاملين (يُحفظ جزء التاريخ)، ويُقصّ النص إلى 500 حرف؛ وحقل نعم/لا لا يقبل إلا <code>true</code> أو <code>false</code>، والاختيار لا يقبل إلا إحدى قيم خياراته، وما عدا ذلك من نوع خاطئ يُهمَل. ويحتاج هذا إلى الصلاحية <code>fields.write</code>. والرد الذي ليس JSON، أو الكبير جداً، يُعدّ نجاحاً مع ذلك؛ ولا يُعبّأ شيء.')}</p>

    </div>
   </div>
  </div>
</section>
`;
}

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
const BUS_DOC_AR = {
  order_created: 'أُنشئ طلب.',
  status_changed: 'انتقل طلب إلى حالة أخرى.',
  order_shipped: 'عُلِّم طلب بأنه شُحن.',
  order_delivered: 'سُلِّم طلب. والتسليم تاريخ على عمل مكتمل، لا حالة، فلا حالة له في الحمولة.',
  payment_received: 'سُجّلت دفعة.',
  quote_created: 'أُنشئ عرض سعر.',
  quote_approved: 'وافق عميل على عرض سعر.',
  low_stock: 'نزلت خامة تحت حدّ إعادة الطلب.',
  printer_alert: 'أبلغت طابعة عن خطأ أو توقفت.',
  intake_submitted: 'أرسل عميل طلباً عبر نموذج الاستقبال.',
  qc_failed: 'لم يجتز عمل الفحص.',
  rma_opened: 'أبلغ عميل عن مشكلة في عمل سُلِّم له (تطبيق سطح المكتب فقط).',
};
same('webhook event', B.EVENTS, BUS_DOC);
same('Arabic webhook event', B.EVENTS, BUS_DOC_AR);
if (problems.length) { console.error('make-dev-docs:\n  ' + problems.join('\n  ')); process.exit(1); }
const CAT = B.eventCatalogue();
const busRows = lang => CAT.events.map(e => [code(e.event), (lang === 'ar' ? BUS_DOC_AR : BUS_DOC)[e.event],
  e.sent ? e.fields.map(f => `${code(f.key)} <span class="ref-cat">${esc(f.type)}</span>`).join('<br>') : (lang === 'ar' ? '<em>مُدرج، ولا يُرسل بعد</em>' : '<em>Listed, not sent yet</em>')]);
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

function webhooksPage(lang) {
const t = tFor(lang);
return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Khayt for developers', 'خيط للمطوّرين')}</span>
    <h1>${t('Shop webhooks', 'خطافات الويب للمطبعة')}</h1>
    <p class="lede">${t('A shop can send its own events to any https address it sets in Settings — a Zapier or Make hook, or your own server. This is what arrives.',
      'يمكن للمطبعة أن ترسل أحداثها إلى أي عنوان https تضبطه في الإعدادات — خطاف Zapier أو Make، أو خادمك أنت. هذا ما يصل.')}</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr">${t(`<strong>Not a connector.</strong> These are addresses a shop types in itself, with no manifest and no review. A connector is sent <a href="../events/">a different body</a>. Everything below is generated from <code>lib/webhook-bus.js</code> at ${VENDOR_SHA.slice(0, 9)}.`,
        `<strong>ليست موصلاً.</strong> هذه عناوين تكتبها المطبعة بنفسها، دون ملف تعريف ودون مراجعة. أما الموصل فيُرسل إليه <a href="../events/">جسم مختلف</a>. كل ما يلي مولَّد من <code>lib/webhook-bus.js</code> عند ${VENDOR_SHA.slice(0, 9)}.`)}</p>

      <h2 id="events">${t('Events', 'الأحداث')}</h2>
      ${table(t('Webhook events', 'أحداث خطافات الويب'), t(['Event', 'When', 'Payload'], ['الحدث', 'متى', 'الحمولة']), busRows(lang))}

      <h2 id="body">${t('The body', 'الجسم')}</h2>
      <p>${t('The request body is an outer object — <code>event</code>, <code>payload</code> and <code>timestamp</code> in milliseconds — with the delivery inside <code>payload</code>. The delivery’s <code>id</code> stays the same on every retry and on a resend from the delivery log, so you can ignore one you have already handled.',
        'جسم الطلب كائن خارجي — <code>event</code> و<code>payload</code> و<code>timestamp</code> بالمللي ثانية — والتسليم داخل <code>payload</code>. ويبقى <code>id</code> التسليم نفسه في كل محاولة معادة وفي إعادة الإرسال من سجل التسليم، فيمكنك تجاهل ما عالجته من قبل.')}</p>
      ${wireBlock(firstSent.event, busWire, busAt)}
      ${CAT.orderEnvelope[0].example ? `<p>${t('The older single-address <em>event webhook</em> (Settings: one URL with a switch for created, status and paid) sends the same moments in its own envelope, which its existing receivers expect byte for byte:',
        'أما <em>خطاف الأحداث</em> الأقدم ذو العنوان الواحد (في الإعدادات: رابط واحد بمفتاح للإنشاء والحالة والدفع) فيرسل اللحظات نفسها في غلافه الخاص، الذي ينتظره مستقبلوه الحاليون بايتاً ببايت:')}</p>
      ${wireBlock(CAT.orderEnvelope[0].event, envWire, envAt)}` : ''}

      <h2 id="verify">${t('Checking a signature', 'التحقق من التوقيع')}</h2>
      <p>${t('When the shop has set a signing secret, three headers are added: <code>X-Khayt-Signature</code> (HMAC-SHA256 of the body, lowercase hex, no prefix), <code>X-Khayt-Timestamp</code> (Unix seconds) and <code>X-Khayt-Signature-V2</code> (HMAC-SHA256 of <code>&lt;timestamp&gt;.&lt;body&gt;</code>). With no secret, none of them is sent. Check V2 with the <a href="../events/#verify">same recipe</a> connectors use.',
        'حين تضبط المطبعة سرّ توقيع، تُضاف ثلاث ترويسات: <code>X-Khayt-Signature</code> (HMAC-SHA256 للجسم، ست عشري بأحرف صغيرة، دون بادئة)، و<code>X-Khayt-Timestamp</code> (ثواني Unix)، و<code>X-Khayt-Signature-V2</code> (HMAC-SHA256 لـ <code>&lt;timestamp&gt;.&lt;body&gt;</code>). ودون سرّ لا تُرسل أيٌّ منها. تحقق من V2 بـ<a href="../events/#verify">الوصفة نفسها</a> التي تستخدمها الموصلات.')}</p>

      <h2 id="delivery">${t('Delivery', 'التسليم')}</h2>
      <p>${t(`Up to ${B.MAX_ATTEMPTS} attempts — at once, then after 30 seconds, 2 minutes, 10 minutes and 1 hour — until a 2xx. <code>410 Gone</code> stops the retries and switches the subscription off. Retries wait on the shop’s computer and survive a restart, so they are only sent while it is on.`,
        `حتى ${B.MAX_ATTEMPTS} محاولات — فوراً، ثم بعد 30 ثانية، ودقيقتين، و10 دقائق، وساعة — حتى رمز 2xx. والرد <code>410 Gone</code> يوقف المحاولات ويطفئ الاشتراك. تنتظر المحاولات المعادة على حاسوب المطبعة وتبقى بعد إعادة تشغيله، فلا تُرسل إلا وهو يعمل.`)}</p>

    </div>
   </div>
  </div>
</section>
`;
}

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
// What a shop might type into a setting, by kind and type, for the sample request.
function sampleSetting(st) {
  if (st.type === 'number') return 1;
  if (st.type === 'bool') return true;
  if (st.type === 'enum') return st.options[0].value;
  return { name: 'Athar Studio', phone: '+966511111111', email: 'shop@example.com', address: 'Olaya St, Riyadh' }[st.kind] || 'Riyadh';
}
function sampleSection({ f, m, key }, lang = 'en') {
  const t = tFor(lang), D = DOC_FOR[lang];
  const ctx = Object.assign({}, sampleCtx, { secrets: Object.fromEntries((m.secrets || []).map(x => [x.name, 'YOUR-' + x.name.toUpperCase()])),
    config: Object.fromEntries((m.settings || []).map(st => [st.key, sampleSetting(st)])) });
  const first = (m.events || [])[0] ? { event: m.events[0].event } : { action: m.actions[0].id };
  const r = P.payloadFor(m, first, ctx);
  if (!r.ok) { console.error(`make-dev-docs: ${f}: payloadFor failed: ${r.error}`); process.exit(1); }
  const consentRows = M.consentRows(m).map(row => [code(row.host),
    row.fields.length ? row.fields.map(x => `${code(x.key)} <span class="ref-cat">${esc(D.categories[x.category] || x.category)}</span>`).join('<br>') : t('Nothing from the book', 'لا شيء من الدفتر')]);
  const triggers = [...(m.events || []).map(e => t(`the ${code(e.event)} event`, `للحدث ${code(e.event)}`)), ...(m.actions || []).map(a => t(`a ${code(a.id)} button`, `لزر ${code(a.id)}`))];
  // A sample's own words, in this page's language when it has them; otherwise
  // its English, marked as English so it is read and laid out as such.
  const own = label => {
    if (!label) return '';
    if (lang === 'ar' && label.ar) return esc(label.ar);
    return lang === 'ar' ? `<span lang="en" dir="ltr">${esc(label.en)}</span>` : esc(label.en);
  };
  const name = own(m.name);
  // An English-only description on the Arabic page is a paragraph of its own,
  // left-to-right, rather than an English sentence inside an Arabic one.
  const desc = m.description || {};
  const enOnly = lang === 'ar' && !desc.ar && desc.en;
  const lead = enOnly ? `<p lang="en" dir="ltr">${esc(desc.en)}</p>
      <p>` : `<p>${own(m.description)} `;
  return `
      <h2 id="${esc(m.id.split('.').pop())}">${name}</h2>
      ${lead}${t(`It reacts to ${triggers.join(' and ')}.`, `يستجيب ${triggers.join(' و')}.`)} ${t('File:', 'الملف:')} <a href="https://github.com/KhaytApp/Khayt/blob/${VENDOR_SHA}/plugins/samples/${esc(f)}">plugins/samples/${esc(f)}</a>${t(', signed with', '، موقَّع بـ')} <code>${esc(key)}</code>.</p>
      ${table(t(`What ${name} sends`, `ما يرسله ${name}`), t(['Host', 'Fields'], ['المضيف', 'الحقول']), consentRows)}
      <p>${t(`The request for ${triggers[0]}, for a sample order:`, `الطلب المرسل ${triggers[0]}، لطلب مثال:`)}</p>
      <pre class="ref-code"><code>${esc(`POST ${r.url}\nContent-Type: application/json\n\n${r.body}`)}</code></pre>`;
}
function samplesPage(lang) {
const t = tFor(lang);
return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Khayt for developers', 'خيط للمطوّرين')}</span>
    <h1>${t('Sample connectors', 'موصلات للبدء منها')}</h1>
    <p class="lede">${t('Connectors Khayt has written, reviewed and signed. Copy one as the start of your own.', 'موصلات كتبتها خيط وراجعتها ووقّعتها. انسخ واحداً منها لتبدأ به موصلك.')}</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">

      <p class="policy-tldr">${t('<strong>Draft.</strong> Connectors are not released yet. Each sample below is checked when this page is built: it passes the app’s validator and its signature verifies against a <a href="../manifest/#signing">published key</a>. The requests are built by the app’s own code. Secrets in a URL are shown as <code>YOUR-…</code>.',
        '<strong>مسودة.</strong> الموصلات لم تصدر بعد. يُفحص كل مثال أدناه عند بناء هذه الصفحة: يجتاز مدقّق التطبيق، ويصحّ توقيعه مقابل <a href="../manifest/#signing">مفتاح منشور</a>. ويبني الطلباتِ كودُ التطبيق نفسه. وتظهر الأسرار في الروابط بصيغة <code>YOUR-…</code>.')}</p>
${samples.map(s => sampleSection(s, lang)).join('\n')}

      <p>${t('A copy you change is no longer signed: load it in developer mode on the Mac while you work on it, then send it for review.',
        'النسخة التي تعدّلها لم تعد موقَّعة: حمّلها في وضع المطوّر على الماك أثناء عملك عليها، ثم أرسلها للمراجعة.')}</p>

    </div>
   </div>
  </div>
</section>
`;
}

// The order matters only for the ids the tables and code blocks are numbered
// with: English first, as it always was.
const MAINS = {};
for (const lang of ['en', 'ar']) {
  MAINS[lang] = { manifest: mainPage(lang), events: eventsPage(lang), webhooks: webhooksPage(lang), samples: samplesPage(lang) };
}
const META = {
  manifest: { title: ['Connector manifest — Khayt developers', 'ملف تعريف الموصل — خيط للمطوّرين'],
    desc: ['Every key a Khayt connector manifest can hold, generated from the app’s own rules.', 'كل مفتاح يمكن أن يحمله ملف تعريف موصل خيط، مولَّداً من قواعد التطبيق نفسه.'] },
  events: { title: ['Connector requests — Khayt developers', 'طلبات الموصل — خيط للمطوّرين'],
    desc: ['What a Khayt connector is sent, how to verify it, and what Khayt does with the reply.', 'ما يُرسل إلى موصل خيط، وكيف تتحقق منه، وما يفعله خيط بالرد.'] },
  samples: { title: ['Sample connectors — Khayt developers', 'موصلات للبدء منها — خيط للمطوّرين'],
    desc: ['Signed sample Khayt connectors to start your own from.', 'موصلات خيط موقَّعة لتبدأ منها موصلك.'] },
  webhooks: { title: ['Shop webhooks — Khayt developers', 'خطافات الويب للمطبعة — خيط للمطوّرين'],
    desc: ['The events a Khayt shop can send to its own https address, and how to verify them.', 'الأحداث التي ترسلها مطبعة خيط إلى عنوان https تختاره، وكيف تتحقق منها.'] },
};
const OUT = {};
for (const [lang, i, prefix] of [['en', 0, ''], ['ar', 1, 'ar/']]) {
  for (const key of ['manifest', 'events', 'samples', 'webhooks']) {
    const rel = `developers/${key}/index.html`;
    OUT[prefix + rel] = page(rel, META[key].title[i], META[key].desc[i], MAINS[lang][key], lang);
  }
}

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
