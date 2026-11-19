#!/usr/bin/env node
/* ============================================================
   Generate the connector and plugin directory (/directory/).
   ------------------------------------------------------------
   Figma: khaytapp.com library (gOsfKt1QtHxY5GCUhJ3Rsm), page "Plugin
   directory (draft)": the list, item and developer frames, and "Trust
   blocks" (review record, signed download with a local check, report).

   The listing text is directory/listings.json, edited by PR. It is NOT
   trusted for anything a shop relies on. What an item may do, its version,
   its SHA-256 and who signed it are read from the signed bytes here, and
   the build refuses to write a page when they do not hold:

     - a connector's manifest must pass the app's own validateManifest()
       (developers/vendor/plugin-manifest.js) AND verify against a published
       SIGNING_KEYS entry, the same two checks the apps make;
     - every address it sends to must be a public host name (no IP literal,
       no localhost, no .local), which the app also refuses;
     - its permission rows are consentRows() of that manifest, in the app's
       own words (directory/strings.json, copied from the app's locales), so
       the page shows what the consent sheet will show, never typed text;
     - a slicer plugin can show a download only when its file is in the
       repository AND its SHA-256 is in a connectors/index.json whose
       signature verifies. Until then it is "Not released yet", no link.

   HIDDEN: directory/ and ar/directory/ are NOT_SERVED in
   .github/scripts/assemble-site.js and every page carries noindex, with no
   nav link and no sitemap entry. directory/README.md says how to switch it
   on, which waits for Turki.

     node scripts/make-directory.js          # write
     node scripts/make-directory.js --check  # fail if a page is stale
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const M = require(path.join(ROOT, 'developers', 'vendor', 'plugin-manifest.js'));
const LIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory', 'listings.json'), 'utf8'));
const STR = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory', 'strings.json'), 'utf8'));

// The deep link that opens the app's own consent sheet is not built yet
// (the Mac owns the khayt:// shapes). Until it is, the button says "coming".
const INSTALL_LINK = false;
const REPORT_TO = 'support@khaytapp.com';

const problems = [];
const fail = msg => problems.push(msg);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tFor = lang => (en, ar) => (lang === 'ar' ? ar : en);
const S = (lang, key) => {
  const v = STR[lang][key] || STR.en[key];
  if (!v) throw new Error(`make-directory: no string ${key} in directory/strings.json`);
  return v;
};
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const kb = n => (n < 1024 ? n + ' B' : (n / 1024).toFixed(1).replace(/\.0$/, '') + ' KB');

// ---- Signatures: the same check the apps make --------------------------------
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
function signedBy(message, sigB64) {
  if (typeof sigB64 !== 'string') return null;
  const sig = Buffer.from(sigB64, 'base64');
  const hit = M.SIGNING_KEYS.find(k => {
    try {
      return crypto.verify(null, Buffer.from(message, 'utf8'),
        crypto.createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(k.key, 'base64')]), format: 'der', type: 'spki' }), sig);
    } catch (_) { return false; }
  });
  return hit ? hit.id : null;
}
// lib/plugin-update.js indexSigningMessage(): a context line, then the canonical JSON.
const INDEX_CONTEXT = 'khayt-index-v1\n';
function signedIndex() {
  const file = path.join(ROOT, 'connectors', 'index.json');
  if (!fs.existsSync(file)) return null;
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  const s = index.signature;
  if (!s || typeof s !== 'object') return null;
  const unsigned = Object.assign({}, index); delete unsigned.signature;
  const id = signedBy(INDEX_CONTEXT + M.canonicalJSON(unsigned), s.sig);
  return id && id === s.keyId ? index : null;
}

const publicHost = h => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && !/^[0-9.]+$/.test(h) &&
  !/(^|\.)(localhost|local|internal|lan|home|arpa)$/.test(h);

// ---- Items, from the listing plus the signed bytes ---------------------------
const CATEGORIES = {
  shipping: ['Shipping', 'الشحن'], notifications: ['Notifications', 'التنبيهات'],
  spreadsheets: ['Spreadsheets', 'جداول البيانات'], slicers: ['Slicers', 'برامج التقطيع'],
};
const KINDS = {
  connector: ['Connector', 'موصل'], slicer: ['Slicer plugin', 'إضافة لبرنامج التقطيع'],
  addon: ['Add-on', 'إضافة'], plugin: ['Plugin', 'إضافة برمجية'],
};

const items = LIST.items.map(L => {
  if (!/^[a-z0-9-]+$/.test(L.slug)) fail(`${L.slug}: a slug is lower case letters, digits and dashes`);
  if (!CATEGORIES[L.category]) fail(`${L.slug}: unknown category ${L.category}`);
  for (const k of ['licence', 'source', 'privacy', 'support']) if (!L[k]) fail(`${L.slug}: no ${k}`);
  if (L.kind === 'connector') {
    const bytes = fs.readFileSync(path.join(ROOT, L.manifest));
    const m = JSON.parse(bytes.toString('utf8'));
    const v = M.validateManifest(m);
    if (!v.ok) fail(`${L.slug}: ${L.manifest} is refused by the app's validator: ${v.errors.join('; ')}`);
    const keyId = signedBy(M.canonicalJSON(m), m.signature);
    if (!keyId) fail(`${L.slug}: ${L.manifest} is not signed by a published key`);
    const rows = M.consentRows(m);
    for (const r of rows) if (!publicHost(r.host)) fail(`${L.slug}: ${r.host} is not a public host name`);
    return {
      slug: L.slug, kind: 'connector', id: m.id, version: m.version, name: m.name, description: m.description || {},
      publisher: m.publisher, category: L.category, licence: L.licence, source: L.source, privacy: L.privacy, support: L.support,
      keyId, file: '/' + L.manifest, fileName: path.basename(L.manifest), sha256: sha256(bytes), size: bytes.length,
      rows, scopes: (m.scopes || []).slice(), refresh: M.refreshConsent(m, 'en') ? m : null, manifest: m,
    };
  }
  if (L.kind === 'slicer') {
    const it = Object.assign({}, L, { released: false });
    // A download needs a released file AND a signed index row with its hash.
    if (L.package) {
      const index = signedIndex();
      const row = index && (index.entries || []).find(r => r.kind === 'slicer' && r.id === L.id && r.version === L.version);
      const file = path.join(ROOT, L.package.file || '');
      if (!row) fail(`${L.slug}: a package is listed but no signed connectors/index.json row has ${L.id} ${L.version}`);
      else if (!fs.existsSync(file)) fail(`${L.slug}: ${L.package.file} is not in the repository`);
      else {
        const bytes = fs.readFileSync(file);
        if (sha256(bytes) !== row.sha256 || bytes.length !== row.size) fail(`${L.slug}: ${L.package.file} does not match its signed index row`);
        else Object.assign(it, { released: true, file: '/' + L.package.file, fileName: path.basename(L.package.file), sha256: row.sha256, size: row.size });
      }
    } else if (L.status !== 'not-released') {
      fail(`${L.slug}: a slicer plugin without a signed package must say status "not-released"`);
    }
    for (const s of L.scopes || []) if (!['slices:send', 'queue:read'].includes(s)) fail(`${L.slug}: ${s} is not a scope the Mac shows at pairing`);
    return it;
  }
  fail(`${L.slug}: unknown kind ${L.kind}`);
  return null;
}).filter(Boolean);
const slugs = new Set();
for (const it of items) { if (slugs.has(it.slug)) fail(`two items use the slug ${it.slug}`); slugs.add(it.slug); }

if (problems.length) {
  console.error('make-directory: refused\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ---- Shared pieces -----------------------------------------------------------
// An item's own words in this page's language when it has them; otherwise
// its English, marked as English so it is read and laid out as such.
function own(label, lang, tag = 'span') {
  if (!label) return '';
  if (typeof label === 'string') return esc(label);
  if (lang === 'ar' && label.ar) return esc(label.ar);
  return lang === 'ar' ? `<${tag} lang="en" dir="ltr">${esc(label.en)}</${tag}>` : esc(label.en);
}
const plainName = (it, lang) => (lang === 'ar' && it.name.ar) || it.name.en;
const kindLabel = (kind, lang) => KINDS[kind][lang === 'ar' ? 1 : 0];
const hashGroups = h => h.match(/.{1,4}/g).join(' ');
const ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const ICON_NO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

function badge(it, lang) {
  const t = tFor(lang);
  if (it.kind === 'slicer' && !it.released) return `<span class="dir-badge dir-badge-wait">${t('Not released yet', 'لم يصدر بعد')}</span>`;
  return `<span class="dir-badge dir-badge-ok">${ICON_CHECK}${t('Reviewed and signed', 'مُراجَع وموقَّع')}</span>`;
}

// ---- The list ----------------------------------------------------------------
function listPage(lang) {
  const t = tFor(lang);
  const card = it => {
    const desc = it.description && (lang === 'ar' && it.description.ar ? esc(it.description.ar) : `<span${lang === 'ar' ? ' lang="en" dir="ltr"' : ''}>${esc(it.description.en)}</span>`);
    const hay = [it.name.en, it.name.ar, it.description.en, it.description.ar, it.publisher, ...CATEGORIES[it.category]].filter(Boolean).join(' ').toLowerCase();
    return `
      <li class="dir-card" data-kind="${it.kind}" data-text="${esc(hay)}">
        <div class="dir-tags"><span class="dir-kind">${kindLabel(it.kind, lang)}</span>${badge(it, lang)}</div>
        <h2 class="dir-card-t"><a href="${it.slug}/">${own(it.name, lang)}</a></h2>
        <p class="dir-by">${t('by', 'من')} ${esc(it.publisher)}</p>
        <p class="dir-card-p">${desc}</p>
        <p class="dir-meta"><span>${esc(it.licence)}</span><span>${t('Free', 'مجاني')}</span><span>${CATEGORIES[it.category][lang === 'ar' ? 1 : 0]}</span></p>
      </li>`;
  };
  const coming = (LIST.coming || []).map(c => `
      <li class="dir-card dir-card-coming" data-kind="${c.kind}" data-text="${esc([...KINDS[c.kind]].join(' ').toLowerCase())}">
        <div class="dir-tags"><span class="dir-kind">${kindLabel(c.kind, lang)}</span><span class="dir-badge dir-badge-wait">${t('Coming', 'قريبًا')}</span></div>
        <h2 class="dir-card-t">${t('Plugins with code', 'إضافات فيها كود')}</h2>
        <p class="dir-card-p">${t('Plugins that run code inside Khayt come later, once they can run sandboxed. None can be installed before then.', 'الإضافات التي تشغّل كودًا داخل خيط تأتي لاحقًا، عندما يمكن تشغيلها معزولة. ولا يمكن تثبيت أي منها قبل ذلك.')}</p>
      </li>`).join('');
  const kinds = ['connector', 'slicer', 'plugin'];
  return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Directory', 'الدليل')}</span>
    <h1>${t('Connectors and plugins', 'الموصلات والإضافات')}</h1>
    <p class="lede">${t('Every item is reviewed and signed by Khayt before it is listed. Each page shows exactly what an item sends, and where, before you install it, and the signed SHA-256 of every file.',
      'تراجع خيط كل عنصر وتوقّعه قبل أن يُدرج. وتعرض صفحة كل عنصر ما يرسله بالضبط وإلى أين قبل أن تثبّته، وبصمة SHA-256 الموقَّعة لكل ملف.')}</p>
   </div>
  </div>
</section>

<section class="section dir">
  <div class="wrap">
    <p class="dir-draft">${t('DRAFT, hidden: this directory is not public, and nothing on it can be installed yet.', 'مسودة مخفية: هذا الدليل ليس عامًّا، ولا يمكن تثبيت شيء منه بعد.')}</p>
    <search class="dir-tools">
      <label class="dir-search"><span class="sr-only">${t('Search connectors and plugins', 'ابحث في الموصلات والإضافات')}</span>
        <input type="search" id="dirSearch" placeholder="${t('Search connectors and plugins', 'ابحث في الموصلات والإضافات')}" autocomplete="off"></label>
      <div class="dir-kinds" role="group" aria-label="${t('Show', 'اعرض')}">
        <button type="button" class="dir-chip" data-kind="" aria-pressed="true">${t('All', 'الكل')}</button>
        ${kinds.map(k => `<button type="button" class="dir-chip" data-kind="${k}" aria-pressed="false">${kindLabel(k, lang)}</button>`).join('\n        ')}
      </div>
    </search>
    <p class="dir-count" id="dirCount" role="status"></p>
    <ul class="dir-grid" id="dirGrid">${items.map(card).join('')}${coming}
    </ul>
    <p class="dir-note">${t('Want your connector or plugin here?', 'تريد أن يظهر موصلك أو إضافتك هنا؟')} <a href="review/">${t('How Khayt reviews and lists items', 'كيف تراجع خيط العناصر وتدرجها')}</a>.</p>
  </div>
</section>
`;
}

// ---- One item ------------------------------------------------------------------
function permissions(it, lang) {
  const t = tFor(lang);
  if (it.kind === 'slicer') {
    return `
      <div class="dir-perm">
        <span class="eyebrow">${t('What a paired slicer can do', 'ما يستطيعه برنامج تقطيع مقترن')}</span>
        <p class="dir-perm-t">${t('It may send slices to the From slicer inbox and see the job queue: job numbers, stages and machines only, never titles or customers. It can never read your book, customers, prices or settings.',
          'يمكنه أن يرسل ملفات مقطّعة إلى صندوق «من برنامج التقطيع» وأن يرى طابور الأعمال: أرقام الأعمال ومراحلها والآلات فقط، دون العناوين أو العملاء أبدًا. ولا يستطيع أبدًا قراءة دفترك أو عملائك أو أسعارك أو إعداداتك.')}</p>
        <p class="dir-perm-no">${ICON_NO}${t('Printer control: not available. It cannot start, stop or send to a printer.', 'التحكم بالطابعة: غير متاح. لا يستطيع بدء الطباعة أو إيقافها أو الإرسال إلى طابعة.')}</p>
        <p class="dir-perm-k">${t('Your Mac shows these scopes in its own words when you pair, and you approve them there. OrcaSlicer asks once, at the first Pair, to allow network access to your Mac’s address.',
          'يعرض جهاز ماك هذه الصلاحيات بكلماته عند الإقران، وتوافق عليها هناك. ويسألك OrcaSlicer مرة واحدة، عند أول إقران، أن تسمح بالوصول إلى عنوان جهاز ماك على الشبكة.')}</p>
      </div>`;
  }
  const rows = it.rows.map(r => `
          <li><span class="dir-host" dir="ltr">${ICON_ARROW}${esc(r.host)}</span><span class="dir-cats">${r.fields.length
            ? [...new Set(r.fields.map(f => S(lang, 'plg.cat.' + f.category)))].join(lang === 'ar' ? '، ' : ', ')
            : esc(S(lang, 'plg.consent_link_only'))}</span></li>`).join('');
  const scopes = it.scopes.length ? `<p class="dir-perm-s">${esc(S(lang, 'plg.consent_scopes'))}: ${it.scopes.map(s => esc(S(lang, 'plg.scope.' + s))).join(lang === 'ar' ? '، ' : ', ')}</p>` : '';
  const rc = it.refresh ? M.refreshConsent(it.manifest, lang) : null;
  const refresh = rc ? `<p class="dir-perm-s">${esc(S(lang, 'plg.consent_refresh').replace('{n}', rc.every).replace('{host}', rc.host).replace('{field}', rc.fieldLabel))}</p>` : '';
  return `
      <div class="dir-perm">
        <span class="eyebrow">${t('What it sends, and where', 'ما يرسله وإلى أين')}</span>
        <p class="dir-perm-t">${esc(S(lang, 'plg.consent_lead'))}</p>
        <ul class="dir-hosts">${rows}
        </ul>${scopes}${refresh}
        <p class="dir-perm-k">${esc(S(lang, 'plg.consent_keys_here'))}</p>
        <p class="dir-perm-k">${t('These rows are worked out from the signed manifest when this page is built, the same way the app builds its consent sheet. Khayt shows you the same list before anything is installed.',
          'تُستخرج هذه الصفوف من ملف التعريف الموقَّع عند بناء هذه الصفحة، بالطريقة نفسها التي يبني بها التطبيق شاشة الموافقة. ويعرض لك خيط القائمة نفسها قبل تثبيت أي شيء.')}</p>
      </div>`;
}
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="dir-flip"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';

function review(it, lang) {
  const t = tFor(lang);
  if (it.kind === 'slicer' && !it.released) {
    return `
      <div class="dir-rev dir-rev-wait">
        <span class="eyebrow">${t('Review', 'المراجعة')}</span>
        <p>${t('Not reviewed for listing yet, because there is no release. Before it lists, a person at Khayt reviews the release, its source is public, the release is built from a tagged commit, the file is scanned for secrets and malware, and its SHA-256 is signed into the index.',
          'لم يُراجَع للإدراج بعد، لأنه لا يوجد إصدار. قبل أن يُدرج يراجع شخص في خيط الإصدار، ويكون كوده المصدري منشورًا، ويُبنى الإصدار من التزام موسوم، ويُفحص الملف بحثًا عن أسرار وبرمجيات خبيثة، وتُوقَّع بصمة SHA-256 الخاصة به في الفهرس.')}</p>
      </div>`;
  }
  const hosts = it.rows.map(r => r.host);
  const checks = [
    t(`Its signature verifies against Khayt’s published key <code>${esc(it.keyId)}</code>`, `يصحّ توقيعه مقابل مفتاح خيط المنشور <code>${esc(it.keyId)}</code>`),
    t('Khayt’s own validator accepts the manifest', 'يقبل مدقّق خيط نفسه ملف التعريف'),
    t(`Every address it sends to is a public host name: ${hosts.map(h => `<code>${esc(h)}</code>`).join(', ')}`, `كل عنوان يرسل إليه اسم مضيف عام: ${hosts.map(h => `<code>${esc(h)}</code>`).join('، ')}`),
    t('It asks for no permission the app does not deliver yet', 'لا يطلب صلاحية لا يقدّمها التطبيق بعد'),
  ];
  return `
      <div class="dir-rev">
        <span class="eyebrow">${t('Reviewed and signed by Khayt', 'راجعته خيط ووقّعته')}</span>
        <p>${t(`A person at Khayt reviewed version ${esc(it.version)} before signing it: Khayt signs nothing it has not reviewed. Khayt checks that signature again on your computer before it installs anything.`,
          `راجع شخص في خيط الإصدار ${esc(it.version)} قبل توقيعه: لا توقّع خيط شيئًا لم تراجعه. ويتحقق خيط من هذا التوقيع مرة أخرى على جهازك قبل أن يثبّت أي شيء.`)}</p>
        <p class="dir-rev-k">${t('Checked again when this page was built:', 'وتحقّقنا مرة أخرى عند بناء هذه الصفحة:')}</p>
        <ul class="dir-checks">${checks.map(c => `\n          <li>${ICON_CHECK}<span>${c}</span></li>`).join('')}
        </ul>
      </div>`;
}

function getIt(it, lang) {
  const t = tFor(lang);
  if (it.kind === 'slicer' && !it.released) {
    return `
      <h2 class="dir-h2" id="get">${t('Get it', 'احصل عليه')}</h2>
      <div class="dir-get dir-get-off">
        <span class="dir-dl" aria-disabled="true">${t('No download yet', 'لا تنزيل بعد')}</span>
        <p class="dir-get-k">${t('There is no download until a release exists and its SHA-256 is signed into Khayt’s index. Then this page shows the file, its size and its signed hash, and lets you check the file you downloaded.',
          'لا يوجد تنزيل حتى يصدر إصدار وتُوقَّع بصمة SHA-256 الخاصة به في فهرس خيط. عندها تعرض هذه الصفحة الملف وحجمه وبصمته الموقَّعة، وتتيح لك التحقق من الملف الذي نزّلته.')}</p>
        <p class="dir-get-k">${t('OrcaSlicer checks no signature when it installs a plugin, so the signed hash on this page is the check.', 'لا يتحقق OrcaSlicer من أي توقيع عند تثبيت إضافة، لذلك فالبصمة الموقَّعة في هذه الصفحة هي وسيلة التحقق.')}</p>
      </div>`;
  }
  const files = [{ v: it.version, sha256: it.sha256 }];
  const what = it.kind === 'connector'
    ? t('The signed manifest', 'ملف التعريف الموقَّع')
    : t('Download', 'نزّل');
  const lead = it.kind === 'connector'
    ? t('Khayt installs connectors itself and checks this file’s hash and signature first. The file is here so anyone can read exactly what was signed.',
        'يثبّت خيط الموصلات بنفسه ويتحقق من بصمة هذا الملف وتوقيعه أولًا. والملف هنا ليقرأ أي أحد بالضبط ما تم توقيعه.')
    : t('OrcaSlicer checks no signature when it installs a plugin, so check the file against the signed hash before you install it.',
        'لا يتحقق OrcaSlicer من أي توقيع عند تثبيت إضافة، لذلك تحقّق من الملف مقابل البصمة الموقَّعة قبل أن تثبّته.');
  return `
      <h2 class="dir-h2" id="get">${t('Get it', 'احصل عليه')}</h2>
      <div class="dir-get">
        <p class="dir-get-p">${lead}</p>
        <p class="dir-dl-row"><a class="dir-dl" href="${esc(it.file)}" download>${what}: <span dir="ltr">${esc(it.fileName)}</span></a><span class="dir-size">${kb(it.size)}</span></p>
        <div class="dir-sha"><span class="dir-sha-k">${t('SHA-256, signed by Khayt', 'SHA-256، موقَّعة من خيط')}</span><code dir="ltr">${hashGroups(it.sha256)}</code></div>
        <div class="dir-check" data-files="${esc(JSON.stringify(files))}" data-current="${esc(it.version)}" hidden>
          <p class="dir-check-t">${t('Check the file you downloaded', 'تحقّق من الملف الذي نزّلته')}</p>
          <p class="dir-check-p">${t('Choose it or drop it here. Your browser works out its SHA-256 on this computer; the file is not uploaded.', 'اختره أو أفلته هنا. يحسب متصفحك بصمة SHA-256 على هذا الجهاز، ولا يُرفع الملف.')}</p>
          <label class="dir-file"><input type="file" class="sr-only dir-file-in"><span>${t('Choose file…', 'اختر ملفًا…')}</span></label>
          <div class="dir-result" role="status" aria-live="polite"></div>
          <template class="dir-r-ok"><p class="dir-r dir-r-ok"><strong>${t('Matches the signed file', 'يطابق الملف الموقَّع')}</strong> ${t('This is the file Khayt reviewed and signed.', 'هذا هو الملف الذي راجعته خيط ووقّعته.')}</p></template>
          <template class="dir-r-bad"><p class="dir-r dir-r-bad"><strong>${t('Does not match: don’t install it', 'لا يطابق: لا تثبّته')}</strong> ${t('This is not the file Khayt signed. Download it again from this page; if it still differs, report it.', 'هذا ليس الملف الذي وقّعته خيط. نزّله مرة أخرى من هذه الصفحة، وإن بقي مختلفًا فأبلغ عنه.')}</p></template>
          <template class="dir-r-err"><p class="dir-r dir-r-bad"><strong>${t('Could not read that file', 'تعذّرت قراءة هذا الملف')}</strong> ${t('Try choosing it again.', 'جرّب اختياره مرة أخرى.')}</p></template>
        </div>
      </div>`;
}

function details(it, lang) {
  const t = tFor(lang);
  const link = (href, text) => `<a href="${esc(href)}" dir="ltr">${esc(text)}</a>`;
  const strip = u => u.replace(/^https:\/\//, '').replace(/\/$/, '');
  const works = it.kind === 'slicer'
    ? t(`${esc(it.host.name)} ${esc(it.host.version.replace('>=', ''))} or later, paired with Khayt for Mac`, `${esc(it.host.name)} ‏${esc(it.host.version.replace('>=', ''))} أو أحدث، مقترنًا بخيط للماك`)
    : t('Khayt for Mac, Windows and Linux, and on iPhone once installed from your computer', 'خيط للماك وويندوز ولينكس، وعلى الآيفون بعد تثبيته من حاسوبك');
  const version = it.kind === 'slicer' && !it.released ? t(`${esc(it.version)} (not released)`, `${esc(it.version)} (لم يصدر)`) : esc(it.version);
  const kind = it.kind === 'connector' ? t('Connector (data only)', 'موصل (بيانات فقط)') : t('Slicer plugin (code)', 'إضافة لبرنامج التقطيع (كود)');
  const row = (k, v) => `\n        <div><dt>${k}</dt><dd>${v}</dd></div>`;
  return `
    <aside class="dir-side">
      <dl class="dir-dl-list">${row(t('Version', 'الإصدار'), `<span dir="ltr">${version}</span>`)}${row(t('Kind', 'النوع'), kind)}${row(t('Publisher', 'الناشر'), esc(it.publisher))}${row(t('Licence', 'الترخيص'), `<span dir="ltr">${esc(it.licence)}</span>`)}${row(t('Price', 'السعر'), t('Free', 'مجاني'))}${row(t('Source', 'الكود المصدري'), link(it.source, strip(it.source)))}${row(t('Privacy statement', 'بيان الخصوصية'), link(it.privacy, strip(it.privacy)))}${row(t('Support', 'الدعم'), `<a href="mailto:${esc(it.support)}" dir="ltr">${esc(it.support)}</a>`)}${row(t('Works in', 'يعمل في'), works)}
      </dl>
      <button type="button" class="dir-report-b" command="show-modal" commandfor="report">${t('Report this item', 'أبلغ عن هذا العنصر')}</button>
    </aside>`;
}

function reportDialog(it, lang) {
  const t = tFor(lang);
  const reasons = [
    ['malware', t('It looks like malware or does something hidden', 'يبدو برمجية خبيثة أو يفعل شيئًا خفيًّا')],
    ['privacy', t('It sends data it should not, or to the wrong place', 'يرسل بيانات لا ينبغي أن يرسلها، أو إلى مكان خاطئ')],
    ['impersonation', t('It pretends to be someone it is not', 'ينتحل صفة جهة أخرى')],
    ['broken', t('It does not work', 'لا يعمل')],
    ['other', t('Something else', 'شيء آخر')],
  ];
  return `
<dialog id="report" class="dir-dialog" closedby="any" aria-labelledby="reportTitle" data-to="${esc(REPORT_TO)}" data-item="${esc(it.id)}" data-version="${esc(it.version)}">
  <form class="dir-form" method="dialog">
    <h2 id="reportTitle">${t('Report', 'أبلغ عن')} ${own(it.name, lang)}</h2>
    <p class="dir-form-p">${t('A person at Khayt reads every report. If an item is unsafe, Khayt can withdraw a version, and that turns it off in every shop that has it.', 'يقرأ شخص في خيط كل بلاغ. وإن كان العنصر غير آمن تستطيع خيط سحب إصدار منه، فيتوقف في كل متجر يستخدمه.')}</p>
    <fieldset>
      <legend>${t('What is wrong?', 'ما المشكلة؟')}</legend>${reasons.map(([v, l], i) => `
      <label class="dir-radio"><input type="radio" name="reason" value="${v}"${i === 0 ? ' required' : ''}> ${l}</label>`).join('')}
    </fieldset>
    <label class="dir-field"><span>${t('What happened', 'ماذا حدث')}</span>
      <textarea name="what" rows="4" maxlength="2000" required placeholder="${t('Which version, and what you saw.', 'أي إصدار، وماذا رأيت.')}"></textarea></label>
    <p class="dir-form-k">${t(`Send opens your email app with the report addressed to ${REPORT_TO}. It holds only what you type here, the item and its version.`,
      `يفتح زر الإرسال تطبيق البريد لديك وفيه البلاغ موجّهًا إلى ${REPORT_TO}. ولا يحمل إلا ما تكتبه هنا، والعنصر وإصداره.`)}</p>
    <div class="dir-form-a">
      <button type="button" class="btn btn-ghost" command="close" commandfor="report">${t('Cancel', 'إلغاء')}</button>
      <button type="submit" class="btn btn-accent" value="send">${t('Send report', 'أرسل البلاغ')}</button>
    </div>
    <p class="dir-form-k">${t('Not for help with an item: use its support link.', 'هذا ليس للمساعدة في استخدام العنصر: استخدم رابط الدعم الخاص به.')}</p>
  </form>
</dialog>
<p class="dir-sent" id="reportSent" role="status" hidden>${t(`Your email app should open with the report. If it does not, write to ${REPORT_TO}.`, `يُفترض أن يفتح تطبيق البريد وفيه البلاغ. وإن لم يفتح فاكتب إلى ${REPORT_TO}.`)}</p>`;
}

function itemPage(it, lang) {
  const t = tFor(lang);
  const eyebrow = it.kind === 'slicer'
    ? t(`Slicer plugin · for ${esc(it.host.name)} ${esc(it.host.version.replace('>=', ''))}+`, `إضافة لبرنامج التقطيع · لـ ${esc(it.host.name)} ${esc(it.host.version.replace('>=', ''))}+`)
    : t(`Connector · version ${esc(it.version)}`, `موصل · الإصدار ${esc(it.version)}`);
  const desc = it.description.en ? (lang === 'ar' && !it.description.ar
    ? `<p class="lede" lang="en" dir="ltr">${esc(it.description.en)}</p>`
    : `<p class="lede">${own(it.description, lang)}</p>`) : '';
  const install = it.kind === 'connector'
    ? (INSTALL_LINK
      ? `<a class="btn btn-accent btn-lg" href="khayt://plugin/install?id=${encodeURIComponent(it.id)}&amp;version=${encodeURIComponent(it.version)}">${t('Install in Khayt', 'ثبّت في خيط')}</a>`
      : `<span class="dir-install-off">${t('Install in Khayt: coming', 'التثبيت في خيط: قريبًا')}</span>`) +
      `<p class="dir-install-k">${t('Opens Khayt, which shows what it sends before anything is installed.', 'يفتح خيط، فيعرض ما يرسله قبل تثبيت أي شيء.')}</p>`
    : '';
  return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in dir-head">
    <a class="dir-back" href="../"><span aria-hidden="true" class="dir-flip">←</span> ${t('All connectors and plugins', 'كل الموصلات والإضافات')}</a>
    <span class="eyebrow">${eyebrow}</span>
    <h1>${own(it.name, lang)}</h1>
    <p class="dir-head-by">${t('by', 'من')} ${esc(it.publisher)} ${badge(it, lang)}</p>
    ${desc}
    <div class="dir-install">${install}</div>
   </div>
  </div>
</section>

<section class="section dir">
  <div class="wrap">
    <p class="dir-draft">${t('DRAFT, hidden: this directory is not public, and nothing on it can be installed yet.', 'مسودة مخفية: هذا الدليل ليس عامًّا، ولا يمكن تثبيت شيء منه بعد.')}</p>
    <div class="dir-item">
     <div class="dir-main">${permissions(it, lang)}${review(it, lang)}${getIt(it, lang)}
      <h2 class="dir-h2" id="versions">${t('Versions', 'الإصدارات')}</h2>
      <ul class="dir-versions">
        <li><span class="dir-v" dir="ltr">${esc(it.version)}</span><span>${it.kind === 'slicer' && !it.released ? t('Not released', 'لم يصدر') : t('Current version', 'الإصدار الحالي')}</span>${it.sha256 ? `<code class="dir-v-sha" dir="ltr" title="SHA-256 ${it.sha256}">SHA-256 ${it.sha256.slice(0, 8)}…${it.sha256.slice(-8)}</code>` : ''}</li>
      </ul>
     </div>${details(it, lang)}
    </div>
  </div>
</section>
${reportDialog(it, lang)}
`;
}

// ---- How Khayt reviews, and how to list ----------------------------------------
function reviewPage(lang) {
  const t = tFor(lang);
  const li = arr => arr.map(s => `\n        <li>${ICON_CHECK}<span>${s}</span></li>`).join('');
  return `
<section class="page-head">
  <div class="wrap">
   <div class="post-in dir-head">
    <a class="dir-back" href="../"><span aria-hidden="true" class="dir-flip">←</span> ${t('All connectors and plugins', 'كل الموصلات والإضافات')}</a>
    <span class="eyebrow">${t('Review and listing', 'المراجعة والإدراج')}</span>
    <h1>${t('How Khayt reviews what it lists', 'كيف تراجع خيط ما تدرجه')}</h1>
    <p class="lede">${t('Nothing reaches a shop until a person at Khayt has reviewed it and Khayt has signed it. Your copy of Khayt checks that signature itself, so even this website cannot change what gets installed.',
      'لا يصل شيء إلى أي متجر حتى يراجعه شخص في خيط وتوقّعه خيط. ونسختك من خيط تتحقق من هذا التوقيع بنفسها، فلا يستطيع حتى هذا الموقع أن يغيّر ما يُثبَّت.')}</p>
   </div>
  </div>
</section>

<section class="section dir">
  <div class="wrap dir-flow">
    <p class="dir-draft">${t('DRAFT, hidden: this directory is not public, and nothing on it can be installed yet.', 'مسودة مخفية: هذا الدليل ليس عامًّا، ولا يمكن تثبيت شيء منه بعد.')}</p>

    <div>
      <h2 class="dir-h2">${t('Before anything is listed', 'قبل أن يُدرج أي شيء')}</h2>
      <ol class="dir-steps">
        <li><h3>${t('Automatic checks', 'فحوص آلية')}</h3><p>${t('Every version: the manifest passes Khayt’s own validator, every address it sends to is a public HTTPS host, and it asks for nothing the app does not deliver. For code, also: a scan for secrets and malware, a dependency audit, and a check that the public source builds the same file.',
          'لكل إصدار: يجتاز ملف التعريف مدقّق خيط نفسه، وكل عنوان يرسل إليه مضيف HTTPS عام، ولا يطلب شيئًا لا يقدّمه التطبيق. وللكود أيضًا: فحص بحثًا عن الأسرار والبرمجيات الخبيثة، وتدقيق للمكتبات التي يعتمد عليها، والتحقق من أن الكود المصدري المنشور يبني الملف نفسه.')}</p></li>
        <li><h3>${t('A person reviews it', 'يراجعه شخص')}</h3><p>${t('Always for a first listing, anything that asks for more than before, a new address, anything with code, and the first version after an item changes hands. The reviewer sees the consent screen exactly as a shop will.',
          'دائمًا عند الإدراج الأول، ولكل ما يطلب أكثر مما سبق، ولكل عنوان جديد، ولكل ما فيه كود، ولأول إصدار بعد انتقال العنصر إلى ناشر آخر. ويرى المراجع شاشة الموافقة كما سيراها المتجر بالضبط.')}</p></li>
        <li><h3>${t('Khayt signs it', 'توقّعه خيط')}</h3><p>${t('With a key kept offline, never on this website or its servers. Every file is listed with its SHA-256 and size in a signed index.',
          'بمفتاح محفوظ دون اتصال، ولا يكون أبدًا على هذا الموقع أو خوادمه. ويُدرج كل ملف ببصمة SHA-256 وحجمه في فهرس موقَّع.')}</p></li>
      </ol>
    </div>

    <div class="dir-split">
      <div class="dir-rev">
        <span class="eyebrow">${t('What you can check yourself', 'ما تستطيع التحقق منه بنفسك')}</span>
        <ul class="dir-checks">${li([
          t('What an item sends, and where, is worked out from its signed bytes, not typed by its publisher.', 'ما يرسله العنصر وإلى أين يُستخرج من بياناته الموقَّعة، ولا يكتبه ناشره.'),
          t('Every file shows its signed SHA-256, and the page can check the file you downloaded, on your computer.', 'كل ملف يعرض بصمة SHA-256 الموقَّعة، وتستطيع الصفحة التحقق من الملف الذي نزّلته، على جهازك.'),
          t('Khayt verifies the hash and the signature again before it installs anything.', 'يتحقق خيط من البصمة والتوقيع مرة أخرى قبل أن يثبّت أي شيء.'),
        ])}
        </ul>
      </div>
      <div class="dir-rev">
        <span class="eyebrow">${t('After it is listed', 'بعد الإدراج')}</span>
        <ul class="dir-checks">${li([
          t('An update that asks for more waits until you agree; the old version keeps working.', 'التحديث الذي يطلب أكثر ينتظر موافقتك، ويستمر الإصدار القديم في العمل.'),
          t('Khayt can withdraw a version, and that turns it off in every shop that has it, with the reason.', 'تستطيع خيط سحب إصدار، فيتوقف في كل متجر يستخدمه، مع ذكر السبب.'),
          t('Every item has a Report button, and a person at Khayt reads every report.', 'لكل عنصر زر للإبلاغ، ويقرأ شخص في خيط كل بلاغ.'),
        ])}
        </ul>
      </div>
    </div>

    <div>
      <h2 class="dir-h2" id="list">${t('List your connector or plugin', 'أدرج موصلك أو إضافتك')}</h2>
      <ol class="dir-steps">
        <li><h3>${t('Build it', 'ابنه')}</h3><p>${t('Write a connector manifest against the schema, or a slicer plugin with its source public. Start from Khayt’s samples, which are MIT.', 'اكتب ملف تعريف موصل وفق المخطط، أو إضافة لبرنامج تقطيع بكود مصدري منشور. وابدأ من أمثلة خيط، وهي بترخيص MIT.')}</p></li>
        <li><h3>${t('Send it', 'أرسله')}</h3><p>${t(`Email <a href="mailto:${REPORT_TO}">${REPORT_TO}</a> with a link to the source and your privacy statement.`, `راسل <a href="mailto:${REPORT_TO}">${REPORT_TO}</a> مع رابط الكود المصدري وبيان الخصوصية الخاص بك.`)}</p></li>
        <li><h3>${t('Review and signing', 'المراجعة والتوقيع')}</h3><p>${t('Khayt runs the checks above, reviews it, and signs it into the directory. You hear back by email, with every note.', 'تُجري خيط الفحوص أعلاه وتراجعه وتوقّعه في الدليل. ويصلك الرد بالبريد مع كل الملاحظات.')}</p></li>
      </ol>
      <h3 class="dir-h3">${t('The rules', 'القواعد')}</h3>
      <ul class="dir-rules">
        <li>${t('Anything with code must publish its source. Data-only items (a connector manifest) may be closed.', 'كل ما فيه كود يجب أن ينشر كوده المصدري. ويجوز أن تكون العناصر التي هي بيانات فقط (ملف تعريف موصل) مغلقة.')}</li>
        <li>${t('Free only, for now.', 'مجانية فقط، حاليًا.')}</li>
        <li>${t('It may send only the fields it declares, to the addresses it declares. Khayt shows those to the shop before install, and enforces them.', 'لا يرسل إلا الحقول التي يصرّح بها، إلى العناوين التي يصرّح بها. ويعرضها خيط على المتجر قبل التثبيت، ويفرضها.')}</li>
        <li>${t('A name may not suggest it comes from someone it does not: an unofficial connector for a service says so.', 'لا يجوز أن يوحي الاسم بأنه من جهة ليس منها: والموصل غير الرسمي لخدمة ما يذكر ذلك.')}</li>
      </ul>
      <p class="dir-note">${t('Developer terms come before Khayt accepts outside submissions.', 'تصدر شروط المطوّرين قبل أن تقبل خيط عناصر من خارجها.')}</p>
    </div>
  </div>
</section>
`;
}

// ---- Page chrome, borrowed from /privacy/ (as make-dev-docs.js does) ---------
const JS_FILE = path.join(ROOT, 'directory', 'directory.js');
const JS_V = sha256(fs.readFileSync(JS_FILE)).slice(0, 10);
function page(rel, title, desc, main, lang) {
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
  // The nav marks no page as current: the directory has no nav link while hidden.
  h = h.replace(/ class="here"/g, '').replace(/ aria-current="page"/g, '');
  h = h.replace('</head>', `<link rel="alternate" hreflang="en" href="${enUrl}">\n<link rel="alternate" hreflang="ar" href="${arUrl}">\n<script src="/directory/directory.js?v=${JS_V}" type="module"></script>\n</head>`);
  if (ar) {
    if (!/<html lang="ar" dir="rtl">/.test(h)) throw new Error('make-directory: ar/privacy/index.html is not an Arabic page');
    return h + '<main id="top">\n' + main + foot;
  }
  const fixPaths = s => s.replace(/(href|src)="\.\.\//g, `$1="${up}`);
  return fixPaths(h) + '<main id="top">\n' + main + fixPaths(foot);
}

const OUT = {};
for (const lang of ['en', 'ar']) {
  const pre = lang === 'ar' ? 'ar/' : '';
  const i = lang === 'ar' ? 1 : 0;
  OUT[pre + 'directory/index.html'] = page('directory/index.html',
    ['Connectors and plugins — Khayt', 'الموصلات والإضافات — خيط'][i],
    ['Connectors and plugins for Khayt, each reviewed and signed before it is listed.', 'موصلات وإضافات لخيط، تُراجع كلها وتُوقَّع قبل إدراجها.'][i], listPage(lang), lang);
  OUT[pre + 'directory/review/index.html'] = page('directory/review/index.html',
    ['How Khayt reviews what it lists — Khayt', 'كيف تراجع خيط ما تدرجه — خيط'][i],
    ['The checks, the review and the signing every listed item goes through, and how to list yours.', 'الفحوص والمراجعة والتوقيع التي يمر بها كل عنصر مُدرج، وكيف تدرج عنصرك.'][i], reviewPage(lang), lang);
  for (const it of items) {
    OUT[pre + `directory/${it.slug}/index.html`] = page(`directory/${it.slug}/index.html`,
      `${plainName(it, lang)} — ${['Khayt directory', 'دليل خيط'][i]}`,
      lang === 'ar' && it.description.ar ? it.description.ar : it.description.en, itemPage(it, lang), lang);
  }
}

let stale = 0;
const want = new Set(Object.keys(OUT));
for (const [rel, html] of Object.entries(OUT)) {
  const file = path.join(ROOT, rel);
  const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (now === html) continue;
  if (CHECK) { console.error(`${rel} is stale: run node scripts/make-directory.js`); stale++; continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`wrote ${rel}`);
}
// A page left behind by an item that was removed from the listing.
for (const base of ['directory', 'ar/directory']) {
  const dir = path.join(ROOT, base);
  if (!fs.existsSync(dir)) continue;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = `${base}/${d.name}/index.html`;
    if (d.isDirectory() && fs.existsSync(path.join(ROOT, rel)) && !want.has(rel)) {
      if (CHECK) { console.error(`${rel} has no listing: run node scripts/make-directory.js`); stale++; }
      else { fs.rmSync(path.join(ROOT, base, d.name), { recursive: true }); console.log(`removed ${base}/${d.name}/`); }
    }
  }
}
if (stale) process.exit(1);
console.log(`make-directory: ${Object.keys(OUT).length} pages, ${items.length} items`);
