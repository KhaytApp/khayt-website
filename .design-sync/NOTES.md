# design-sync notes — khayt-website

## What this repo syncs

A **tokens-only** design system. Khayt has no React anywhere — this site renders
HTML strings from `render.js`, and the desktop app is vanilla DOM — so there is
no component library to convert and `_ds_bundle.js` is deliberately empty. The
value being synced is the palette, type and spacing.

## How it's wired

- `.design-sync/package/` is a package that exists **only** for the converter: a
  `package.json`, an entry that exports nothing, and one generated stylesheet.
  It is not used by the website and nothing on the site imports it.
- `.design-sync/extract-tokens.mjs` derives `.design-sync/package/styles/khayt.css`
  from the site's own `styles.css`. **`styles.css` is the source of truth** —
  never hand-edit the generated file. `cfg.buildCmd` runs the extractor, so a
  re-sync picks up token changes automatically.
- The extractor reads the `:root` and `body.deep` blocks by locating
  `"<selector> {"` and the next `"\n}"`. If either block is renamed or
  reformatted in `styles.css`, the extractor throws with the selector name
  rather than emitting a silently-empty file.

- **The DS package lives under `.design-sync/`, not at the repo root, on purpose.**
  This repo is served by GitHub Pages straight from the root, so a top-level
  `design-system/` would publish `khaytapp.com/design-system/package.json`.
  Dot-prefixed directories are not served, which keeps a converter-only
  artifact off the live domain.

## The commands

```sh
node .design-sync/extract-tokens.mjs            # regenerate tokens from styles.css
node .ds-sync/resync.mjs --config .design-sync/config.json \
  --node-modules ./.ds-sync/node_modules \
  --entry ./.design-sync/package/src/index.js --out ./ds-bundle --no-render-check
```

Re-create the symlink the converter resolves `@khayt/tokens` through on a fresh
clone (it lives in the gitignored `.ds-sync/`):

```sh
mkdir -p .ds-sync/node_modules/@khayt
ln -sfn ../../../.design-sync/package .ds-sync/node_modules/@khayt/tokens
```

## Gotchas already paid for

- **`tokensGlob` does nothing without `tokensPkg`.** `copyTokens()` in
  `lib/css.mjs` returns immediately when `tokensPkg` is unset, and resolves the
  package under `--node-modules`. Dropped both in favour of a single flat
  `cssEntry`.
- **`cssEntry` must be a flat stylesheet, not a file of `@import`s.** It is
  copied to the bundle root as `_ds_bundle.css`, where relative `@import` paths
  no longer resolve — that failed as `[CSS_IMPORT_MISSING]` ×3 plus
  `[CSS_PLACEHOLDER]`. The extractor concatenates instead. The remote font
  `@import` must stay the first rule in that file.
- **Tokens-only is only detected** when `cfg.cssEntry` is set or the package
  has a root `styles.css` (`lib/source-kit.mjs`). Without it the build exits 1
  with `[ZERO_MATCH] … nothing to sync`.
- **The converter needs `react` under `--node-modules`**, even for a DS with no
  components — it vendors React for preview cards that, here, don't exist.
  `.ds-sync/node_modules` carries it; `@khayt/tokens` is symlinked in there so
  the package resolves.
- **The extractor needs Node 20.11+** (`import.meta.dirname`). Nothing in CI
  runs it — `check.yml` only runs `scripts/check-site.js` — but a contributor
  on an older Node will see it fail rather than misbehave.
- **`PIPESTATUS` is a bashism** — this is zsh. Run build and validate as
  separate commands and read `$?` each time, as the skill says.

## Known render warns

- `[RENDER_SKIPPED]` — **expected and vacuous here.** There are zero component
  previews, so the render check has nothing to open; validate prints
  "tokens-only DS — no component previews" immediately above it. Run with
  `--no-render-check`. This stops being acceptable the moment this DS gains a
  single component.
- `[FONT_REMOTE]` — informational. The four families load from Google Fonts via
  a remote `@import`, which is exactly how the live site loads them.
- `[DTS_REACT] @types/react not found` — printed even though it IS installed in
  `.ds-sync/node_modules`; the check looks under the DS package's own
  `node_modules`. Harmless with zero components, and it would matter the moment
  there were any.

## This repo has its own project — do not point it at "Khayt Design System"

**Fixed 2026-09-18.** Both this repo and the Khayt app repo
(`/Users/turkialballaa/Khayt/.design-sync/config.json`) had `projectId`
`75ea0497-476b-4e0d-9e68-ace704423f5b` — one Claude Design project, two
different design systems:

| | this repo | the app repo |
|---|---|---|
| `pkg` | `@khayt/tokens` | `@khayt/design-system` |
| content | tokens only, empty `_ds_bundle.js` | 11 React components |

They overwrote each other. A sync from here builds a bundle with no
`components/`, and the reconciliation pass deletes every remote path the local
bundle lacks — so it would have **wiped all 11 components**. It had already
happened once in the other direction: this repo synced on 16 Sep and the app
repo's sync overwrote it on 17 Sep.

This repo now syncs to **"Khayt Site Foundations"**
(`987ea060-c3e9-4ed6-93db-0e28fb7bba29`). The app repo keeps
`75ea0497-…`. Neither config should ever name the other's project.

If a future sync from here lists remote `components/` that this repo did not
build, **stop** — it means the pin has drifted back to the app's project.

## Re-sync risks

- **The extractor is coupled to `styles.css`'s shape**, not just its values. A
  refactor that splits the stylesheet, renames `body.deep`, or moves the tokens
  into a nested layer will break extraction — loudly, by design.
- **`conventions.md` enumerates 31 token names and the 19 that `body.deep`
  re-points.** Those lists are validated against the built CSS; re-check them on
  every re-sync. Adding a token to `styles.css` does NOT update the header.
- **Nothing here is visually verified.** No previews exist to look at, so the
  gate was the CSS closure and the token diff, not a render.
- **Two repos sync Khayt design systems.** Anything that resets
  `.design-sync/config.json` from the app repo's copy re-creates the collision
  above. The `projectId` is the one field that must differ between them.

- **The moment Khayt grows a real React component library**, this config is the
  wrong shape: `pkg` should point at that package's built `dist/`, and
  `.design-sync/package/` here should be deleted rather than grown.
