/* Every HTML page this site serves, in one place.
   ------------------------------------------------------------
   It used to be in two: check-site.js had its own list and check-links.js had
   another, and adding /privacy and /terms updated one of them. The link
   checker then reported the site clean while never opening either new page.
   Both scripts require this now, so a page added here is checked by both. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Directory pages, each an index.html one level down. 404.html is one of the
// flat ones on purpose — GitHub Pages hands it to anyone who mistypes a URL.
const FLAT = ['index.html', 'services.html', '404.html', 'success.html', 'cancel.html', 'failure.html'];
// ar/ is the site in Arabic: the home page (scripts/make-ar.js) and a copy of
// every sub-page in AR_SOURCES below (scripts/make-ar-pages.js), at the same
// path under /ar/.
const DIRS = ['ar', 'ar/blog', 'ar/privacy', 'ar/terms', 'blog', 'privacy', 'terms'];

module.exports = function pages() {
  const out = [...FLAT];
  for (const d of DIRS) {
    if (!fs.existsSync(path.join(ROOT, d, 'index.html'))) continue;
    out.push(d + '/index.html');
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (f.endsWith('.html') && f !== 'index.html') out.push(d + '/' + f);
    }
  }
  return out;
};

// Pages that exist to be landed on, never to be found: the 404, and the three
// a BNPL checkout (Tabby, Tamara) returns a shop's customer to — the desktop
// app's payment links name https://khaytapp.com/success, /cancel and /failure
// (lib/main/payment-links.js in the app repo), and for as long as they existed
// a customer who had just paid landed on "page not found". All four are
// noindex, carry no canonical, and stay out of the sitemap.
module.exports.NOINDEX = new Set(['404.html', 'success.html', 'cancel.html', 'failure.html']);

// The English sub-pages that have an Arabic copy at ar/<same path>, written by
// scripts/make-ar-pages.js: services, the blog and every post, and the two
// policies. The home page's copy (ar/index.html) is make-ar.js's.
module.exports.AR_SOURCES = function arSources() {
  const posts = fs.readdirSync(path.join(ROOT, 'blog'))
    .filter(f => f.endsWith('.html') && f !== 'index.html').sort().map(f => 'blog/' + f);
  return ['services.html', 'privacy/index.html', 'terms/index.html', 'blog/index.html', ...posts];
};

// Where an internal link to `file` (repo-relative, e.g. 'blog/', 'privacy/index.html')
// should point from an Arabic page: the Arabic copy when there is one, else
// the file itself. Root-absolute either way, fragment and query untouched.
module.exports.arHref = function arHref(file) {
  const m = /^([^?#]*)(.*)$/.exec(file);
  let p = m[1], rest = m[2];
  const asFile = p === '' || p.endsWith('/') ? p + 'index.html' : p;
  const localised = asFile === 'index.html' || module.exports.AR_SOURCES().includes(asFile);
  // An old "?lang=ar" on such a link is redundant on the copy, which is Arabic.
  if (localised) rest = rest.replace(/^\?lang=ar(?=#|$)/, '');
  return '/' + (localised ? 'ar/' : '') + p + rest;
};
