#!/usr/bin/env node
/* ============================================================
   Start a blog post.
   ------------------------------------------------------------
   A post touches four things, and three of them are bookkeeping that CI will
   fail on if you forget: the post file, its entry in blog/posts.js, its URL
   in sitemap.xml, and blog/feed.xml. This does all four, so the only thing
   left is writing.

     node scripts/new-post.js <slug> <YYYY-MM-DD> "<Tag EN>" "<Tag AR>"

   e.g.
     node scripts/new-post.js khayt-3-8 2026-10-02 Release إصدار

   Then write the title and summary in blog/posts.js — that is where they
   live, and scripts/stamp-posts.js copies them into the page — and the prose
   in blog/<slug>.html. Both are bilingual, because this site is.

   The post file is generated from scripts/post-template.html, which is itself
   a real post with the words taken out, so a change to the page chrome only
   has to be made in one place plus the existing posts.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

const [slug, date, tagEn, tagAr] = process.argv.slice(2);

function die(msg) {
  console.error('new-post: ' + msg);
  console.error('\n  node scripts/new-post.js <slug> <YYYY-MM-DD> "<Tag EN>" "<Tag AR>"');
  console.error('  node scripts/new-post.js khayt-3-8 2026-10-02 Release إصدار');
  process.exit(1);
}

if (!slug || !date || !tagEn || !tagAr) die('needs a slug, a date, and a tag in both languages');
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) die(`"${slug}" is not a usable slug — lowercase, digits and hyphens`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) die(`"${date}" is not YYYY-MM-DD`);
if (Number.isNaN(Date.parse(date + 'T12:00:00Z'))) die(`"${date}" is not a real date`);

const target = path.join('blog', slug + '.html');
if (fs.existsSync(target)) die(target + ' already exists');

/* ---------- 1. the post file ---------- */

const longDate = new Intl.DateTimeFormat('en-GB',
  { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  .format(new Date(date + 'T12:00:00Z'));

const TODO_EN = '        <p>TODO — write the post in English. Headings are &lt;h2&gt;, and\n' +
  '        links to elsewhere on the site are relative, like ../index.html#download.</p>';
const TODO_AR = '        <p>TODO — اكتب المقال بالعربية.</p>';

const filled = fs.readFileSync(path.join('scripts', 'post-template.html'), 'utf8')
  .replace(/__SLUG__/g, slug)
  .replace(/__DATE_LONG__/g, longDate)
  .replace(/__DATE__/g, date)
  .replace(/__TAG_EN__/g, tagEn)
  .replace(/__TAG_AR__/g, tagAr)
  .replace(/__TITLE_EN__/g, 'TODO: title in English')
  .replace(/__TITLE_AR__/g, 'TODO: العنوان بالعربية')
  .replace(/__DESC_EN__/g, 'TODO: one-sentence summary in English.')
  .replace(/__DESC_AR__/g, 'TODO: ملخص بجملة واحدة بالعربية.')
  .replace(/__BODY_EN__/g, TODO_EN)
  .replace(/__BODY_AR__/g, TODO_AR);

const left = filled.match(/__[A-Z_]+__/g);
if (left) die('the template has placeholders this script does not fill: ' + [...new Set(left)].join(', '));

fs.writeFileSync(target, filled);

/* ---------- 2. blog/posts.js, newest first ---------- */

const POSTS = path.join('blog', 'posts.js');
let posts = fs.readFileSync(POSTS, 'utf8');
const anchor = 'root.KHAYT_POSTS = [\n';
if (!posts.includes(anchor)) die('could not find the list in blog/posts.js');

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const entry =
`  {
    slug: ${q(slug)},
    date: ${q(date)},
    tag: { en: ${q(tagEn)}, ar: ${q(tagAr)} },
    t: {
      en: 'TODO: title in English',
      ar: 'TODO: العنوان بالعربية'
    },
    d: {
      en: 'TODO: one-sentence summary in English.',
      ar: 'TODO: ملخص بجملة واحدة بالعربية.'
    }
  },
`;
posts = posts.replace(anchor, anchor + entry);
fs.writeFileSync(POSTS, posts);

/* ---------- 3. sitemap.xml ---------- */

const SITEMAP = 'sitemap.xml';
let xml = fs.readFileSync(SITEMAP, 'utf8');
const url =
`  <url>
    <loc>https://khaytapp.com/blog/${slug}.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://khaytapp.com/blog/${slug}.html"/>
    <xhtml:link rel="alternate" hreflang="ar" href="https://khaytapp.com/blog/${slug}.html?lang=ar"/>
    <lastmod>${date}</lastmod>
    <priority>0.6</priority>
  </url>
`;
if (!xml.includes('</urlset>')) die('sitemap.xml has no </urlset>');
xml = xml.replace('</urlset>', url + '</urlset>');
fs.writeFileSync(SITEMAP, xml);

/* ---------- 4. the feed ---------- */

execFileSync(process.execPath, [path.join('scripts', 'make-feed.js')], { stdio: 'pipe' });

console.log(`Created ${target}`);
console.log('  · added to blog/posts.js (newest first)');
console.log('  · added to sitemap.xml');
console.log('  · blog/feed.xml regenerated');
console.log('\nNow, two files and one command:');
console.log('  1. blog/posts.js   — the title and the one-line summary, in both languages.');
console.log('                       This is the source for them; the page is stamped from it.');
console.log(`  2. ${target}
                       — the prose only, in both <div class="post-body"> blocks.`);
console.log('  3. node scripts/stamp-posts.js && node scripts/make-feed.js && node scripts/check-site.js');
