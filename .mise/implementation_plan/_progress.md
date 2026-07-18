# Progress

## 1.1 — Core migration from presetWind3 to presetWind4

- Key changes:
  - `src/index.ts`: base swapped to `presetWind4`; `PresetStrictDesignTheme`
    now extends `PresetWind4Theme` with narrowed `text` (required `fontSize`)
    plus custom `opacity`; validation requires `colors`/`spacing`/`text`/
    `fontWeight`; wind4's native `mask-size` rule filtered out; rules ordered
    `[...windRules, ...localRules]` so local rules win (later rules are tried
    first). The wind4 preset is cast once
    (`as unknown as Preset<PresetStrictDesignTheme>`) to realign the theme
    generic — direct assignment fails under `exactOptionalPropertyTypes`.
  - `src/extendTheme.ts`: typed against `PresetWind4Theme`; shallow merge kept;
    `container: {}` added; the six width/height/min/max spacing copies deleted;
    also sets `text: theme.text ?? {}` so wind4's default text scale (optional
    `fontSize`) never leaks through the merge (needed for type safety; user
    `text` is guaranteed by factory validation).
  - `src/rules.ts`: existing mask-size/opacity rules kept; added themed
    margin/padding rule (`/^([mp])([xytrblse]?)-(.+)$/`) and gap rule
    (`/^gap(?:-([xy]))?-(.+)$/`) resolving `theme.spacing`, returning
    `undefined` for unthemed keys.
  - `src/blocklist.ts`: `{ ...theme.fontSize }` → `{ ...theme.text }` (compile
    fix only).
  - `src/internal/shouldBeBlocked.ts`: `themeSection` widened to
    `Record<string, unknown>`; logic unchanged, existing tests untouched.
  - `src/preset.test.ts` (NEW): 19 generator-based tests covering text/
    fontWeight var emission + preflight literals, custom m/p/gap literal
    output (incl. negated `-m-1`, no `calc(var(--spacing)` fallback), sizing
    via `--spacing-*` vars, `bg-primary` color-mix output, `opacity-80` →
    `0.75` precedence regression, mask-size themed-only, statics
    (`w-full`/`m-auto`/`w-1/2`), container neutralization, default palette
    removal, validation throws, and a `@ts-expect-error` guard for the removed
    flat `fontSize` key.
- Deviations from plan: none of substance. Two implementation notes: the
  wind4 realignment cast is on the whole preset (not just `rules`) because
  `variants` from the `...wind` spread hits the same theme-generic invariance;
  `extendTheme` explicitly pins `text` (see above) since the plain
  `{ ...defaultTheme, ...theme }` spread does not typecheck with the narrowed
  `text` under `exactOptionalPropertyTypes`.
- Verification: `yarn smoke` green (build + lint + 26 tests);
  `grep -rn "presetWind3|PresetWindTheme" src/` clean; manual CSS spot-check
  of generated output performed via scratch script (matches test assertions).

## 2.1 — Blocklist overhaul: suffix-conditional blocking and regex fixes

- Key changes:
  - `src/internal/shouldBeSuffixBlocked.ts` (NEW): `shouldBeSuffixBlocked(theme)`
    function matcher for the size-suffix blocklist entry. Suffix list extended
    with wind4's `2xs`/`3xs`. Maps the full utility head to a single USER-theme
    section (`text` → `theme.text`, `font` → `theme.fontWeight`, `opacity` →
    `theme.opacity`, margin/padding incl. negatives and directionals plus
    `gap`/`gap-x`/`gap-y`/`w`/`h`/`min-*`/`max-*`/`mask-size` → `theme.spacing`);
    allows the selector iff the user supplied that section key, blocks any other
    prefix unconditionally. Co-located `shouldBeSuffixBlocked.test.ts` (9 direct
    unit tests, no generator).
  - `src/blocklist.ts`: entry 1 replaced by the suffix matcher (message
    `'Use theme values.'` kept); m/p bracket regex fixed to
    `/^(-?m|p)([rltbxyse]?)-\[.+\]$/` (adds x/y); sizing/gap bracket regex fixed
    to `/^(gap(?:-[xy])?|h|min-h|max-h|w|min-w|max-w)-\[.+\]$/` (escapes the
    former `[.+]` char class, adds gap-x/gap-y); NEW `mask-size-[*]` bracket
    block and `shouldBeBlocked(/^mask-size-(.+)$/, theme.spacing)` numeric
    block. Entries 2, 3, 4, 6, 8, 9 unchanged.
  - `src/blocklist.test.ts` (NEW): generator-based blocking matrix — both
    suffix-conditional directions (`p-sm` emits literal; `text-sm` blocked
    without `text.sm`, emits with it via a second generator theme), all 21
    bracket forms (absence asserted via UnoCSS-escaped selectors plus value
    leak checks), numeric guard (`p-5`/`w-9`/`gap-7`/`text-9`/`font-100`/
    `opacity-55`/`mask-size-3` blocked; no `calc(var(--spacing)` in preflighted
    CSS), consistency renames (`color-primary`/`fw-bold`), and statics
    regression (`w-full`/`m-auto`/`w-1/2` still emit).
- Deviations from plan: none. The new internal file is named
  `shouldBeSuffixBlocked.ts` (returns true = block, consistent with
  `shouldBeBlocked.ts`) rather than the plan's placeholder name — explicitly
  left to implementer discretion.
- Verification: `yarn smoke` green (build + lint + 44 tests across 4 files).

## 3.1 — Release packaging: v3.0.0, peer dep ^66.7.0, README rewrite + migration guide

- Key changes:
  - `package.json`: `version` 2.0.0 → 3.0.0; `peerDependencies.unocss`
    `66.x` → `^66.7.0` (devDependency `^66.7.5` untouched); `yarn.lock`
    refreshed via `yarn install` (peer range line only).
  - `README.md`: usage example's flat `fontSize` replaced with nested `text`
    (one entry shows `lineHeight`); "Theme Value Inheritance" replaced with
    "Sizing Resolves from Spacing" (sizing/gap utilities resolve from
    `theme.spacing`; no width/height sections); Restrictions rewritten —
    bracket examples marked always-blocked, `text-sm`/`m-4`/`bg-primary`
    marked conditional on theme keys, note on unconditional blocking of
    non-strict sections (`rounded-lg`/`shadow-md`); Required Theme
    Properties now `colors`/`spacing`/`text`/`fontWeight` with `opacity`
    noted as needed for `opacity-*`; "wind preset" wording updated to wind4;
    new `## Migrating from v2 to v3` section covering (a) `fontSize` → `text`
    (flat and tuple before/after), (b) wind3 → wind4 base + `unocss ^66.7.0`
    peer, (c) removed width/height theme sections, (d) suffix-conditional
    blocking incl. new `2xs`/`3xs`, (e) CSS-variable output/preflights and
    newly-closed bracket holes.
- Deviations from plan: none.
- Verification: `yarn smoke` green (build + lint + 44 tests); every README
  class example cross-checked against `src/preset.test.ts` /
  `src/blocklist.test.ts` assertions; no publish/tag performed.

## Acceptance fix — drop the whole-preset `as unknown as Preset<...>` cast

- Key changes:
  - `src/index.ts`: factory retyped to
    `PresetFactory<PresetWind4Theme, PresetStrictDesignOptions>` /
    `definePreset<PresetStrictDesignOptions, PresetWind4Theme>`; the
    `as unknown as Preset<PresetStrictDesignTheme>` cast on `presetWind4()`
    and the `Preset` type import removed. Strict typing stays at the options
    boundary (`PresetStrictDesignOptions.theme: PresetStrictDesignTheme`);
    NOTE comment explains Preset<Theme> is invariant in Theme.
  - `src/rules.ts`: `rules` retyped to `Rule<PresetWind4Theme>[]`; the opacity
    handler reads the section via one narrow
    `const { opacity } = theme as PresetStrictDesignTheme` cast (opacity is
    this preset's theme extension, absent from wind4's Theme type).
  - `src/extendTheme.ts` / `src/blocklist.ts`: unchanged, still compile.
- Deviations from plan: none. Behavior unchanged (types-only plus the opacity
  destructure); no test files modified.
- Verification: `yarn prettier --write .` then `yarn smoke` green (build +
  lint + 44 tests across 4 files); `grep -n "unknown" src/*.ts` returns
  nothing.

- Review fix: documented the defineConfig generic change (drop `defineConfig<PresetStrictDesignTheme>`, annotate the theme value instead) in the README v2-to-v3 migration guide as item 6; `yarn smoke` green.

## Acceptance fix — boundary re-brand + parse-don't-cast

- Key changes:
  - `src/index.ts`: factory kept as
    `definePreset<PresetStrictDesignOptions, PresetWind4Theme>` assigned to an
    internal `factory` const; exported re-branded as
    `presetStrictDesign = factory as unknown as PresetFactory<PresetStrictDesignTheme, PresetStrictDesignOptions>`
    with a NOTE explaining the single boundary assertion is unprovable in TS
    (Preset<Theme> invariant via RuleContext's UnoGenerator) but true at
    runtime (parseTheme validation + extendTheme's wholesale `text`
    replacement / emptied `container`). The two inline validation throws
    replaced by `const theme = parseTheme(options?.theme)`.
  - `src/internal/parseTheme.ts` (NEW): `parseTheme(input: unknown):
PresetStrictDesignTheme` — preserves the exact `'theme is required'` and
    collective four-section messages, then deep-checks shapes (colors as
    wind4 Colors incl. nesting, spacing/fontWeight/opacity string records,
    text entries with string `fontSize` and optional string lineHeight/
    letterSpacing) with precise per-key errors (e.g.
    `theme.text.sm must define fontSize as a string`). Narrowing is done via
    an `asserts theme is Record<string, unknown> & PresetStrictDesignTheme`
    assertion signature — no `as PresetStrictDesignTheme` cast. Exports
    `isStringRecord` helper. Co-located `parseTheme.test.ts` (12 tests).
  - `src/rules.ts`: opacity handler's `theme as PresetStrictDesignTheme` cast
    replaced by `theme as { opacity?: unknown }` read backed by the
    `isStringRecord` runtime check.
  - `README.md` migration §6 flipped: `defineConfig<PresetStrictDesignTheme>`
    works again in v3; bare `defineConfig` infers the strict theme; annotating
    the theme value kept as the recommended authoring pattern.
- Deviations from plan: none. Assertion signature used instead of boolean
  predicates (both are type predicates; assertion form keeps the throw-based
  checks in one place).
- Verification: `yarn prettier --write .` then `yarn smoke` green (build +
  lint + 56 tests: 44 pre-existing unmodified + 12 new). Type-boundary
  scratch file confirmed `defineConfig<PresetStrictDesignTheme>` and bare
  `defineConfig` (strict theme inferred in a custom rule context) both
  compile; the `@ts-expect-error` flat-`fontSize` guard still holds (build
  type-checks tests). Behavioral spot-check via node + createGenerator:
  `opacity-80` → 0.75, `text-1` resolves, malformed text entry throws the new
  precise message; scratch files deleted. Only `unknown` casts in src/: the
  index.ts export re-brand and the rules.ts `{ opacity?: unknown }` read.
