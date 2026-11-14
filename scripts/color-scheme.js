#!/usr/bin/env node
/* ============================================================
   Light and dark, on every page.
   ------------------------------------------------------------
   The site follows the visitor's system scheme (styles.css, the top of
   :root). A visitor can pin the other scheme for this site with the moon/sun
   button in the nav. Three pieces make that work, and this script writes all
   three into every page so no page can be missing one:

   1. <meta name="color-scheme" content="light dark"> in the <head>, with an
      inline script right after it that copies a saved pin into the meta. It
      runs before the first paint, so a pinned page never flashes the wrong
      scheme. It is the only thing that script does; if storage is blocked it
      does nothing and the system decides.
   2. The button, just before the language button. It carries both icons and
      both labels; CSS shows the one for the scheme you would switch TO, so
      the button needs no script to stay right when the system flips.
   3. A small inline script at the end of <body> that handles the click.
      Two states, as the platform guidance asks of a toggle in the chrome:
      the system scheme, and its opposite. Choosing the scheme the system
      already has REMOVES the pin rather than saving it, so nobody is pinned
      by accident when their OS changes at sunset.

   Inline scripts are allowed by hash, so run this BEFORE scripts/csp.js.

     node scripts/color-scheme.js          # write into every page
     node scripts/color-scheme.js --check  # exit 1 if any page is stale
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const pages = require('./pages.js');

const KEY = 'khayt-color-scheme';

const HEAD =
  '<meta name="color-scheme" content="light dark">\n' +
  `<script>try{var c=localStorage.getItem('${KEY}');if(c==='light'||c==='dark')document.querySelector('meta[name="color-scheme"]').content=c}catch(e){}</script>\n`;

const LABELS = {
  en: { dark: 'Switch to dark theme', light: 'Switch to light theme' },
  ar: { dark: 'التبديل إلى المظهر الداكن', light: 'التبديل إلى المظهر الفاتح' },
};

const MOON = '<svg class="when-light" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
const SUN = '<svg class="when-dark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';

const button = (lang) =>
  `<button class="theme-toggle" id="navTheme" type="button">${MOON}${SUN}` +
  `<span class="sr-only when-light">${LABELS[lang].dark}</span>` +
  `<span class="sr-only when-dark">${LABELS[lang].light}</span></button>\n      `;

const TAIL =
  '<script>(function(){' +
  `var m=document.querySelector('meta[name="color-scheme"]'),b=document.getElementById('navTheme'),K='${KEY}';` +
  "if(!m||!b)return;var q=matchMedia('(prefers-color-scheme: dark)');" +
  "function sys(){return q.matches?'dark':'light'}" +
  "function shown(){var v=m.content;return v==='light'||v==='dark'?v:sys()}" +
  "b.addEventListener('click',function(){var t=shown()==='dark'?'light':'dark',p=t===sys()?null:t;" +
  "m.content=p||'light dark';try{p?localStorage.setItem(K,p):localStorage.removeItem(K)}catch(e){}});" +
  "addEventListener('storage',function(e){if(e.key===K)m.content=e.newValue==='light'||e.newValue==='dark'?e.newValue:'light dark'})" +
  '})();</script>\n';

const OLD_HEAD = /<meta name="color-scheme" content="[^"]*">\n<script>[^<]*<\/script>\n/;
const OLD_BUTTON = /<button class="theme-toggle" id="navTheme"[\s\S]*?<\/button>\n\s*/;
const OLD_TAIL = /<script>\(function\(\)\{var m=document\.querySelector\('meta\[name="color-scheme"\]'\)[^<]*<\/script>\n/;

function apply(html) {
  const lang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  let out = html.replace(OLD_HEAD, '').replace(OLD_BUTTON, '').replace(OLD_TAIL, '');
  out = out.replace(/(<meta name="viewport"[^>]*>\n)/, '$1' + HEAD);
  if (/<button class="lang-toggle"/.test(out)) {
    out = out.replace(/<button class="lang-toggle"/, button(lang) + '<button class="lang-toggle"');
    out = out.replace(/<\/body>/, TAIL + '</body>');
  }
  return out;
}

module.exports = { apply };

if (require.main === module) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const f of pages()) {
    const html = fs.readFileSync(f, 'utf8');
    if (!/<meta name="viewport"/.test(html)) { stale.push(f + ' (no viewport meta to anchor on)'); continue; }
    const next = apply(html);
    if (next === html) continue;
    if (check) stale.push(f);
    else { fs.writeFileSync(f, next); console.log('color-scheme: ' + f); }
  }
  if (stale.length) {
    console.error('Colour scheme markup missing or stale on:\n  ' + stale.join('\n  ') +
      '\nRun `node scripts/color-scheme.js` and commit the result.');
    process.exit(1);
  }
}
