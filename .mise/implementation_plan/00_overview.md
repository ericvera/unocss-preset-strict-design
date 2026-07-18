# Implementation Plan

## Summary

Migrate `unocss-preset-strict-design` from a `presetWind3` base to
`presetWind4` (Tailwind 4-compatible), adopting wind4-native theme naming
(`fontSize` → nested `text`), preserving every strictness guarantee, and
shipping as breaking v3.0.0 with peer dep `unocss ^66.7.0` and full migration
docs. Requirements: `.mise/requirements.md` (REQ-* IDs traced per task).

## Design

The preset keeps its v2 architecture — a factory that spreads the base wind
preset and overrides `extendTheme`, `blocklist`, and `rules` — with four
deliberate changes:

1. **Base swap with rule surgery** (`src/index.ts`): `presetWind4()` replaces
   `presetWind3()`. Wind4's native `mask-size` rule (matcher
   `/^mask-size-(.+)$/`) is FILTERED OUT of `wind.rules` — it resolves
   fractions/units/globals/$var that no blocklist rule can catch; removing it
   makes the custom themed rule the only mask-size surface. Rule order flips
   to `[...filteredWindRules, ...localRules]`: UnoCSS tries later-registered
   rules first, so local rules now win — this also fixes the latent v2 bug
   where wind's native opacity rule shadowed the custom themed one.
2. **Theme model** (`src/index.ts`, `src/extendTheme.ts`):
   `PresetStrictDesignTheme` extends `PresetWind4Theme` (exported by
   `unocss`), tightening `text` entries to require `fontSize` and adding
   `opacity?`. Validation requires `colors`, `spacing`, `text`, `fontWeight`
   (collective error message, as v2). `extendTheme` becomes: shallow
   section-level merge (user sections replace wind4 defaults wholesale) plus
   `container: {}` neutralization — wind4's sizing lookup consults
   `container` before `spacing` and its defaults include `prose`/`2xs`/`3xs`
   which would otherwise leak. The v2 width/height/min/max spacing-copy is
   deleted: wind4 has no such theme sections; sizing reads `spacing`
   directly.
3. **Blocklist overhaul** (`src/blocklist.ts`): the unconditional size-suffix
   block becomes suffix-conditional — a suffixed utility passes only when the
   suffix key exists in the USER-provided section that utility resolves from
   (`text-*`→`text`, `font-*`→`fontWeight`, margins/paddings/gap/sizing→
   `spacing`, `opacity-*`→`opacity`, `mask-size-*`→`spacing`; any other
   prefix always blocked). The suffix list gains `2xs`/`3xs` (new in wind4
   defaults). Two v2 regex bugs are fixed (bracket blocking for sizing/gap,
   `x`/`y` margin/padding variants) and `mask-size-[*]` + `gap-x/y-[*]`
   join the bracket list. Numeric checks move `text` from `theme.fontSize`
   to `theme.text`.
4. **Custom directional spacing rules** (`src/rules.ts`): wind4's native
   margin/padding/gap handler resolves NUMERIC values via the
   `calc(var(--spacing) * n)` multiplier BEFORE consulting `theme.spacing`
   (verified by execution), so numeric theme keys — the primary consumer's
   scheme — would never resolve. New local rules (margin/padding with all
   directional/negative variants; gap/gap-x/gap-y) resolve `theme.spacing`
   keys to literal declarations and fall through (`undefined`) otherwise so
   statics like `m-auto` keep working natively. Sizing (`w-*` etc.) needs no
   custom rule — wind4 consults theme keys first there.
5. **Behavioral test suite** (new, `createGenerator`-based): generates CSS
   in-process and asserts emission/absence per utility — this is the net
   that proves strictness parity, since v2 had no such tests. Wind4-native
   rules emit CSS-variable references with literals in the preflight layer,
   so tests assert structure without preflights and value-mapping with
   preflights; absence is asserted per-selector (not empty output).

Data flow (unchanged from v2): user theme → validation → `extendTheme`
merges over wind4 defaults at config-resolve time; `blocklist(theme)`
closes over the USER theme (never the merged theme) so wind4 defaults can
never satisfy a strictness check.

## Assumptions

- Rule-precedence direction (later-registered wins) is asserted by a
  dedicated test (themed `opacity-80` → `0.75`, a value deliberately ≠
  80/100) rather than trusted from reading `@unocss/core` internals.
- `interface PresetStrictDesignTheme extends PresetWind4Theme` can narrow
  `text` (required `fontSize`) because the narrowed type is assignable to
  wind4's optional one; if tsc rejects it, fall back to
  `extends Omit<PresetWind4Theme, 'text'>` — same public shape.
- Neutralizing `container` via `extendTheme` (`container: {}`) rather than
  filtering sizing rules: it also disables `columns-*` container lookups,
  which requirements accept as intended (REQ-THEME-5).
- `.mise` markdown is prettier-formatted at commit by lint-staged; plan
  files are written in prettier-stable form (run `yarn prettier --write` on
  them before any approval hash is recorded).

## Phases

- **Phase 1: Core migration** — swap the base to wind4, new theme model,
  rule ordering/filtering, resolution tests. Preset works end-to-end with
  wind4; v2 blocklist still compiles (suffix rule still unconditional).
- **Phase 2: Strictness overhaul** — suffix-conditional blocklist, regex
  fixes, full blocking test matrix.
- **Phase 3: Release packaging** — version/peer-dep bumps, README rewrite,
  migration guide.

## Phase Rationale

Phase 1 must land first: every blocklist test in Phase 2 needs the wind4
base, rule ordering, and container neutralization already in place to assert
real end-to-end behavior. Phase 1 stays green by keeping the v2 blocklist
semantics compiling against the new theme shape (its `theme.fontSize` reads
become `theme.text`); the suffix-conditional change is isolated in Phase 2 so
each phase has one reviewable concern. Phase 3 (docs/versioning) depends on
final behavior being settled, else the migration guide would document a
moving target.

## Task Index

| File                          | Task                                                            | Phase | Requirements                                                             |
| ----------------------------- | --------------------------------------------------------------- | ----- | ------------------------------------------------------------------------ |
| `01_01_core_migration.md`     | Swap base to presetWind4: theme model, rule order, extendTheme  | 1     | REQ-BASE-1, REQ-BASE-2, REQ-THEME-1..6, REQ-UTIL-1, 1b, 2, 3, 4, 5, 6, 7 |
| `02_01_blocklist_overhaul.md` | Suffix-conditional blocklist, regex fixes, blocking test matrix | 2     | REQ-BLOCK-1..5, REQ-UTIL-5, REQ-UTIL-6, REQ-THEME-5                      |
| `03_01_release_packaging.md`  | v3.0.0 version/peer-dep, README rewrite, migration guide        | 3     | REQ-PKG-1, REQ-PKG-2, REQ-PKG-3, REQ-DOC-1, REQ-DOC-2, REQ-DOC-3         |
