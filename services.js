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
    'sv.plans.eyebrow': { en: 'Plans', ar: 'الخطط' },
    'sv.plans.h2': { en: 'The prices are real. Nobody is being charged yet.', ar: 'الأسعار حقيقية. ولا أحد يُحاسَب بعد.' },
    'sv.plans.sub': { en: 'The desktop app is free forever and always will be — it is the hosted service, and only the hosted service, that Khayt charges for. Those prices are published now so nobody discovers one later, having built their shop on the assumption there wasn’t one.',
                      ar: 'تطبيق سطح المكتب مجاني للأبد وسيبقى كذلك — فالخدمة المستضافة، وهي وحدها، ما يتقاضى خيط مقابلها. وهذه الأسعار تُنشر الآن كي لا يكتشفها أحد لاحقاً بعد أن يكون قد بنى مطبعته على افتراض أنها غير موجودة.' },
    'sv.plans.monthly': { en: 'Monthly', ar: 'شهري' },
    'sv.plans.annual': { en: 'Annual', ar: 'سنوي' },
    'sv.plans.perMonth': { en: 'per shop / month', ar: 'لكل مطبعة / شهرياً' },
    'sv.plans.perYear': { en: 'per shop / year', ar: 'لكل مطبعة / سنوياً' },
    'sv.plans.forever': { en: 'forever', ar: 'للأبد' },
    'sv.plans.freeNow': { en: 'Free forever — no account needed', ar: 'مجاني للأبد — بلا حساب' },
    'sv.plans.betaNow': { en: 'Free during beta — nothing is being charged', ar: 'مجاني أثناء التجربة — لا يُحصَّل شيء' },
    'sv.plans.featured': { en: 'Most shops', ar: 'أغلب المطابع' },
    'sv.plans.soon': { en: 'Not built yet', ar: 'لم يُبنَ بعد' },
    'sv.plans.peg': { en: 'SAR is pegged to USD at 3.75, so these are the same price expressed twice. Other locales see USD — a rate snapshot that goes stale is worse than a foreign currency.',
                      ar: 'الريال مربوط بالدولار عند 3.75، فهذان السعران هما السعر نفسه مكتوباً مرتين. وبقية المناطق ترى الدولار — فسعر صرف مُلتقط يتقادم أسوأ من عملة أجنبية.' },

    'sv.list.count': { en: '{n} of 9 on', ar: '{n} من 9 مُشغَّلة' },
    'sv.list.allOn': { en: 'Switch everything on', ar: 'شغّل كل شيء' },
    'sv.list.allOff': { en: 'Switch everything off', ar: 'أطفئ كل شيء' },
    'sv.list.sends': { en: 'Switched on, this sends', ar: 'عند تشغيلها، تُرسل' },
    'sv.list.switchLabel': { en: 'Preview what this service sends', ar: 'اعرض ما ترسله هذه الخدمة' },

    'sv.status.r4': { en: 'Cloud billing — off, free during beta', ar: 'فوترة السحابة — متوقفة، مجانية أثناء التجربة' },
    'sv.status.r5': { en: 'Branches tier — not built yet', ar: 'فئة الفروع — لم تُبنَ بعد' },

    'sv.eyebrow': { en: 'Opt-in · Beta', ar: 'اختياري · تجريبي' },
    'sv.h1':      { en: 'Online services', ar: 'الخدمات السحابية' },
    'sv.lede':    { en: 'Khayt is a desktop app that works with no account, no server and no internet. On top of that there is an optional, end-to-end-encrypted cloud. This page is what it is, what each part of it sends, and how to switch any of it off.',
                    ar: 'خيط تطبيق سطح مكتب يعمل بلا حساب ولا خادم ولا إنترنت. وفوق ذلك توجد سحابة اختيارية مشفّرة من طرف إلى طرف. هذه الصفحة تشرح ما هي، وما يُرسله كل جزء منها، وكيف تُطفئ أيّاً منها.' },

    'sv.promise.t': { en: 'Off is the default, not a fallback', ar: 'الإيقاف هو الأصل، لا البديل' },
    'sv.promise.d': { en: 'Every service below ships switched off. A shop that never turns one on gets the whole app — queue, quoting, invoicing, inventory, analytics — running on its own machine, with no account to create and nothing leaving the building. Turning a service off again returns the app to exactly that.',
                      ar: 'كل خدمة أدناه تأتي معطّلة. والمطبعة التي لا تشغّل أياً منها تحصل على التطبيق كاملاً — القائمة والتسعير والفوترة والمخزون والتحليلات — يعمل على جهازها، بلا حساب يُنشأ وبلا شيء يغادر المكان. وإطفاء خدمة يعيد التطبيق إلى هذا بالضبط.' },

    'sv.list.eyebrow': { en: 'What’s on offer', ar: 'ما المتاح' },
    'sv.list.h2':  { en: 'Nine services, each on its own switch', ar: 'تسع خدمات، لكل منها مفتاحها' },
    'sv.list.sub': { en: 'Flip one on to see what it would send. Nothing here changes your install — this is the same switchboard the app shows you, and these are the same nine described on the home page, from one list so the two pages cannot drift apart.',
                     ar: 'شغّل إحداها لترى ما كانت سترسله. لا شيء هنا يغيّر ما هو مثبّت عندك — هذه هي لوحة المفاتيح نفسها التي يعرضها التطبيق، وهذه هي التسع نفسها الموصوفة في الصفحة الرئيسية، من قائمة واحدة لكي لا تتباعد الصفحتان.' },

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
    'sv.status.r3': { en: 'Desktop app — free forever', ar: 'تطبيق سطح المكتب — مجاني للأبد' },
    'sv.status.cta': { en: 'Download Khayt', ar: 'حمّل خيط' },
    'sv.status.blog': { en: 'Read the blog', ar: 'اقرأ المدوّنة' }
  };

  var BETA = { en: 'BETA', ar: 'تجريبي' };

  // Presentation state for the plan cards. Neither is persisted: a price is
  // not a preference, and a reload should show the page's own default.
  var cycle = 'monthly';
  var cur = 'USD';

  function lang() { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en'; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Which service cards are showing their "this sends" panel. The switches are
  // a preview of the app's own switchboard and nothing more: this page has no
  // idea what your install has turned on, and says so above the grid.
  var shown = {};

  function str(key) {
    var d = window.PAGE_STRINGS[key];
    return d ? d[lang()] : key;
  }

  /* ---------- The three plans ----------
     Rendered from KHAYT_DATA.plans, which is vendored from lib/cloud-plans.js
     in the app repo. While betaFree is true every non-zero price is struck
     through — the figure still shown, because the point of publishing it is
     that nobody meets it as a surprise later. */
  function renderPlans(L) {
    var grid = document.getElementById('planGrid');
    var D = window.KHAYT_DATA || {};
    if (!grid || !D.plans) return;

    var annual = cycle === 'annual';
    var sym = cur === 'SAR' ? 'SAR ' : '$';
    var html = '';

    for (var i = 0; i < D.plans.length; i++) {
      var p = D.plans[i];
      var amount = annual ? p.annual[cur] : p.price[cur];
      var isFree = amount === 0;
      var strike = !isFree && D.betaFree;

      var cls = 'plan';
      if (p.featured) cls += ' is-featured';
      if (p.soon) cls += ' is-soon';

      var badge = '';
      if (p.soon) badge = '<span class="plan-badge soon">' + esc(str('sv.plans.soon')) + '</span>';
      else if (p.featured) badge = '<span class="plan-badge">' + esc(str('sv.plans.featured')) + '</span>';

      var period = isFree ? str('sv.plans.forever')
        : (annual ? str('sv.plans.perYear') : str('sv.plans.perMonth'));

      var feats = '';
      for (var f = 0; f < p.features.length; f++) {
        feats += '<li>' + esc(p.features[f][L]) + '</li>';
      }

      html += '<article class="' + cls + '">' +
        '<div class="plan-top"><h3>' + esc(p.label[L]) + '</h3>' + badge + '</div>' +
        '<p class="plan-tag">' + esc(p.tagline[L]) + '</p>' +
        '<p class="plan-price"><span class="' + (strike ? 'amt struck' : 'amt') + '">' + esc(sym + amount) + '</span>' +
        '<span class="per">' + esc(period) + '</span></p>' +
        '<p class="plan-now' + (isFree ? ' free' : '') + '">' +
        esc(isFree ? str('sv.plans.freeNow') : str('sv.plans.betaNow')) + '</p>' +
        '<ul class="plan-feats">' + feats + '</ul>' +
        (p.soon
          ? '<span class="btn btn-ghost plan-cta is-dead" aria-disabled="true">' + esc(p.cta[L]) + '</span>'
          : '<a class="btn ' + (p.featured ? 'btn-accent' : 'btn-ghost') + ' plan-cta" href="' + esc(p.href) + '">' + esc(p.cta[L]) + '</a>') +
        '</article>';
    }
    grid.innerHTML = html;
  }

  /* ---------- The nine services, as a switchboard ---------- */
  function renderServices(L, list) {
    var grid = document.getElementById('svcGrid');
    if (!grid) return;

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var on = !!shown[i];
      var sends = SENDS[i] || { what: { en: '', ar: '' }, to: { en: '', ar: '' } };

      html += '<article class="svc' + (on ? ' is-on' : '') + '" id="svc-' + i + '">' +
        '<div class="svc-head">' +
          '<div class="svc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f.i + '</svg></div>' +
          '<div class="svc-text"><h3>' + esc(f.t[L]) + '</h3><p>' + esc(f.d[L]) + '</p></div>' +
          '<button type="button" class="sw" role="switch" aria-checked="' + (on ? 'true' : 'false') +
            '" data-svc="' + i + '" aria-label="' + esc(str('sv.list.switchLabel') + ' — ' + f.t[L]) + '">' +
            '<span class="sw-knob" aria-hidden="true"></span></button>' +
        '</div>' +
        '<div class="svc-sends"' + (on ? '' : ' hidden') + '>' +
          '<span class="svc-sends-k">' + esc(str('sv.list.sends')) + '</span>' +
          '<p>' + esc(sends.what[L]) + '</p>' +
          '<p class="svc-to">&rarr; ' + esc(sends.to[L]) + '</p>' +
        '</div>' +
      '</article>';
    }
    grid.innerHTML = html;
    paintCount(list.length);
  }

  function paintCount(total) {
    var n = 0;
    for (var k in shown) if (shown[k]) n++;
    var el = document.getElementById('svcCount');
    if (el) el.textContent = str('sv.list.count').replace('{n}', String(n));
    var all = document.getElementById('svcToggleAll');
    if (all) all.textContent = str(n === total ? 'sv.list.allOff' : 'sv.list.allOn');
  }

  function render() {
    var L = lang();
    var list = (window.KHAYT_DATA && window.KHAYT_DATA.cloud) || [];

    renderPlans(L);
    renderServices(L, list);

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
      // Measured again once the webfonts land. The first measurement runs with
      // fallback faces, which are wider: the table overflowed, the hint said
      // "swipe" — and then Archivo and Hanken loaded, the table fitted, and
      // nothing re-measured. The hint was pointing at nothing on every phone.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
      el.__wired = true;
    }
    paint();
  }

  /* ---------- Wiring ----------
     One delegated listener on the document: the grids are re-rendered on every
     language change, so anything bound to a card would be bound to a node that
     no longer exists. */
  document.addEventListener('click', function (ev) {
    var sw = ev.target.closest && ev.target.closest('.sw');
    if (sw) {
      var i = sw.getAttribute('data-svc');
      if (shown[i]) delete shown[i]; else shown[i] = true;
      render();
      var again = document.querySelector('.sw[data-svc="' + i + '"]');
      if (again) again.focus();
      return;
    }

    var all = ev.target.closest && ev.target.closest('#svcToggleAll');
    if (all) {
      var list = (window.KHAYT_DATA && window.KHAYT_DATA.cloud) || [];
      var n = 0;
      for (var k in shown) if (shown[k]) n++;
      shown = {};
      if (n !== list.length) for (var j = 0; j < list.length; j++) shown[j] = true;
      render();
      return;
    }

    var seg = ev.target.closest && ev.target.closest('.seg-btn');
    if (seg) {
      if (seg.hasAttribute('data-cycle')) cycle = seg.getAttribute('data-cycle');
      else if (seg.hasAttribute('data-cur')) cur = seg.getAttribute('data-cur');
      var group = seg.parentNode.children;
      for (var g = 0; g < group.length; g++) {
        var on = group[g] === seg;
        group[g].classList.toggle('is-on', on);
        group[g].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      renderPlans(lang());
    }
  });

  // site.js owns the language and announces every change, including the one it
  // applies on load. Rendering only on DOMContentLoaded would paint the grid in
  // English before site.js had read ?lang=ar.
  document.addEventListener('khayt:lang', render);
})();
