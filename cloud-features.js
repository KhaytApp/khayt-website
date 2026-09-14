/* ============================================================
   KHAYT — the opt-in cloud, as one list
   ------------------------------------------------------------
   Both the home page's cloud section and services.html describe the same nine
   services. They were going to be written twice and drift, the way the
   language count did, so the list lives here and both pages read it.

   Everything here is opt-in. The desktop app runs fully offline with all of it
   switched off; that is the default and the fallback, not a degraded mode.
   ============================================================ */
window.KHAYT_CLOUD = [
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
