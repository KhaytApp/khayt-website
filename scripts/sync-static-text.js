#!/usr/bin/env node
/* Copy app.js's English strings into index.html's data-i18n elements.

   app.js rewrites every data-i18n element from DICT when the page runs, so
   the browser never shows the HTML's own copy — but a crawler, a link
   preview and a reader without JS see nothing else. check-site.js holds the
   two equal; this makes them equal. DICT is the source: it is what the page
   shows to everyone who runs it.

     node scripts/sync-static-text.js

   Leaf elements (plain text) get their text replaced, escaped. data-i18n-html
   elements get DICT's markup as-is, matched to their own closing tag. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
process.chdir(path.resolve(__dirname, '..'));

const src = fs.readFileSync('app.js', 'utf8');
const start = src.indexOf('var DICT = {');
const end = src.indexOf('\n  };', start);
const dict = vm.runInNewContext('(' + src.slice(src.indexOf('{', start), end) + '\n})');

const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let html = fs.readFileSync('index.html', 'utf8');
let changed = 0;

html = html.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)</g, (whole, open, key, text) => {
  const e = dict[key];
  if (!e || typeof e.en !== 'string') return whole;
  const want = esc(e.en);
  if (text.replace(/\s+/g, ' ').trim() === want) return whole;
  changed++;
  return open + want + '<';
});
html = html.replace(/(<(\w+)[^>]*\sdata-i18n-html="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (whole, open, tag, key, inner, close) => {
  const e = dict[key];
  if (!e || typeof e.en !== 'string' || inner.replace(/\s+/g, ' ').trim() === e.en) return whole;
  changed++;
  return open + e.en + close;
});

fs.writeFileSync('index.html', html);
console.log(changed ? `synced ${changed} element(s) from app.js` : 'already in sync');
