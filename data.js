/* ============================================================
   KHAYT — the page's content, as data
   ------------------------------------------------------------
   Three lists that used to live inside app.js as private literals. They moved
   out for two reasons, and both are about a second reader:

     · services.html describes the same nine cloud services as the home page.
       Written twice, they drift — the way the language count did, sitting at
       8 while the section it pointed at said nine.

     · scripts/prerender.js renders all three into index.html at build time,
       so the page's richest content is in the HTML rather than only in a
       grid that JavaScript fills after load. Googlebot renders JS on a second
       pass; Bing, social scrapers, archives and LLM crawlers largely do not,
       and this is a static site that had no reason to need JS for it.

   Data only. The markup that turns it into a page is render.js, shared by the
   browser and the prerender step so the two cannot produce different HTML.
   ============================================================ */
(function (root) {
  'use strict';

  var DATA = {};

  /* ---------- The nine features, in the order they are numbered ---------- */
  DATA.features = [
    { t: { en: 'Kanban Production Queue', ar: 'قائمة إنتاج كانبان' }, d: { en: 'Drag orders across Pending → Printing → Post-Processing → QC → Done. Per-machine views, shift checklists, failure photo capture and part-level colour assignment.', ar: 'اسحب الطلبات عبر: قيد الانتظار ← الطباعة ← المعالجة ← الفحص ← مكتمل. عروض لكل طابعة، قوائم بدء الوردية، التقاط صور الأعطال وتعيين ألوان القطع.' },
      i: '<rect x="3" y="4" width="5" height="16" rx="1.4"/><rect x="9.5" y="4" width="5" height="11" rx="1.4"/><rect x="16" y="4" width="5" height="8" rx="1.4"/>' },
    { t: { en: 'Smart Cost Calculator', ar: 'حاسبة تكلفة ذكية' }, d: { en: 'Drop in an STL, 3MF or g-code and it prices the geometry itself, then learns from what the printer reports when the job finishes. Live breakdown of material, machine time, electricity, labour, overhead, failure rate and margin — and every estimate says whether the rate behind it was measured or assumed. FDM, Resin and multi-material AMS/MMU costing.', ar: 'أسقِط ملف STL أو 3MF أو G-code ليسعّر الشكل نفسه، ثم يتعلّم مما تُبلغ به الطابعة عند انتهاء المهمة. تفصيل مباشر للمادة ووقت التشغيل والكهرباء والعمالة والمصاريف ونسبة الفشل والهامش — ويذكر كل تقدير إن كان معدّله مقيساً أم مفترضاً. تسعير FDM والراتنج والمواد المتعددة AMS/MMU.' },
      i: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/>' },
    { t: { en: 'E-Invoicing & Worldwide Tax', ar: 'الفوترة الإلكترونية والضرائب' }, d: { en: 'Cryptographically signed e-invoices with TLV QR codes, submitted automatically where your country requires it, plus proforma invoices, milestone billing, BNPL links (Tabby, Tamara, Stripe) and VAT export. Tax is added to a price rather than folded into it, with thirty country presets — and documents print in the language you chose.', ar: 'فواتير إلكترونية موقّعة تُرسل تلقائياً إلى فاتورة، برموز QR، فواتير مبدئية، فوترة بالمراحل، روابط دفع آجل (تابي، تمارا، سترايب) وتصدير ضريبي. وخارج الخليج تُضاف الضريبة إلى السعر بدل أن تكون مضمّنة فيه، مع ثلاثين إعداداً جاهزاً للدول — وتُطبع المستندات باللغة التي اخترتها.' },
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
      i: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7M8.2 13.2 15.8 17"/>' }  ];

  /* ---------- Mode comparison (mirrors lib/feature-tiers.js) ---------- */
  // t = [simple, professional]. Additive: the personal core is on in both,
  // production depth adds in Professional.
  // Enthusiast was removed as a Khayt mode — that audience is served by the
  // separate Bed Ready app, so the site must not offer it as a choice here.
  DATA.modes = [
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
      { l: { en: 'Signed e-invoicing', ar: 'فوترة هيئة الزكاة (المرحلة الثانية)' }, t: [0, 1] },
      { l: { en: 'Proforma, milestone & credit notes', ar: 'فواتير مبدئية ومراحل وإشعارات دائنة' }, t: [0, 1] },
      { l: { en: 'Purchase orders & payables', ar: 'أوامر الشراء والذمم الدائنة' }, t: [0, 1] },
      { l: { en: 'Multiple locations & print-farm view', ar: 'فروع متعددة وعرض مزرعة الطباعة' }, t: [0, 1] },
      { l: { en: 'Team accounts & roles', ar: 'حسابات الفريق والأدوار' }, t: [0, 1] },
      { l: { en: 'Machine maintenance & downtime', ar: 'صيانة الأجهزة والتوقّف' }, t: [0, 1] },
      { l: { en: 'Loyalty tiers & break-even', ar: 'مستويات الولاء ونقطة التعادل' }, t: [0, 1] },
      { l: { en: 'Expense tracking & accounting sync', ar: 'تتبّع المصروفات ومزامنة المحاسبة' }, t: [0, 1] }
    ] }  ];

  /* ---------- The opt-in cloud. Everything here is off by default; the
     desktop app runs fully offline with all of it switched off, and that is
     the default and the fallback, not a degraded mode. ---------- */
  DATA.cloud = [
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
      i: '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><path d="M14 4h7v7h-7zM14 15h3M20 15v5M14 20h6"/>' }  ];

  /* ---------- The three cloud plans ----------------------------------------
     Vendored from lib/cloud-plans.js in the app repo, which is the source of
     truth: the app prices from it and this page only describes it. The fields
     copied are the ones a price is made of — id, label, price, annual, soon,
     tagline, features — and they are copied verbatim, Arabic included.

     `betaFree` is that file's BETA_FREE. While it is true nothing is charged
     and every non-zero price renders struck through next to "free during
     beta". The prices are published anyway, so that nobody discovers one
     later having built their shop on the assumption there wasn't one.

     `featured` is the only field that is not in the app: it is presentation,
     marking the tier this page recommends, and means nothing to the app.

     SAR is pegged to USD at 3.75, so the two figures are the same price
     expressed twice rather than a conversion that drifts. Every other locale
     sees USD — a rate snapshot that goes stale is worse than a foreign
     currency. If lib/cloud-plans.js changes, this changes with it.          */
  DATA.betaFree = true;
  DATA.currencies = ['USD', 'SAR'];
  DATA.plans = [
    {
      id: 'free',
      label: { en: 'Free', ar: 'مجاني' },
      price: { USD: 0, SAR: 0 },
      annual: { USD: 0, SAR: 0 },
      tagline: { en: 'The whole app, forever, with no account.', ar: 'التطبيق كامل، للأبد، بدون حساب.' },
      features: [
        { en: 'Local app, LAN and BYO-key AI — everything', ar: 'التطبيق المحلي والشبكة والذكاء الاصطناعي بمفتاحك — كل شيء' },
        { en: 'Off-site encrypted backup — 1 device', ar: 'نسخة احتياطية مشفّرة خارجية — جهاز واحد' },
        { en: 'Customer portal — 30-day trial', ar: 'بوابة العملاء — تجربة 30 يوماً' },
        { en: '7 days of snapshot history', ar: 'سجل نسخ لمدة 7 أيام' }
      ],
      cta: { en: 'Download Khayt', ar: 'حمّل خيط' },
      href: 'index.html#download'
    },
    {
      id: 'cloud',
      label: { en: 'Cloud', ar: 'السحابة' },
      price: { USD: 9, SAR: 35 },
      annual: { USD: 90, SAR: 350 },
      featured: true,
      tagline: { en: 'Your shop on every device, and visible to your customers.', ar: 'متجرك على كل جهاز، وظاهر لعملائك.' },
      features: [
        { en: 'Encrypted sync across all your devices', ar: 'مزامنة مشفّرة عبر كل أجهزتك' },
        { en: 'Customer portal and online storefront', ar: 'بوابة العملاء والمتجر الإلكتروني' },
        { en: 'Team accounts — up to 3 people', ar: 'حسابات الفريق — حتى 3 أشخاص' },
        { en: '90 days of snapshot history', ar: 'سجل نسخ لمدة 90 يوماً' }
      ],
      cta: { en: 'Turn it on in the app', ar: 'شغّلها داخل التطبيق' },
      href: 'index.html#download'
    },
    {
      id: 'branches',
      label: { en: 'Branches', ar: 'الفروع' },
      price: { USD: 29, SAR: 109 },
      annual: { USD: 290, SAR: 1090 },
      soon: true,
      tagline: { en: 'One owner, several branches, one set of numbers.', ar: 'مالك واحد، عدة فروع، أرقام موحّدة.' },
      features: [
        { en: 'Everything in Cloud', ar: 'كل ما في السحابة' },
        { en: 'Multiple branches with an HQ dashboard', ar: 'فروع متعددة مع لوحة تحكم رئيسية' },
        { en: 'Team accounts — up to 10 people', ar: 'حسابات الفريق — حتى 10 أشخاص' },
        { en: 'Shared inventory across branches', ar: 'مخزون مشترك بين الفروع' }
      ],
      cta: { en: 'Not built yet', ar: 'لم يُبنَ بعد' },
      href: 'blog/'
    }
  ];

  /* ---------- The thread: one job, end to end ----------------------------
     Khayt means "thread", and this is the section that earns the name. The
     five steps are the app's own order of operations — calculator, queue,
     printer link, invoice, actuals — and step 05 is the one that closes the
     loop back onto step 01.                                               */
  DATA.flow = [
    { n: '01',
      t: { en: 'Quote', ar: 'تسعير' },
      d: { en: 'Drop an STL, 3MF or g-code on the calculator. Khayt reads the geometry and prices it against your machine, material and margin.',
           ar: 'أسقِط ملف STL أو 3MF أو G-code على الحاسبة. يقرأ خيط الشكل نفسه ويسعّره وفق آلتك وموادك وهامشك.' },
      tag: { en: 'Calculator', ar: 'الحاسبة' } },
    { n: '02',
      t: { en: 'Schedule', ar: 'جدولة' },
      d: { en: 'An approved quote becomes a job on the board, assigned to a machine with its colours and parts already attached.',
           ar: 'يتحوّل العرض المعتمد إلى مهمة على اللوحة، مُسندة إلى طابعة بألوانها وقطعها مرفقة سلفاً.' },
      tag: { en: 'Production queue', ar: 'قائمة الإنتاج' } },
    { n: '03',
      t: { en: 'Print', ar: 'طباعة' },
      d: { en: 'Live temperature and progress from OctoPrint, Bambu, Klipper and friends — with stall and offline alerts.',
           ar: 'حرارة وتقدّم مباشران من OctoPrint وBambu وKlipper وغيرها — مع تنبيهات التوقّف وانقطاع الاتصال.' },
      tag: { en: 'Printer API', ar: 'واجهة الطابعات' } },
    { n: '04',
      t: { en: 'Invoice', ar: 'فوترة' },
      d: { en: 'A signed e-invoice in the language your shop chose, with the tax added the way your country does it.',
           ar: 'فاتورة إلكترونية موقّعة باللغة التي اختارتها مطبعتك، والضريبة مضافة بالطريقة التي يتبعها بلدك.' },
      tag: { en: '30 country presets', ar: 'هيئة الزكاة · 30 إعداداً' } },
    { n: '05',
      t: { en: 'Correct', ar: 'تصحيح' },
      d: { en: 'The finished job reports what it really used, and the estimator calibrates itself against your shop.',
           ar: 'تُبلغ المهمة المنتهية بما استهلكته فعلاً، فيعاير المقدِّر نفسه على مطبعتك.' },
      tag: { en: 'Measured, not assumed', ar: 'مقيس، لا مفترض' } }
  ];

  root.KHAYT_DATA = DATA;
  // cloud-features.js used to export this on its own. Kept so nothing that
  // reads the old name breaks while both spellings are in the tree.
  root.KHAYT_CLOUD = DATA.cloud;
})(typeof window !== 'undefined' ? window : globalThis);
