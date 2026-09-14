/* ============================================================
   KHAYT — the blog index, as one list
   ------------------------------------------------------------
   blog/index.html renders from this, so adding a post is: write the post file,
   add one entry here, add one <url> to sitemap.xml. Newest first.

   `date` is the date the thing being written about actually happened — a
   release date comes from the release, not from when the post was typed.
   ============================================================ */
window.KHAYT_POSTS = [
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
    }
  }
];
