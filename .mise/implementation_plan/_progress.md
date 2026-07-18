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
