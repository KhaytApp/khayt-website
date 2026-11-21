# Connector and plugin directory (hidden)

Generated, not hand-written: `node scripts/make-directory.js` builds `directory/` and `ar/directory/`
from `listings.json` (listing text, edited by PR) and the signed bytes it points at. `check-site.js`
runs its `--check`. Layout designed first in Figma (khaytapp.com library, page "Plugin directory
(draft)": list, item, developer and "Trust blocks" frames).

What the build refuses, so a listing cannot claim more than the signed bytes:

- a connector whose manifest fails the app's validator or whose signature does not verify against a
  published `SIGNING_KEYS` entry;
- a connector that sends to a host that is not a public host name;
- a slicer plugin download whose file is missing or whose SHA-256 is not in a signed
  `connectors/index.json` row (until then it shows "Not released yet" and no link).

Permission rows are `consentRows()` of the signed manifest, in the app's own words
(`strings.json`, copied from `renderer/locales` at the vendored commit).

**Not served.** `directory/` and `ar/directory/` are `NOT_SERVED` in `.github/scripts/assemble-site.js`,
every page is `noindex`, none is in the sitemap, and check-site fails if a served page links to it.

To publish (only when Turki says so, after connectors ship and the /privacy and /terms lines are
signed off):
1. Move `directory/**.html`, `ar/directory/**.html` and `directory/directory.js` to served in
   assemble-site.js, with the signed manifests they link (`developers/samples/*.json`, or the
   `connectors/` files once the signed index lands).
2. Drop `noindex` and the DRAFT line in make-directory.js; add canonicals, `scripts/pages.js`
   entries (so the CSP and colour-scheme checks cover them), the sitemap and a nav or footer link;
   remove the "stays hidden" half of the check-site check.
3. Set `INSTALL_LINK = true` once the Mac ships `khayt://plugin/install?id=<id>&version=<version>` (KhaytApp/Khayt#2622). The button then shows only for a connector the signed `connectors/index.json` (#158) lists at exactly that version, not withdrawn; otherwise it says "not in Khayt’s signed list yet".
4. Point the report form at the Cloud reports endpoint once it exists (today it opens the visitor's
   email app, addressed to support@khaytapp.com).
