/* ============================================================
   KHAYT — the blog index, as one list
   ------------------------------------------------------------
   blog/index.html renders from this, so adding a post is: write the post file,
   add one entry here, add one <url> to sitemap.xml. Newest first. The index's
   cards are prerendered from it too (scripts/prerender.js), and CI fails if
   they were not re-rendered.

   `date` is the date the thing being written about actually happened — a
   release date comes from the release, not from when the post was typed.
   `updated`, when a post has one, is the date it last changed in substance;
   it is the post's dateModified, and without it that is `date`.

   `d` is the summary on the index card and in the feed, and can run long.
   `m` is the page's meta description, which search results cut at about 160
   characters, so it is the same summary with the lead sentence first and the
   rest trimmed to fit — CI holds both languages to 50–160.
   ============================================================ */
(function (root) {
  'use strict';
  root.KHAYT_POSTS = [
  {
    slug: 'mac-first',
    date: '2026-09-18',
    tag: { en: 'Direction', ar: 'الاتجاه' },
    t: {
      en: 'The Mac app leads now, and the cross-platform app follows',
      ar: 'تطبيق ماك يتقدّم الآن، والنسخة العابرة للمنصّات تتبعه'
    },
    d: {
      en: 'Khayt for macOS and the iPhone companion are where the work goes from here. The Windows and Linux app keeps being maintained and keeps getting the same features — weeks later, not never. What that means if you are running Khayt today.',
      ar: 'خيط لماك وتطبيق الآيفون المرافق هما وجهة العمل من الآن. وتطبيق ويندوز ولينكس يبقى مدعوماً ويأخذ المزايا نفسها — بعد أسابيع، لا أبداً. وهذا ما يعنيه ذلك إن كنت تشغّل خيط اليوم.'
    },
    m: {
      en: 'Khayt for macOS and the iPhone companion lead from here. The Windows and Linux app stays maintained and gets the same features — weeks later, not never.',
      ar: 'خيط لماك وتطبيق الآيفون المرافق يتقدّمان من الآن. وتطبيق ويندوز ولينكس يبقى مدعوماً ويأخذ المزايا نفسها — بعد أسابيع، لا أبداً.'
    }
  },
  {
    slug: 'native-mac-alpha',
    date: '2026-09-14',
    tag: { en: 'Mac', ar: 'ماك' },
    t: {
      en: 'Khayt for macOS, rebuilt native — where the alpha stands',
      ar: 'خيط لماك، مبنيّ من جديد — أين وصل إصدار الألفا'
    },
    d: {
      en: 'Not Electron in a Mac costume: real Mac windows, the menu bar, Quick Look, Shortcuts. What it already does, what an alpha means for a shop’s book, and why the Windows and Linux app is not going anywhere.',
      ar: 'ليس إلكترون بزيّ ماك: نوافذ ماك حقيقية، وشريط القوائم، وQuick Look، والاختصارات. ما يفعله الآن، وماذا يعني وصف "ألفا" لدفتر مطبعة، ولماذا لن يختفي تطبيق ويندوز ولينكس.'
    },
    m: {
      en: 'Not Electron in a Mac costume: real Mac windows, the menu bar, Quick Look, Shortcuts. What it already does, and what an alpha means for a shop’s book.',
      ar: 'ليس إلكترون بزيّ ماك: نوافذ ماك حقيقية، وشريط القوائم، وQuick Look، والاختصارات. ما يفعله الآن، وماذا يعني وصف "ألفا" لدفتر مطبعة.'
    }
  },
  {
    slug: 'what-the-cloud-sends',
    date: '2026-09-14',
    tag: { en: 'Cloud', ar: 'السحابة' },
    t: {
      en: 'What the optional cloud actually sends',
      ar: 'ما تُرسله السحابة الاختيارية فعلياً'
    },
    d: {
      en: '"In the cloud" is not one thing. Some of Khayt’s nine online services never transmit readable data at all; some send a single link; some talk to an account you opened yourself. Here is the difference, service by service.',
      ar: '"سحابي" ليس وصفاً واحداً. فبعض خدمات خيط التسع لا ترسل بيانات مقروءة أبداً، وبعضها يرسل رابطاً واحداً، وبعضها يخاطب حساباً فتحته أنت. إليك الفرق، خدمةً خدمة.'
    },
    m: {
      en: 'Some of Khayt’s nine online services never send readable data at all, some send a single link, some talk to an account you opened. Service by service.',
      ar: 'بعض خدمات خيط التسع لا ترسل بيانات مقروءة أبداً، وبعضها يرسل رابطاً واحداً، وبعضها يخاطب حساباً فتحته أنت. إليك الفرق، خدمةً خدمة.'
    }
  },
  {
    slug: 'khayt-3-7',
    date: '2026-09-11',
    tag: { en: 'Release', ar: 'إصدار' },
    t: {
      en: 'Khayt 3.7: costs measured, not guessed',
      ar: 'خيط 3.7: تكاليف مقيسة، لا مخمَّنة'
    },
    d: {
      en: 'A model dropped on the calculator becomes a quote; a finished job reports the filament and hours it actually used, and the next estimate corrects itself. Plus tax that behaves the way your country does, in thirty presets.',
      ar: 'نموذج تُسقطه على الحاسبة يصير عرض سعر؛ ومهمة منتهية تُبلّغ بالخيط والساعات التي استُهلكت فعلاً، فيصحّح التقدير التالي نفسه. وضريبة تتصرّف كما تتصرّف في بلدك، بثلاثين إعداداً جاهزاً.'
    },
    m: {
      en: 'Khayt 3.7 turns a model dropped on the calculator into a quote, and each finished job\'s real filament and hours correct the next estimate. Plus 30 tax presets.',
      ar: 'في خيط 3.7 يصير النموذج الذي تُسقطه على الحاسبة عرض سعر، وتصحّح كل مهمة منتهية التقدير التالي بخيطها وساعاتها الفعلية. وثلاثون إعداداً ضريبياً جاهزاً.'
    }
  }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
