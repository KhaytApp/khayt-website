# Connector developer docs (hidden)

Generated, not hand-written. Layout designed first in Figma (khaytapp.com library file,
page "Developers (hidden)"); compare a screenshot with those frames after changing it.

Generated, not hand-written:

- `node scripts/sync-plugin-manifest.js` copies `lib/plugin-manifest.js` from the app repo
  (pinned commit) to `vendor/` and writes `../schemas/plugin-manifest-v1.json`.
- `node scripts/make-dev-docs.js` builds the pages from it. `check-site.js` runs its `--check`.

**Not served until connectors v1 ships.** `developers/`, `ar/developers/` and `schemas/` are
`NOT_SERVED` in `.github/scripts/assemble-site.js`, and every page carries `noindex`.

The Arabic copies (`ar/developers/…`) come from the same script: each page is written once, with
its prose in both languages side by side (`t(en, ar)`, and `DOC_AR` beside `DOC`, held to the module
the same way). Code, keys and examples are shared, and code stays left-to-right. Their layout is the
Arabic frames on the same Figma page.

To publish at v1 (only on Dev Hub's word that v1 shipped):
1. Move `developers/**.html`, `ar/developers/**.html`, `developers/docs.js` and `schemas/*.json` from
   NOT_SERVED to served in assemble-site.js (docs.js runs the "On this page" list and the copy buttons;
   the Arabic pages load it from `/developers/docs.js`).
2. Drop `noindex` in make-dev-docs.js; add canonical; add the pages to `scripts/pages.js`
   and the sitemap; add a footer link.
3. The Arabic copies already exist (above): give them their canonical too, and add them to the
   sitemap with their hreflang pair.
4. Publish KhaytApp/khayt-connector-samples (approved by Turki, Nov 8 2026).
