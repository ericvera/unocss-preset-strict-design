# Exploration Notes

Verified against the working tree and installed `unocss@66.7.5` (2026-07-18).

## Source layout (5 files)

- `src/index.ts` — preset factory. `presetStrictDesign = definePreset(...)`:
  validates theme (throws unless `colors`, `spacing`, `fontSize`, `fontWeight`
  all present, one collective message at lines 30–39), builds
  `const wind = presetWind3()` (line 41), returns
  `{ ...wind, extendTheme, name, blocklist, rules: [...localRules, ...wind.rules] }`.
  Exports `PresetStrictDesignTheme extends PresetWindTheme` with
  `opacity?: Record<string, string>`.
- `src/extendTheme.ts` — `(userTheme) => (defaultTheme) => ({...defaultTheme, ...userTheme})`
  shallow section-level merge, then copies `theme.spacing` into
  `width/height/maxWidth/maxHeight/minWidth/minHeight` when unset.
- `src/blocklist.ts` — `blocklist(theme)` (receives the USER theme, not the
  merged theme) returns `BlocklistRule[]`:
  - line 16: `/^(.+)-(xs|sm|md|lg|xl|2xl|...|9xl)$/` unconditional suffix block
  - line 22: `color-*` → consistency msg; line 24: `bg-\[.*\]`
  - line 28: `fw-*` → consistency msg; line 30: `shouldBeBlocked(/^font-(.*)$/ , theme.fontWeight)`
  - line 36: `text-\[.*\]`; line 38: `shouldBeBlocked(/^text-(.*)$/ , theme.fontSize)`
  - line 42: `/^(-m|m|p)([rltbse]?)-\[.+\]$/` — BUG: omits `x`,`y`
  - line 45: `shouldBeBlocked(/^(?:-m|m|p)(?:[rltbxyse]?)-(.*)$/ , theme.spacing)`
  - line 53: `/^(gap|h|min-h|max-h|w|min-w|max-w)-[.+]$/` — BUG: `[.+]` is a
    char class (matches literal `.`/`+`), brackets not blocked
  - line 56: `shouldBeBlocked(/^(?:gap|h|min-h|max-h|w|min-w|max-w)-(.+)$/ , theme.spacing)`
  - lines 64–69: `opacity-\[.*\]` + `shouldBeBlocked(/^opacity-(.*)$/ , theme.opacity)`
- `src/rules.ts` — 2 custom rules: `mask-size-<key>` → `mask-size: auto <spacing[key]>`
  (undefined when unthemed); `opacity-<key>` → `opacity: <theme.opacity[key]>`.
- `src/internal/shouldBeBlocked.ts` — `(regex, themeSection) => (selector) => boolean`;
  blocks only when captured value is numeric (`!isNaN(Number(value))`) AND not a
  key of `themeSection`; empty value also blocked. `themeSection` typed
  `Record<string, string | [string, string | CSSObject] | [string, string, string]>`.
- `src/internal/blockMessages.ts` — `staticValuesMessage`, `themeValuesMessage`,
  `consistencyMessage(insteadOf, use)`.
- Tests: only `src/internal/shouldBeBlocked.test.ts` (vitest, co-located).

## unocss 66.7.5 facts (verified by direct inspection/execution)

- `unocss` exports: `presetWind4`, `type PresetWind4Theme` (= wind4 `Theme`),
  `createGenerator` (re-export of `@unocss/core`), `definePreset`,
  `BlocklistRule`, `Rule`, `CSSObject`.
- `presetWind4()` returns keys: `name, rules, shortcuts, theme, layers,
preflights, variants, prefix, postprocess, extractorDefault, autocomplete,
options, configResolved, meta`. **No `extendTheme`** — overriding it via
  spread is safe (same pattern as v2 over wind3). 1245 rules.
- Wind4 `Theme` (node_modules/@unocss/preset-wind4/dist/theme-DFkXSCqq.d.mts:1289):
  has `colors`, `spacing`, `text?: Record<string, {fontSize?, lineHeight?, letterSpacing?}>`,
  `fontWeight`, `container`, `shadow`, `insetShadow`, … — NO `fontSize`, NO
  `opacity`, NO `width/height/minWidth/...` sections.
- Default theme hazards:
  - `container` = `3xs,2xs,xs,sm,md,lg,xl,2xl…7xl` **plus `prose: '65ch'`**
    (theme.mjs ~538–553). Sizing lookup `getSizeValue` (rules.mjs ~1930)
    consults `theme.container` BEFORE `theme.spacing` → `w-prose`, `w-2xs`
    resolve from defaults unless neutralized.
  - `shadow`/`insetShadow` define `2xs` keys (new in wind4; v2 suffix regex
    list stops at `xs` so `2xs`/`3xs` aren't matched by the old list).
- Native rules that conflict with custom rules:
  - mask-size: rule with matcher `/^mask-size-(.+)$/` (rules.mjs ~1488),
    handler `h.bracket.cssvar.global.fraction.rem` — resolves brackets,
    `$var`, globals (`inherit`), fractions (`1/2`→`50%`), unit values, bare
    numerics (spacing multiplier). Identify by `String(rule[0]) === '/^mask-size-(.+)$/'`.
  - opacity: `/^op(?:acity)?-?(.+)$/` (rules.mjs:639), `h.bracket.percent.cssvar`
    — numeric `opacity-80` → `0.8` regardless of theme.
- **Rule precedence**: `@unocss/core` `rulesDynamic.unshift(rule)` — LATER
  registered rules are tried FIRST. v2 did `[...localRules, ...wind.rules]`
  → wind's native rules shadowed the custom ones (latent v2 opacity bug:
  `theme.opacity['80']='0.75'` emitted `opacity: 0.8`). v3 must use
  `[...wind.rules (filtered), ...localRules]` so custom rules win.
- Spacing multiplier: numeric keys not in theme resolve to
  `calc(var(--spacing) * n)` in both `directionSize` and `getSizeValue` —
  blocklist numeric rules are the guard.
- Wind4 text rule resolves `theme.text[key]` first (themed numeric keys like
  `text-1` work); unthemed numerics fall to `h.bracketOfLength.rem` — the
  blocklist numeric check vs `theme.text` is the guard.
- Static fallbacks (`w-full`, `w-screen`, `w-fit`, `m-auto`, `w-1/2`,
  `w-10px`) exist in wind4 handlers as in wind3 — must stay allowed.

## Tooling

- `yarn build` = `tsc --build`; `yarn lint` = `eslint .`; `yarn test` =
  `vitest run`; `yarn smoke` = all three. Node >= 24, yarn 4.17.1.
- Husky + lint-staged runs prettier on EVERY commit — markdown in `.mise/`
  gets reformatted at commit time (emphasis `*x*` → `_x_` etc.).
- `vitest.config.ts` exists at repo root; tests co-located `*.test.ts`.
- Generator usage for tests:
  `const uno = await createGenerator({ presets: [presetStrictDesign({ theme })] })`
  then `const { css } = await uno.generate('w-full text-1 ...', { preflights: false })`.
  Blocklist-blocked and unresolvable utilities emit no CSS.
