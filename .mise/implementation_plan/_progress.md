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
