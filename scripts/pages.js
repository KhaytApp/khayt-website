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
const FLAT = ['index.html', 'services.html', '404.html'];
const DIRS = ['blog', 'privacy', 'terms'];

module.exports = function pages() {
  const out = [...FLAT];
  for (const d of DIRS) {
    out.push(d + '/index.html');
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (f.endsWith('.html') && f !== 'index.html') out.push(d + '/' + f);
    }
  }
  return out;
};
