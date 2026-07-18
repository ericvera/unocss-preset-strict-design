# Task 3.1: Release packaging — v3.0.0, peer dep, README + migration guide

## Goal

Bump the package to 3.0.0 with peer dependency `unocss ^66.7.0`, rewrite the
README for the wind4-based theme API, and add a v2 → v3 migration section.
Green at the end: `yarn smoke`.

## Requirements addressed

REQ-PKG-1, REQ-PKG-2, REQ-PKG-3, REQ-DOC-1, REQ-DOC-2, REQ-DOC-3

## Background

`unocss-preset-strict-design` is a UnoCSS preset enforcing theme-only values.
Tasks 1.1 and 2.1 migrated it from `presetWind3` to `presetWind4`
(Tailwind 4-compatible):

- Theme API is wind4-native: `colors`, `spacing`, `fontWeight` flat records;
  `text` is nested — `Record<string, { fontSize: string; lineHeight?: string; letterSpacing?: string }>`
  — replacing v2's flat `fontSize` record (no shim; TypeScript errors on the
  old key). `opacity` stays a custom flat record. Required at creation:
  `colors`, `spacing`, `text`, `fontWeight` (collective error).
- Explicit `width`/`height`/`minWidth`/`minHeight`/`maxWidth`/`maxHeight`
  theme sections are gone — sizing utilities (`w-*`, `h-*`, `min/max-*`,
  `gap-*`) resolve from `theme.spacing` only; wind4's default `container`
  scale is neutralized (so `w-prose`/`w-2xs` never leak).
- Size-suffix blocking is now conditional: `-xs/-sm/.../-9xl` (plus new
  `2xs`/`3xs`) utilities resolve when the user's corresponding theme section
  defines the key (`text-sm` works iff `theme.text.sm` exists), and are
  blocked otherwise; `rounded-lg`/`shadow-md`-style utilities (sections
  outside the strict API) are always blocked. v2 blocked all such suffixes
  unconditionally.
- Bracket blocking fixed/extended: `w-[10px]`, `gap-[2rem]`, `mx-[10px]`,
  `py-[4px]`, `mask-size-[10px]`, `gap-x/y-[*]` now blocked (v2 regex bugs
  let them through); `bg-[*]`, `text-[*]`, `opacity-[*]`, negative margins
  as before.
- Custom rules now take precedence over wind4's native rules (fixes a latent
  v2 bug where a numeric themed `opacity-80` emitted the native `0.8`
  instead of the theme value); wind4's native `mask-size` rule is removed
  entirely, so only themed `mask-size-<key>` emits.
- Wind4 emits CSS-variable-based output and preflights (theme values become
  CSS variables like `--spacing-*`/`--color-*`; some declarations reference
  variables) — an output-format change from v2 users will see in their
  generated CSS.

Current state of the files this task touches:

- `package.json` — `"version": "2.0.0"`, `"peerDependencies": { "unocss": "66.x" }`,
  devDependency `"unocss": "^66.7.5"`. Scripts: `build`/`lint`/`test`/`smoke`
  (`yarn smoke` = build + lint + test). Keywords include `tailwind`.
- `README.md` — documents the v2 API: flat `fontSize` in the usage example
  (lines ~44–82), "Theme Value Inheritance" section (lines ~84–95) describing
  the removed width/height inheritance, "Required Theme Properties" listing
  `fontSize` (lines ~111–116), Restrictions examples (lines ~97–116),
  "Available Utility Classes" for `mask-size-*` and `opacity-*`
  (lines ~118–133).

## Files to modify/create

- `package.json` — version `3.0.0`; `peerDependencies.unocss` → `"^66.7.0"`.
  Leave the devDependency as-is.
- `README.md` — rewrite affected sections + new migration section.

## Implementation details

1. `package.json`: exactly the two field changes above (REQ-PKG-1/2). Run
   `yarn install` afterward so the lockfile reflects the peer range, and
   commit the lockfile change with it if one occurs.
2. `README.md` (REQ-DOC-1, REQ-DOC-3):
   - Usage example: replace the flat `fontSize` block with the nested `text`
     shape (show `lineHeight` on one entry so the capability is
     discoverable). Keep the rest of the example theme.
   - Replace the "Theme Value Inheritance" section: sizing utilities now
     resolve from `theme.spacing` directly; explicit width/height sections
     no longer exist.
   - "Required Theme Properties": `colors`, `spacing`, `text`, `fontWeight`
     (plus `opacity` needed for `opacity-*` utilities).
   - Restrictions: keep the arbitrary-value and consistency examples;
     ensure every "✅ allowed" example is genuinely allowed under the new
     rules (e.g. `text-sm` is fine ONLY with a note that the key must exist
     in `theme.text` — v3 makes that example real) and every "❌" example is
     genuinely blocked. Cross-check each against the test matrix in
     `src/preset.test.ts` / `src/blocklist.test.ts` rather than guessing.
   - "Available Utility Classes": unchanged semantics for `mask-size-*` and
     `opacity-*`; update wording that references "the wind preset" to wind4.
3. `README.md` — new `## Migrating from v2 to v3` section (REQ-DOC-2), with
   these five sub-points, each with a short before/after where applicable:
   - (a) `fontSize` → `text` rename: flat string
     (`fontSize: { sm: '0.875rem' }` → `text: { sm: { fontSize: '0.875rem' } }`)
     AND tuple form (`fontSize: { sm: ['0.875rem', '1.25rem'] }` →
     `text: { sm: { fontSize: '0.875rem', lineHeight: '1.25rem' } }` — v2
     accepted tuples via `PresetWindTheme`).
   - (b) Base change presetWind3 → presetWind4; peer requirement now
     `unocss ^66.7.0` (bump unocss together with the preset).
   - (c) Removed `width`/`height`/`minWidth`/`minHeight`/`maxWidth`/
     `maxHeight` theme sections — define sizes in `spacing`.
   - (d) Size-suffix blocking change: suffixed utilities now WORK when the
     key exists in your theme (previously always blocked); everything
     outside the strict sections (`rounded-lg`, `shadow-md`, …) stays
     blocked.
   - (e) Output differences: wind4 emits CSS-variable-based output and
     preflights; visual results are unchanged when values come from your
     theme, but raw CSS diffs are expected. Also note newly-closed holes
     (bracket values like `w-[10px]` that v2 accidentally allowed are now
     blocked) so users aren't surprised by new block messages.
4. Final gate: `yarn smoke` (REQ-PKG-3).

## Testing suggestions

- `yarn smoke` — full build + lint + test.
- Manual verification (Test exception substitute): read the rendered README
  once top-to-bottom checking every class example against the behavior
  encoded in the test files; there must be no example the test matrix
  contradicts.

## Gotchas

- Do NOT publish or tag — version bump and docs only; release happens
  through the repo's normal flow (npm trusted publishing per commit
  `764e9a3`).
- lint-staged runs prettier on commit and will reformat README markdown —
  write prettier-compatible markdown (or run `yarn prettier --write README.md`
  before committing) so the committed content is what you reviewed.
- The README's v2 "Restrictions" section shows `text-sm`, `m-4` as allowed —
  under v3 those are conditional on theme keys; say so explicitly rather
  than deleting the examples (REQ-DOC-3).
- Peer dep is `^66.7.0` — not `66.x` (too loose; wind4 evolved during 66.x)
  and not `^66.7.5` (devDependency pin is separate).

## Verification checklist

- [ ] `package.json` shows `"version": "3.0.0"` and
      `"peerDependencies": { "unocss": "^66.7.0" }`.
- [ ] README migration section covers all five sub-points (a)–(e).
- [ ] Every README class example agrees with an assertion in the test files.
- [ ] `yarn smoke` passes.
- [ ] End-to-end tests: none — Test exception (no e2e infrastructure)
      applies; substitute is `yarn smoke` plus the README/manual review
      above.
