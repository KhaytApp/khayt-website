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
    'nav.whatsnew':  { en: "What's New", ar: 'الجديد' },
    'nav.languages': { en: 'Languages', ar: 'اللغات' },
    'nav.oss':       { en: 'Open Source', ar: 'مفتوح المصدر' },
    'nav.download':  { en: 'Download', ar: 'تحميل' },

    'hero.pill':  { en: 'Free to use · Source available', ar: 'مجاني · المصدر متاح' },
    'hero.h1':    { en: 'Run your print shop like a <span class="hl">studio</span>', ar: 'أدِر مطبعتك <span class="hl">كأنها استوديو</span>' },
    'hero.desc':  { en: 'The all-in-one production desk for 3D print shops — quoting, queue, ZATCA invoicing and inventory, entirely offline.', ar: 'مكتب الإنتاج المتكامل لمطابع الطباعة ثلاثية الأبعاد — التسعير والقائمة وفواتير هيئة الزكاة والمخزون، دون اتصال تماماً.' },
    'hero.dl':    { en: 'Download Free', ar: 'حمّل مجاناً' },
    'hero.github':{ en: 'View on GitHub', ar: 'عرض على GitHub' },
    'hero.os':    { en: 'No account · No telemetry', ar: 'بدون حساب · بدون تتبّع' },
    'hero.live':  { en: '3 printers live', ar: '3 طابعات تعمل الآن' },

    'pill.queue':     { en: 'Kanban queue', ar: 'قائمة كانبان' },
    'pill.zatca':     { en: 'ZATCA e-invoicing', ar: 'فوترة هيئة الزكاة' },
    'pill.catalog':   { en: 'Catalog', ar: 'كتالوج' },
    'pill.gift':      { en: 'Gift cards', ar: 'بطاقات هدايا' },
    'pill.portal':    { en: 'Customer portal', ar: 'بوابة العملاء' },
    'pill.analytics': { en: 'Analytics', ar: 'تحليلات' },

    'trust.lab':  { en: 'Talks live to your printers', ar: 'يتصل مباشرة بطابعاتك' },

    'gal.eyebrow':{ en: 'See it in action', ar: 'شاهده أثناء العمل' },
    'gal.h2':     { en: 'Every screen, purpose-built', ar: 'كل شاشة مصمّمة لغرضها' },
    'gal.lede':   { en: 'One app runs the whole shop — quoting, production, invoicing, inventory and the numbers behind it all. Real screens, not mockups — preview them in any of Khayt’s designs.', ar: 'تطبيق واحد يدير المطبعة بالكامل — التسعير والإنتاج والفوترة والمخزون والأرقام خلفها جميعاً. شاشات حقيقية وليست تصاميم وهمية — استعرضها بأي من تصاميم خيط.' },
    'tab.queue':      { en: 'Production Queue', ar: 'قائمة الإنتاج' },
    'tab.dashboard':  { en: 'Dashboard', ar: 'لوحة التحكم' },
    'tab.calculator': { en: 'Calculator', ar: 'الحاسبة' },
    'tab.printfiles': { en: 'Print Files', ar: 'ملفات الطباعة' },
    'tab.colorstudio':{ en: 'Colour Studio', ar: 'استوديو الألوان' },
    'tab.orders':     { en: 'Orders Log', ar: 'سجل الطلبات' },
    'tab.inventory':  { en: 'Inventory', ar: 'المخزون' },
    'tab.catalog':    { en: 'Catalog', ar: 'الكتالوج' },
    'tab.giftcards':  { en: 'Gift Cards', ar: 'بطاقات الهدايا' },
    'tab.portfolio':  { en: 'Portfolio', ar: 'المعرض' },
    'tab.waste':      { en: 'Waste Log', ar: 'سجل الهدر' },
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
    'beta.h2':     { en: 'An optional cloud', ar: 'سحابة اختيارية' },
    'beta.lede':   { en: 'Khayt has an opt-in, end-to-end-encrypted cloud on top of the offline core. None of it is required: turn the cloud off and Khayt works exactly as it always has.', ar: 'يضيف خيط 3.0 سحابة اختيارية مشفّرة طرفياً فوق النواة العاملة دون اتصال. ولا شيء منه إلزامي: أوقف السحابة ويعمل خيط تماماً كما اعتدت.' },
    'beta.pill':   { en: 'BETA', ar: 'تجريبي' },

    'wn.eyebrow': { en: 'Shipped recently', ar: 'وصل حديثاً' },
    'wn.h2':      { en: 'New since you last looked', ar: 'جديد منذ آخر زيارة' },
    'wn.lede':    { en: 'Khayt 3.6 stops guessing what your prints cost. Drop a model on the calculator and it becomes a quote; when the job finishes, the printer reports the filament and the hours it actually used, and the estimator corrects itself against them. Every estimate now says whether the rate behind it was measured or assumed. Khayt also works outside the Gulf for the first time — tax added to a price rather than folded into it, thirty country presets, and documents printed in the language you chose rather than that language and Arabic.', ar: 'خيط 3.6 يتوقّف عن تخمين تكلفة مطبوعاتك. أسقِط مجسّماً على الحاسبة ليتحوّل إلى عرض سعر، وعند انتهاء المهمة تُبلغ الطابعة بما استُهلك فعلاً من خيط وساعات، فيصحّح المقدّر نفسه بناءً عليها. وصار كل تقدير يذكر إن كان معدّله مقيساً أم مفترضاً. كما يعمل خيط خارج الخليج لأول مرة — ضريبة تُضاف إلى السعر بدل أن تكون مضمّنة فيه، وثلاثون إعداداً جاهزاً للدول، ومستندات تُطبع باللغة التي اخترتها بدل تلك اللغة والعربية معاً.' },
    'wn.verlab':  { en: 'latest stable', ar: 'أحدث إصدار مستقر' },

    'bento.quote.tag':   { en: 'Costing', ar: 'التسعير' },
    'bento.quote.t':     { en: 'Drop a model in, get a price out', ar: 'أسقِط مجسّماً، واحصل على سعر' },
    'bento.quote.d':     { en: 'One drop zone takes STL, 3MF and g-code. Khayt reads the geometry and prices it against your own machine, material and margin — then, when the job finishes, the printer reports what it really used.', ar: 'منطقة إسقاط واحدة تقبل STL و3MF وG-code. يقرأ خيط الشكل ويسعّره وفق آلتك وموادك وهامشك — ثم تُبلغ الطابعة بما استهلكته المهمة فعلاً عند انتهائها.' },
    'bento.quote.f1':    { en: 'Filament', ar: 'الخيط' },
    'bento.quote.f2':    { en: 'Print time', ar: 'زمن الطباعة' },
    'bento.quote.f3':    { en: 'Quote', ar: 'عرض السعر' },
    'bento.quote.f4':    { en: 'Machine & labour', ar: 'الآلة والعمالة' },
    'bento.quote.f5':    { en: 'Costs you', ar: 'يكلّفك' },
    'bento.quote.badge': { en: 'Measured, not assumed', ar: 'مقيس لا مفترض' },
    'bento.calib.tag':   { en: 'Self-correcting estimates', ar: 'تقديرات تصحّح نفسها' },
    'bento.calib.t':     { en: 'The more you print, the closer it gets', ar: 'كلما طبعت أكثر، اقترب أكثر' },
    'bento.calib.d':     { en: 'Once a few jobs have finished with measured figures, the estimator calibrates against your shop instead of a fixed assumption.', ar: 'بعد انتهاء بضع مهام بأرقام مقيسة، يعاير المقدّر نفسه على مطبعتك بدل افتراض ثابت.' },
    'bento.calib.est':   { en: 'Estimated', ar: 'المقدَّر' },
    'bento.calib.act':   { en: 'Actual', ar: 'الفعلي' },
    'bento.tax.tag':     { en: 'Tax, worldwide', ar: 'ضرائب حول العالم' },
    'bento.tax.t':       { en: 'Prices that add up the way your country does', ar: 'أسعار تُحسب كما تُحسب في بلدك' },
    'bento.tax.d':       { en: 'Tax added to a price rather than folded into it — so a shop quoting 100 invoices 108.25. Thirty country presets, alongside the ZATCA e-invoicing that was already there.', ar: 'ضريبة تُضاف إلى السعر بدل أن تكون مضمّنة فيه — فمطبعة تعرض 100 تُصدر فاتورة بـ108.25. ثلاثون إعداداً جاهزاً للدول، إلى جانب فوترة هيئة الزكاة والضريبة الموجودة أصلاً.' },
    'bento.tax.f1':      { en: 'Subtotal', ar: 'المجموع الفرعي' },
    'bento.tax.f2':      { en: 'Sales tax · 8.25%', ar: 'ضريبة المبيعات · 8.25٪' },
    'bento.tax.f3':      { en: 'Invoiced', ar: 'المفوتر' },
    'bento.docs.tag':    { en: 'Documents', ar: 'المستندات' },
    'bento.docs.t':      { en: 'Your paperwork, your language', ar: 'مستنداتك بلغتك' },
    'bento.docs.d':      { en: 'Quotes, invoices, credit notes and delivery notes print in the language your shop chose — and you pick which language goes second.', ar: 'عروض الأسعار والفواتير وإشعارات الدائن وسندات التسليم تُطبع باللغة التي اختارتها مطبعتك — وأنت تختار اللغة الثانية.' },
    'bento.library.tag': { en: 'Print library', ar: 'مكتبة الطباعة' },
    'bento.library.t':   { en: 'Keep your files where you keep your files', ar: 'احفظ ملفاتك حيث تحفظ ملفاتك' },
    'bento.library.r1':  { en: 'Network drive', ar: 'قرص شبكي' },
    'bento.library.r2':  { en: 'Object storage backup', ar: 'نسخة احتياطية سحابية' },
    'bento.library.r2s': { en: 'nightly', ar: 'كل ليلة' },
    'bento.safety.tag':  { en: 'Your data', ar: 'بياناتك' },
    'bento.safety.t':    { en: "A restore can't overwrite newer work", ar: 'الاستعادة لا تطمس عملاً أحدث' },
    'bento.safety.item': { en: 'Checked before syncing', ar: 'يُفحص قبل المزامنة' },
    'bento.safety.reason':{ en: '3 newer records kept', ar: 'أُبقي على 3 سجلات أحدث' },

    'lang.eyebrow':{ en: '9 languages', ar: '9 لغات' },
    'lang.h2':     { en: 'Built for global makers', ar: 'مصمّم لصُنّاع العالم' },
    'lang.lede':   { en: 'Full Arabic RTL layout is a core design decision — not an afterthought. Khayt also ships in German, Spanish, French, Turkish, Chinese and Japanese, with instant switching from anywhere in the app. Portuguese (Brazil) makes nine, and dates and numbers now follow the language you picked rather than defaulting to English.', ar: 'دعم العربية من اليمين إلى اليسار قرار تصميمي أساسي، وليس إضافة لاحقة. يأتي خيط أيضاً بالألمانية والإسبانية والفرنسية والتركية والصينية واليابانية، مع تبديل فوري من أي مكان في التطبيق. وتنضم البرتغالية (البرازيل) لتصبح تسع لغات، وصارت التواريخ والأرقام تتبع اللغة التي اخترتها بدل الإنجليزية.' },
    'lang.li1':{ en: 'Arabic RTL layout throughout the entire app', ar: 'تخطيط عربي من اليمين لليسار في كامل التطبيق' },
    'lang.li2':{ en: 'ZATCA Phase 2 e-invoices — signed, bilingual AR & EN', ar: 'فواتير المرحلة الثانية — موقّعة، ثنائية اللغة عربي وإنجليزي' },
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
    'stat.subs': { en: 'Subscriptions', ar: 'اشتراكات' },
    'stat.keep': { en: 'Yours to keep', ar: 'ملك لك للأبد' },

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

  /* ---------- Feature grid ---------- */
  var FEATURES = [
    { t: { en: 'Kanban Production Queue', ar: 'قائمة إنتاج كانبان' }, d: { en: 'Drag orders across Pending → Printing → Post-Processing → QC → Done. Per-machine views, shift checklists, failure photo capture and part-level colour assignment.', ar: 'اسحب الطلبات عبر: قيد الانتظار ← الطباعة ← المعالجة ← الفحص ← مكتمل. عروض لكل طابعة، قوائم بدء الوردية، التقاط صور الأعطال وتعيين ألوان القطع.' },
      i: '<rect x="3" y="4" width="5" height="16" rx="1.4"/><rect x="9.5" y="4" width="5" height="11" rx="1.4"/><rect x="16" y="4" width="5" height="8" rx="1.4"/>' },
    { t: { en: 'Smart Cost Calculator', ar: 'حاسبة تكلفة ذكية' }, d: { en: 'Drop in an STL, 3MF or g-code and it prices the geometry itself, then learns from what the printer reports when the job finishes. Live breakdown of material, machine time, electricity, labour, overhead, failure rate and margin — and every estimate says whether the rate behind it was measured or assumed. FDM, Resin and multi-material AMS/MMU costing.', ar: 'أسقِط ملف STL أو 3MF أو G-code ليسعّر الشكل نفسه، ثم يتعلّم مما تُبلغ به الطابعة عند انتهاء المهمة. تفصيل مباشر للمادة ووقت التشغيل والكهرباء والعمالة والمصاريف ونسبة الفشل والهامش — ويذكر كل تقدير إن كان معدّله مقيساً أم مفترضاً. تسعير FDM والراتنج والمواد المتعددة AMS/MMU.' },
      i: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/>' },
    { t: { en: 'E-Invoicing & Worldwide Tax', ar: 'الفوترة الإلكترونية والضرائب' }, d: { en: 'Cryptographically signed ZATCA e-invoices auto-submitted to FATOORA, with TLV QR codes, proforma invoices, milestone billing, BNPL links (Tabby, Tamara, Stripe) and VAT export. Outside the Gulf, tax is added to a price rather than folded into it, with thirty country presets — and documents print in the language you chose.', ar: 'فواتير إلكترونية موقّعة تُرسل تلقائياً إلى فاتورة، برموز QR، فواتير مبدئية، فوترة بالمراحل، روابط دفع آجل (تابي، تمارا، سترايب) وتصدير ضريبي. وخارج الخليج تُضاف الضريبة إلى السعر بدل أن تكون مضمّنة فيه، مع ثلاثين إعداداً جاهزاً للدول — وتُطبع المستندات باللغة التي اخترتها.' },
      i: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>' },
    { t: { en: 'Live Printer API', ar: 'ربط مباشر بالطابعات' }, d: { en: 'Connect OctoPrint, Moonraker (Klipper), Bambu Lab, PrusaLink, Duet and Repetier. Real-time temperature and print progress inside the queue, plus error / offline / stall alerts over Telegram, webhook or email.', ar: 'اربط OctoPrint وMoonraker وBambu Lab وPrusaLink وDuet وRepetier. حرارة وتقدّم الطباعة لحظياً داخل القائمة، مع تنبيهات الأعطال والانقطاع والتوقف عبر تيليجرام أو ويب هوك أو البريد.' },
      i: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M8 19h8M12 15v4"/><circle cx="12" cy="9.5" r="2.4"/>' },
    { t: { en: 'Inventory Management', ar: 'إدارة المخزون' }, d: { en: 'Track FDM spools and Resin bottles with auto-deduction on completion, drying logs, smart reorder alerts with draft POs, price history, per-location stock and overcommit warnings.', ar: 'تتبّع خيوط FDM وزجاجات الراتنج مع الخصم التلقائي عند الإكمال، سجلات التجفيف، تنبيهات إعادة الطلب بأوامر شراء، سجل الأسعار، مخزون متعدد المواقع وتنبيهات التجاوز.' },
      i: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>' },
    { t: { en: 'Analytics & Break-Even', ar: 'تحليلات ونقطة التعادل' }, d: { en: 'Revenue, machine P&L, operator performance, retention, production heatmap, cost trends and end-of-day PDF reports. Break-even card and NPS surveys.', ar: 'الإيرادات، أرباح كل آلة، أداء المشغّلين، الاحتفاظ، خريطة حرارية للإنتاج، اتجاهات التكلفة وتقارير PDF لنهاية اليوم. بطاقة التعادل واستبيانات الرضا.' },
      i: '<path d="M4 20V4M4 20h16"/><path d="M7 16l3-4 3 2 4-7"/>' },
    { t: { en: 'Catalog, Gift Cards & Portfolio', ar: 'كتالوج وبطاقات هدايا ومعرض' }, d: { en: 'Reusable product SKUs for one-tap quotes, sellable gift cards and store credit, plus a finished-print portfolio gallery to show off your best work.', ar: 'منتجات جاهزة لتسعير بلمسة، بطاقات هدايا ورصيد قابل للبيع، ومعرض أعمال للمطبوعات المنتهية لعرض أفضل أعمالك.' },
      i: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 14h3"/><circle cx="16" cy="14" r="1.4"/>' },
    { t: { en: 'Client CRM & Customer Portal', ar: 'علاقات العملاء والبوابة' }, d: { en: 'Profiles with credit limits, multi-currency, loyalty tiers and automatic discounts, plus a live LAN customer portal with quote approval and QR order tracking.', ar: 'ملفات بحدود ائتمانية، تعدد العملات، مستويات ولاء وخصومات تلقائية، مع بوابة عملاء محلية حيّة لاعتماد العروض وتتبّع الطلبات برمز QR.' },
      i: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.6M18 20a5.5 5.5 0 0 0-3-4.9"/>' },
    { t: { en: 'Integrations & Access', ar: 'التكاملات والوصول' }, d: { en: 'Salla/Zid webhooks, Telegram notifications, iCal feed and a public intake form. Embedded LAN server, a native iOS companion app (queue, inventory, live printer monitoring, NFC spool scanning), auto-updater and operator PIN lock with Admin/Tech/Sales roles.', ar: 'ويب هوك لسلة وزد، إشعارات تيليجرام، تقويم iCal ونموذج استقبال عام. خادم محلي، تطبيق iOS مرافق (قائمة الإنتاج والمخزون ومتابعة الطابعات وقراءة وسوم NFC)، محدّث تلقائي وقفل PIN بأدوار مدير/فني/مبيعات.' },
      i: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7M8.2 13.2 15.8 17"/>' }
  ];

  /* ---------- Optional cloud — all opt-in; app still runs fully offline ---------- */
  var BETA_FEATURES = [
    { t: { en: 'Encrypted cloud sync', ar: 'مزامنة سحابية مشفّرة' }, d: { en: 'Opt-in sync across your devices, end-to-end encrypted — the server only ever sees ciphertext. Your sync passphrase never leaves your machine. Turn it off and Khayt runs 100% offline as before.', ar: 'مزامنة اختيارية بين أجهزتك مشفّرة طرفياً — لا يرى الخادم سوى نص مُعمّى. لا تغادر عبارة المزامنة جهازك. أوقفها ويعمل خيط دون اتصال بالكامل كالسابق.' },
      i: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 18 18z"/><path d="M12 12v5M12 17l-2-2M12 17l2-2"/>' },
    { t: { en: 'Team accounts', ar: 'حسابات الفريق' }, d: { en: 'Invite staff to your shop with roles (manager / operator / viewer). Everyone shares the same live cloud data; the desktop enforces what each role can do.', ar: 'ادعُ موظفيك إلى مطبعتك بأدوار (مدير / مشغّل / مشاهد). يشارك الجميع البيانات السحابية نفسها، ويفرض التطبيق صلاحيات كل دور.' },
      i: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M18.5 19a5.5 5.5 0 0 0-3-4.9"/>' },
    { t: { en: 'Online storefront', ar: 'متجر إلكتروني' }, d: { en: 'Publish a public shop page customers can browse — prices, a cart, deposits and promo codes. Orders land straight in your queue as draft quotes; checkout can take a deposit via your own payment link.', ar: 'انشر صفحة متجر عامة يتصفحها العملاء — أسعار وسلة وعربون ورموز خصم. تصل الطلبات مباشرة إلى قائمتك كعروض مبدئية، ويمكن أخذ عربون عبر رابط دفعك الخاص.' },
      i: '<path d="M4 8h16l-1 12H5L4 8z"/><path d="M8 8a4 4 0 0 1 8 0"/>' },
    { t: { en: 'Customer order tracking', ar: 'تتبّع طلبات العملاء' }, d: { en: 'Share a link and your customer follows a live progress timeline — received → printing → finishing → ready — in their own language, updating as you advance the order.', ar: 'شارك رابطاً ليتابع عميلك مخطط تقدّم حيّاً — استُلم ← طباعة ← لمسات أخيرة ← جاهز — بلغته، ويتحدّث مع تقدّم الطلب.' },
      i: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { t: { en: 'Reviews & ratings', ar: 'التقييمات' }, d: { en: 'Collect a star rating + comment after each order via a simple link; your average rating shows on the storefront and in the app.', ar: 'اجمع تقييماً بالنجوم وتعليقاً بعد كل طلب عبر رابط بسيط؛ ويظهر متوسط تقييمك على المتجر وداخل التطبيق.' },
      i: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z"/>' },
    { t: { en: 'WhatsApp & SMS', ar: 'واتساب ورسائل' }, d: { en: 'Send automated order updates over WhatsApp or SMS (Twilio, WhatsApp Cloud API, Unifonic or your own webhook), and run marketing campaigns to a customer segment.', ar: 'أرسل تحديثات الطلبات تلقائياً عبر واتساب أو الرسائل (Twilio أو واجهة واتساب السحابية أو Unifonic أو ويب هوك خاص)، وأطلق حملات تسويقية لشريحة من العملاء.' },
      i: '<path d="M4 18l1.2-3.2A7 7 0 1 1 9 19.5z"/><path d="M9 10c.5 2 2.5 4 4.5 4.5"/>' },
    { t: { en: 'AI shop assistant', ar: 'مساعد ذكاء اصطناعي' }, d: { en: 'Ask questions about your own shop — “what’s overdue?”, “revenue vs last month?” — in a chat that answers only from your data. Bring your own key; it stays on your machine.', ar: 'اسأل عن مطبعتك — «ما المتأخر؟»، «الإيراد مقابل الشهر الماضي؟» — في محادثة تجيب من بياناتك فقط. مفتاحك الخاص يبقى على جهازك.' },
      i: '<rect x="3.5" y="5" width="17" height="12" rx="2.5"/><path d="M8 21l2-4M16 21l-2-4M9 10h.01M15 10h.01"/>' },
    { t: { en: 'Smart reorder & POs', ar: 'إعادة طلب ذكية' }, d: { en: 'Forecasts when each material runs out from real usage and the grams already committed to open orders, then drafts purchase orders ahead of time.', ar: 'يتوقّع نفاد كل مادة من الاستهلاك الفعلي والغرامات المحجوزة لطلبات مفتوحة، ثم يجهّز أوامر شراء مسبقاً.' },
      i: '<path d="M4 7h16M4 12h16M4 17h10"/><path d="M18 15v6M15 18h6"/>' },
    { t: { en: 'Label & QR printing', ar: 'طباعة الملصقات و QR' }, d: { en: 'Print QR labels for orders (scan to the tracking page) and spools (scan to inventory), plus a one-way accounting webhook to push paid invoices to QuickBooks, Zoho or Xero.', ar: 'اطبع ملصقات QR للطلبات (مسح لصفحة التتبّع) والبكرات (مسح للمخزون)، مع ويب هوك محاسبي أحادي الاتجاه لدفع الفواتير المسددة إلى QuickBooks أو Zoho أو Xero.' },
      i: '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><path d="M14 4h7v7h-7zM14 15h3M20 15v5M14 20h6"/>' }
  ];

  /* ---------- Screen gallery data ---------- */
  var SCREENS = {
    queue:      { name: { en: 'Production Queue', ar: 'قائمة الإنتاج' }, cap: { en: 'Kanban production queue', ar: 'قائمة إنتاج كانبان' }, text: { en: 'Drag orders across Pending → Printing → Post-Processing → QC → Done. Per-machine queue views, shift-start checklists, print-failure photo capture, on-hold with reason, and part-level colour assignment.', ar: 'اسحب الطلبات عبر المراحل من قيد الانتظار إلى مكتمل. عروض لكل طابعة، قوائم بدء الوردية، التقاط صور الأعطال، الإيقاف المؤقت بسبب، وتعيين ألوان القطع.' } },
    dashboard:  { name: { en: 'Dashboard', ar: 'لوحة التحكم' }, cap: { en: 'Your shop at a glance', ar: 'مطبعتك في لمحة' }, text: { en: 'Active orders, today\u2019s revenue, outstanding balances, pipeline value and days-to-clear-queue — with a monthly revenue goal forecast and live machine-load breakdown.', ar: 'الطلبات النشطة، إيرادات اليوم، الأرصدة المستحقة، قيمة المسار وأيام تفريغ القائمة — مع توقّع هدف الإيرادات الشهري وتوزيع حِمل الآلات لحظياً.' } },
    calculator: { name: { en: 'Calculator', ar: 'الحاسبة' }, cap: { en: 'Quote with confidence, not guesswork', ar: 'سعّر بثقة لا بالتخمين' }, text: { en: 'A multi-part cart costs material, machine time, electricity, labour, overhead, failure rate and margin in real time — for both FDM (grams) and Resin (mL), with G-code / 3MF auto-extraction.', ar: 'سلة متعددة القطع تحسب المادة ووقت التشغيل والكهرباء والعمالة والمصاريف ونسبة الفشل والهامش لحظياً — لكل من FDM بالغرام والراتنج بالمل، مع استخراج تلقائي من G-code و3MF.' } },
    printfiles: { name: { en: 'Print Files', ar: 'ملفات الطباعة' }, cap: { en: 'Your STL, 3MF and G-code library', ar: 'مكتبة ملفات STL و3MF وG-code' }, text: { en: 'A visual library of your print files with real preview thumbnails, extracted colours and swap counts, tested slicer notes, and one-click open in any installed slicer. Convert a 3MF to another printer and the result stays with the file.', ar: 'مكتبة مرئية لملفات الطباعة بمعاينات حقيقية، ألوان مستخرجة وعدد التبديلات، ملاحظات التقطيع المجرّبة، وفتح بنقرة في أي برنامج تقطيع مثبّت. حوّل ملف 3MF لطابعة أخرى ويبقى الناتج مع الملف.' } },
    colorstudio: { name: { en: 'Colour Studio', ar: 'استوديو الألوان' }, cap: { en: 'Match, blend and plan filament colours', ar: 'طابِق وامزج وخطّط ألوان الخيوط' }, text: { en: 'Pick a target colour and see the closest filament you already own, ranked by perceptual distance (ΔE). Blend two spools into a gradient for ombré or swap plans, and assign each colour of a multicolour print to a spool — with cost pushed straight to the calculator.', ar: 'اختر لوناً هدفاً وشاهد أقرب خيط تملكه مرتّباً حسب الفرق اللوني (ΔE). امزج بكرتين في تدرّج لخطط الأومبريه أو التبديل، وعيّن كل لون في طباعة متعددة الألوان لبكرة — مع دفع التكلفة مباشرة للحاسبة.' } },
    orders:     { name: { en: 'Orders Log', ar: 'سجل الطلبات' }, cap: { en: 'From quote to paid, in one log', ar: 'من العرض إلى السداد في سجل واحد' }, text: { en: 'Every order tracked end-to-end with ZATCA Phase 2 e-invoices, TLV QR codes, proforma invoices, milestone billing, BNPL payment links, PDF export and WhatsApp or email delivery.', ar: 'كل طلب متتبّع من البداية للنهاية بفواتير المرحلة الثانية ورمز QR وفواتير مبدئية وفوترة بالمراحل وروابط دفع آجل وتصدير PDF وإرسال عبر واتساب أو البريد.' } },
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
    { v: '2.2.0', date: '2026-05-30', beta: false, d: { en: 'Gift cards, ZATCA Phase 2 FATOORA, LAN quote approval', ar: 'بطاقات هدايا، فاتورة المرحلة الثانية، اعتماد العروض' } },
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

  // Screenshot path — themed, with Arabic RTL captures for every theme.
  // Workbench (default) uses the flat set; the others live under themes/<id>/.
  function shotPath(key) {
    var pre = lang === 'ar' ? 'ar-' : '';
    if (curTheme === 'workbench') return 'screenshots/screenshot-' + pre + key + '.png';
    return 'screenshots/themes/' + curTheme + '/screenshot-' + pre + key + '.png';
  }
  function heroPath() { return 'screenshots/screenshot-' + (lang === 'ar' ? 'ar-' : '') + 'queue.png'; }

  /* ---------- Mode comparison (mirrors lib/feature-tiers.js) ---------- */
  // t = [simple, professional]. Additive: the personal core is on in both,
  // production depth adds in Professional.
  // Enthusiast was removed as a Khayt mode — that audience is served by the
  // separate Bed Ready app, so the site must not offer it as a choice here.
  var MODE_COMPARE = [
    { g: { en: 'Personal core', ar: 'الأساسيات الشخصية' }, rows: [
      { l: { en: 'Cost calculator (FDM + resin)', ar: 'حاسبة التكلفة (FDM والراتنج)' }, t: [1, 1] },
      { l: { en: 'Production queue (Kanban)', ar: 'قائمة الإنتاج (كانبان)' }, t: [1, 1] },
      { l: { en: 'Print-file library & 3MF converter', ar: 'مكتبة ملفات الطباعة ومحوّل 3MF' }, t: [1, 1] },
      { l: { en: 'Colour mixer & matcher', ar: 'مازج ومطابق الألوان' }, t: [1, 1] },
      { l: { en: 'Filament inventory', ar: 'مخزون الخيوط' }, t: [1, 1] },
      { l: { en: 'Printers, monitoring & waste log', ar: 'الطابعات والمراقبة وسجل الهدر' }, t: [1, 1] }
    ] },
    { g: { en: 'Selling & invoicing', ar: 'البيع والفوترة' }, rows: [
      { l: { en: 'Clients & customer orders', ar: 'العملاء وطلبات العملاء' }, t: [1, 1] },
      { l: { en: 'Invoices & payments', ar: 'الفواتير والمدفوعات' }, t: [1, 1] },
      { l: { en: 'Online storefront & customer portal', ar: 'المتجر الإلكتروني وبوابة العملاء' }, t: [1, 1] },
      { l: { en: 'Gift cards & store credit', ar: 'بطاقات الهدايا ورصيد المتجر' }, t: [1, 1] },
      { l: { en: 'Sales reports', ar: 'تقارير المبيعات' }, t: [1, 1] }
    ] },
    { g: { en: 'Production business', ar: 'أعمال الإنتاج' }, rows: [
      { l: { en: 'Full analytics & forecasting', ar: 'تحليلات وتوقّعات كاملة' }, t: [0, 1] },
      { l: { en: 'ZATCA Phase 2 e-invoicing', ar: 'فوترة هيئة الزكاة (المرحلة الثانية)' }, t: [0, 1] },
      { l: { en: 'Proforma, milestone & credit notes', ar: 'فواتير مبدئية ومراحل وإشعارات دائنة' }, t: [0, 1] },
      { l: { en: 'Purchase orders & payables', ar: 'أوامر الشراء والذمم الدائنة' }, t: [0, 1] },
      { l: { en: 'Multiple locations & print-farm view', ar: 'فروع متعددة وعرض مزرعة الطباعة' }, t: [0, 1] },
      { l: { en: 'Team accounts & roles', ar: 'حسابات الفريق والأدوار' }, t: [0, 1] },
      { l: { en: 'Machine maintenance & downtime', ar: 'صيانة الأجهزة والتوقّف' }, t: [0, 1] },
      { l: { en: 'Loyalty tiers & break-even', ar: 'مستويات الولاء ونقطة التعادل' }, t: [0, 1] },
      { l: { en: 'Expense tracking & accounting sync', ar: 'تتبّع المصروفات ومزامنة المحاسبة' }, t: [0, 1] }
    ] }
  ];

  function buildModesTable() {
    var el = document.getElementById('modesTable');
    if (!el) return;
    var cols = [t('modes.sim.pill'), t('modes.pro.pill')];
    var yes = '<span class="cmp-yes" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
    var no = '<span class="cmp-no" aria-hidden="true"></span>';
    var h = '<table class="cmp"><colgroup><col class="cmp-c-feat"><col class="cmp-c"><col class="cmp-c cmp-c-hl"></colgroup>';
    h += '<thead><tr><th class="cmp-feat"></th>';
    for (var c = 0; c < 2; c++) h += '<th class="cmp-col' + (c === 1 ? ' cmp-col-hl' : '') + '"><span class="cmp-chip">' + cols[c] + '</span></th>';
    h += '</tr></thead><tbody>';
    for (var g = 0; g < MODE_COMPARE.length; g++) {
      var grp = MODE_COMPARE[g];
      h += '<tr class="cmp-grouprow"><td colspan="3"><span>' + grp.g[lang] + '</span></td></tr>';
      for (var r = 0; r < grp.rows.length; r++) {
        var row = grp.rows[r];
        h += '<tr><td class="cmp-feat">' + row.l[lang] + '</td>';
        for (var m = 0; m < 2; m++) {
          var on = row.t[m];
          h += '<td class="cmp-cell' + (m === 1 ? ' cmp-col-hl' : '') + '">' + (on ? yes : no) + '</td>';
        }
        h += '</tr>';
      }
    }
    h += '</tbody></table>';
    el.innerHTML = h;
  }

  function buildFeatures() {
    var grid = document.getElementById('featGrid');
    if (!grid) return;
    var html = '';
    for (var k = 0; k < FEATURES.length; k++) {
      var f = FEATURES[k];
      var n = (k + 1 < 10 ? '0' : '') + (k + 1);
      html += '<article class="feat">' +
        '<span class="num">' + n + '</span>' +
        '<div class="feat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + f.i + '</svg></div>' +
        '<h3>' + f.t[lang] + '</h3><p>' + f.d[lang] + '</p></article>';
    }
    grid.innerHTML = html;
  }

  function buildBetaFeatures() {
    var grid = document.getElementById('betaGrid');
    if (!grid) return;
    var betaLab = t('beta.pill');
    var html = '';
    for (var k = 0; k < BETA_FEATURES.length; k++) {
      var f = BETA_FEATURES[k];
      html += '<article class="feat feat-beta">' +
        '<span class="beta-pill">' + betaLab + '</span>' +
        '<div class="feat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + f.i + '</svg></div>' +
        '<h3>' + f.t[lang] + '</h3><p>' + f.d[lang] + '</p></article>';
    }
    grid.innerHTML = html;
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
    buildBetaFeatures();
    buildModesTable();
    buildChangelog();
    paintCaption();
    // swap gallery + hero screenshots to match language (EN / AR-RTL)
    var gi = document.getElementById('galImg'); if (gi) gi.src = shotPath(curKey);
    var hs = document.getElementById('heroShot'); if (hs) hs.src = heroPath();
    buildThemeChips();
    var btn = document.getElementById('navLang');
    if (btn) btn.innerHTML = lang === 'ar' ? '<span>🌐</span> English' : '<span>🌐</span> العربية';
    var card = document.getElementById('flipCard');
    var sw = document.getElementById('flipSwitch');
    if (card && sw) setFlip(card, sw, lang === 'ar');
    try { localStorage.setItem('khayt-lang', lang); } catch (e) {}
  }

  /* ---------- Theme switcher (in-app theme demo) ---------- */
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
      var img = document.getElementById('galImg');
      if (img) { img.style.opacity = '0'; setTimeout(function () { img.src = shotPath(curKey); img.style.opacity = '1'; }, 160); }
    });
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
      img.style.opacity = '0';
      setTimeout(function () {
        img.src = shotPath(key);
        img.alt = 'Khayt ' + SCREENS[key].name.en + ' screenshot';
        img.style.opacity = '1';
      }, 180);
      paintCaption();
    });
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
    if (burger) burger.addEventListener('click', function () { el.classList.toggle('open'); });
    var links = document.getElementById('navLinks');
    if (links) links.addEventListener('click', function (e) { if (e.target.tagName === 'A') el.classList.remove('open'); });
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
      if (!btn) return;
      channel = btn.getAttribute('data-channel');
      var btns = bar.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i] === btn);
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

  function setVersionTags(v) {
    var tags = document.querySelectorAll('.ver-tag');
    for (var i = 0; i < tags.length; i++) tags[i].textContent = 'v' + v;
  }

  function fmtMB(b) { return Math.round(b / 1048576) + ' MB'; }

  function wireDownloadLinks(rel) {
    if (!rel || !rel.assets) return;
    var assets = rel.assets;
    function find(re) { for (var i = 0; i < assets.length; i++) if (re.test(assets[i].name)) return assets[i]; return null; }
    var map = { 'mac-dmg': find(/arm64\.dmg$/i), 'win-exe': find(/setup.*\.exe$/i), 'win-portable': find(/portable.*\.exe$/i), 'linux-appimage': find(/\.AppImage$/i), 'linux-deb': find(/\.deb$/i) };
    Object.keys(map).forEach(function (key) {
      var a = map[key]; if (!a) return;
      var link = document.querySelector('[data-dl="' + key + '"]');
      if (!link) return;
      link.setAttribute('href', a.browser_download_url);
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
        } else {
          // no beta channel published — disable beta button gracefully
          var betaBtn = document.querySelector('#dlChannel [data-channel="beta"]');
          if (betaBtn) { betaBtn.style.opacity = '0.5'; betaBtn.querySelector('.ver-beta').textContent = '—'; betaBtn.title = 'No beta build published yet'; }
        }
        if (cl.length) { CHANGELOG = cl; buildChangelog(); }
        // refresh visible channel
        applyChannel();
      })
      .catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = 'en';
    try { saved = localStorage.getItem('khayt-lang') || 'en'; } catch (e) {}
    tabs();
    flip();
    nav();
    langToggle();
    channelToggle();
    themeSwitch();
    applyLang(saved);
    fetchReleases();
  });
})();
