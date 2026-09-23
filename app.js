/* ============================================================
   KHAYT — landing interactions + bilingual (EN / AR, RTL)
   Light redesign · "Console" direction · v2.3.x
   ============================================================ */
(function () {
  'use strict';

  /* ---------- i18n dictionary ---------- */
  var DICT = {
    'nav.screens':   { en: 'Screens', ar: 'الشاشات' },
    'nav.modes':     { en: 'Modes', ar: 'الأوضاع' },
    'nav.features':  { en: 'Features', ar: 'المزايا' },
    'nav.languages': { en: 'Languages', ar: 'اللغات' },
    'nav.oss':       { en: 'Open Source', ar: 'مفتوح المصدر' },
    'nav.download':  { en: 'Download', ar: 'تحميل' },
    'nav.services':  { en: 'Services', ar: 'الخدمات' },
    'nav.blog':      { en: 'Blog', ar: 'المدوّنة' },

    'meta.title': {
      en: 'Khayt \u2014 Free 3D Print Shop Management Software',
      ar: 'خيط — برنامج مجاني لإدارة مطابع الطباعة ثلاثية الأبعاد'
    },
    'meta.desc': {
      en: 'Free desktop app for 3D print shop owners. Kanban production queue, cost calculator, signed e-invoicing, live printer API, filament inventory and analytics \u2014 fully offline.',
      ar: 'تطبيق مجاني لأصحاب مطابع الطباعة ثلاثية الأبعاد. قائمة إنتاج كانبان، حاسبة تكلفة، فوترة إلكترونية للمرحلة الثانية من هيئة الزكاة، ربط مباشر بالطابعات، مخزون الخيوط وتحليلات — دون اتصال تماماً.'
    },

    'a11y.skip': { en: 'Skip to content', ar: 'تخطّ إلى المحتوى' },
    'a11y.toAr': { en: 'Switch language to Arabic', ar: 'تغيير اللغة إلى العربية' },
    'a11y.toEn': { en: 'Switch language to English', ar: 'تغيير اللغة إلى الإنجليزية' },

    'dl.nobeta': { en: 'No beta build published yet', ar: 'لا يوجد إصدار تجريبي منشور بعد' },

    'modes.cmp.caption': { en: 'What Simple and Professional each include', ar: 'ما يشمله وضع بسيط ووضع احترافي' },
    'modes.cmp.featcol': { en: 'Feature', ar: 'الميزة' },
    'modes.cmp.yes':  { en: 'Included', ar: 'متوفر' },
    'modes.cmp.no':   { en: 'Not included', ar: 'غير متوفر' },
    'modes.cmp.hint': { en: 'Swipe the table to see both columns', ar: 'اسحب الجدول لرؤية العمودين' },

    'hero.mac': {
      en: 'Khayt for macOS is being rebuilt as a native Mac app \u2014 download it now \u2192',
      ar: 'يُعاد بناء خيط لماك كتطبيق ماك أصلي — حمّله الآن ←'
    },

    'hero.pill':  { en: 'Free to use · Source available', ar: 'مجاني · المصدر متاح' },
    'hero.h1':    { en: 'One desk runs the <span class="hl">whole shop</span>.', ar: 'مكتب واحد يُدير <span class="hl">المطبعة كاملة</span>.' },
    'hero.desc':  { en: 'Khayt is the production desk for 3D print shops — quoting, Kanban queue, e-invoicing and filament inventory in one app. Entirely offline. Free. No account, no telemetry.', ar: 'خيط هو مكتب الإنتاج لمطابع الطباعة ثلاثية الأبعاد — التسعير وقائمة كانبان والفوترة الإلكترونية ومخزون الخيوط في تطبيق واحد. دون اتصال تماماً. مجاناً. بلا حساب وبلا تتبّع.' },
    'hero.dl':    { en: 'Download Free', ar: 'حمّل مجاناً' },
    'hero.github':{ en: 'View on GitHub', ar: 'عرض على GitHub' },
    'hero.os':    { en: 'No account · No telemetry', ar: 'بدون حساب · بدون تتبّع' },
    'hero.ios':   { en: 'iOS companion', ar: 'تطبيق iOS مرافق' },

    'more.features': { en: 'Show all nine features', ar: 'اعرض المزايا التسع' },
    'more.cloud':    { en: 'Show all nine services', ar: 'اعرض الخدمات التسع' },
    'more.modes':    { en: 'Show the full comparison', ar: 'اعرض المقارنة كاملة' },
    'more.less':     { en: 'Show less', ar: 'اعرض أقل' },

    'flow.eyebrow': { en: 'One continuous thread', ar: 'خيط واحد متّصل' },
    'flow.h2':      { en: 'From a file on the desk to money in the bank.', ar: 'من ملف على المكتب إلى مال في الحساب.' },
    'flow.lede':    { en: 'Khayt — <span class="ar">خيط</span> — means thread. Every job is one unbroken run: nothing is re-keyed, nothing is guessed twice, and the numbers at the end correct the estimate at the start.', ar: '<span class="ar">خيط</span> — هو الخيط نفسه. كل مهمة مسار واحد غير منقطع: لا شيء يُعاد إدخاله، ولا شيء يُخمَّن مرتين، والأرقام في النهاية تصحّح التقدير في البداية.' },
    'hero.live':  { en: '3 printers live', ar: '3 طابعات تعمل الآن' },


    'trust.lab':  { en: 'Talks live to your printers', ar: 'يتصل مباشرة بطابعاتك' },

    'gal.eyebrow':{ en: 'Every screen, purpose-built', ar: 'كل شاشة مصمّمة لغرضها' },
    'gal.h2':     { en: 'Real screens. Not mockups.', ar: 'شاشات حقيقية. لا تصاميم وهمية.' },
    'tab.queue':      { en: 'Production Queue', ar: 'قائمة الإنتاج' },
    'tab.dashboard':  { en: 'Dashboard', ar: 'لوحة التحكم' },
    'tab.calculator': { en: 'Calculator', ar: 'الحاسبة' },
    'tab.printfiles': { en: 'Print Files', ar: 'ملفات الطباعة' },
    'tab.colorstudio':{ en: 'Colour Studio', ar: 'استوديو الألوان' },
    'tab.orders':     { en: 'Orders Log', ar: 'سجل الطلبات' },
    'tab.inventory':  { en: 'Inventory', ar: 'المخزون' },
    'tab.catalog':    { en: 'Catalog', ar: 'الكتالوج' },
    'tab.analytics':  { en: 'Analytics', ar: 'التحليلات' },
    'tab.clients':    { en: 'Clients', ar: 'العملاء' },

    'modes.hobby.t':{ en: 'Printing for yourself, not for customers?', ar: 'تطبع لنفسك لا لعملاء؟' },
    'modes.hobby.d':{ en: 'Khayt is built around orders, clients and invoicing. If you just want to prep files, plan colours and keep track of filament, that\u2019s Bed Ready \u2014 a separate free app from the same workshop.', ar: '\u062e\u064a\u0637 \u0645\u0628\u0646\u064a\u0651 \u062d\u0648\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0641\u0648\u062a\u0631\u0629. \u0625\u0646 \u0643\u0646\u062a \u062a\u0631\u064a\u062f \u0641\u0642\u0637 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0648\u062a\u062e\u0637\u064a\u0637 \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062e\u064a\u0648\u0637\u060c \u0641\u0647\u0630\u0627 \u0647\u0648 Bed Ready \u2014 \u062a\u0637\u0628\u064a\u0642 \u0645\u062c\u0627\u0646\u064a \u0645\u0646\u0641\u0635\u0644 \u0645\u0646 \u0627\u0644\u0648\u0631\u0634\u0629 \u0646\u0641\u0633\u0647\u0627.' },
    'modes.hobby.cta':{ en: 'Take a look at Bed Ready', ar: '\u0627\u0637\u0651\u0644\u0639 \u0639\u0644\u0649 Bed Ready' },
    'modes.eyebrow':{ en: 'One app, two ways to run it', ar: 'تطبيق واحد بطريقتين للاستخدام' },
    'modes.h2':     { en: 'From side-business to production floor', ar: 'من عمل جانبي إلى أرضية إنتاج' },
    'modes.lede':   { en: 'Choose the mode that fits how you work. Khayt hides what you don’t need and keeps what you do — the same app grows from a personal print log to a full production business, and you can switch any time.', ar: 'اختر الوضع الذي يناسب طريقة عملك. يخفي خيط ما لا تحتاجه ويُبقي ما تحتاجه — التطبيق نفسه ينمو من سجل طباعة شخصي إلى منشأة إنتاج كاملة، ويمكنك التبديل في أي وقت.' },
    'modes.sim.pill':{ en: 'Simple', ar: 'بسيط' },
    'modes.sim.t': { en: 'A small shop, made easy', ar: 'متجر صغير بسهولة' },
    'modes.sim.d': { en: 'Everything a side-business needs — orders, clients, invoicing and revenue, plus focused sales reports. The advanced production and accounting depth stays out of the way until you want it.', ar: 'كل ما يحتاجه مشروع جانبي — طلبات، عملاء، فوترة وإيرادات، مع تقارير مبيعات مركّزة. يبقى العمق الإنتاجي والمحاسبي المتقدّم بعيداً حتى تطلبه.' },
    'modes.pro.pill':{ en: 'Professional', ar: 'احترافي' },
    'modes.pro.t': { en: 'The whole production floor', ar: 'أرضية الإنتاج بالكامل' },
    'modes.pro.d': { en: 'The full toolkit — profit margins, expenses, multi-location, team roles, deep analytics, forecasting and every integration. Built for a real print shop running at scale.', ar: 'العدّة الكاملة — هوامش الربح، المصاريف، تعدد المواقع، أدوار الفريق، تحليلات عميقة، تنبؤ وكل التكاملات. مصمّم لمطبعة حقيقية تعمل على نطاق واسع.' },
    'modes.cmp.h':  { en: 'What’s in each mode', ar: 'ما الذي يتضمّنه كل وضع' },
    'modes.cmp.sub':{ en: 'Every mode keeps the personal core. Simple adds selling and invoicing; Professional adds the full production-business depth. Nothing is locked behind a paywall — it’s all free.', ar: 'كل وضع يحتفظ بالأساسيات الشخصية. «بسيط» يضيف البيع والفوترة، و«احترافي» يضيف عمق أعمال الإنتاج الكامل. لا شيء محجوب خلف اشتراك — كل شيء مجاني.' },
    'modes.cmp.feature':{ en: 'Feature', ar: 'الميزة' },

    'feat.eyebrow':{ en: 'Everything you need', ar: 'كل ما تحتاجه' },
    'feat.h2':     { en: 'Built for print shop owners', ar: 'مصمّم لأصحاب المطابع' },
    'feat.lede':   { en: 'One app handles your entire workflow — from first quote to final invoice, entirely offline.', ar: 'تطبيق واحد يدير سير عملك بالكامل — من أول عرض سعر إلى آخر فاتورة، دون اتصال تماماً.' },

    'nav.beta':    { en: 'Cloud', ar: 'السحابة' },
    'beta.eyebrow':{ en: 'Opt-in', ar: 'اختياري' },
    'beta.h2':     { en: 'An optional cloud. Never a requirement.', ar: 'سحابة اختيارية. وليست شرطاً أبداً.' },
    'beta.lede':   { en: 'End-to-end encrypted — the server only ever sees ciphertext, and your sync passphrase never leaves your machine. Turn the cloud off and Khayt works exactly as it always has. The plans are published — $9/mo for Cloud — and every one of them is free while the beta runs. <a href="services.html">See the plans and what each service sends →</a>', ar: 'مشفّرة من طرف إلى طرف — لا يرى الخادم إلا نصاً مشفّراً، وعبارة مرور المزامنة لا تغادر جهازك. أطفئ السحابة ويعمل خيط تماماً كما كان. والخطط منشورة — 9 دولارات شهرياً للسحابة — وكلها مجانية ما دامت التجربة قائمة. <a href="services.html">اطّلع على الخطط وما ترسله كل خدمة ←</a>' },
    'beta.pill':   { en: 'BETA', ar: 'تجريبي' },

    'wn.h2':      { en: 'New since you last looked', ar: 'جديد منذ آخر زيارة' },

    'bento.quote.f1':    { en: 'Filament', ar: 'الخيط' },
    'bento.quote.f2':    { en: 'Print time', ar: 'زمن الطباعة' },
    'bento.quote.f3':    { en: 'Quote', ar: 'عرض السعر' },
    'bento.quote.f4':    { en: 'Machine & labour', ar: 'الآلة والعمالة' },
    'bento.quote.f5':    { en: 'Costs you', ar: 'يكلّفك' },
    'bento.tax.f1':      { en: 'Subtotal', ar: 'المجموع الفرعي' },
    'bento.tax.f2':      { en: 'Sales tax · 8.25%', ar: 'ضريبة المبيعات · 8.25٪' },
    'bento.tax.f3':      { en: 'Invoiced', ar: 'المفوتر' },
    'bento.library.r1':  { en: 'Network drive', ar: 'قرص شبكي' },
    'bento.library.r2':  { en: 'Object storage backup', ar: 'نسخة احتياطية سحابية' },
    'bento.library.r2s': { en: 'nightly', ar: 'كل ليلة' },

    'lang.eyebrow':{ en: '9 languages', ar: '9 لغات' },
    'lang.h2':     { en: 'Built for global makers', ar: 'مصمّم لصُنّاع العالم' },
    'lang.lede':   { en: 'Full Arabic RTL layout is a core design decision — not an afterthought. Khayt also ships in German, Spanish, French, Turkish, Chinese and Japanese, with instant switching from anywhere in the app. Portuguese (Brazil) makes nine, and dates and numbers now follow the language you picked rather than defaulting to English.', ar: 'دعم العربية من اليمين إلى اليسار قرار تصميمي أساسي، وليس إضافة لاحقة. يأتي خيط أيضاً بالألمانية والإسبانية والفرنسية والتركية والصينية واليابانية، مع تبديل فوري من أي مكان في التطبيق. وتنضم البرتغالية (البرازيل) لتصبح تسع لغات، وصارت التواريخ والأرقام تتبع اللغة التي اخترتها بدل الإنجليزية.' },
    'lang.li1':{ en: 'Arabic RTL layout throughout the entire app', ar: 'تخطيط عربي من اليمين لليسار في كامل التطبيق' },
    'lang.li2':{ en: 'Signed e-invoices — bilingual AR & EN', ar: 'فواتير المرحلة الثانية — موقّعة، ثنائية اللغة عربي وإنجليزي' },
    'lang.li3':{ en: 'Instant language switch, no restart needed', ar: 'تبديل فوري للّغة دون إعادة تشغيل' },
    'flip.lab':{ en: 'Live invoice preview', ar: 'معاينة فاتورة حيّة' },
    'theme.lab':{ en: 'Make it yours', ar: 'بلمستك الخاصة' },
    'theme.note':{ en: '8 designs · light & dark · switch any time', ar: '8 تصاميم · فاتح وداكن · بدّل في أي وقت' },
    'chip.beta': { en: 'beta', ar: 'تجريبي' },

    'oss.eyebrow':{ en: 'Source available', ar: 'المصدر متاح' },
    'oss.h2':    { en: 'Free to use.<br>Yours to inspect.', ar: 'مجاني للاستخدام.<br>وملكك لتفحّصه.' },
    'oss.lede':  { en: 'Khayt is free to use and will remain free. The source is on GitHub — read it, fork it, run it and modify it for your own shop. Licensed under the Functional Source License (FSL-1.1-Apache-2.0): the only thing you can’t do is repackage it to compete with Khayt — and each release converts to the permissive Apache-2.0 license two years after it ships. If it helps your business, consider sponsoring.', ar: 'خيط مجاني وسيبقى مجانياً. المصدر على GitHub — اقرأه وانسخه وشغّله وعدّله لمطبعتك. مرخّص بموجب رخصة Functional Source License‏ (FSL-1.1-Apache-2.0): الممنوع الوحيد هو إعادة تغليفه لمنافسة خيط — ويتحوّل كل إصدار إلى رخصة Apache-2.0 المتساهلة بعد عامين من صدوره. إن ساعد عملك فكّر في الدعم.' },
    'oss.star':   { en: 'Star on GitHub', ar: 'أضِف نجمة على GitHub' },
    'oss.sponsor':{ en: 'Sponsor', ar: 'ادعم' },
    'stat.free': { en: 'Free to use', ar: 'مجاني للاستخدام' },
    'stat.langs':{ en: 'Languages', ar: 'لغات' },
    'stat.telemetry': { en: 'Telemetry', ar: 'تتبّع' },
    'stat.keep': { en: 'Yours to keep', ar: 'ملك لك للأبد' },

    'mn.badge':  { en: 'Alpha', ar: 'ألفا' },
    'mn.h':      { en: 'Khayt for macOS, rebuilt native', ar: 'خيط لماك، مُعاد بناؤه أصليًا' },
    'mn.p':      { en: 'Not Electron in a Mac costume — a real Mac app: native windows, the menu bar, Quick Look, Shortcuts. It runs the same tax, pricing and estimator rules as the app above, unchanged and proved against them test for test, so it reads the same book and gets the same answers.',
                   ar: 'ليس إلكترون بثوب ماك — تطبيق ماك حقيقي: نوافذ أصلية، وشريط القوائم، والعرض السريع، والاختصارات. يشغّل قواعد الضريبة والتسعير والتقدير نفسها الموجودة في التطبيق أعلاه، دون تغيير ومُثبتة مقابلها اختبارًا باختبار، فيقرأ الدفتر نفسه ويعطي الإجابات نفسها.' },
    'mn.warn':   { en: 'It is an alpha. Keep the stable app installed alongside it — they read the same file, so nothing is lost either way, but an alpha is not what a shop should be billing from yet.',
                   ar: 'إنه إصدار ألفا. أبقِ التطبيق المستقر مثبّتًا إلى جانبه — كلاهما يقرأ الملف نفسه فلا يضيع شيء، لكن الألفا ليس ما ينبغي أن تصدر منه فواتيرك بعد.' },
    'mn.dl':     { en: 'Download for Apple silicon', ar: 'حمّل لمعالجات آبل' },
    'mn.updates':{ en: 'Updates itself', ar: 'يحدّث نفسه' },
    'mn.signed': { en: 'Signed & notarized', ar: 'موقّع وموثّق' },
    'mn.all':    { en: 'All Mac releases →', ar: 'كل إصدارات ماك ←' },
    'mn.road':   { en: 'Where this goes: the native Mac app becomes the main Khayt on macOS, a native Windows app follows it, and the app above keeps running everywhere — it is not going away.',
                   ar: 'إلى أين يتجه هذا: تطبيق ماك الأصلي سيصبح خيط الأساسي على ماك، ويتبعه تطبيق ويندوز أصلي، ويبقى التطبيق أعلاه يعمل في كل مكان — فهو لن يختفي.' },

    'dl.eyebrow':{ en: 'Download Khayt', ar: 'حمّل خيط' },
    'dl.h2':     { en: 'Set up shop in two minutes', ar: 'جهّز مطبعتك في دقيقتين' },
    'dl.lede':   { en: 'Free for everyone. No account. No telemetry. Your data stays on your device.', ar: 'مجاني للجميع. بدون حساب. بدون تتبّع. بياناتك تبقى على جهازك.' },
    'dl.stable': { en: 'Stable', ar: 'مستقر' },
    'dl.beta':   { en: 'Beta', ar: 'تجريبي' },
    'dl.mac':    { en: 'Signed & Notarized — opens cleanly', ar: 'موقّع وموثّق — يفتح بسلاسة' },
    'dl.win':    { en: 'Built-in auto-updater', ar: 'محدّث تلقائي مدمج' },
    'dl.linux':  { en: 'Runs anywhere, no install', ar: 'يعمل في أي مكان دون تثبيت' },
    'dl.dmg':    { en: 'Download .dmg', ar: 'حمّل .dmg' },
    'dl.exe':    { en: 'Installer (.exe)', ar: 'المثبّت (.exe)' },
    'dl.portable':{ en: 'Portable (.exe)', ar: 'نسخة محمولة (.exe)' },
    'dl.deb':    { en: 'Debian / Ubuntu (.deb)', ar: 'دبيان / أوبنتو (.deb)' },
    'dl.latest': { en: 'latest', ar: 'الأحدث' },
    'dl.srcavail':{ en: 'Source available', ar: 'المصدر متاح' },
    'dl.notel':  { en: 'No telemetry', ar: 'بدون تتبّع' },
    'dl.allrel': { en: 'All releases on GitHub →', ar: 'كل الإصدارات على GitHub ←' },

    'cl.title':  { en: 'Release history', ar: 'سجل الإصدارات' },
    'cl.all':    { en: 'View all →', ar: 'عرض الكل ←' },
    'cl.beta':   { en: 'beta', ar: 'تجريبي' },

    'foot.desc':    { en: 'The all-in-one production desk for 3D print shops — quoting, queue, invoicing and inventory, entirely offline.', ar: 'مكتب الإنتاج المتكامل لمطابع الطباعة ثلاثية الأبعاد — التسعير والقائمة والفوترة والمخزون، دون اتصال تماماً.' },
    'foot.product': { en: 'Product', ar: 'المنتج' },
    'foot.project': { en: 'Project', ar: 'المشروع' },
    'foot.releases':{ en: 'Releases', ar: 'الإصدارات' },
    'foot.community':{ en: 'Community', ar: 'المجتمع' },
    'foot.license': { en: 'License', ar: 'الرخصة' },
    'foot.made':    { en: 'Made with ♥ for the 3D printing community · Built with the help of AI', ar: 'صُنع بحب لمجتمع الطباعة ثلاثية الأبعاد · بُني بمساعدة الذكاء الاصطناعي' }
  };

  /* ---------- The languages Khayt ships in ----------
     The two hero/open-source stat tiles used to hardcode "8" while this
     section's own copy and chips said nine. One list; the tiles count it. */
  var LANGS = ['ar', 'en', 'de', 'es', 'fr', 'pt', 'tr', 'zh', 'ja'];

  /* ---------- The page's content ----------
     FEATURES, MODE_COMPARE and the cloud list moved to data.js, which
     services.html and scripts/prerender.js also read. Same lists, one copy. */
  var DATA = (window.KHAYT_DATA || { features: [], modes: [], cloud: [] });
  var RENDER = window.KHAYT_RENDER;
  var FEATURES = DATA.features;
  var FLOW = DATA.flow;

  var BETA_FEATURES = DATA.cloud;

  /* ---------- Screen gallery data ---------- */
  var SCREENS = {
    queue:      { name: { en: 'Production Queue', ar: 'قائمة الإنتاج' }, cap: { en: 'Kanban production queue', ar: 'قائمة إنتاج كانبان' }, text: { en: 'Drag orders across Pending → Printing → Post-Processing → QC → Done. Per-machine queue views, shift-start checklists, print-failure photo capture, on-hold with reason, and part-level colour assignment.', ar: 'اسحب الطلبات عبر المراحل من قيد الانتظار إلى مكتمل. عروض لكل طابعة، قوائم بدء الوردية، التقاط صور الأعطال، الإيقاف المؤقت بسبب، وتعيين ألوان القطع.' } },
    dashboard:  { name: { en: 'Dashboard', ar: 'لوحة التحكم' }, cap: { en: 'Your shop at a glance', ar: 'مطبعتك في لمحة' }, text: { en: 'Active orders, today\u2019s revenue, outstanding balances, pipeline value and days-to-clear-queue — with a monthly revenue goal forecast and live machine-load breakdown.', ar: 'الطلبات النشطة، إيرادات اليوم، الأرصدة المستحقة، قيمة المسار وأيام تفريغ القائمة — مع توقّع هدف الإيرادات الشهري وتوزيع حِمل الآلات لحظياً.' } },
    calculator: { name: { en: 'Calculator', ar: 'الحاسبة' }, cap: { en: 'Quote with confidence, not guesswork', ar: 'سعّر بثقة لا بالتخمين' }, text: { en: 'A multi-part cart costs material, machine time, electricity, labour, overhead, failure rate and margin in real time — for both FDM (grams) and Resin (mL), with G-code / 3MF auto-extraction.', ar: 'سلة متعددة القطع تحسب المادة ووقت التشغيل والكهرباء والعمالة والمصاريف ونسبة الفشل والهامش لحظياً — لكل من FDM بالغرام والراتنج بالمل، مع استخراج تلقائي من G-code و3MF.' } },
    printfiles: { name: { en: 'Print Files', ar: 'ملفات الطباعة' }, cap: { en: 'Your STL, 3MF and G-code library', ar: 'مكتبة ملفات STL و3MF وG-code' }, text: { en: 'A visual library of your print files with real preview thumbnails, extracted colours and swap counts, tested slicer notes, and one-click open in any installed slicer. Convert a 3MF to another printer and the result stays with the file.', ar: 'مكتبة مرئية لملفات الطباعة بمعاينات حقيقية، ألوان مستخرجة وعدد التبديلات، ملاحظات التقطيع المجرّبة، وفتح بنقرة في أي برنامج تقطيع مثبّت. حوّل ملف 3MF لطابعة أخرى ويبقى الناتج مع الملف.' } },
    colorstudio: { name: { en: 'Colour Studio', ar: 'استوديو الألوان' }, cap: { en: 'Match, blend and plan filament colours', ar: 'طابِق وامزج وخطّط ألوان الخيوط' }, text: { en: 'Pick a target colour and see the closest filament you already own, ranked by perceptual distance (ΔE). Blend two spools into a gradient for ombré or swap plans, and assign each colour of a multicolour print to a spool — with cost pushed straight to the calculator.', ar: 'اختر لوناً هدفاً وشاهد أقرب خيط تملكه مرتّباً حسب الفرق اللوني (ΔE). امزج بكرتين في تدرّج لخطط الأومبريه أو التبديل، وعيّن كل لون في طباعة متعددة الألوان لبكرة — مع دفع التكلفة مباشرة للحاسبة.' } },
    orders:     { name: { en: 'Orders Log', ar: 'سجل الطلبات' }, cap: { en: 'From quote to paid, in one log', ar: 'من العرض إلى السداد في سجل واحد' }, text: { en: 'Every order tracked end-to-end with signed e-invoices, TLV QR codes, proforma invoices, milestone billing, BNPL payment links, PDF export and WhatsApp or email delivery.', ar: 'كل طلب متتبّع من البداية للنهاية بفواتير المرحلة الثانية ورمز QR وفواتير مبدئية وفوترة بالمراحل وروابط دفع آجل وتصدير PDF وإرسال عبر واتساب أو البريد.' } },
    inventory:  { name: { en: 'Inventory', ar: 'المخزون' }, cap: { en: 'Never start a print you can\u2019t finish', ar: 'لا تبدأ طباعة لا يمكنك إكمالها' }, text: { en: 'Track FDM spools and Resin bottles with auto-deduction on completion, FIFO cost, smart reorder alerts with draft purchase orders, drying logs and price history.', ar: 'تتبّع خيوط FDM وزجاجات الراتنج مع الخصم التلقائي عند الإكمال، تكلفة FIFO، تنبيهات إعادة طلب ذكية بأوامر شراء، سجلات التجفيف وسجل الأسعار.' } },
    analytics:  { name: { en: 'Analytics', ar: 'التحليلات' }, cap: { en: 'Know exactly where the money goes', ar: 'اعرف أين يذهب المال بالضبط' }, text: { en: 'Revenue trends, machine P&L, operator performance, filament usage, retention and a production heatmap — in Simple or Professional reporting modes, with end-of-day PDFs.', ar: 'اتجاهات الإيرادات، أرباح كل آلة، أداء المشغّلين، استهلاك الخيوط، الاحتفاظ وخريطة حرارية للإنتاج — بوضع بسيط أو احترافي، مع تقارير PDF لنهاية اليوم.' } },
    clients:    { name: { en: 'Clients', ar: 'العملاء' }, cap: { en: 'Turn buyers into regulars', ar: 'حوّل المشترين إلى عملاء دائمين' }, text: { en: 'Client profiles with credit limits, multi-currency, loyalty tiers with automatic discounts, a live customer portal with QR order tracking and an aged-receivables report.', ar: 'ملفات عملاء بحدود ائتمانية وتعدد عملات ومستويات ولاء بخصومات تلقائية، بوابة عملاء حيّة بتتبّع QR وتقرير الذمم المدينة.' } },
    catalog:    { name: { en: 'Catalog', ar: 'الكتالوج' }, cap: { en: 'Reusable products, one-tap quotes', ar: 'منتجات جاهزة وتسعير بلمسة' }, text: { en: 'Save any part as a reusable product SKU with its slicer settings and price, then quote it in one tap. Track per-product revenue and print history, import in bulk via CSV.', ar: 'احفظ أي قطعة كمنتج جاهز بإعداداته وسعره، ثم سعّره بلمسة. تتبّع إيراد كل منتج وسجل طباعته، واستورد دفعة عبر CSV.' } },
    giftcards:  { name: { en: 'Gift Cards', ar: 'بطاقات الهدايا' }, cap: { en: 'Sell credit, redeem at checkout', ar: 'بِع رصيداً واستخدمه عند الدفع' }, text: { en: 'Issue gift cards and store credit with balance and optional expiry tracking. Redeem directly in the payment modal, with full status history (Active / Used).', ar: 'أصدر بطاقات هدايا ورصيداً بتتبّع الرصيد وتاريخ انتهاء اختياري. استخدمها مباشرة في نافذة الدفع مع سجل حالة كامل (نشطة / مستخدمة).' } },
    portfolio:  { name: { en: 'Portfolio', ar: 'المعرض' }, cap: { en: 'Show off your finished work', ar: 'اعرض أعمالك المنتهية' }, text: { en: 'A gallery built automatically from your finished-order photos — browse by project or order number, and reveal the source photos folder in one click.', ar: 'معرض يُبنى تلقائياً من صور الطلبات المنتهية — تصفّح بحسب المشروع أو رقم الطلب، واكشف مجلد الصور بنقرة.' } },
    waste:      { name: { en: 'Waste Log', ar: 'سجل الهدر' }, cap: { en: 'Every failed print, counted', ar: 'كل طباعة فاشلة، محسوبة' }, text: { en: 'Log failed prints with a failure category, scrapped weight and the real material cost lost — so waste shows up in analytics instead of quietly eating your margin.', ar: 'سجّل الطبعات الفاشلة بفئة العطل والوزن المهدور والتكلفة الفعلية المفقودة — ليظهر الهدر في التحليلات بدل أن يلتهم هامشك بصمت.' } }
  };

  /* ---------- Release history (descriptions; dates refreshed from GitHub) ----------
     Keep this list current when a stable version ships. It is not a fallback that
     only shows when the network fails: every GitHub release body is the same
     "See [README] for full release notes." boilerplate, so the API can say which
     versions exist and when, and never what changed. The words below are the only
     description a visitor ever reads, and the only Arabic one. */
  var CHANGELOG = [
    { v: '3.6.0', date: '2026-08-21', beta: false, d: { en: 'Costs measured, not guessed — a model on the calculator becomes a quote, and a finished job reports the filament and hours it actually used so the next estimate corrects itself', ar: 'تكاليف مقاسة لا مُخمَّنة — يتحول المجسم في الحاسبة إلى عرض سعر، وتُبلّغ المهمة المنتهية بما استُهلك فعلاً من خيط وساعات فيصحّح التقدير التالي نفسه' } },
    { v: '3.5.0', date: '2026-07-30', beta: false, d: { en: 'Organisations — one passphrase across every branch, and an operator-lock recovery code that survives long enough to read', ar: 'المنشآت — عبارة مرور واحدة لكل فرع، ورمز استرداد لقفل المشغّل يبقى مدة تكفي لقراءته' } },
    { v: '3.4.0', date: '2026-07-29', beta: false, d: { en: 'Nine languages with dates and numbers that follow them, eight designs, and “today” taken from your calendar rather than UTC', ar: 'تسع لغات مع تواريخ وأرقام تتبعها، وثمانية تصاميم، و«اليوم» من تقويمك لا من UTC' } },
    { v: '3.4.0-beta.4', date: '2026-07-27', beta: true, d: { en: 'Eight designs including the new board-first Flow, a ninth language, and dates that follow your language', ar: 'ثمانية تصاميم منها «فلو» القائم على اللوحة، ولغة تاسعة، وتواريخ تتبع لغتك' } },
    { v: '3.3.0', date: '2026-07-26', beta: false, d: { en: 'Money integrity — voided invoices and refunds reduce revenue, deposits survive edits, archived orders release stock', ar: 'سلامة الأرقام — الفواتير الملغاة والمبالغ المستردة تخفض الإيراد، والعرابين تبقى، والطلبات المؤرشفة تحرّر المخزون' } },
    { v: '3.2.0', date: '2026-07-22', beta: false, d: { en: 'Quoting now counts part quantities correctly; assembly tracking, printer discovery, per-printer camera and scoped API tokens', ar: 'التسعير يحتسب كميات القطع بشكل صحيح؛ تتبّع التجميع، اكتشاف الطابعات، كاميرا لكل طابعة، ورموز API محدودة الصلاحية' } },
    { v: '3.1.0', date: '2026-07-05', beta: false, d: { en: 'Enthusiast mode, Print-File Library, Colour Mixer suite, multi-slicer & 3MF Converter', ar: 'وضع الهواة، مكتبة ملفات الطباعة، أدوات مزج الألوان، تعدد برامج التقطيع ومحوّل 3MF' } },
    { v: '3.0.0', date: '2026-07-04', beta: false, d: { en: 'Khayt 3.0 stable — optional E2E-encrypted cloud: sync, teams, storefront, portal & AI assistant', ar: 'خيط 3.0 مستقر — سحابة اختيارية مشفّرة: مزامنة، فِرق، متجر، بوابة ومساعد ذكي' } },
    { v: '2.3.3', date: '2026-06-11', beta: false, d: { en: 'LAN tunnel & customer-portal hardening', ar: 'تحسين نفق الشبكة وبوابة العملاء' } },
    { v: '2.3.0', date: '2026-06-04', beta: false, d: { en: 'Security & stability release — LAN order tracking tokens', ar: 'إصدار أمان واستقرار — رموز تتبّع الطلبات' } },
    { v: '2.2.0', date: '2026-05-30', beta: false, d: { en: 'Gift cards, Phase 2 e-invoicing, LAN quote approval', ar: 'بطاقات هدايا، فاتورة المرحلة الثانية، اعتماد العروض' } },
    { v: '2.1.0', date: '2026-05-30', beta: false, d: { en: 'Modular renderer, store validation, expanded tests', ar: 'بنية معيارية، التحقق من البيانات، اختبارات موسّعة' } }
  ];

  var lang = 'en', curKey = 'queue', channel = 'stable', curTheme = 'workbench';
  var CHANNELS = { stable: null, beta: null }; // filled from GitHub

  // In-app design demo — every design a user can pick, in the order the app
  // presents them. Nocturne is captured dark because that is what it is for.
  var THEMES = [
    { id: 'workbench', label: { en: 'Workbench', ar: 'وركبنش' }, tone: 'light' },
    { id: 'command',   label: { en: 'Command',   ar: 'كوماند' }, tone: 'light' },
    { id: 'vivid',     label: { en: 'Vivid',     ar: 'فيفِد' }, tone: 'light' },
    { id: 'blueprint', label: { en: 'Blueprint', ar: 'بلوبرنت' }, tone: 'light', beta: true },
    { id: 'nocturne',  label: { en: 'Nocturne',  ar: 'نوكتيرن' }, tone: 'dark',  beta: true },
    { id: 'meridian',  label: { en: 'Meridian',  ar: 'ميريديان' }, tone: 'light', beta: true },
    { id: 'foreman',   label: { en: 'Foreman',   ar: 'فورمان' }, tone: 'light', beta: true },
    { id: 'flow',      label: { en: 'Flow',      ar: 'فلو' }, tone: 'light', beta: true }
  ];

  function t(key) { return DICT[key] ? DICT[key][lang] : key; }

  // The CSS reduces every transition to ~0 under prefers-reduced-motion, which
  // would leave the gallery image sitting at opacity 0 for the length of the
  // timeout that was going to restore it. Swap straight through instead.
  function calmed() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // Every screenshot ships as a WebP beside its PNG (scripts/make-webp.js);
  // <picture> picks. Setting img.src alone does NOT move a <picture> off its
  // <source>, so both have to change or the browser keeps serving the old
  // WebP under the new PNG's alt text.
  function swapShot(img, src, alt) {
    if (!img) return;
    var source = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement.querySelector('source[type="image/webp"]') : null;
    var webp = src.replace(/\.png$/, '.webp');

    function set() {
      if (source) source.srcset = webp;
      img.src = src;
      if (alt) img.alt = alt;
      img.style.opacity = '1';
    }

    if (calmed()) { set(); return; }

    // The old code faded out, waited a fixed 170ms, then set src — so the
    // network fetch started at the moment the image became visible again and
    // the frame in between was blank or stale. Fetch first, swap when it is
    // decoded, and the fade covers a picture that is already there.
    img.style.opacity = '0';
    var pre = new Image();
    pre.src = supportsWebp ? webp : src;
    var done = false;
    function go() { if (!done) { done = true; set(); } }
    var decoded = pre.decode ? pre.decode() : Promise.reject();
    decoded.then(go, go);
    // A decode that never settles must not leave the gallery blank.
    setTimeout(go, 1200);
  }

  // One synchronous check, not a fetch: a browser that renders this 2x2 WebP
  // reports a natural width. Used only to decide which file to prefetch —
  // <picture> makes the real decision on its own.
  var supportsWebp = (function () {
    try {
      var c = document.createElement('canvas');
      return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { return false; }
  })();

  // Warm the image while the pointer is still travelling to the tab. Costs
  // nothing for anyone who does not reach for one, and removes the wait for
  // everyone who does.
  var warmed = {};
  function warm(src) {
    if (!src || warmed[src]) return;
    warmed[src] = true;
    var i = new Image();
    i.src = supportsWebp ? src.replace(/\.png$/, '.webp') : src;
  }

  // Screenshot path — themed, with Arabic RTL captures for every theme.
  // Workbench (default) uses the flat set; the others live under themes/<id>/.
  function shotPath(key) {
    var pre = lang === 'ar' ? 'ar-' : '';
    if (curTheme === 'workbench') return 'screenshots/screenshot-' + pre + key + '.png';
    return 'screenshots/themes/' + curTheme + '/screenshot-' + pre + key + '.png';
  }
  function heroPath() { return 'screenshots/screenshot-' + (lang === 'ar' ? 'ar-' : '') + 'queue.png'; }

  var MODE_COMPARE = DATA.modes;

  function buildModesTable() {
    var el = document.getElementById('modesTable');
    if (!el) return;
    el.innerHTML = RENDER.modesTable(MODE_COMPARE, lang, {
      simple: t('modes.sim.pill'), professional: t('modes.pro.pill'),
      caption: t('modes.cmp.caption'), featcol: t('modes.cmp.featcol'),
      yes: t('modes.cmp.yes'), no: t('modes.cmp.no')
    });
    // An overflow-x container is not focusable by default, so a keyboard user
    // cannot scroll it at all. Labelled, because a bare focusable region
    // announces nothing.
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', t('modes.cmp.caption'));
    syncCmpScroll(el);
  }

  // Drives the fade, the frozen-pane divider and the worded hint off one
  // measurement, on load, on scroll and on resize — a phone that rotates is a
  // phone whose table may now fit. All three are suppressed when it does fit,
  // so nothing ever points at content that is not off-screen.
  function syncCmpScroll(el) {
    el = el || document.getElementById('modesTable');
    if (!el) return;
    var frame = document.getElementById('cmpFrame') || el.parentElement;
    var hint = document.getElementById('cmpHint');
    function paint() {
      var slack = el.scrollWidth - el.clientWidth;
      var scrollable = slack > 2;
      frame.classList.toggle('is-scrollable', scrollable);
      // scrollLeft runs negative in RTL in every engine that matters now.
      frame.classList.toggle('at-end', scrollable && Math.abs(el.scrollLeft) >= slack - 2);
      if (hint) hint.hidden = !scrollable;
    }
    if (!el.__cmpWired) {
      el.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint, { passive: true });
      // Measured again once the webfonts land. The first measurement runs with
      // fallback faces, which are wider: the table overflowed, the hint said
      // "swipe" — and then Archivo and Hanken loaded, the table fitted, and
      // nothing re-measured. The hint was pointing at nothing on every phone.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
      el.__cmpWired = true;
    }
    paint();
  }

  function buildFeatures() {
    var grid = document.getElementById('featGrid');
    if (!grid) return;
    grid.innerHTML = RENDER.features(FEATURES, lang);
  }

  function buildFlow() {
    var list = document.getElementById('flowSteps');
    if (!list) return;
    list.innerHTML = RENDER.flow(FLOW, lang);
  }

  function buildBetaFeatures() {
    var grid = document.getElementById('betaGrid');
    if (!grid) return;
    grid.innerHTML = RENDER.cloud(BETA_FEATURES, lang, t('beta.pill'));
  }

  function buildChangelog() {
    var list = document.getElementById('clList');
    if (!list) return;
    var html = '';
    for (var i = 0; i < CHANGELOG.length; i++) {
      var c = CHANGELOG[i];
      html += '<div class="cl-row">' +
        '<span class="cl-ver' + (c.beta ? ' beta' : '') + '">v' + c.v + '</span>' +
        '<div class="cl-body"><div class="cd">' + (c.beta ? (t('cl.beta') + ' · ') : '') + c.d[lang] + '</div></div>' +
        '<span class="cl-date">' + c.date + '</span></div>';
    }
    list.innerHTML = html;
  }

  function buildTitle(name) { return 'Khayt — <b>' + name + '</b>'; }

  function paintCaption() {
    var s = SCREENS[curKey]; if (!s) return;
    var title = document.getElementById('galTitle');
    var capT = document.getElementById('capTitle');
    var capP = document.getElementById('capText');
    if (title) title.innerHTML = buildTitle(s.name[lang]);
    if (capT) capT.textContent = s.cap[lang];
    if (capP) capP.textContent = s.text[lang];
  }

  function applyLang(next) {
    lang = (next === 'ar') ? 'ar' : 'en';
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (DICT[key]) nodes[i].textContent = DICT[key][lang];
    }
    var htmlNodes = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlNodes.length; j++) {
      var hk = htmlNodes[j].getAttribute('data-i18n-html');
      if (DICT[hk]) htmlNodes[j].innerHTML = DICT[hk][lang];
    }
    buildFeatures();
    buildFlow();
    buildBetaFeatures();
    buildModesTable();
    buildChangelog();
    paintCaption();
    capGrids();
    // swap gallery + hero screenshots to match language (EN / AR-RTL)
    var gi = document.getElementById('galImg');
    if (gi) {
      gi.src = shotPath(curKey);
      var gsrc = document.getElementById('galSrc');
      if (gsrc) gsrc.srcset = shotPath(curKey).replace(/\.png$/, '.webp');
    }
    var hs = document.getElementById('heroShot');
    if (hs) {
      hs.src = heroPath();
      var hsrc = document.getElementById('heroSrc');
      if (hsrc) hsrc.srcset = heroPath().replace(/\.png$/, '.webp');
    }
    buildThemeChips();
    var btn = document.getElementById('navLang');
    if (btn) {
      // The label is the language you are switching TO, written in that
      // language, so it carries its own lang or an English screen reader
      // voices Arabic glyphs with an English voice.
      var toAr = lang !== 'ar';
      btn.innerHTML = '<span aria-hidden="true">🌐</span> ' +
        (toAr ? '<span lang="ar">العربية</span>' : '<span lang="en">English</span>');
      btn.setAttribute('aria-label', t(toAr ? 'a11y.toAr' : 'a11y.toEn'));
    }

    // The page's own metadata was staying English while the page turned
    // Arabic — so a shared link, a search result and a social card all
    // described a page nobody was looking at.
    document.title = t('meta.title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta.desc'));
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', t('meta.title'));
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', t('meta.desc'));
    var ogl = document.querySelector('meta[property="og:locale"]');
    if (ogl) ogl.setAttribute('content', lang);

    // Arabic becomes a URL rather than a private localStorage flag: linkable,
    // shareable, and the thing the hreflang tags in <head> actually point at.
    try {
      var u = new URL(window.location.href);
      if (lang === 'ar') u.searchParams.set('lang', 'ar'); else u.searchParams.delete('lang');
      history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) {}

    // The lede was just re-rendered from the dictionary; put the resolved
    // version back over the placeholder it carries.
    if (curVer) setVersionTags(curVer);

    var counts = document.querySelectorAll('[data-stat="langs"]');
    for (var k = 0; k < counts.length; k++) counts[k].textContent = String(LANGS.length);
    var card = document.getElementById('flipCard');
    var sw = document.getElementById('flipSwitch');
    if (card && sw) setFlip(card, sw, lang === 'ar');
    try { localStorage.setItem('khayt-lang', lang); } catch (e) {}
  }

  /* ---------- Phone disclosures ----------
     The cap is applied from here, not from CSS: if this script never runs, the
     grids must render whole rather than cropped with an inert button. */
  function capGrids() {
    var btns = document.querySelectorAll('.grid-more');
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      var g = document.getElementById(btn.getAttribute('data-grid'));
      if (!g) continue;
      var open = btn.getAttribute('aria-expanded') === 'true';
      g.classList.toggle('is-capped', !open);
      if (open) btn.querySelector('span').textContent = t('more.less');
    }
  }

  function wireGrids() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('.grid-more');
      if (!btn) return;
      var g = document.getElementById(btn.getAttribute('data-grid'));
      if (!g) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      g.classList.toggle('is-capped', open);
      var label = btn.querySelector('span');
      var key = label.getAttribute('data-i18n');
      label.textContent = open ? t(key) : t('more.less');
    });
  }

  /* ---------- Theme switcher (in-app theme demo) ----------
     Dormant: the redesign took the chip row out of index.html, so there is no
     #themeChips element and both functions below return immediately. They are
     kept because the eight themes and their screenshots still exist — putting
     `<div class="theme-chips" id="themeChips"></div>` back in the gallery is
     the whole of restoring the demo. */
  function buildThemeChips() {
    var bar = document.getElementById('themeChips');
    if (!bar) return;
    var html = '';
    for (var i = 0; i < THEMES.length; i++) {
      var th = THEMES[i];
      html += '<button class="theme-chip tone-' + th.tone + (th.id === curTheme ? ' on' : '') + '" data-theme="' + th.id + '">' +
        '<span class="sw"></span>' + th.label[lang] +
        (th.beta ? '<span class="chip-beta">' + t('chip.beta') + '</span>' : '') + '</button>';
    }
    bar.innerHTML = html;
  }
  function themeSwitch() {
    var bar = document.getElementById('themeChips');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-chip');
      if (!btn) return;
      curTheme = btn.getAttribute('data-theme');
      var all = bar.querySelectorAll('.theme-chip');
      for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === btn);
      for (var j = 0; j < all.length; j++) all[j].setAttribute('aria-pressed', all[j] === btn ? 'true' : 'false');
      swapShot(document.getElementById('galImg'), shotPath(curKey));
    });

    function hint(e) {
      var chip = e.target.closest && e.target.closest('.theme-chip');
      if (!chip) return;
      var id = chip.getAttribute('data-theme');
      var pre = lang === 'ar' ? 'ar-' : '';
      warm(id === 'workbench'
        ? 'screenshots/screenshot-' + pre + curKey + '.png'
        : 'screenshots/themes/' + id + '/screenshot-' + pre + curKey + '.png');
    }
    bar.addEventListener('pointerover', hint);
    bar.addEventListener('focusin', hint);
  }

  /* ---------- Screen gallery ---------- */
  function tabs() {
    var bar = document.getElementById('tabs');
    if (!bar) return;
    var img = document.getElementById('galImg');
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      if (!SCREENS[key]) return;
      curKey = key;
      var all = bar.querySelectorAll('.tab');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-selected', 'false');
      btn.setAttribute('aria-selected', 'true');
      swapShot(img, shotPath(key), 'Khayt ' + SCREENS[key].name.en + ' screenshot');
      paintCaption();
    });

    // Pointer travel and keyboard focus both give a head start on the fetch.
    function hint(e) {
      var btn = e.target.closest && e.target.closest('.tab');
      if (btn) warm(shotPath(btn.getAttribute('data-key')));
    }
    bar.addEventListener('pointerover', hint);
    bar.addEventListener('focusin', hint);
  }

  /* ---------- Bilingual flip card ---------- */
  function flip() {
    var sw = document.getElementById('flipSwitch');
    var card = document.getElementById('flipCard');
    if (!sw || !card) return;
    sw.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      setFlip(card, sw, btn.getAttribute('data-side') === 'back');
    });
  }
  function setFlip(card, sw, back) {
    card.classList.toggle('flipped', back);
    var btns = sw.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++)
      btns[i].classList.toggle('on', (btns[i].getAttribute('data-side') === 'back') === back);
  }

  /* ---------- Nav: scroll state + mobile menu ---------- */
  function nav() {
    var el = document.getElementById('nav');
    var burger = document.getElementById('burger');
    function onScroll() { el.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    function setOpen(open) {
      el.classList.toggle('open', open);
      if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (burger) burger.addEventListener('click', function () { setOpen(!el.classList.contains('open')); });
    var links = document.getElementById('navLinks');
    if (links) links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
  }

  /* ---------- Language toggle ---------- */
  function langToggle() {
    var btn = document.getElementById('navLang');
    if (!btn) return;
    btn.addEventListener('click', function () { applyLang(lang === 'ar' ? 'en' : 'ar'); });
  }

  /* ---------- Download channel (stable / beta) ---------- */
  function channelToggle() {
    var bar = document.getElementById('dlChannel');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      channel = btn.getAttribute('data-channel');
      var btns = bar.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i] === btn;
        btns[i].classList.toggle('on', on);
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      }
      applyChannel();
    });
  }

  function applyChannel() {
    var rel = CHANNELS[channel];
    // update headline version chips for stable; beta uses its own tag
    if (channel === 'stable') {
      var v = (CHANNELS.stable && CHANNELS.stable.v) || '3.4.0';
      setVersionTags(v);
      var metaV = document.getElementById('dlMetaVer');
      if (metaV) metaV.querySelector('.ver-tag').textContent = 'v' + v;
    } else {
      var bv = (CHANNELS.beta && CHANNELS.beta.v) || null;
      var metaB = document.getElementById('dlMetaVer');
      if (metaB) metaB.querySelector('.ver-tag').textContent = bv ? ('v' + bv) : 'v3.4.0-beta.5';
      if (!bv) {
        // no beta available — keep links on stable, note in console
      }
    }
    wireDownloadLinks(rel || CHANNELS.stable);
  }

  // Remembered so applyLang can re-apply it: switching language rewrites the
  // "What's new" lede from the dictionary, which would otherwise put the
  // hardcoded version back over the one the release fetch resolved.
  var curVer = null;

  function setVersionTags(v) {
    curVer = v;
    var tags = document.querySelectorAll('.ver-tag');
    for (var i = 0; i < tags.length; i++) tags[i].textContent = 'v' + v;
    // The "What's new" lede names the release in prose. It said 3.6 while the
    // chip beside it said v3.7.0, because the release-sync workflow rewrites
    // "3.7.0" and this sentence had been written "3.6" by hand. Deriving the
    // major.minor from the same version the chips use is the only spelling
    // that cannot go stale.
    var mm = v.split('.').slice(0, 2).join('.');
    var mms = document.querySelectorAll('.ver-mm');
    for (var j = 0; j < mms.length; j++) mms[j].textContent = mm;
  }

  function fmtMB(b) { return Math.round(b / 1048576) + ' MB'; }

  function wireDownloadLinks(rel) {
    if (!rel || !rel.assets) return;
    var assets = rel.assets;
    function find(re) { for (var i = 0; i < assets.length; i++) if (re.test(assets[i].name)) return assets[i]; return null; }
    // electron-builder names the portable target "Khayt-<version>.exe" and the
    // NSIS installer "Khayt-Setup-<version>.exe". Neither carries the word
    // "portable", so the portable build is identified by exclusion.
    function findPortable() {
      for (var i = 0; i < assets.length; i++) {
        var n = assets[i].name;
        if (/\.exe$/i.test(n) && !/setup/i.test(n) && !/\.blockmap$/i.test(n)) return assets[i];
      }
      return null;
    }
    var map = { 'mac-dmg': find(/arm64\.dmg$/i), 'win-exe': find(/setup.*\.exe$/i), 'win-portable': findPortable(), 'linux-appimage': find(/\.AppImage$/i), 'linux-deb': find(/\.deb$/i) };
    Object.keys(map).forEach(function (key) {
      var a = map[key]; if (!a) return;
      var link = document.querySelector('[data-dl="' + key + '"]');
      if (!link) return;
      link.setAttribute('href', a.browser_download_url);
      link.removeAttribute('target');
      link.removeAttribute('rel');
      var sz = link.querySelector('.b');
      if (sz) { var arch = sz.textContent.split('\u00b7')[0].trim(); sz.textContent = arch + ' \u00b7 ' + fmtMB(a.size); }
    });
  }

  /* ---------- GitHub releases (stable + beta + changelog) ---------- */
  // Compare versions like "3.0.0-beta.11" — numeric core, then a stable release
  // ranks above a prerelease of the same core, then beta number. Returns >0 if a>b.
  // (The GitHub API does NOT return releases in version order, so we must sort.)
  function cmpVer(a, b) {
    function parse(v) {
      var m = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.?(\d+)?)?$/i.exec(String(v).replace(/^v/, ''));
      if (!m) return null;
      return { core: [+m[1], +m[2], +m[3]], pre: m[4] ? (m[4] + '.' + (m[5] || 0)) : '', preNum: m[5] ? +m[5] : 0, isPre: !!m[4] };
    }
    var pa = parse(a), pb = parse(b);
    if (!pa || !pb) return String(b).localeCompare(String(a));
    for (var i = 0; i < 3; i++) if (pa.core[i] !== pb.core[i]) return pa.core[i] - pb.core[i];
    if (pa.isPre !== pb.isPre) return pa.isPre ? -1 : 1; // stable > prerelease of same core
    return pa.preNum - pb.preNum;
  }

  function shortNote(rel) {
    var body = (rel.body || '').replace(/\r/g, '');
    var line = body.split('\n').find(function (l) { return l.trim().length > 0 && !/^#/.test(l); });
    if (!line) return { en: rel.name || rel.tag_name, ar: rel.name || rel.tag_name };
    // Unwrap markdown links to their text. The body is rendered as plain text, so
    // an un-stripped `[README](https://…)` printed its own brackets and URL on the
    // page — which is exactly what the boilerplate body is made of.
    line = line.replace(/^[-*\s]+/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
               .replace(/\*\*/g, '').replace(/`/g, '').slice(0, 90);
    return { en: line, ar: line };
  }

  function fetchReleases() {
    if (!window.fetch) return;
    // 30, not 12: a long beta run pushes the newest STABLE out of a 12-release
    // window, and then there is no stable to point the download buttons at.
    // 3.6.0 alone shipped 19 betas plus 4 rcs.
    fetch('https://api.github.com/repos/khaytapp/Khayt/releases?per_page=30', { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rels) {
        if (!rels || !rels.length) return;
        // The API does not guarantee version order — collect, then sort by semver.
        var pub = [];
        for (var i = 0; i < rels.length; i++) {
          var rel = rels[i];
          if (rel.draft) continue;
          pub.push({ v: String(rel.tag_name).replace(/^v/, ''), rel: rel, beta: !!rel.prerelease });
        }
        pub.sort(function (a, b) { return cmpVer(b.v, a.v); }); // newest first
        var stable = null, beta = null;
        for (var j = 0; j < pub.length; j++) {
          if (!stable && !pub[j].beta) stable = pub[j];
          if (!beta && pub[j].beta) beta = pub[j];
        }
        // Only surface the beta channel when a prerelease is actually newer than
        // stable — after a stable release the latest beta is older, so hide it.
        if (beta && stable && cmpVer(beta.v, stable.v) <= 0) beta = null;
        // The curated list is the BACKBONE of the release history, not a fallback.
        // GitHub supplies only what it is authoritative about: publish dates, and
        // any stable release newer than the newest one written up here.
        //
        // Two things this avoids. Overwriting wholesale put the same boilerplate
        // body on every row, in English even in Arabic. And filtering that same
        // window down to stable leaves almost nothing — a beta run fills the page,
        // so after 3.6.0 shipped a 12-release window held exactly one stable.
        //
        // Prereleases are deliberately absent: the beta button on the download card
        // is where they belong. Listing them here buried every stable release.
        var dates = {}, known = {}, newest = '';
        for (var d = 0; d < pub.length; d++) { dates[pub[d].v] = (pub[d].rel.published_at || '').slice(0, 10); }
        for (var c = 0; c < CHANGELOG.length; c++) {
          known[CHANGELOG[c].v] = true;
          if (!CHANGELOG[c].beta && (!newest || cmpVer(CHANGELOG[c].v, newest) > 0)) newest = CHANGELOG[c].v;
        }
        // Only a stable release NEWER than anything written up above earns a row of
        // its own, so a release that ships before someone writes the copy still
        // appears (with its boilerplate body) instead of silently missing. Older
        // uncurated patches are left out rather than padding the list with rows
        // that all read "See README for full release notes."
        var fresh = pub.filter(function (e) {
          return !e.beta && !known[e.v] && cmpVer(e.v, newest) > 0;
        }).map(function (e) {
          return { v: e.v, date: dates[e.v] || '', beta: false, d: shortNote(e.rel) };
        });
        var cl = fresh.concat(CHANGELOG.filter(function (e) { return !e.beta; }).map(function (e) {
          return { v: e.v, date: dates[e.v] || e.date, beta: false, d: e.d };
        })).sort(function (a, b) { return cmpVer(b.v, a.v); }).slice(0, 5);
        if (stable) { CHANNELS.stable = { v: stable.v, assets: stable.rel.assets }; }
        if (beta) {
          CHANNELS.beta = { v: beta.v, assets: beta.rel.assets };
          var bbtn = document.querySelector('#dlChannel .ver-beta');
          if (bbtn) bbtn.textContent = 'v' + beta.v;
          // The markup ships the beta tab disabled, because "no beta" is the
          // normal state and a tab that is live before the fetch resolves is a
          // tab that can be clicked into an empty channel.
          var betaOn = document.querySelector('#dlChannel [data-channel="beta"]');
          if (betaOn) { betaOn.disabled = false; betaOn.style.opacity = ''; betaOn.removeAttribute('title'); }
        } else {
          // no beta channel published — disable beta button gracefully
          var betaBtn = document.querySelector('#dlChannel [data-channel="beta"]');
          if (betaBtn) { betaBtn.disabled = true; betaBtn.style.opacity = '0.5'; betaBtn.querySelector('.ver-beta').textContent = '—'; betaBtn.title = t('dl.nobeta'); }
        }
        if (cl.length) { CHANGELOG = cl; buildChangelog(); }
        // refresh visible channel
        applyChannel();
      })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    // An explicit ?lang= in the link beats whatever this browser last chose:
    // someone following an Arabic link wants the Arabic page, even if they
    // read the site in English yesterday.
    var saved = 'en';
    try { saved = localStorage.getItem('khayt-lang') || 'en'; } catch (e) {}
    try {
      var q = new URL(window.location.href).searchParams.get('lang');
      if (q === 'ar' || q === 'en') saved = q;
    } catch (e) {}
    tabs();
    flip();
    nav();
    langToggle();
    channelToggle();
    themeSwitch();
    wireGrids();
    applyLang(saved);
    fetchReleases();
  });
})();
