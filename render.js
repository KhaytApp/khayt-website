/* ============================================================
   KHAYT — the markup for the JS-built blocks, in one place
   ------------------------------------------------------------
   app.js and the blog index call these in the browser, and
   scripts/prerender.js calls them in Node. That is the whole point: the
   prerendered HTML in index.html and blog/index.html and the HTML the browser
   writes over it on load have to be byte-identical, or the page visibly
   reflows on every load and the prerender is worse than nothing.

   One implementation is the only way to guarantee that. A duplicated template
   string in the build script would agree on the day it was written.

   These are pure functions of (data, lang, t). No DOM, no globals, no state —
   which is also what lets prerender.js run them with no browser at all.
   ============================================================ */
(function (root) {
  'use strict';

  var R = {};

  function esc(s) {
    // The data is ours, not a visitor's, so this is a correctness guard for
    // ampersands in copy ("Catalog, Gift Cards & Portfolio"), not a security
    // boundary. Angle brackets are escaped anyway rather than relying on that.
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- "Built for print shop owners" ---------- */
  R.features = function (features, lang) {
    var html = '';
    for (var k = 0; k < features.length; k++) {
      var f = features[k];
      var n = (k + 1 < 10 ? '0' : '') + (k + 1);
      html += '<article class="feat">' +
        // The big faint number is decoration (1.4:1 on the card on purpose);
        // the cards are already a list, so a screen reader gains nothing from
        // hearing "zero one" before each heading.
        '<span class="num" aria-hidden="true">' + n + '</span>' +
        '<div class="feat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + f.i + '</svg></div>' +
        '<h3>' + esc(f.t[lang]) + '</h3><p>' + esc(f.d[lang]) + '</p></article>';
    }
    return html;
  };

  /* ---------- "From a file on the desk to money in the bank" ---------- */
  R.flow = function (flow, lang) {
    var html = '';
    for (var k = 0; k < flow.length; k++) {
      var f = flow[k];
      html += '<li class="step">' +
        '<span class="step-n" aria-hidden="true">' + esc(f.n) + '</span>' +
        '<h3>' + esc(f.t[lang]) + '</h3>' +
        '<p>' + esc(f.d[lang]) + '</p>' +
        '<span class="step-tag">' + esc(f.tag[lang]) + '</span>' +
        '</li>';
    }
    return html;
  };

  /* ---------- "An optional cloud" ---------- */
  R.cloud = function (cloud, lang, betaLabel) {
    var html = '';
    for (var k = 0; k < cloud.length; k++) {
      var f = cloud[k];
      html += '<article class="feat feat-beta">' +
        '<span class="beta-pill">' + esc(betaLabel) + '</span>' +
        '<div class="feat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + f.i + '</svg></div>' +
        '<h3>' + esc(f.t[lang]) + '</h3><p>' + esc(f.d[lang]) + '</p></article>';
    }
    return html;
  };

  /* ---------- "What's in each mode" ----------
     `strings` carries the six labels the table needs from the page's own
     dictionary: the two column names, the caption, the blank column's
     screen-reader label, and the two words behind the tick and the dash. */
  R.modesTable = function (modes, lang, strings) {
    var cols = [strings.simple, strings.professional];
    var yes = '<span class="cmp-yes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span class="sr-only">' + esc(strings.yes) + '</span></span>';
    var no = '<span class="cmp-no" aria-hidden="true"></span><span class="sr-only">' + esc(strings.no) + '</span>';

    var h = '<table class="cmp">';
    h += '<caption class="sr-only">' + esc(strings.caption) + '</caption>';
    h += '<colgroup><col class="cmp-c-feat"><col class="cmp-c"><col class="cmp-c cmp-c-hl"></colgroup>';
    // The first header is blank by design; blank to a screen reader is not the
    // same as absent, so it carries the label the visual column never needs.
    h += '<thead><tr><th class="cmp-feat" scope="col"><span class="sr-only">' + esc(strings.featcol) + '</span></th>';
    for (var c = 0; c < 2; c++) {
      h += '<th class="cmp-col' + (c === 1 ? ' cmp-col-hl' : '') + '" scope="col"><span class="cmp-chip">' + esc(cols[c]) + '</span></th>';
    }
    h += '</tr></thead><tbody>';
    for (var g = 0; g < modes.length; g++) {
      var grp = modes[g];
      h += '<tr class="cmp-grouprow"><td colspan="3"><span>' + esc(grp.g[lang]) + '</span></td></tr>';
      for (var r = 0; r < grp.rows.length; r++) {
        var row = grp.rows[r];
        h += '<tr><th class="cmp-feat" scope="row">' + esc(row.l[lang]) + '</th>';
        for (var m = 0; m < 2; m++) {
          h += '<td class="cmp-cell' + (m === 1 ? ' cmp-col-hl' : '') + '">' + (row.t[m] ? yes : no) + '</td>';
        }
        h += '</tr>';
      }
    }
    return h + '</tbody></table>';
  };

  /* ---------- The blog index's post cards ----------
     `strings` carries the two labels from the page's own dictionary: the
     "Read the post" line and the "Latest" tag. The date is formatted here too,
     so the visible date is part of what has to match. Only the English copy
     is ever prerendered, and en-GB formats the same in Node as in a browser;
     Arabic is written by the browser alone, so its digits are the browser's. */
  R.postDate = function (iso, lang) {
    try {
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-GB',
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
        .format(new Date(iso + 'T00:00:00Z'));
    } catch (e) { return iso; }
  };

  R.postCards = function (posts, lang, strings) {
    var html = '';
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      html += '<a class="post-card" href="' + esc(p.slug) + '.html">' +
        '<div class="post-meta"><span class="tag">' + esc(p.tag[lang]) + '</span>' +
        '<time datetime="' + esc(p.date) + '">' + esc(R.postDate(p.date, lang)) + '</time>' +
        // posts.js is newest-first, so the first card is the latest post.
        (i === 0 ? '<span class="tag latest">' + esc(strings.latest) + '</span>' : '') +
        '</div>' +
        '<h2>' + esc(p.t[lang]) + '</h2>' +
        '<p>' + esc(p.d[lang]) + '</p>' +
        '<span class="more">' + esc(strings.more) + '</span>' +
        '</a>';
    }
    return html;
  };

  root.KHAYT_RENDER = R;
})(typeof window !== 'undefined' ? window : globalThis);
