# Connector developer docs (hidden)

Generated, not hand-written. Layout designed first in Figma (khaytapp.com library file,
page "Developers (hidden)"); compare a screenshot with those frames after changing it.

Generated, not hand-written:

- `node scripts/sync-plugin-manifest.js` copies `lib/plugin-manifest.js` from the app repo
  (pinned commit) to `vendor/` and writes `../schemas/plugin-manifest-v1.json`.
- `node scripts/make-dev-docs.js` builds the pages from it. `check-site.js` runs its `--check`.

**Not served until connectors v1 ships.** `developers/` and `schemas/` are `NOT_SERVED` in
`.github/scripts/assemble-site.js`, and every page carries `noindex`.

To publish at v1 (only on Dev Hub's word that v1 shipped):
1. Move `developers/**.html`, `developers/docs.js` and `schemas/*.json` from NOT_SERVED to served in
   assemble-site.js (docs.js runs the "On this page" list and the copy buttons).
2. Drop `noindex` in make-dev-docs.js; add canonical; add the pages to `scripts/pages.js`
   and the sitemap; add a footer link.
3. Arabic copies via make-ar-pages.js (code samples stay LTR).
4. Publish KhaytApp/khayt-connector-samples (approved by Turki, Nov 8 2026).
