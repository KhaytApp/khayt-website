# Khayt — design foundations

Khayt is a production-management desktop app for 3D print shops, and its site
is plain HTML styled entirely by CSS custom properties. **This design system is
foundations only — colour, type, spacing. It exports no components.**
`window.KhaytTokens` is deliberately empty; there is nothing to import from it.
Build layout with your own markup and reach for the tokens below for every
colour, family and measure. Never hard-code a hex, a font name or a radius.

## The two surfaces

Every token name is defined twice. `:root` is Khayt on paper (white); putting
`class="deep"` on `<body>` re-points the *same names* onto navy. Style against
the names and a page works on both surfaces with no dark variants of its own —
that is the whole mechanism, and it is how the site's cards, tables and buttons
survived being moved onto navy unchanged.

```html
<body class="deep">   <!-- navy; omit the class for the white surface -->
```

Nineteen names are re-pointed by `deep`: `--paper --paper-2 --paper-3 --card
--ink --ink-soft --muted --brand --brand-2 --tint --tint-2 --wash --wash-2
--line --line-soft --live-ink --shadow-sm --shadow-md --shadow-lg`.

## The vocabulary

No CSS classes ship with this system — style via `var(--token)`.

| Family | Names | Use |
|---|---|---|
| Surface | `--paper` `--paper-2` `--paper-3` `--card` | page, raised band, sunken band, card fill |
| Text | `--ink` `--ink-soft` `--muted` | headings/body, secondary prose, captions and mono lines |
| Brand | `--brand` `--brand-2` `--ink-panel` `--on-brand` | fills, link text, the icon's navy, text on a brand fill |
| Accent | `--amber` `--live` `--live-ink` | the filament orange (sparing), a live dot, that green as text |
| Wash/tint | `--tint` `--tint-2` `--wash` `--wash-2` | icon plates, hover borders, pale panels |
| Edges | `--line` `--line-soft` `--radius` | borders, hairlines, 16px corner |
| Depth | `--shadow-sm` `--shadow-md` `--shadow-lg` | resting, hover, hero |
| Measure | `--maxw` `--pad` | 1220px content column, responsive page gutter |
| Type | `--font-display` `--font-body` `--font-mono` `--font-ar` `--font-wordmark` | Archivo, Hanken Grotesk, JetBrains Mono, IBM Plex Sans Arabic, Almarai |

Headings take `--font-display` at weight 800–900 with tight tracking
(`letter-spacing:-.03em`). `--font-mono` carries eyebrows, prices, counts and
anything that reads as a measurement — uppercase with `letter-spacing:.16em`.

## Arabic is first-class, not an afterthought

Khayt ships a full RTL layout. Use **logical** properties throughout —
`inset-inline-start`, `margin-inline-start`, `padding-inline-end` — never
`left`/`right`. Under `[dir="rtl"]`, switch to `--font-ar` and drop the Latin
tracking: uppercase and wide letter-spacing do not apply to Arabic.

## Where the truth lives

`styles.css` (which `@import`s `_ds_bundle.css`) is the whole system, and every
value carries a comment explaining why it is that value — including the measured
contrast ratios and why the accent is the icon's **navy** rather than its orange.
Read it before choosing a colour.

## A page, idiomatically

```html
<section style="background:var(--paper-2);padding:clamp(56px,7vw,100px) var(--pad)">
  <div style="max-width:var(--maxw);margin:0 auto">
    <span style="font-family:var(--font-mono);font-size:12px;letter-spacing:.16em;
                 text-transform:uppercase;color:var(--brand-2)">Plans</span>
    <h2 style="font-family:var(--font-display);font-weight:800;letter-spacing:-.03em;
               color:var(--ink);margin:18px 0 0">The prices are real.</h2>
    <article style="background:var(--card);border:1px solid var(--line);
                    border-radius:var(--radius);box-shadow:var(--shadow-sm);padding:26px 24px">
      <p style="color:var(--ink-soft)">Everything in Cloud.</p>
      <a style="background:var(--brand);color:var(--on-brand);border-radius:11px;
                padding:12px 18px;display:inline-block">Turn it on</a>
    </article>
  </div>
</section>
```
