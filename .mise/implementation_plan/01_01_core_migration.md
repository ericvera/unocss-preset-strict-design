# Task 1.1: Core migration to presetWind4

## Goal

Swap the preset's base from `presetWind3` to `presetWind4`, adopt the
wind4-native theme model (`fontSize` → nested `text`, plus custom `opacity`),
fix rule ordering so custom rules win, remove wind4's native mask-size rule,
neutralize the default `container` scale, and prove utility resolution with a
new generator-based test file. Everything green at the end: `yarn smoke`.

## Requirements addressed

REQ-BASE-1, REQ-BASE-2, REQ-THEME-1, REQ-THEME-2, REQ-THEME-3, REQ-THEME-4,
REQ-THEME-5, REQ-THEME-6, REQ-UTIL-1, REQ-UTIL-1b, REQ-UTIL-2, REQ-UTIL-3,
REQ-UTIL-4, REQ-UTIL-5, REQ-UTIL-6, REQ-UTIL-7

## Background

`unocss-preset-strict-design` is a UnoCSS preset that enforces theme-only
values (blocking arbitrary/non-theme values). It is one npm package with five
source files under `src/`. Today it builds on `presetWind3` (Tailwind
3-compatible); this work migrates it to `presetWind4` (Tailwind 4-compatible,
shipped in the already-installed `unocss@66.7.5`) for a v3.0.0 release.

Current code (all verified):

- `src/index.ts` — `presetStrictDesign = definePreset((options) => ...)`:
  throws unless `theme` given; throws one collective error unless
  `theme.colors && theme.spacing && theme.fontSize && theme.fontWeight`
  (lines 30–39); `const wind = presetWind3()` (line 41); returns
  `{ ...wind, extendTheme: extendTheme(theme), name, blocklist: blocklist(theme), rules }`
  where `rules = [...localRules, ...wind.rules]` (lines 43–47).
  Exports `interface PresetStrictDesignTheme extends PresetWindTheme { opacity?: Record<string, string> }`
  and `interface PresetStrictDesignOptions { theme: PresetStrictDesignTheme }`.
- `src/extendTheme.ts` — `(theme) => (defaultTheme) => strictTheme`: shallow
  merge `{ ...defaultTheme, ...theme }`, then copies `theme.spacing` into
  `width/height/maxWidth/maxHeight/minWidth/minHeight` when the user didn't
  set them. Typed against `PresetMiniTheme`.
- `src/rules.ts` — two custom rules typed `Rule<PresetStrictDesignTheme>[]`:
  `mask-size-<key>` → `{ 'mask-size': \`auto ${theme.spacing[key]}\` }`and`opacity-<key>`→`{ opacity: theme.opacity[key] }`; both return
`undefined` for unthemed keys.
- `src/blocklist.ts` — `blocklist(theme)` closes over the USER theme; one
  entry reads `{ ...theme.fontSize }` (line 38) — the only blocklist read
  that must change in this task (to `theme.text`) so the file compiles;
  behavioral blocklist changes are Task 2.1's, not yours.
- `src/internal/shouldBeBlocked.ts` — `(regex, themeSection) => (selector) => boolean`;
  `themeSection: Record<string, string | [string, string | CSSObject] | [string, string, string]>`.

Key `unocss@66.7.5` facts (verified by inspection/execution — trust these):

- `unocss` exports `presetWind4`, `type PresetWind4Theme`, `createGenerator`,
  `definePreset`, `BlocklistRule`, `Rule`, `CSSObject`.
- `presetWind4()` has NO `extendTheme` key — overriding via spread is safe.
  It returns `rules` (1245 entries), `theme`, `preflights`, `postprocess`,
  `variants`, etc.
- `PresetWind4Theme` has `text?: Record<string, { fontSize?: string; lineHeight?: string; letterSpacing?: string }>`,
  no `fontSize`, no `opacity`, no `width`/`height`/`minWidth`/... sections.
- Wind4 default theme: `container` holds `3xs`/`2xs`/`xs`–`7xl` AND
  `prose: '65ch'`; sizing (`w-*`, `h-*`, `min-*`, `max-*`) looks up
  `theme.container` BEFORE `theme.spacing`.
- **Rule precedence: UnoCSS tries later-registered rules first**
  (`rulesDynamic.unshift`). v2's `[...localRules, ...wind.rules]` made wind's
  native rules shadow the custom ones — a real v2 bug: with
  `theme.opacity['80'] = '0.75'`, v2 emitted `opacity: 0.8` (wind's percent
  handler), not the theme value.
- Wind4 ships a native mask-size rule with matcher `/^mask-size-(.+)$/`
  whose handler resolves brackets, `$var`, globals (`inherit`), fractions
  (`1/2` → `50%`), unit values (`10px`), and bare numerics. It must be
  removed entirely — the custom themed rule returning `undefined` would
  otherwise fall through to it.

## Files to modify/create

- `src/index.ts` — wind4 base, new theme types, validation message, rule
  filtering + ordering.
- `src/extendTheme.ts` — wind4 `Theme` typing, keep shallow merge, add
  `container: {}`, delete the width/height/min/max spacing copies.
- `src/rules.ts` — keep the two existing rules (typing must compile against
  the new theme type; `theme.spacing`/`theme.opacity` reads unchanged) and
  ADD themed directional spacing rules for margin/padding/gap (see details
  §4 below — wind4's native handler cannot resolve numeric theme keys).
- `src/blocklist.ts` — minimal compile fix only: the `{ ...theme.fontSize }`
  read becomes `{ ...theme.text }` (see Gotchas for the type mismatch).
- `src/internal/shouldBeBlocked.ts` — widen `themeSection` value type so a
  `text`-shaped record (object values) is accepted; blocking logic unchanged
  (it only tests key presence + numeric-ness).
- `src/preset.test.ts` — NEW: generator-based resolution tests (details
  below).

## Implementation details

1. `src/index.ts`:
   - Import `presetWind4` and `type PresetWind4Theme` from `unocss` (drop
     `presetWind3`, `PresetWindTheme`).
   - `export interface PresetStrictDesignTheme extends PresetWind4Theme`
     overriding `text?: Record<string, { fontSize: string; lineHeight?: string; letterSpacing?: string }>`
     (required `fontSize`) and adding `opacity?: Record<string, string>`.
     If tsc rejects the interface narrowing, use
     `extends Omit<PresetWind4Theme, 'text'>` with the same `text` member.
   - Validation: require `theme.colors && theme.spacing && theme.text &&
theme.fontWeight`; single collective message naming the four sections
     (mirror the existing sentence, `fontSize` → `text`). Keep the separate
     `theme is required` throw.
   - `const wind = presetWind4()`. Build
     `windRules = (wind.rules ?? []).filter((rule) => String(rule[0]) !== String(/^mask-size-(.+)$/))`
     — compare matcher string forms; add a comment stating why (native rule
     resolves non-theme forms the blocklist can't catch).
   - `rules: [...windRules, ...localRules]` — local LAST so they are tried
     first. Keep the rest of the returned object shape as today
     (`...wind`, `extendTheme`, `name: 'unocss-preset-strict-design'`,
     `blocklist`).
2. `src/extendTheme.ts`:
   - Type against the wind4 theme (`PresetWind4Theme` in,
     `PresetStrictDesignTheme` out is fine).
   - Body: keep the `spacing` required throw; return
     `{ ...defaultTheme, ...theme, container: {} }`. Delete all six
     width/height/min/max copies — those sections don't exist in wind4;
     sizing utilities read `theme.spacing` directly.
3. `src/internal/shouldBeBlocked.ts`: change `themeSection` to
   `Record<string, unknown>` (the function only checks `!themeSection[value]`
   and numeric-ness of the string value — verify the existing unit tests in
   `src/internal/shouldBeBlocked.test.ts` still pass unchanged).
4. `src/rules.ts` — themed directional spacing rules (REQ-UTIL-3). CRITICAL
   wind4 fact (verified by execution): for margin/padding/gap, wind4's
   `directionSize` handler resolves NUMERIC values via the multiplier path
   (`p-1` → `padding: calc(var(--spacing) * 1)`) BEFORE ever consulting
   `theme.spacing` — and with a wholesale-replaced user `spacing` lacking
   `DEFAULT`, `--spacing` is undefined, so the declaration is inert. Numeric
   theme keys (the primary consumer's scheme) would silently stop working.
   (Sizing `w-*`/`h-*`/`min/max-*` is the opposite — theme keys first — and
   needs no custom rule.) Add local rules that resolve `theme.spacing` and
   return `undefined` for unthemed keys (falling through to wind4's native
   statics like `m-auto`; the blocklist guards non-theme numerics):
   - Margin/padding: matcher `/^([mp])([xytrblse]?)-(.+)$/`; property base
     `m`→`margin`, `p`→`padding`; direction map: `''`→base, `x`→
     `-left`+`-right`, `y`→`-top`+`-bottom`, `t/r/b/l`→ the side, `s`→
     `-inline-start`, `e`→`-inline-end`. Do NOT handle a leading `-`
     yourself: wind4's `negative` VARIANT strips the `-` before rules match
     and negates the emitted values (verified) — a `(-?)` capture would be
     dead code.
   - Gap: matcher `/^gap(?:-([xy]))?-(.+)$/`; `''`→`gap`, `x`→`column-gap`,
     `y`→`row-gap`.
   - Follow the existing rule style in `src/rules.ts` (destructured match,
     `theme` from context, `undefined` when unthemed, e.g. the `mask-size`
     rule at lines 10–21).
5. `src/preset.test.ts` — use this fixture theme throughout (values chosen so
   no emitted value can coincide with a wind4 default or an n/100 percent):

   - `colors: { primary: '#0066cc' }`
   - `spacing: { '1': '0.3rem', '2': '0.6rem', sm: '0.9rem' }`
   - `text: { '1': { fontSize: '0.8rem' }, '2': { fontSize: '1.1rem', lineHeight: '1.6' } }`
   - `fontWeight: { normal: '450', bold: '750' }`
   - `opacity: { '80': '0.75' }`

   Harness: `const uno = await createGenerator({ presets: [presetStrictDesign({ theme })] })`.
   Generate TWO ways per case group as needed:
   - **Structural pass** — `uno.generate('<classes>', { preflights: false })`:
     asserts which declarations/selectors appear.
   - **Value pass** — `uno.generate('<classes>')` (preflights ON): asserts
     the theme preflight maps CSS variables to the fixture literals.

   CRITICAL output-format fact (verified by execution): wind4-native rules
   emit CSS-VARIABLE references, not literals — `text-1` →
   `font-size: var(--text-1-fontSize)`, `font-bold` →
   `font-weight: var(--fontWeight-bold)`, `w-1` → `width: var(--spacing-1)`;
   the literal values live only in the preflight layer. Custom local rules
   (opacity, mask-size, and the new m/p/gap rules) emit literals directly.
   In the first run, print the actual CSS once and pin exact var names from
   what you observe — do not guess variable naming. "Emits no CSS" for
   blocked/unresolvable classes must be asserted as ABSENCE OF THE SELECTOR
   (e.g. `.w-prose`), not empty output — some classes still trigger
   `@property` blocks.

   Cases:

   - `text-1`/`text-2` structural: `font-size: var(--text-1-fontSize)`-style
     declarations; `text-2` also has a line-height declaration referencing
     its var. Value pass: preflight defines the vars as `0.8rem` / `1.1rem`
     / `1.6` (REQ-UTIL-1, REQ-UTIL-1b — the numeric-key scheme is the
     primary consumer's).
   - `font-bold` structural: `var(--fontWeight-bold)`; value pass: var is
     `750` (REQ-UTIL-2).
   - `p-1`, `m-2`, `-m-1`, `mx-1`, `gap-1`, `gap-x-2` — via the NEW custom
     rules, LITERAL assertions: `padding: 0.3rem`, `margin: 0.6rem`,
     `margin: -0.3rem` (wind4's negative VARIANT negates the custom rule's
     output — assert the negated literal, never a `calc(... * -1)` form),
     `margin-left`/`margin-right`, `gap: 0.3rem`, `column-gap: 0.6rem`
     (REQ-UTIL-3). None of the generated CSS may contain
     `calc(var(--spacing)`. Note: `text-1` (no themed lineHeight) still
     emits a dangling `line-height: var(--un-leading, ...)` declaration —
     REQ-UTIL-1 permits it; do not assert its absence.
   - `w-1`, `h-2`, `max-w-1` structural: `var(--spacing-1)`-style refs;
     value pass: `--spacing-1: 0.3rem` etc. (REQ-THEME-5).
   - `bg-primary` emits a declaration for the fixture color (inspect actual
     output — wind4 may wrap in `color-mix`/vars; assert the stable part)
     (REQ-UTIL-4).
   - `opacity-80` emits literal `opacity: 0.75` and NOT `0.8` — the
     rule-precedence regression test (REQ-UTIL-5).
   - `mask-size-1` emits literal `mask-size: auto 0.3rem`; `mask-size-1/2`,
     `mask-size-10px`, `mask-size-inherit`, `mask-size-$foo` have no
     mask-size selector/declaration (native rule removed; REQ-UTIL-6).
   - Statics: `w-full`, `m-auto`, `w-1/2` still emit their declarations
     (REQ-UTIL-7).
   - Container neutralization: no `.w-prose`, `.max-w-prose`, `.w-2xs`,
     `.w-xl` selectors appear (REQ-THEME-5; `w-xl` is mandated by the
     requirements' assumptions).
   - Theme replacement: no `.bg-red-500` selector (wind4 default palette
     gone; REQ-THEME-6).
   - Validation: `presetStrictDesign({ theme: { ... } })` without `text`
     throws; message names all four sections (REQ-THEME-2). Passing the old
     `fontSize` key must be a TypeScript error — assert via `@ts-expect-error`
     line in the test file (REQ-THEME-3).

## Testing suggestions

- Run `yarn test` for the new file plus the untouched
  `src/internal/shouldBeBlocked.test.ts`.
- Test exception applies (from `.claude/mise-config.md`): "Anything that
  would need an e2e test (no e2e infrastructure exists) — verify with unit
  tests plus manual verification." Manual verification: temporarily generate
  CSS for a themed class via a scratch script if a test assertion surprises
  you — but every observable behavior above must land in `preset.test.ts`.

## Gotchas

- Do NOT keep v2's rule order (`[...localRules, ...wind.rules]`) — later
  rules win in UnoCSS, so that order silently disables every custom rule.
  The `opacity-80` → `0.75` test exists precisely to catch this.
- `src/blocklist.ts` line 16's unconditional suffix rule will block
  `-xs/-sm/...`-suffixed utilities during THIS task — that's expected (Task
  2.1 makes it conditional). Don't use suffix keys in this task's resolution
  tests except `spacing.sm`, which stays blocked for now — don't assert on
  `p-sm` here at all; Task 2.1 owns suffix behavior.
- The blocklist's former `{ ...theme.fontSize }` spread must become
  `{ ...theme.text }`; `shouldBeBlocked` only checks key presence, so the
  object values are fine once its `themeSection` type is widened.
- `wind.rules` entries can be static (`['mask-auto', {...}]`) — the filter
  must not assume `rule[0]` is a RegExp; `String()` both sides.
- Wind4 may emit colors converted (e.g. `color-mix`/`oklch` or CSS vars);
  inspect the actual `bg-primary` output once and assert on the stable part.
- The new m/p/gap rules must return `undefined` (not a blocked/empty
  object) for unthemed keys so statics like `m-auto` fall through to wind4's
  native handler.
- `m-2` also matches the mask-size-style patterns? No — but double-check the
  new margin matcher doesn't swallow `mask-size-*` or `max-w-*` (`m` prefix
  regexes must not match `ma...` utilities; anchor the direction char class
  exactly as specified).
- Keep `definePreset<PresetStrictDesignOptions, PresetStrictDesignTheme>`
  typing pattern; the NOTE comment about `definePreset` not enforcing
  required theme properties still applies (leave it).

## Verification checklist

- [ ] `yarn smoke` passes (build + lint + all tests).
- [ ] `src/preset.test.ts` covers every bullet in Implementation details §5.
- [ ] `grep -rn "presetWind3\|PresetWindTheme" src/` returns no hits, and a
      manual read of `src/index.ts` confirms no flat `fontSize` theme key
      remains (nested `text` entry `fontSize` members are correct and
      expected — a bare grep for "fontSize" cannot distinguish them).
- [ ] End-to-end tests: none — Test exception (no e2e infrastructure)
      applies; substitute is the unit suite above plus manual spot-check of
      generated CSS.
