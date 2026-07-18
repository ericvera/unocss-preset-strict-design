1# Goals: Migrate preset base from presetWind3 to presetWind4 (Tailwind 4)

## Original description

upgrade to the version that has tailwind4

## What this means

The preset currently builds on `presetWind3` (Tailwind 3-compatible). The installed
`unocss` 66.7.5 (latest) already ships `presetWind4`, the
Tailwind 4-compatible preset. This work migrates the preset's base from
`presetWind3` to `presetWind4`, adapting the theme API, blocklist, rules, and
theme extension to wind4's theme model.

## Decisions (user-confirmed)

1. **Theme API adopts wind4-native naming; values are preserved.** The flat
   `fontSize: { sm: '0.875rem' }` key is replaced by wind4's nested
   `text: { sm: { fontSize: '0.875rem', lineHeight?, letterSpacing? } }` shape.
   Users rename the key once and keep their values; per-size `lineHeight` /
   `letterSpacing` become available. `colors`, `spacing`, and `fontWeight` keep
   their identical shapes. `opacity` remains a custom preset extension
   (wind4 has no themed opacity), with the same flat shape as today.
2. **Spacing strictness is preserved.** Only values whose keys exist in the
   user's `theme.spacing` are allowed. Wind4's default numeric-multiplier
   spacing (`p-3` = `calc(var(--spacing) * 3)`) must remain blocked for keys
   not defined in the user's theme, same as today.
3. **Breaking major release: v3.0.0.** Peer dependency becomes `unocss ^66.7.0` —
   a conservative floor: only claim compatibility with what we develop and test
   against (`presetWind4` first shipped in 66.1.0 but evolved during 66.x).

## Required theme properties (post-migration)

`colors`, `spacing`, `text`, `fontWeight` (validated at preset creation, as
today), plus `opacity` used by the custom opacity rule. The blocklist's
fontSize check moves from `theme.fontSize` keys to `theme.text` keys.

## Behavior that must not change

- Utility class names users write stay the same: `text-sm`, `font-bold`,
  `p-4`, `bg-primary`, `opacity-50`, `mask-size-4`, etc.
- All existing strictness guarantees: arbitrary values blocked
  (`text-[20px]`, `m-[10px]`, `bg-[#fff]`), non-theme values blocked,
  consistency renames enforced (`color-*` → `text-*`, `fw-*` → `font-*`),
  default `-xs/-sm/-md/...` suffixed utilities blocked unless themed.
- Width/height/min/max/gap inherit from `theme.spacing` when not explicitly
  themed (extendTheme behavior), adapted to however wind4 resolves these
  utilities.

## Documentation

- **README updated** for the new theme shape (usage example, required
  properties, restrictions) — including the `text` nested shape.
- **Migration info included**: a migration section (README or CHANGELOG-style
  note) covering v2 → v3: the `fontSize` → `text` rename with a
  before/after example, the presetWind3 → presetWind4 base change, and any
  output differences users should expect (e.g. wind4 CSS-variable-based
  output/preflights).

## Out of scope

- No new utilities or new strictness rules beyond porting existing behavior.
- No support for flat `fontSize` compatibility shim (users migrate their key).
- No e2e infrastructure (per config test exception: verify with unit tests
  plus manual verification).
