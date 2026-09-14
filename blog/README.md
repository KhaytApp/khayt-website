# Adding a post

```bash
node scripts/new-post.js <slug> <YYYY-MM-DD> "<Tag EN>" "<Tag AR>"
# e.g.
node scripts/new-post.js khayt-3-8 2026-10-02 Release إصدار
```

That creates `blog/<slug>.html` and registers it in the three places CI checks:
`blog/posts.js`, `sitemap.xml`, and `blog/feed.xml`.

Then edit two files:

1. **`blog/posts.js`** — the title and the one-line summary, in both languages.
   This is where they live. The post page is stamped from it, so do not edit
   them in the HTML; they will be overwritten.
2. **`blog/<slug>.html`** — the prose, in both `<div class="post-body">` blocks.
   English in `data-lang="en"`, Arabic in `data-lang="ar" hidden`.

Then:

```bash
node scripts/stamp-posts.js && node scripts/make-feed.js && node scripts/check-site.js
```

Commit, and merging to `main` publishes it.

## Why the title is in two places and the prose is not

A post's title and summary appear in nine places across its own page and the
index — `<title>`, the meta description, three `og:` tags, the JSON-LD, the two
`<h1>`s, and `posts.js`, in two languages each. Written by hand they drift, and
they did: one post's page said "What the alpha already does" while the index
and the feed said "What it already does".

So `posts.js` owns them and `stamp-posts.js` copies them in. `check-site.js`
fails if a page is out of date, so forgetting to re-stamp breaks the build
rather than shipping a page whose tab, share card and heading disagree with the
index linking to it.

Prose stays in the HTML because prose belongs in HTML — it has headings, links
and emphasis, and threading paragraphs of Arabic through a JavaScript
dictionary is unreadable in both languages.

## Dates

`date` is the date the thing being written about actually happened — a release
date comes from the release, not from when the post was typed. The visible date
is formatted from it, in the reader's language.

## The page chrome

Every post's nav, footer and scripts come from `scripts/post-template.html`,
which is a real post with its words taken out. Changing the chrome means
changing the template *and* the existing posts; `check-site.js` will tell you
if the navs disagree.
