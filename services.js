/* ============================================================
   KHAYT — services.html
   ------------------------------------------------------------
   Two things: render the nine cloud services from the shared list, and render
   the "what each one sends" table.

   Every row of that table restates something the app or the home page already
   says about that service. Nothing here describes behaviour that is only
   claimed on this page — if a row cannot be traced back to the service's own
   description in cloud-features.js, it does not belong here.
   ============================================================ */
(function () {
  'use strict';

  // Keyed by position in window.KHAYT_CLOUD so the two lists stay aligned.
  // `to` is deliberately blunt: "Khayt's sync server", a named third party you
  // hold the account with, or the customer you sent a link to.
  var SENDS = [
    {
      what: { en: 'Your shop’s data, encrypted on your machine first', ar: 'بيانات مطبعتك، مشفّرة على جهازك أولاً' },
      to:   { en: 'The sync server — which only ever holds ciphertext', ar: 'خادم المزامنة — ولا يحمل إلا نصاً مشفّراً' }
    },
    {
      what: { en: 'The same encrypted shop data, shared with the staff you invite', ar: 'نفس بيانات المطبعة المشفّرة، مشتركة مع من تدعوهم' },
      to:   { en: 'The sync server, and the people you gave a role to', ar: 'خادم المزامنة، ومن منحتهم دوراً' }
    },
    {
      what: { en: 'Only what you publish: the products, prices and promo codes you put on the page', ar: 'فقط ما تنشره: المنتجات والأسعار ورموز الخصم التي تضعها' },
      to:   { en: 'Anyone with the shop page link — it is a public page', ar: 'أي شخص لديه رابط صفحة المتجر — فهي صفحة عامة' }
    },
    {
      what: { en: 'One order’s stage — received, printing, finishing, ready', ar: 'مرحلة طلب واحد — مُستلم، قيد الطباعة، التشطيب، جاهز' },
      to:   { en: 'The customer you sent that order’s link to', ar: 'العميل الذي أرسلت إليه رابط ذلك الطلب' }
    },
    {
      what: { en: 'A star rating and a comment, written by the customer', ar: 'تقييم بالنجوم وتعليق، يكتبهما العميل' },
      to:   { en: 'Back to you, and onto the storefront as an average', ar: 'إليك، وإلى واجهة المتجر كمتوسط' }
    },
    {
      what: { en: 'The order update, and the customer’s phone number', ar: 'تحديث الطلب، ورقم هاتف العميل' },
      to:   { en: 'Twilio, the WhatsApp Cloud API, Unifonic or your own webhook — your account, your choice', ar: 'Twilio أو WhatsApp Cloud API أو Unifonic أو ويب هوك خاص بك — حسابك واختيارك' }
    },
    {
      what: { en: 'The question you typed and the shop figures needed to answer it', ar: 'السؤال الذي كتبته وأرقام المطبعة اللازمة للإجابة' },
      to:   { en: 'The AI provider whose key you entered — the key itself stays on your machine', ar: 'مزوّد الذكاء الاصطناعي الذي أدخلت مفتاحه — والمفتاح نفسه يبقى على جهازك' }
    },
    {
      what: { en: 'Nothing on its own — it forecasts from usage already on your machine', ar: 'لا شيء بذاته — يتوقّع من استهلاك موجود أصلاً على جهازك' },
      to:   { en: 'Your supplier, only once you send the purchase order it drafted', ar: 'مورّدك، وفقط حين تُرسل أمر الشراء الذي صاغه' }
    },
    {
      what: { en: 'Paid invoices, on the accounting webhook — the labels themselves print locally', ar: 'الفواتير المدفوعة عبر ويب هوك المحاسبة — أمّا الملصقات فتُطبع محلياً' },
      to:   { en: 'QuickBooks, Zoho or Xero — one way, and only if you connected one', ar: 'QuickBooks أو Zoho أو Xero — باتجاه واحد، وفقط إن ربطت أحدها' }
    }
  ];

  window.PAGE_STRINGS = {
    'sv.eyebrow': { en: 'Opt-in · Beta', ar: 'اختياري · تجريبي' },
    'sv.h1':      { en: 'Online services', ar: 'الخدمات السحابية' },
    'sv.lede':    { en: 'Khayt is a desktop app that works with no account, no server and no internet. On top of that there is an optional, end-to-end-encrypted cloud. This page is what it is, what each part of it sends, and how to switch any of it off.',
                    ar: 'خيط تطبيق سطح مكتب يعمل بلا حساب ولا خادم ولا إنترنت. وفوق ذلك توجد سحابة اختيارية مشفّرة من طرف إلى طرف. هذه الصفحة تشرح ما هي، وما يُرسله كل جزء منها، وكيف تُطفئ أيّاً منها.' },

    'sv.promise.t': { en: 'Off is the default, not a fallback', ar: 'الإيقاف هو الأصل، لا البديل' },
    'sv.promise.d': { en: 'Every service below ships switched off. A shop that never turns one on gets the whole app — queue, quoting, invoicing, inventory, analytics — running on its own machine, with no account to create and nothing leaving the building. Turning a service off again returns the app to exactly that.',
                      ar: 'كل خدمة أدناه تأتي معطّلة. والمطبعة التي لا تشغّل أياً منها تحصل على التطبيق كاملاً — القائمة والتسعير والفوترة والمخزون والتحليلات — يعمل على جهازها، بلا حساب يُنشأ وبلا شيء يغادر المكان. وإطفاء خدمة يعيد التطبيق إلى هذا بالضبط.' },

    'sv.list.eyebrow': { en: 'What’s on offer', ar: 'ما المتاح' },
    'sv.list.h2':  { en: 'Nine services, each on its own switch', ar: 'تسع خدمات، لكل منها مفتاحها' },
    'sv.list.sub': { en: 'These are the same nine described on the home page — one list, so the two pages cannot drift apart. All are in beta.',
                     ar: 'هذه هي التسع نفسها الموصوفة في الصفحة الرئيسية — قائمة واحدة، لكي لا تتباعد الصفحتان. وجميعها تجريبية.' },

    'sv.sends.eyebrow': { en: 'Plainly', ar: 'بوضوح' },
    'sv.sends.h2':  { en: 'What each one actually sends', ar: 'ما تُرسله كل خدمة فعلياً' },
    'sv.sends.sub': { en: 'A service being "in the cloud" is not one thing. Some never send readable data at all; some send a single link; some talk to a third party you chose and paid for yourself. The difference matters, so here it is by row.',
                      ar: 'كون الخدمة "سحابية" ليس شيئاً واحداً. فبعضها لا يرسل بيانات مقروءة أبداً، وبعضها يرسل رابطاً واحداً، وبعضها يخاطب طرفاً ثالثاً اخترته ودفعت له بنفسك. والفرق مهمّ، فإليكه صفّاً صفّاً.' },
    'sv.sends.caption': { en: 'What each online service transmits and to where', ar: 'ما تنقله كل خدمة سحابية وإلى أين' },
    'sv.sends.col1': { en: 'Service', ar: 'الخدمة' },
    'sv.sends.col2': { en: 'What leaves your machine', ar: 'ما يغادر جهازك' },
    'sv.sends.col3': { en: 'Who receives it', ar: 'من يستلمه' },
    'sv.sends.hint': { en: 'Swipe the table to read every column', ar: 'اسحب الجدول لقراءة كل الأعمدة' },
    'sv.sends.note': { en: 'Every row above restates what the app itself does; none of it is a promise made only on this page. Where a row names a third party — Twilio, the WhatsApp Cloud API, Unifonic, QuickBooks, Zoho, Xero, an AI provider — that is an account you open and control, and Khayt sends nothing to it until you have entered your own credentials.',
                       ar: 'كل صف أعلاه يعيد صياغة ما يفعله التطبيق نفسه؛ وليس فيه وعد يُقطع في هذه الصفحة وحدها. وحيثما يذكر صفّ طرفاً ثالثاً — Twilio أو WhatsApp Cloud API أو Unifonic أو QuickBooks أو Zoho أو Xero أو مزوّد ذكاء اصطناعي — فهو حساب تفتحه أنت وتتحكم فيه، ولا يرسل خيط إليه شيئاً حتى تدخل بياناتك فيه.' },

    'sv.enc.eyebrow': { en: 'The sync model', ar: 'نموذج المزامنة' },
    'sv.enc.h2': { en: 'The server holds ciphertext it cannot read', ar: 'الخادم يحمل نصاً مشفّراً لا يستطيع قراءته' },
    'sv.enc.k1': { en: 'Encrypted where', ar: 'أين يُشفّر' },
    'sv.enc.v1': { en: 'On your machine, before anything is sent', ar: 'على جهازك، قبل إرسال أي شيء' },
    'sv.enc.k2': { en: 'Passphrase', ar: 'عبارة المرور' },
    'sv.enc.v2': { en: 'Never leaves your machine', ar: 'لا تغادر جهازك أبداً' },
    'sv.enc.k3': { en: 'Server sees', ar: 'ما يراه الخادم' },
    'sv.enc.v3': { en: 'Ciphertext only', ar: 'نص مشفّر فقط' },
    'sv.enc.k4': { en: 'If you lose it', ar: 'إن فقدتها' },
    'sv.enc.v4': { en: 'No reset — by design', ar: 'لا إعادة تعيين — بحكم التصميم' },
    'sv.enc.k5': { en: 'Turn it off', ar: 'عند الإيقاف' },
    'sv.enc.v5': { en: 'App returns to 100% offline', ar: 'يعود التطبيق دون اتصال تماماً' },

    'sv.status.eyebrow': { en: 'Where this stands', ar: 'أين يقف هذا' },
    'sv.status.h2': { en: 'All of it is beta, and labelled that way in the app', ar: 'جميعها تجريبي، وموسومة كذلك داخل التطبيق' },
    'sv.status.r1': { en: 'Cloud services — beta', ar: 'الخدمات السحابية — تجريبية' },
    'sv.status.r2': { en: 'Offline core — stable', ar: 'النواة دون اتصال — مستقرة' },
    'sv.status.r3': { en: 'Price — free, no subscription', ar: 'السعر — مجاني، بلا اشتراك' },
    'sv.status.cta': { en: 'Download Khayt', ar: 'حمّل خيط' },
    'sv.status.blog': { en: 'Read the blog', ar: 'اقرأ المدوّنة' }
  };

  var BETA = { en: 'BETA', ar: 'تجريبي' };

  function lang() { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    var L = lang();
    var list = window.KHAYT_CLOUD || [];

    var grid = document.getElementById('svcGrid');
    if (grid) {
      var h = '';
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        h += '<article class="feat feat-beta" id="svc-' + i + '">' +
          '<span class="beta-pill">' + BETA[L] + '</span>' +
          '<div class="feat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f.i + '</svg></div>' +
          '<h3>' + esc(f.t[L]) + '</h3>' +
          '<p>' + esc(f.d[L]) + '</p>' +
          '</article>';
      }
      grid.innerHTML = h;
    }

    var body = document.getElementById('sendsBody');
    if (body) {
      var rows = '';
      for (var j = 0; j < list.length && j < SENDS.length; j++) {
        rows += '<tr>' +
          '<th scope="row"><a href="#svc-' + j + '">' + esc(list[j].t[L]) + '</a></th>' +
          '<td>' + esc(SENDS[j].what[L]) + '</td>' +
          '<td>' + esc(SENDS[j].to[L]) + '</td>' +
          '</tr>';
      }
      body.innerHTML = rows;
    }

    syncScroll();
  }

  // Same measurement the home page's comparison table uses: the fade and the
  // worded hint appear only while there is somewhere left to scroll.
  function syncScroll() {
    var el = document.getElementById('sendsWrap');
    var frame = document.getElementById('sendsFrame');
    var hint = document.getElementById('sendsHint');
    if (!el || !frame) return;
    function paint() {
      var slack = el.scrollWidth - el.clientWidth;
      var scrollable = slack > 2;
      frame.classList.toggle('is-scrollable', scrollable);
      frame.classList.toggle('at-end', scrollable && Math.abs(el.scrollLeft) >= slack - 2);
      if (hint) hint.hidden = !scrollable;
    }
    if (!el.__wired) {
      el.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint, { passive: true });
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'region');
      el.__wired = true;
    }
    paint();
  }

  // site.js owns the language and announces every change, including the one it
  // applies on load. Rendering only on DOMContentLoaded would paint the grid in
  // English before site.js had read ?lang=ar.
  document.addEventListener('khayt:lang', render);
})();
