# Task 2.1: Blocklist overhaul — suffix-conditional blocking and regex fixes

## Goal

Rework `src/blocklist.ts`: make size-suffix blocking conditional on the
user's theme (a deliberate, user-approved loosening), extend the suffix list
with wind4's new `2xs`/`3xs`, fix two v2 regex bugs (bracket blocking for
sizing/gap; missing `x`/`y` margin/padding variants), add `mask-size-[*]` and
`gap-x/y-[*]` bracket blocking, and land the full blocking test matrix.
Green at the end: `yarn smoke`.

## Requirements addressed

REQ-BLOCK-1, REQ-BLOCK-2, REQ-BLOCK-3, REQ-BLOCK-4, REQ-BLOCK-5,
REQ-UTIL-5, REQ-UTIL-6, REQ-THEME-5

## Background

`unocss-preset-strict-design` is a UnoCSS preset enforcing theme-only values.
Task 1.1 migrated the base to `presetWind4`: `src/index.ts` now builds
`presetWind4()`, filters out wind4's native `/^mask-size-(.+)$/` rule,
orders rules `[...windRules, ...localRules]` (local rules win — UnoCSS tries
later-registered rules first), and `src/extendTheme.ts` merges the user theme
over wind4 defaults shallowly plus sets `container: {}`. The theme is
wind4-shaped: `colors`, `spacing`, `fontWeight` flat records; `text` nested
(`Record<string, { fontSize: string; lineHeight?; letterSpacing? }>`);
`opacity` optional flat record. `src/preset.test.ts` (from Task 1.1) holds
generator-based resolution tests with fixture theme
`spacing: { '1': '0.3rem', '2': '0.6rem', sm: '0.9rem' }`,
`text: { '1': ..., '2': ... }`, `fontWeight: { normal: '450', bold: '750' }`,
`opacity: { '80': '0.75' }`, `colors: { primary: '#0066cc' }`.

Task 1.1 also added LOCAL directional spacing rules to `src/rules.ts`
(margin/padding incl. negatives and `x`/`y`/`s`/`e`, plus `gap`/`gap-x`/
`gap-y`): they resolve `theme.spacing` keys to LITERAL declarations
(`p-sm` → `padding: 0.9rem` when `spacing.sm` exists) and return `undefined`
otherwise — necessary because wind4's native `directionSize` takes the
numeric-multiplier path (`calc(var(--spacing) * n)`) BEFORE consulting
`theme.spacing`, so numeric theme keys never resolve natively. Sizing
(`w-*`/`h-*`/`min/max-*`) has no custom rule: wind4 resolves those from
theme keys natively, emitting `var(--spacing-<key>)` references.

`src/blocklist.ts` exports `blocklist(theme): BlocklistRule[]` — `theme` is
the USER theme (never the merged theme; `src/index.ts` calls
`blocklist(theme)` with the validated options theme). Current entries after
Task 1.1 (v2 semantics, only the `text` read updated):

1. `[/^(.+)-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, { message: 'Use theme values.' }]`
   — unconditional suffix block (YOU replace this).
2. `color-*` → `consistencyMessage('color-*', 'text-*')`; `bg-\[.*\]` →
   `themeValuesMessage`.
3. `fw-*` → `consistencyMessage('fw-*', 'font-*')`;
   `shouldBeBlocked(/^font-(.*)$/, { ...theme.fontWeight })` → `staticValuesMessage`.
4. `text-\[.*\]`; `shouldBeBlocked(/^text-(.*)$/, { ...theme.text })`.
5. `/^(-m|m|p)([rltbse]?)-\[.+\]$/` — BUG: char class omits `x`,`y`, so
   `mx-[10px]`/`py-[4px]` slip through.
6. `shouldBeBlocked(/^(?:-m|m|p)(?:[rltbxyse]?)-(.*)$/, { ...theme.spacing })`.
7. `/^(gap|h|min-h|max-h|w|min-w|max-w)-[.+]$/` — BUG: `[.+]` is a character
   class matching one literal `.`/`+`, so `w-[10px]`/`gap-[2rem]` slip
   through.
8. `shouldBeBlocked(/^(?:gap|h|min-h|max-h|w|min-w|max-w)-(.+)$/, { ...theme.spacing })`.
9. `opacity-\[.*\]`; `shouldBeBlocked(/^opacity-(.*)$/, { ...theme.opacity })`.

`src/internal/shouldBeBlocked.ts` — `(regex, themeSection) => (selector) =>
boolean`: matches, then blocks iff captured value is empty, or is numeric
(`!isNaN(Number(value))`) and not a key of `themeSection`. Non-numeric
unknown values pass (they just don't resolve — intended).
`src/internal/blockMessages.ts` — `staticValuesMessage`, `themeValuesMessage`,
`consistencyMessage`.

A `BlocklistRule` is either `[RegExp | ((selector: string) => boolean), meta]`
— function matchers are how theme-aware logic is expressed (see
`shouldBeBlocked` usage).

## Files to modify/create

- `src/blocklist.ts` — all behavioral changes below.
- `src/internal/shouldNotBeSuffixBlocked.ts` (NEW, name at your discretion
  within `src/internal/`) — the suffix-conditional matcher + its co-located
  `*.test.ts`.
- `src/preset.test.ts` — extend with the blocking matrix (or add a separate
  `src/blocklist.test.ts` co-located per test conventions; either is fine,
  keep generator harness identical to Task 1.1's).

## Implementation details

1. **Suffix-conditional matcher** (REQ-BLOCK-2). Replace blocklist entry 1
   with a function matcher, built in `src/internal/` alongside
   `shouldBeBlocked.ts` and taking the user theme:
   - Suffix list: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`–`9xl`
     (note `2xs`/`3xs` are NEW vs v2 — wind4's default `shadow`/
     `insetShadow`/`container` define them).
   - On a selector ending `-<suffix>`: determine the section the utility
     resolves from and allow (return false) iff the USER supplied that
     section key; block otherwise. Prefix → section mapping (single-section
     checks only — `text-<suffix>` checks `theme.text` ONLY, never colors):
     - `text-` → `theme.text`
     - `font-` → `theme.fontWeight`
     - `-m/m/p` + directional (same pattern as entry 6), `gap`(-x/-y), `w`,
       `h`, `min-w`, `min-h`, `max-w`, `max-h`, `mask-size-` → `theme.spacing`
     - `opacity-` → `theme.opacity`
     - any other prefix (`rounded-lg`, `shadow-md`, `shadow-2xs`,
       `inset-shadow-2xs`, `blur-sm`, …) → ALWAYS blocked.
   - Keep the message `'Use theme values.'`.
2. **Bracket fixes** (REQ-BLOCK-1):
   - Entry 5 → `/^(-?m|p)([rltbxyse]?)-\[.+\]$/` (adds `x`/`y`; keeps
     negatives — v2's `(-m|m|p)` already covered `-m`, don't regress).
   - Entry 7 → escape the brackets: `/^(gap(?:-[xy])?|h|min-h|max-h|w|min-w|max-w)-\[.+\]$/`
     (fixes the `[.+]` char-class bug; adds `gap-x`/`gap-y`).
   - Add `/^mask-size-\[.+\]$/` → `themeValuesMessage` (wind4 introduced a
     native mask-size rule; its bracket form must carry an explicit block
     even though Task 1.1 removed the rule — defense in depth and a clear
     user message).
3. **Numeric checks** (REQ-BLOCK-3/4): keep entries 3, 4, 6, 8, 9 as-is, and
   add `shouldBeBlocked(/^mask-size-(.+)$/, { ...theme.spacing })` →
   `staticValuesMessage`. (Entry 4's `theme.text` spread already happened in
   Task 1.1.)
4. **Consistency renames** (REQ-BLOCK-5): entries 2 and 3 unchanged.
5. **Blocking test matrix** (generator-based; blocked/unresolved ⇒ class
   absent from generated CSS). With Task 1.1's fixture theme:
   - Suffix-conditional: `p-sm` EMITS literal `padding: 0.9rem` (user
     `spacing.sm` exists; resolved by Task 1.1's custom rule); `text-sm`
     has no selector (no `text.sm` in fixture); add
     `text: { sm: { fontSize: '0.95rem' } }` in a second generator instance
     and assert `text-sm` then emits — the flagship user-approved change;
     `rounded-lg`, `shadow-md`, `shadow-2xs`, `inset-shadow-2xs`, `w-2xs`,
     `w-xl`, `m-3xs` produce no selectors.
   - Brackets — assert EVERY form REQ-BLOCK-1 names, one class each:
     `bg-[#fff]`, `text-[20px]`, `m-[10px]`, `p-[10px]`, `mx-[10px]`,
     `my-[10px]`, `px-[4px]`, `py-[4px]`, `-m-[10px]`, `-mt-[10px]`,
     `gap-[2rem]`, `gap-x-[1rem]`, `gap-y-[1rem]`, `w-[10px]`, `h-[10px]`,
     `min-w-[10px]`, `min-h-[10px]`, `max-w-[10px]`, `max-h-[10px]`,
     `mask-size-[10px]`, `opacity-[0.3]` — none may produce a selector.
   - Numerics: `p-5`, `w-9`, `gap-7`, `text-9`, `font-100`, `opacity-55`,
     `mask-size-3` emit nothing (keys absent from fixture sections) — this
     is REQ-BLOCK-4's spacing-multiplier guard; also assert the multiplier
     never appears: generated CSS must not contain `calc(var(--spacing)`.
   - Consistency: `color-primary`, `fw-bold` emit nothing.
   - Statics survive blocking (REQ-UTIL-7 regression guard): `w-full`,
     `m-auto`, `w-1/2` still emit CSS.
   - Unit tests for the new suffix matcher function itself, co-located,
     mirroring `src/internal/shouldBeBlocked.test.ts` style (direct calls,
     no generator).

## Testing suggestions

- `yarn test` runs everything; iterate with `yarn vitest run src/blocklist.test.ts`.
- Test exception applies (from `.claude/mise-config.md`): no e2e
  infrastructure — unit tests plus manual verification substitute.

## Gotchas

- Blocklist function matchers receive the selector string only — all theme
  awareness comes from closing over the `theme` parameter (the USER theme).
  Never read merged/default theme sections; wind4 defaults surviving the
  merge (e.g. `shadow.2xs`) must not satisfy a check.
- Suffix check order matters inside the matcher: test `-2xl`-style
  multi-char suffixes before `-xl` (a naive "ends with xl" hits `2xl` too).
  Anchor with a leading `-`.
- `mask-size-sm` maps to `theme.spacing` (its values come from spacing), not
  a mask section.
- `min-w`/`max-w` prefixes contain `-`; write the prefix→section mapping
  against the full utility head, not `split('-')[0]`.
- The numeric text check (`shouldBeBlocked(/^text-(.*)$/, theme.text)`)
  coexists with the suffix matcher — both must be present; they cover
  different value shapes (numerics vs named suffixes).
- Don't block `text-<key>/<n>` shorthand, `size-*`, dash-less `w4`, `op-*`,
  `opacity-$foo`, `c-*` aliases, logical variants (`p-bs-[*]`), or
  `gap-col-[*]` — all explicitly out of scope as carried-over v2 holes
  (requirements Out of Scope). Adding them would be scope drift; tests must
  not assert on them either way.
- `p-sm` emitting depends on Task 1.1's CUSTOM directional rule resolving
  `theme.spacing.sm` — wind4's native `directionSize` is NOT the resolver
  (its numeric-multiplier path runs before any theme lookup, and named keys
  reached natively would emit `var(--spacing-sm)` references, not the
  literal this test asserts). If the assert fails, check the custom rule and
  the rule ordering (local rules last in the array → tried first).
- Blocked/unresolvable classes must be asserted as ABSENCE OF THE SELECTOR
  (e.g. no `.shadow-2xs`), not empty CSS — some class families still emit
  `@property` blocks.

## Verification checklist

- [ ] `yarn smoke` passes.
- [ ] Every bullet of the blocking matrix (§5) is an assertion in a test
      file, including both suffix-conditional directions (blocked without
      the theme key; emits with it).
- [ ] Generated CSS in tests never contains `calc(var(--spacing)`.
- [ ] End-to-end tests: none — Test exception (no e2e infrastructure)
      applies; substitute is the unit matrix above.
