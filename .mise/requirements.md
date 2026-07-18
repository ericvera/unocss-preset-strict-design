# Requirements

This document specifies the user-facing requirements for migrating
`unocss-preset-strict-design` from a `presetWind3` base to a `presetWind4`
(Tailwind 4-compatible) base, released as v3.0.0.

"User" below means a developer consuming this preset in their UnoCSS config.

## 1. Preset Base (BASE)

- **REQ-BASE-1:** The preset MUST be built on `presetWind4` (imported from
  `unocss`); `presetWind3` MUST no longer be used or referenced by the
  published code.
- **REQ-BASE-2:** The preset MUST continue to be created via a preset factory
  accepting `{ theme }` options, exported as `presetStrictDesign`, exactly as
  today (same export name, same call shape).

## 2. Theme API (THEME)

- **REQ-THEME-1:** The preset MUST accept a theme using wind4-native naming:
  `colors`, `spacing`, and `fontWeight` as flat records (unchanged shapes),
  and `text` as a nested record
  `Record<string, { fontSize: string; lineHeight?: string; letterSpacing?: string }>`
  replacing v2's flat `fontSize` record.
- **REQ-THEME-2:** The preset MUST throw an error at creation time when
  `theme` is missing, and when any of `colors`, `spacing`, `text`, or
  `fontWeight` is missing. As in v2, one collective error message naming all
  four required sections is used (no per-key messages).
- **REQ-THEME-3:** The v2 `fontSize` key MUST NOT be accepted as an alias or
  shim; the published theme type MUST NOT include a `fontSize` property, so
  TypeScript users get a compile-time error pointing them to the new shape.
- **REQ-THEME-4:** The theme type MUST continue to allow an optional flat
  `opacity` record (`Record<string, string>`) powering the custom opacity
  utility, since wind4 has no themed opacity.
- **REQ-THEME-5:** For _theme-key_ resolution, sizing utilities (`w-*`,
  `h-*`, `min-w-*`, `min-h-*`, `max-w-*`, `max-h-*`) and `gap-*` MUST
  resolve only from the user's `theme.spacing`. Explicit `width`/`height`/
  `minWidth`/`minHeight`/`maxWidth`/`maxHeight` theme sections (supported in
  v2) are no longer part of the theme API — wind4 has no such sections.
  Wind4's sizing lookup consults `theme.container` before `theme.spacing`,
  and its default `container` scale includes non-suffixed keys (notably
  `prose: 65ch`) as well as `2xs`/`3xs`: the preset MUST neutralize the
  default `container` section so that NO sizing key resolves from it (e.g.
  `w-prose`, `max-w-prose`, `w-2xs` MUST emit no CSS unless the key exists
  in the user's `theme.spacing`). Side effect to accept and note: wind4's
  `columns-*` rule also reads `theme.container`, so container neutralization
  disables those lookups too — this is strictness-consistent and intended,
  not a bug. Static non-theme forms that v2 allowed (see REQ-UTIL-7) are
  unaffected by this requirement. The width/height section removal MUST be
  covered in the migration notes (REQ-DOC-2).
- **REQ-THEME-6:** A user-provided theme section MUST replace the
  corresponding wind4 default section wholesale (v2's shallow
  section-level merge, `{ ...defaultTheme, ...userTheme }`): e.g. providing
  `colors` means none of wind4's default palette resolves. Per-key deep
  merging MUST NOT be used — it would let default theme values through and
  break strictness.

## 3. Utility Behavior (UTIL)

Utility class names users write in v2 keep working in v3 with the same
names, resolving from the same theme values:

- **REQ-UTIL-1:** `text-<key>` MUST emit the font size from
  `theme.text[<key>].fontSize`. When the entry themes `lineHeight` /
  `letterSpacing`, those values MUST be applied. When `lineHeight` is not
  themed, wind4's native output shape (a `line-height` declaration
  referencing a CSS variable that resolves to nothing) is acceptable — the
  requirement is that no line-height _value_ outside the theme takes effect.
- **REQ-UTIL-1b:** Numeric text keys MUST work: with
  `theme.text = { '1': {...}, '2': {...}, ... }`, the utilities `text-1`,
  `text-2`, … MUST resolve from those entries (this is the primary known
  consumer's naming scheme), and numeric text keys NOT in `theme.text` MUST
  be blocked (REQ-BLOCK-3). Tests MUST cover numeric keys explicitly, since
  wind4 may handle numeric values specially in its native text rule.
- **REQ-UTIL-2:** `font-<key>` MUST emit the font weight from
  `theme.fontWeight[<key>]`.
- **REQ-UTIL-3:** Margin/padding utilities (`m-*`, `p-*`, and their
  directional variants including `x`/`y`) and `gap-*` MUST resolve from
  `theme.spacing`.
- **REQ-UTIL-4:** Color utilities (`bg-<color>`, `text-<color>`, etc.) MUST
  resolve from `theme.colors`.
- **REQ-UTIL-5:** `opacity-<key>` MUST emit the value from
  `theme.opacity[<key>]`; numeric and bracket values absent from
  `theme.opacity` MUST NOT resolve (REQ-BLOCK-1/3). As with mask-size
  (REQ-UTIL-6), wind4's native `opacity-*` rule MUST NOT apply for
  `opacity-<key>`: the themed value MUST win. Note this _fixes_ a latent v2
  bug rather than preserving it — in v2, rule precedence let wind3's native
  percent handler shadow the custom rule for numeric keys (with
  `theme.opacity['80'] = '0.75'`, v2 emitted `opacity: 0.8`, not the theme
  value), so tests MUST use theme values that differ from `<key>/100` to
  catch shadowing. Carve-out: `opacity-$foo` → `opacity: var(--foo)` is a
  carried-over v2 hole and stays out of scope, like the sibling `op-*`
  alias.
- **REQ-UTIL-6:** `mask-size-<key>` MUST emit
  `mask-size: auto <theme.spacing[<key>]>` and MUST NOT resolve for keys
  absent from `theme.spacing`. Wind4 (unlike wind3, which had no mask-size
  rule) ships a native `mask-size-*` rule that resolves brackets, bare
  numerics, fractions (`mask-size-1/2` → `50%`), unit values
  (`mask-size-10px`), global keywords (`mask-size-inherit`), and CSS-var
  shorthand (`mask-size-$foo`). The preset MUST ensure wind4's native
  mask-size rule does not apply at all: only the preset's themed
  `mask-size-<key>` rule may emit CSS, and every other form listed above
  MUST emit no CSS (blocked or inert). REQ-BLOCK-1/3 cover only the bracket
  and bare-numeric forms — this requirement is the guard for the rest.
  (The static-forms allowance in REQ-UTIL-7 does NOT apply to `mask-size-*`:
  v2 emitted nothing for any non-themed mask-size form.)
- **REQ-UTIL-7:** Static non-theme values that v2 allowed MUST keep working
  identically in v3. In v2, wind3's sizing/spacing handlers fall back to
  static keywords and value handlers beyond theme lookups — `w-full`,
  `w-screen`, `h-screen`, `w-fit`, `m-auto`, `w-1/2`, `w-10px`, `m-10px`
  all emit CSS (v2's own block message reads "Only **static values** and
  values defined in themes are allowed"). Wind4 has equivalent fallbacks
  and they MUST NOT be blocked: no requirement in this document may be read
  as blocking these static/fraction/unit forms for margin/padding/sizing —
  strictness applies to theme-key and numeric-multiplier resolution, not to
  statics v2 permitted.

## 4. Strictness / Blocking (BLOCK)

- **REQ-BLOCK-1:** Arbitrary bracket values MUST be blocked with the
  existing messages for: `bg-[*]`, `text-[*]`, margin/padding brackets
  (`m-[*]`, `p-[*]`, and all directional variants including `mx-[*]`,
  `my-[*]`, `px-[*]`, `py-[*]`), sizing/gap brackets (`gap-[*]`, `w-[*]`,
  `h-[*]`, `min-w-[*]`, `min-h-[*]`, `max-w-[*]`, `max-h-[*]`),
  `mask-size-[*]`, and `opacity-[*]`. Margin/padding coverage includes the
  negative variants v2 already blocked (`-m-[*]`, `-mt-[*]`, etc. — these
  MUST NOT regress) and `gap-x-[*]`/`gap-y-[*]`. Note: v2 intended this
  coverage but two regexes were defective (`[.+]` matched a literal `.`/`+`
  instead of a bracket expression, and the margin/padding character class
  omitted `x`/`y`), so `w-[10px]`, `gap-[2rem]`, `mx-[10px]`, `py-[4px]`
  slipped through. v3 MUST block them — this is a fix toward v2's documented
  intent, not a behavior preservation.
- **REQ-BLOCK-2:** A utility ending in a Tailwind size suffix (`-3xs`,
  `-2xs`, `-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl` … `-9xl` — note `2xs`/
  `3xs` are new in wind4's default theme and MUST be in the list) MUST be
  blocked **unless** the suffix key is defined in the **user-provided**
  theme section that utility resolves from — the check is against what the
  user supplied, never against wind4 defaults surviving the merge (e.g.
  `text-sm` resolves when the user's `theme.text.sm` exists; `p-sm`
  resolves when the user's `theme.spacing.sm` exists; `rounded-lg`,
  `shadow-md`, `shadow-2xs`, and `inset-shadow-2xs` are always blocked since
  radius/shadow are not part of the strict theme API — wind4's default
  `shadow`/`insetShadow` sections define `2xs` keys that would otherwise
  emit CSS). For dual-nature utilities the check is single-section:
  `text-<suffix>` checks the user's `theme.text` only — suffix-named color
  keys (e.g. a color named `sm`) are unsupported and stay blocked. This
  suffix-conditional behavior is a deliberate, user-approved change from
  v2, whose code blocked these suffixes unconditionally; it makes the
  documented `text-sm` usage real.
- **REQ-BLOCK-3:** Numeric values not defined in the corresponding theme
  section MUST be blocked (existing `shouldBeBlocked` semantics) for:
  `font-*` (vs `theme.fontWeight`), `text-*` (vs `theme.text`),
  margin/padding (vs `theme.spacing`), gap/width/height/min/max and
  `mask-size-*` (vs `theme.spacing`), and `opacity-*` (vs `theme.opacity`).
- **REQ-BLOCK-4:** In particular, wind4's default numeric spacing multiplier
  (`p-3` → `calc(var(--spacing) * 3)`) MUST NOT let a numeric spacing value
  through: for every utility form listed in REQ-BLOCK-3, a numeric key
  absent from the user's `theme.spacing` MUST remain blocked. Forms outside
  that list that can also reach the multiplier (e.g. `size-*`, dash-less
  `w4`/`h10`, and others) are pre-existing v2-era holes — see Out of Scope.
- **REQ-BLOCK-5:** Consistency renames MUST be preserved: `color-*` blocked
  with the message directing to `text-*`; `fw-*` blocked with the message
  directing to `font-*`.

## 5. Packaging & Release (PKG)

- **REQ-PKG-1:** The package peer dependency MUST become `unocss ^66.7.0`.
- **REQ-PKG-2:** The package version MUST be bumped to `3.0.0` (breaking
  major).
- **REQ-PKG-3:** The existing quality gates MUST pass: build (`tsc`), lint
  (`eslint`), and unit tests (`vitest`) via `yarn smoke`.

## 6. Documentation (DOC)

- **REQ-DOC-1:** The README MUST be updated for the wind4 base: the usage
  example MUST show the nested `text` theme shape, and the Required Theme
  Properties and Restrictions sections MUST reflect `text` instead of
  `fontSize`.
- **REQ-DOC-2:** The README MUST include a v2 → v3 migration section
  covering: (a) the `fontSize` → `text` rename with a before/after config
  example, including how v2 tuple values (`fontSize: { sm: ['0.875rem',
'1.25rem'] }`, which v2 supported via `PresetWindTheme`) map to
  `text: { sm: { fontSize: '0.875rem', lineHeight: '1.25rem' } }`;
  (b) the presetWind3 → presetWind4 base change and the new
  `unocss ^66.7.0` peer requirement; (c) the removal of explicit
  `width`/`height`/`minWidth`/`minHeight`/`maxWidth`/`maxHeight` theme
  sections (sizing now resolves from `theme.spacing` only); (d) the
  size-suffix blocking change (suffixed utilities now resolve when themed,
  REQ-BLOCK-2); and (e) a note on expected CSS output differences (wind4
  emits CSS-variable-based output/preflights).
- **REQ-DOC-3:** README examples MUST be consistent with actual v3 blocking
  behavior.

## Out of Scope

- New utilities or new strictness rules beyond the ones specified above.
- A compatibility shim or runtime warning for the removed flat `fontSize` key
  (TypeScript typing + docs carry the migration).
- Supporting unocss versions below 66.7.0 or above 66.x.
- e2e test infrastructure (per config test exception: unit tests plus manual
  verification).
- Changes to opacity semantics or making `opacity` a validated-required key.
- Closing pre-existing strictness holes carried over from v2/wind3 that also
  exist in wind4, beyond those explicitly listed in REQ-BLOCK-1. Acknowledged
  examples (not addressed): the `op-*` opacity alias (`op-50`) and
  `opacity-$var`; `text-<key>/<n>` arbitrary line-height shorthand; the
  `c-*` color alias (`c-[#fff]`) and `text-size-*`/`font-size-*` aliases;
  `size-*` and dash-less `w4`/`h10`; alternate bracket spellings v2 also
  missed (`gap-col-[*]`/`gap-row-[*]`, `flex-gap-*`/`grid-gap-*`, logical
  margin/padding variants like `m-block-[*]`/`p-bs-[*]`); and other
  numeric-multiplier surfaces v2 never blocked (`basis-*`, `inset-*`/
  positions, `space-x/y-*`, `scroll-m/p-*`). The list is representative,
  not exhaustive: the rule is "v2 let it through → v3 may too".

## Assumptions

- Creation-time validation stays limited to `colors`, `spacing`, `text`,
  `fontWeight` (opacity optional), matching v2's validation exactly.
- Wind4's CSS-variable-based output (e.g. `--spacing`, color variables in
  preflights) is an acceptable output-format change for v3 as long as the
  resolved values come from the user's theme; it is documented in the
  migration notes rather than suppressed.
- The custom `mask-size-*` and `opacity-*` rules keep their exact v2 CSS
  output shape.
- Non-numeric, non-themed, non-suffix values that v2's `shouldBeBlocked`
  lets through (numeric blocking only) keep their exact v2 behavior:
  arbitrary unknown keys (e.g. `text-unknown`) fail to resolve and emit no
  CSS, while static keywords/fractions/units that wind3 resolved keep
  resolving (REQ-UTIL-7) — "no CSS in v2" vs "CSS in v2" is decided by v2's
  actual behavior, which tests should mirror per utility form.
- Wind4's sizing lookup consults `theme.container` before `theme.spacing`;
  `container` is not part of the strict theme API and its default keys are
  NOT all size-suffixed (`prose: 65ch`, plus `2xs`/`3xs` and `xs`–`7xl`), so
  suffix blocking alone cannot cover it — REQ-THEME-5's container
  neutralization is the required mechanism. Tests must assert at minimum
  that `w-xl`, `w-2xs`, and `w-prose` emit no CSS when those keys are absent
  from `theme.spacing`.
