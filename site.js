/* ============================================================
   KHAYT — shared chrome for the pages that are not the landing page
   ------------------------------------------------------------
   index.html has app.js, which is large and full of things only that page
   has (the gallery, the theme demo, the release fetch). The blog and the
   services page need four much smaller things, and running app.js on them
   would mean an unnecessary GitHub API call on every page view:

     · the nav's scrolled state and the mobile burger
     · the language toggle, with the same ?lang= URL and localStorage key
     · bilingual bodies, switched by [data-lang] rather than per-string
     · the page's own <title> and description following the language

   The short chrome strings live in CHROME below. Long prose does NOT: a post
   carries both languages as two blocks in the markup, because paragraphs of
   Arabic threaded through a JS dictionary are unreadable in both.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'khayt-lang';

  var CHROME = {
    'nav.screens':   { en: 'Screens', ar: 'الشاشات' },
    'nav.modes':     { en: 'Modes', ar: 'الأوضاع' },
    'nav.features':  { en: 'Features', ar: 'المزايا' },
    'nav.cloud':     { en: 'Cloud', ar: 'السحابة' },
    'nav.whatsnew':  { en: "What's New", ar: 'الجديد' },
    'nav.languages': { en: 'Languages', ar: 'اللغات' },
    'nav.services':  { en: 'Services', ar: 'الخدمات' },
    'nav.blog':      { en: 'Blog', ar: 'المدوّنة' },
    'nav.download':  { en: 'Download', ar: 'تحميل' },
    'nav.home':      { en: 'Home', ar: 'الرئيسية' },

    'a11y.skip': { en: 'Skip to content', ar: 'تخطّ إلى المحتوى' },
    'a11y.toAr': { en: 'Switch language to Arabic', ar: 'تغيير اللغة إلى العربية' },
    'a11y.toEn': { en: 'Switch language to English', ar: 'تغيير اللغة إلى الإنجليزية' },

    'foot.desc':     { en: 'The all-in-one production desk for 3D print shops — quoting, queue, invoicing and inventory, entirely offline.', ar: 'مكتب الإنتاج المتكامل لمطابع الطباعة ثلاثية الأبعاد — التسعير والقائمة والفوترة والمخزون، دون اتصال تماماً.' },
    'foot.product':  { en: 'Product', ar: 'المنتج' },
    'foot.project':  { en: 'Project', ar: 'المشروع' },
    'foot.releases': { en: 'Releases', ar: 'الإصدارات' },
    'foot.community':{ en: 'Community', ar: 'المجتمع' },
    'foot.license':  { en: 'License', ar: 'الرخصة' },
    'foot.sponsor':  { en: 'Sponsor', ar: 'ادعم المشروع' },
    'foot.made':     { en: 'Made with ♥ for the 3D printing community · Built with the help of AI', ar: 'صُنع بحب لمجتمع الطباعة ثلاثية الأبعاد · بُني بمساعدة الذكاء الاصطناعي' },

    'back.blog':  { en: '← All posts', ar: 'كل المقالات →' },
    'post.share': { en: 'Read this in', ar: 'اقرأ هذا بـ' }
  };

  var lang = 'en';

  function t(key) {
    var e = CHROME[key];
    return e ? e[lang] : (window.PAGE_STRINGS && window.PAGE_STRINGS[key] ? window.PAGE_STRINGS[key][lang] : key);
  }

  /* ---------- Language ---------- */

  function applyLang(next) {
    lang = (next === 'ar') ? 'ar' : 'en';
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-i18n');
      var v = t(k);
      if (v !== k) nodes[i].textContent = v;
    }

    // A post's date follows the language, the same rule the app itself uses for
    // dates: an Arabic page should not be showing "11 September 2026".
    var times = document.querySelectorAll('time[datetime]');
    for (var d = 0; d < times.length; d++) {
      var iso = times[d].getAttribute('datetime');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
      try {
        times[d].textContent = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-GB',
          { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
          .format(new Date(iso + 'T00:00:00Z'));
      } catch (e) {}
    }

    // Long prose ships as two blocks rather than as dictionary entries.
    var blocks = document.querySelectorAll('[data-lang]');
    for (var b = 0; b < blocks.length; b++) {
      blocks[b].hidden = blocks[b].getAttribute('data-lang') !== lang;
    }

    // The page's own metadata follows the page, the same as on index.html.
    var titles = document.querySelector('[data-page-title-ar]');
    if (titles) {
      var ar = titles.getAttribute('data-page-title-ar');
      var en = titles.getAttribute('data-page-title-en');
      if (ar && en) document.title = (lang === 'ar' ? ar : en);
    }
    var md = document.querySelector('meta[name="description"]');
    var descEl = document.querySelector('[data-page-desc-ar]');
    if (md && descEl) {
      md.setAttribute('content', descEl.getAttribute(lang === 'ar' ? 'data-page-desc-ar' : 'data-page-desc-en') || md.content);
    }

    var btn = document.getElementById('navLang');
    if (btn) {
      var toAr = lang !== 'ar';
      btn.innerHTML = '<span aria-hidden="true">🌐</span> ' +
        (toAr ? '<span lang="ar">العربية</span>' : '<span lang="en">English</span>');
      btn.setAttribute('aria-label', t(toAr ? 'a11y.toAr' : 'a11y.toEn'));
    }

    try {
      var u = new URL(window.location.href);
      if (lang === 'ar') u.searchParams.set('lang', 'ar'); else u.searchParams.delete('lang');
      history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) {}

    try { localStorage.setItem(KEY, lang); } catch (e) {}

    // Pages with JS-rendered content (services.js) redraw on this rather than
    // on DOMContentLoaded, which would fire before the language is settled.
    document.dispatchEvent(new CustomEvent('khayt:lang', { detail: { lang: lang } }));
  }

  /* ---------- Nav ---------- */

  function nav() {
    var el = document.getElementById('nav');
    if (!el) return;
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

  document.addEventListener('DOMContentLoaded', function () {
    var saved = 'en';
    try { saved = localStorage.getItem(KEY) || 'en'; } catch (e) {}
    // An explicit ?lang= in the link beats the saved preference, so an Arabic
    // link opens in Arabic for someone who reads the site in English.
    try {
      var q = new URL(window.location.href).searchParams.get('lang');
      if (q === 'ar' || q === 'en') saved = q;
    } catch (e) {}

    nav();
    var toggle = document.getElementById('navLang');
    if (toggle) toggle.addEventListener('click', function () { applyLang(lang === 'ar' ? 'en' : 'ar'); });
    applyLang(saved);
  });
})();
