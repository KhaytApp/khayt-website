/* ============================================================
   /developers/updates/ and /developers/directory/, for make-dev-docs.js.
   ------------------------------------------------------------
   How a new version reaches a shop (lib/plugin-update.js) and what a
   directory listing may say (lib/plugin-directory.js, still the draft
   KhaytApp/Khayt#2598). As on the other pages, every key, kind, limit and
   reason comes from the vendored modules, and the prose is held to them both
   ways: a key the module has and the prose does not describe fails the
   build, and so does prose for a key the module does not have. The example
   index passes the module's own checkIndex(), each refusal listed is one
   checkIndex() really gives, and the example listing passes checkListing().

   HIDDEN like the rest of /developers/ (NOT_SERVED, noindex).
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function trustPages({ ROOT, VENDOR_SHA, table, esc, code, tFor, problems }) {
  const U = require(path.join(ROOT, 'developers', 'vendor', 'plugin-update.js'));
  const D = require(path.join(ROOT, 'developers', 'vendor', 'plugin-directory.js'));
  const DIR_SHA = (/at ([0-9a-f]{40}) \(DRAFT/.exec(
    fs.readFileSync(path.join(ROOT, 'developers', 'vendor', 'plugin-directory.js'), 'utf8')) || [])[1] || '';

  function same(what, have, documented) {
    const h = new Set(have), d = new Set(Object.keys(documented));
    for (const k of h) if (!d.has(k)) problems.push(`${what}: "${k}" is in the module but not documented`);
    for (const k of d) if (!h.has(k)) problems.push(`${what}: "${k}" is documented but the module has no such thing`);
  }

  /* ── Prose, keyed by the modules' names ───────────────────────────────── */
  const ROW = {
    en: {
      kind: `What it is: one of ${U.KINDS.map(code).join(', ')}. A row of a kind this app version does not know is skipped, not an error.`,
      id: 'The manifest’s <code>id</code>.',
      version: 'The current version. Older versions are not listed; a device only ever moves forward.',
      url: 'Where the signed manifest is: https, on khaytapp.com.',
      sha256: 'SHA-256 of the file at <code>url</code>, 64 lower-case hex digits. A download that does not match is thrown away.',
      size: 'Optional: the file’s size in bytes, checked with the hash.',
      requires: 'Optional: <code>schema</code>, the manifest format the version needs, and the oldest app version per platform (<code>mac</code>, <code>desktop</code>, <code>ios</code>). An older app is told the update needs a newer Khayt, and keeps the version it has.',
      revoked: `Optional: versions Khayt has withdrawn, each <code>{ version, reason }</code>. The reason is shown to the shop, up to ${U.REASON_MAX} characters.`,
    },
    ar: {
      kind: `ما هو: أحد ${U.KINDS.map(code).join('، ')}. والسطر من نوع لا يعرفه إصدار التطبيق يُتخطّى، ولا يُعدّ خطأ.`,
      id: '<code>id</code> ملف التعريف.',
      version: 'الإصدار الحالي. لا تُدرج الإصدارات الأقدم؛ فالجهاز لا يتقدّم إلا إلى الأمام.',
      url: 'مكان ملف التعريف الموقَّع: https، على khaytapp.com.',
      sha256: 'بصمة SHA-256 للملف في <code>url</code>، 64 رقماً ست عشرياً بأحرف صغيرة. والتنزيل الذي لا يطابقها يُرمى.',
      size: 'اختياري: حجم الملف بالبايت، ويُفحص مع البصمة.',
      requires: 'اختياري: <code>schema</code>، صيغة ملف التعريف التي يحتاجها الإصدار، وأقدم إصدار للتطبيق لكل منصة (<code>mac</code> و<code>desktop</code> و<code>ios</code>). والتطبيق الأقدم يُخبَر بأن التحديث يحتاج خيطاً أحدث، ويُبقي إصداره.',
      revoked: `اختياري: الإصدارات التي سحبتها خيط، كلٌّ منها <code>{ version, reason }</code>. ويُعرض السبب على المطبعة، حتى ${U.REASON_MAX} حرفاً.`,
    },
  };
  const REASONS = {
    en: {
      unreadable: 'The index is not in the format this app reads, or a row is malformed.',
      unsigned: 'No signature from a published Khayt key.',
      old_serial: 'Its serial is lower than one this device has already accepted: an older index served again.',
      expired: `Past its <code>expires</code> date. Khayt re-signs the index every ${U.RESIGN_DAYS} days, and each is good for ${U.EXPIRY_DAYS}.`,
      from_future: 'Issued more than a day ahead of this device’s clock.',
    },
    ar: {
      unreadable: 'الفهرس ليس بالصيغة التي يقرؤها هذا التطبيق، أو أن أحد أسطره تالف.',
      unsigned: 'لا توقيع عليه من مفتاح منشور لخيط.',
      old_serial: 'رقمه التسلسلي أقل من رقم قبله هذا الجهاز من قبل: فهرس أقدم يُقدَّم من جديد.',
      expired: `تجاوز تاريخ <code>expires</code>. تعيد خيط توقيع الفهرس كل ${U.RESIGN_DAYS} يوماً، ويصلح كلٌّ منها ${U.EXPIRY_DAYS} يوماً.`,
      from_future: 'صدر قبل ساعة هذا الجهاز بأكثر من يوم.',
    },
  };
  const LISTING = {
    en: {
      id: 'The item’s id: the manifest’s <code>id</code> for a connector. It must sit under your publisher namespace.',
      kind: `One of ${D.KINDS.map(code).join(', ')}. Only ${D.INSTALLABLE.map(code).join(', ')} can be installed today; the others list as “coming”.`,
      name: `The name on the card and the page, up to ${D.LIMITS.name} characters.`,
      publisher: 'Your publisher <code>name</code> and <code>namespace</code>. The page shows the name and the verified badge from Khayt’s publisher record, never from this.',
      summary: `One line for the card, up to ${D.LIMITS.summary} characters.`,
      description: `Optional: the page’s text, up to ${D.LIMITS.description} characters. Shown as plain text: no HTML, no markdown.`,
      descriptionAr: 'Optional: the same in Arabic. Without it, the Arabic page shows the English, set left to right.',
      category: `One of ${D.CATEGORIES.map(code).join(', ')}.`,
      licence: 'An SPDX identifier, such as <code>MIT</code>.',
      source: `An https link to the source. Required for code (${D.CODE_KINDS.map(code).join(', ')}); optional for a connector, which is data only.`,
      privacy: 'Optional: an https link to your privacy statement. The review asks whether it says where the data goes.',
      support: 'An https link or a <code>mailto:</code> address for shops that need help.',
      screenshots: `Optional: up to ${D.LIMITS.screenshots}, each <code>{ url, alt }</code>, url https, alt up to ${D.LIMITS.alt} characters.`,
      deprecated: 'Optional: <code>true</code> when you no longer maintain it. Installed copies keep working; the page says so.',
      transferredFrom: 'Set by Khayt after an ownership transfer: the previous publisher’s name.',
    },
    ar: {
      id: 'معرّف العنصر: <code>id</code> ملف التعريف للموصل. ويجب أن يقع تحت نطاق الناشر الخاص بك.',
      kind: `أحد ${D.KINDS.map(code).join('، ')}. ولا يمكن اليوم تثبيت إلا ${D.INSTALLABLE.map(code).join('، ')}؛ ويُدرج الباقي بأنه «قادم».`,
      name: `الاسم على البطاقة والصفحة، حتى ${D.LIMITS.name} حرفاً.`,
      publisher: '<code>name</code> الناشر و<code>namespace</code>. وتعرض الصفحة الاسم وشارة التحقق من سجلّ الناشرين لدى خيط، لا من هنا.',
      summary: `سطر واحد للبطاقة، حتى ${D.LIMITS.summary} حرفاً.`,
      description: `اختياري: نص الصفحة، حتى ${D.LIMITS.description} حرف. يُعرض نصاً عادياً: لا HTML ولا markdown.`,
      descriptionAr: 'اختياري: النص نفسه بالعربية. ودونه تعرض الصفحة العربية النص الإنجليزي، من اليسار إلى اليمين.',
      category: `أحد ${D.CATEGORIES.map(code).join('، ')}.`,
      licence: 'معرّف SPDX، مثل <code>MIT</code>.',
      source: `رابط https إلى الشيفرة المصدرية. مطلوب للشيفرة (${D.CODE_KINDS.map(code).join('، ')})؛ واختياري للموصل، لأنه بيانات فقط.`,
      privacy: 'اختياري: رابط https إلى بيان الخصوصية الخاص بك. وتسأل المراجعة هل يذكر أين تذهب البيانات.',
      support: 'رابط https أو عنوان <code>mailto:</code> للمطابع التي تحتاج مساعدة.',
      screenshots: `اختياري: حتى ${D.LIMITS.screenshots}، كلٌّ منها <code>{ url, alt }</code>، والرابط https، والنص البديل حتى ${D.LIMITS.alt} حرفاً.`,
      deprecated: 'اختياري: <code>true</code> حين لا تعود تصونه. وتبقى النسخ المثبّتة تعمل، وتقول الصفحة ذلك.',
      transferredFrom: 'تضعه خيط بعد نقل الملكية: اسم الناشر السابق.',
    },
  };
  for (const L of ['en', 'ar']) {
    same(`${L} index row key`, ['kind', 'id', 'version', 'url', 'sha256', 'size', 'requires', 'revoked'], ROW[L]);
    same(`${L} listing key`, D.LISTING_KEYS, LISTING[L]);
    same(`${L} index refusal`, ['unreadable', 'unsigned', 'old_serial', 'expired', 'from_future'], REASONS[L]);
  }

  /* ── Examples, held by the modules' own checks ───────────────────────── */
  const NOW = Date.parse('2026-11-21T09:00:00Z');
  const issuedAt = '2026-11-21T08:00:00Z';
  const exampleIndex = {
    khaytIndex: U.INDEX_FORMAT,
    serial: 12,
    issuedAt,
    expires: new Date(Date.parse(issuedAt) + U.EXPIRY_DAYS * 86400000).toISOString().replace('.000Z', 'Z'),
    entries: [{
      kind: 'connector', id: 'com.example.courier', version: '1.2.0',
      url: 'https://khaytapp.com/connectors/com.example.courier/1.2.0.json',
      sha256: 'a3f1c2d4e5b6978877665544332211ffeeddccbbaa99887766554433221100ab', size: 4210,
      requires: { schema: U.SCHEMA, mac: '4.0.0-beta.42', desktop: '4.11.0' },
      revoked: [{ version: '1.0.0', reason: 'Sent the customer’s phone to the wrong address.' }],
    }],
    signature: { alg: 'ed25519', keyId: 'khayt-2026-11', value: 'BASE64…' },
  };
  const { signature: _sig, ...goodIndex } = exampleIndex;
  { const v = U.checkIndex(goodIndex, { signedBy: 'khayt-2026-11', lastSerial: 11, nowMs: NOW });
    if (!v.ok) problems.push(`example index: checkIndex says ${v.reason}`);
    for (const r of goodIndex.entries) for (const k of Object.keys(r)) if (!ROW.en[k]) problems.push(`example index: row key ${k} is not documented`); }
  { const cases = {
      unreadable: [Object.assign({}, goodIndex, { khaytIndex: 99 }), {}],
      unsigned: [goodIndex, { signedBy: null }],
      old_serial: [goodIndex, { lastSerial: 13 }],
      expired: [goodIndex, { nowMs: Date.parse(goodIndex.expires) + 1 }],
      from_future: [goodIndex, { nowMs: Date.parse(issuedAt) - 2 * 86400000 }],
    };
    for (const [want, [ix, over]] of Object.entries(cases)) {
      const got = U.checkIndex(ix, Object.assign({ signedBy: 'khayt-2026-11', lastSerial: 11, nowMs: NOW }, over)).reason;
      if (got !== want) problems.push(`index refusal ${want}: checkIndex gave ${got}`);
    } }

  const exampleListing = {
    id: 'com.example.courier', kind: 'connector', name: 'Example Courier',
    publisher: { name: 'Example Logistics', namespace: 'com.example' },
    summary: 'Book a pickup from a finished job and get the tracking number back.',
    description: 'Adds a Book pickup button to a job. Sends the customer’s name, phone and address to api.example.com, and fills in the tracking number from the reply.',
    category: 'shipping', licence: 'MIT', source: 'https://github.com/example/khayt-courier',
    privacy: 'https://example.com/privacy', support: 'mailto:help@example.com',
    screenshots: [{ url: 'https://example.com/khayt/book-pickup.png', alt: 'The Book pickup button on a finished job' }],
  };
  { const e = D.checkListing(exampleListing); if (e.length) problems.push('example listing: ' + e.join('; ')); }
  const refused = Object.assign({}, exampleListing, {
    publisher: Object.assign({}, exampleListing.publisher, { verifiedDomain: 'example.com' }), domains: ['api.example.com'] });
  const refusedErrors = D.checkListing(refused);
  if (refusedErrors.length < 2) problems.push('refused listing example: checkListing accepted it');

  const head = (t, title, lede) => `
<section class="page-head">
  <div class="wrap">
   <div class="post-in">
    <span class="eyebrow">${t('Khayt for developers', 'خيط للمطوّرين')}</span>
    <h1>${title}</h1>
    <p class="lede">${lede}</p>
   </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
   <div class="post-in">
    <div class="post-body policy">
`;
  const tail = `
    </div>
   </div>
  </div>
</section>
`;

  function updatesPage(lang) {
    const t = tFor(lang);
    const rowRows = Object.keys(ROW.en).map(k => [code(k), ROW[lang][k]]);
    const reasonRows = Object.keys(REASONS.en).map(k => [code(k), REASONS[lang][k]]);
    const outcomes = lang === 'ar' ? [
      ['لا يطلب شيئاً جديداً', 'يُثبَّت من تلقاء نفسه على الماك وعلى ويندوز ولينكس، مع ملاحظة هادئة «حُدّث إلى 1.2.0 · تراجع». و«لا شيء جديد» يعني الحقول نفسها إلى المضيفين أنفسهم، بالنطاقات نفسها والتحديث الدوري نفسه: الحقل الذي يُرسل إلى مضيف آخر يُعدّ جديداً.'],
      ['يطلب أكثر', 'ينتظر موافقة المطبعة على ورقة تبيّن ما الجديد، ويبقى الإصدار المثبّت يعمل حتى ذلك الحين. و«ليس الآن» لا يسأل مرة أخرى إلا عن إصدار أحدث.'],
      ['يحتاج خيطاً أحدث', 'يُقال للمطبعة إن التحديث يحتاج خيطاً أحدث، ويبقى إصدارها كما هو.'],
      ['مسحوباً', 'يتوقف على كل جهاز، مع السبب. وهي الحالة الوحيدة التي يتوقف فيها موصل يعمل دون كلمة المطبعة. ولا يُحتفظ بإصدار مسحوب للتراجع إليه.'],
      ['إضافة (<code>plugin</code>)', 'لا تُحدَّث من تلقاء نفسها أبداً، حتى لو لم تطلب جديداً، إلى أن يوجد لها صندوق عزل.'],
    ] : [
      ['asks for nothing new', 'Installs by itself on the Mac and on Windows and Linux, with a quiet “Updated to 1.2.0 · Revert” note. Nothing new means the same fields to the same hosts, with the same scopes and refresh: a field sent to a different host counts as new.'],
      ['asks for more', 'Waits for the shop’s yes on a sheet that shows what is new, and the installed version keeps running until then. “Not now” asks again only for a newer version.'],
      ['needs a newer Khayt', 'The shop is told the update needs a newer Khayt, and keeps the version it has.'],
      ['is withdrawn', 'It is paused on every device, with the reason. This is the one case a running connector stops without the shop’s word. A withdrawn version is never kept to revert to.'],
      ['is a plugin (<code>plugin</code>)', 'It never updates by itself, even asking for nothing new, until there is a sandbox for it.'],
    ];
    const ctx = esc(JSON.stringify(U.INDEX_CONTEXT).slice(1, -1));
    return head(t, t('How updates reach shops', 'كيف تصل التحديثات إلى المطابع'),
      t('Shops never download a connector from you. Khayt signs each version that passes review and lists it in one signed index on khaytapp.com, which every device checks. This is what a device does with it.',
        'لا تنزّل المطابع موصلاً منك مباشرة. توقّع خيط كل إصدار يجتاز المراجعة وتدرجه في فهرس واحد موقَّع على khaytapp.com، يفحصه كل جهاز. وهذا ما يفعله الجهاز به.')) + `
      <p class="policy-tldr">${t(`<strong>Draft.</strong> Connectors are not switched on yet, and the index is not published. Everything below is generated from <code>lib/plugin-update.js</code> at ${VENDOR_SHA.slice(0, 9)}; the example index passes its <code>checkIndex</code>.`,
        `<strong>مسودة.</strong> الموصلات غير مفعّلة بعد، والفهرس غير منشور. كل ما يلي مولَّد من <code>lib/plugin-update.js</code> عند ${VENDOR_SHA.slice(0, 9)}؛ ومثال الفهرس يجتاز <code>checkIndex</code> فيه.`)}</p>

      <h2 id="index">${t('The signed index', 'الفهرس الموقَّع')}</h2>
      <p>${t(`One file, <code>https://khaytapp.com/<wbr>connectors/<wbr>index.json</code>, with one row per item. It says which version is current; what that version may do is still only what Khayt signed into its manifest. The signature is ed25519 over <code>${ctx}</code> followed by the canonical JSON of everything except <code>signature</code>, so an index signature can never pass as a manifest’s, or the other way round. The <code>serial</code> only ever rises.`,
        `ملف واحد، <code>https://khaytapp.com/<wbr>connectors/<wbr>index.json</code>، فيه سطر لكل عنصر. يقول أيّ إصدار هو الحالي؛ أما ما يحق لذلك الإصدار فعله فهو فقط ما وقّعته خيط في ملف تعريفه. والتوقيع ed25519 على <code>${ctx}</code> يتبعها JSON القانوني لكل شيء عدا <code>signature</code>، فلا يمكن أن يمرّ توقيع فهرس على أنه توقيع ملف تعريف، ولا العكس. ولا يزيد <code>serial</code> إلا صعوداً.`)}</p>
      <pre class="ref-code" data-file="index.json"><code>${esc(JSON.stringify(exampleIndex, null, 2))}</code></pre>
      ${table(t('An index row', 'سطر في الفهرس'), t(['Key', 'Meaning'], ['المفتاح', 'المعنى']), rowRows)}

      <h2 id="outcomes">${t('What a device does with a new version', 'ما يفعله الجهاز بإصدار جديد')}</h2>
      <p>${t('A device downloads the manifest from the row’s <code>url</code>, checks its SHA-256, then the manifest’s own signature, then compares what it asks for with what the shop agreed to.',
        'ينزّل الجهاز ملف التعريف من <code>url</code> السطر، ويفحص بصمة SHA-256، ثم توقيع ملف التعريف نفسه، ثم يقارن ما يطلبه بما وافقت عليه المطبعة.')}</p>
      ${table(t('Update outcomes', 'نتائج التحديث'), t(['When the new version…', 'What happens'], ['حين يكون الإصدار الجديد…', 'ما يحدث']), outcomes)}
      <p>${t('The iPhone shows updates and the previous version, and takes the change from the shop’s Mac.',
        'يعرض الآيفون التحديثات والإصدار السابق، ويأخذ التغيير من ماك المطبعة.')}</p>

      <h2 id="revert">${t('Revert', 'التراجع')}</h2>
      <p>${t('After an update, the shop can go back to the version it had, with the permissions it had. A version a shop reverted is never installed by itself again; a later version can be.',
        'بعد التحديث، يمكن للمطبعة العودة إلى الإصدار الذي كان لديها، بالأذونات التي كانت لها. والإصدار الذي تراجعت عنه المطبعة لا يُثبَّت من تلقاء نفسه مرة أخرى؛ أما إصدار أحدث منه فيمكن.')}</p>

      <h2 id="fail-safe">${t('When the index cannot be trusted', 'حين لا يمكن الوثوق بالفهرس')}</h2>
      <p>${t('Nothing changes: no update, no pause, and every connector keeps running as it is. A device remembers the highest serial it has accepted, so an older index cannot bring back a version withdrawn since.',
        'لا يتغيّر شيء: لا تحديث ولا إيقاف، ويبقى كل موصل يعمل كما هو. ويتذكر الجهاز أعلى رقم تسلسلي قبله، فلا يستطيع فهرس أقدم أن يعيد إصداراً سُحب بعده.')}</p>
      ${table(t('Why an index is refused', 'لماذا يُرفض الفهرس'), t(['Reason', 'Meaning'], ['السبب', 'المعنى']), reasonRows)}

      <h2 id="you">${t('What this means for you', 'ماذا يعني هذا لك')}</h2>
      <p>${t('Raise <code>version</code> for every change you send for review. If a version sends the same fields to the same hosts as the one before, shops get it without being asked. If it sends anything new, every shop is asked, and some will say not now: keep the old behaviour working on your side until they agree.',
        'ارفع <code>version</code> مع كل تغيير ترسله للمراجعة. إن كان الإصدار يرسل الحقول نفسها إلى المضيفين أنفسهم كسابقه، وصل إلى المطابع دون سؤال. وإن أرسل أي شيء جديد، سُئلت كل مطبعة، وسيقول بعضها «ليس الآن»: فأبقِ السلوك القديم يعمل لديك حتى يوافقوا.')}</p>
` + tail;
  }

  function directoryPage(lang) {
    const t = tFor(lang);
    const req = new Set(['id', 'kind', 'name', 'publisher', 'summary', 'category', 'licence', 'support']);
    const listingRows = D.LISTING_KEYS.map(k => [code(k), req.has(k) ? t('Required', 'مطلوب') : t('Optional', 'اختياري'), LISTING[lang][k]]);
    return head(t, t('Listing in the directory', 'الإدراج في الدليل'),
      t('The directory on khaytapp.com shows shops what an item does before they install it. A listing is your words, links and pictures. What the item may do comes only from its signed manifest.',
        'يعرض الدليل على khaytapp.com للمطابع ما يفعله العنصر قبل أن تثبّته. والإدراج كلماتك وروابطك وصورك. أما ما يحق للعنصر فعله فيأتي فقط من ملف تعريفه الموقَّع.')) + `
      <p class="policy-tldr">${t(`<strong>Draft.</strong> The directory is not public yet. The rules below are generated from <code>lib/plugin-directory.js</code> at ${DIR_SHA.slice(0, 9)}, which is itself still a draft; the example listing passes its <code>checkListing</code>.`,
        `<strong>مسودة.</strong> الدليل غير منشور بعد. والقواعد أدناه مولَّدة من <code>lib/plugin-directory.js</code> عند ${DIR_SHA.slice(0, 9)}، وهو نفسه ما زال مسودة؛ ومثال الإدراج يجتاز <code>checkListing</code> فيه.`)}</p>

      <h2 id="listing">${t('What a listing holds', 'ما يحمله الإدراج')}</h2>
      <pre class="ref-code" data-file="listing.json"><code>${esc(JSON.stringify(exampleListing, null, 2))}</code></pre>
      ${table(t('Listing keys', 'مفاتيح الإدراج'), t(['Key', 'Required', 'Meaning'], ['المفتاح', 'مطلوب', 'المعنى']), listingRows)}
      <p>${t('Every piece of your text is shown as text. Nothing in a listing is read as HTML, and outside links open with <code>rel="noopener noreferrer"</code>.',
        'يُعرض كل نص منك نصاً. لا يُقرأ شيء في الإدراج على أنه HTML، وتُفتح الروابط الخارجية مع <code>rel="noopener noreferrer"</code>.')}</p>

      <h2 id="powers">${t('What a listing cannot say', 'ما لا يستطيع الإدراج قوله')}</h2>
      <p>${t(`A listing describes; it never grants. It may not carry ${D.GRANTING_KEYS.map(code).join(', ')}. The permissions a page shows are worked out from the signed manifest: the same rows the app’s consent sheet shows. A listing that tries is refused, for example:`,
        `الإدراج يصف ولا يمنح. لا يجوز أن يحمل ${D.GRANTING_KEYS.map(code).join('، ')}. والأذونات التي تعرضها الصفحة محسوبة من ملف التعريف الموقَّع: الأسطر نفسها التي تعرضها ورقة الموافقة في التطبيق. والإدراج الذي يحاول ذلك يُرفض، مثلاً:`)}</p>
      <pre class="ref-code" data-file="checkListing"><code>${esc(refusedErrors.map(e => '✕ ' + e).join('\n'))}</code></pre>

      <h2 id="publisher">${t('Who it is from', 'ممن هو')}</h2>
      <p>${t('Your publisher namespace is reverse-DNS, like <code>com.example</code>, and every id you list sits under it. You prove the domain to Khayt once, with a DNS TXT record <code>khayt-publisher=&lt;token&gt;</code> or a file at <code>https://example.com/.well-known/khayt-publisher</code>. The name and the verified badge on your pages come from that record, never from a listing, so nobody can appear as Khayt or as you.',
        'نطاق الناشر الخاص بك بصيغة DNS معكوسة، مثل <code>com.example</code>، وكل معرّف تدرجه يقع تحته. تثبت النطاق لخيط مرة واحدة، بسجل DNS من نوع TXT <code>khayt-publisher=&lt;token&gt;</code> أو بملف في <code>https://example.com/.well-known/khayt-publisher</code>. ويأتي الاسم وشارة التحقق في صفحاتك من ذلك السجل، لا من الإدراج، فلا يستطيع أحد أن يظهر باسم خيط أو باسمك.')}</p>

      <h2 id="review">${t('Review', 'المراجعة')}</h2>
      <ol>
        <li>${t('Send the manifest and the listing to Khayt. While the directory is new, that is by email to <a href="mailto:support@khaytapp.com">support@khaytapp.com</a>.',
          'أرسل ملف التعريف والإدراج إلى خيط. وما دام الدليل جديداً، يكون ذلك بالبريد إلى <a href="mailto:support@khaytapp.com">support@khaytapp.com</a>.')}</li>
        <li>${t('Automated checks: the manifest passes the app’s validator, its id is in your namespace, its version is higher than the last, and every domain serves https from a public address.',
          'فحوص آلية: يجتاز ملف التعريف مدقّق التطبيق، ويقع معرّفه في نطاقك، وإصداره أعلى من السابق، وكل نطاق يخدم https من عنوان عام.')}</li>
        <li>${t('A person reviews it, always for a first listing, wider permissions, a new domain or code. They see the consent sheet exactly as a shop would, and ask whether each field makes sense for what the item says it does.',
          'يراجعه شخص، دائماً عند الإدراج الأول، أو الأذونات الأوسع، أو نطاق جديد، أو الشيفرة. ويرى ورقة الموافقة كما تراها المطبعة تماماً، ويسأل هل لكل حقل معنى بالنسبة لما يقول العنصر إنه يفعله.')}</li>
        <li>${t('Khayt signs it and adds it to the <a href="../updates/">signed index</a>. Only then can a shop install it, and only then does the page offer it.',
          'توقّعه خيط وتضيفه إلى <a href="../updates/">الفهرس الموقَّع</a>. وعندها فقط يمكن للمطبعة تثبيته، وعندها فقط تعرضه الصفحة.')}</li>
      </ol>
      <p>${t('Listings are free. There are no paid items in this version.', 'الإدراج مجاني. ولا عناصر مدفوعة في هذا الإصدار.')}</p>

      <h2 id="downloads">${t('Downloads and reports', 'التنزيلات والبلاغات')}</h2>
      <p>${t(`Anything a page offers to download comes from <code>https://${D.HOST}</code> only, with the SHA-256 and size Khayt signed, and the page can check a downloaded file on the shop’s own computer. Every page has a Report button (malware, privacy, broken, impersonation, other). Khayt can withdraw a version, which pauses it on every device with the reason shown.`,
        `كل ما تعرضه الصفحة للتنزيل يأتي من <code>https://${D.HOST}</code> فقط، مع بصمة SHA-256 والحجم اللذين وقّعتهما خيط، ويمكن للصفحة فحص ملف منزَّل على حاسوب المطبعة نفسه. وفي كل صفحة زر «إبلاغ» (برمجية خبيثة، خصوصية، معطّل، انتحال، غير ذلك). ويمكن لخيط سحب إصدار، فيتوقف على كل جهاز مع عرض السبب.`)}</p>
` + tail;
  }

  return {
    pages: { updates: updatesPage, directory: directoryPage },
    docs: [
      { rel: 'developers/updates/index.html', tab: 'Updates', title: 'How updates reach shops',
        tabAr: 'التحديثات', titleAr: 'كيف تصل التحديثات إلى المطابع',
        source: () => `Generated from <code>lib/plugin-update.js</code> at ${VENDOR_SHA.slice(0, 9)}`,
        sourceAr: () => `مولَّدة من <code>lib/plugin-update.js</code> عند ${VENDOR_SHA.slice(0, 9)}` },
      { rel: 'developers/directory/index.html', tab: 'Directory', title: 'Listing in the directory',
        tabAr: 'الدليل', titleAr: 'الإدراج في الدليل',
        source: () => `Generated from <code>lib/plugin-directory.js</code> at ${DIR_SHA.slice(0, 9)} (draft)`,
        sourceAr: () => `مولَّدة من <code>lib/plugin-directory.js</code> عند ${DIR_SHA.slice(0, 9)} (مسودة)` },
    ],
    meta: {
      updates: { title: ['How updates reach shops — Khayt developers', 'كيف تصل التحديثات إلى المطابع — خيط للمطوّرين'],
        desc: ['How a new connector version reaches Khayt shops through one signed index, and when a shop is asked.', 'كيف يصل إصدار جديد من الموصل إلى مطابع خيط عبر فهرس واحد موقَّع، ومتى تُسأل المطبعة.'] },
      directory: { title: ['Listing in the directory — Khayt developers', 'الإدراج في الدليل — خيط للمطوّرين'],
        desc: ['What a Khayt directory listing may say, who it is from, and how it is reviewed.', 'ما يجوز أن يقوله إدراج في دليل خيط، وممن هو، وكيف يُراجَع.'] },
    },
  };
};
