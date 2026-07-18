# UnoCSS Strict Design Preset

**A strict design system preset for [UnoCSS](https://github.com/unocss/unocss).**

[![github license](https://img.shields.io/github/license/ericvera/unocss-preset-strict-design.svg?style=flat-square)](https://github.com/ericvera/unocss-preset-strict-design/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/unocss-preset-strict-design.svg?style=flat-square)](https://npmjs.org/package/unocss-preset-strict-design)

## Features

- 🎨 Enforces usage of theme values for colors, spacing, font sizes, and more
- 🚫 Blocks arbitrary values (e.g., `text-[20px]`, `m-[10px]`)
- ✨ Ensures consistent class naming conventions
- 🎯 Perfect for maintaining design system consistency

## Design Philosophy

This preset is built on the principle that consistent design systems lead to better user experiences and more maintainable codebases. Key principles include:

1. **Intentional Constraints**: By limiting to predefined theme values, we ensure design consistency across your entire application.

2. **No Magic Numbers**: Arbitrary values often lead to design inconsistencies. All values should come from your theme configuration.

3. **Predictable Patterns**: Class names follow consistent patterns, making your code more readable and maintainable.

4. **Design System First**: Forces teams to think in terms of design systems rather than one-off solutions.

## Installation

```bash
# Using npm
npm install -D unocss-preset-strict-design

# Using yarn
yarn add -D unocss-preset-strict-design

# Using pnpm
pnpm add -D unocss-preset-strict-design
```

## Usage

Add the preset to your UnoCSS configuration:

```ts
// uno.config.ts
import { defineConfig } from 'unocss'
import { presetStrictDesign } from 'unocss-preset-strict-design'

export default defineConfig({
  presets: [
    presetStrictDesign({
      theme: {
        colors: {
          // Your color palette
          primary: '#0066cc',
          // ...
        },
        spacing: {
          // Your spacing scale
          '1': '0.25rem',
          // ...
        },
        text: {
          // Your font sizes (optionally with line height / letter spacing)
          sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
          base: { fontSize: '1rem' },
          // ...
        },
        fontWeight: {
          // Your font weights
          normal: '400',
          // ...
        },
        opacity: {
          // Your opacity values
          '50': '0.5',
          // ...
        },
      },
    }),
  ],
})
```

### Sizing Resolves from Spacing

Sizing utilities (`w-*`, `h-*`, `min-w-*`, `min-h-*`, `max-w-*`, `max-h-*`, and `gap-*`) resolve directly from `theme.spacing`. There are no separate `width`/`height`/`minWidth`/`minHeight`/`maxWidth`/`maxHeight` theme sections — define your sizes once in `spacing` and they work for spacing and sizing utilities alike.

## Restrictions

This preset enforces several restrictions to maintain design consistency:

1. **Theme Values Only**: All properties must use predefined theme values

   - ❌ `text-[20px]`, `m-[10px]`, `bg-[#fff]` — arbitrary bracket values are always blocked
   - ✅ `text-sm`, `m-4`, `bg-primary` — allowed when the key exists in your theme (`theme.text.sm`, `theme.spacing['4']`, `theme.colors.primary`)

   A utility resolves only when its key is defined in the matching theme section. Numeric or size-suffixed values without a theme entry are blocked (e.g. `p-5` is blocked unless `theme.spacing['5']` exists), and utilities outside the strict theme sections (e.g. `rounded-lg`, `shadow-md`) are always blocked.

2. **Consistent Class Names**: Enforces consistent naming conventions

   - ❌ `color-red`, `fw-bold`
   - ✅ `text-red`, `font-bold`

3. **Required Theme Properties**: The theme configuration must include:
   - `colors`
   - `spacing`
   - `text`
   - `fontWeight`

   `opacity` is optional at creation, but the `opacity-*` utilities only resolve values defined there.

## Available Utility Classes

This preset provides the following utility classes:

### Mask Size

- `mask-size-{size}`: Sets the mask size using your theme's spacing values
  - Example: `mask-size-4` will use the spacing value defined at `theme.spacing['4']`
  - Only uses predefined spacing values from your theme

### Opacity

- `opacity-{value}`: Sets the opacity using your theme's opacity values
  - Example: `opacity-50` will use the opacity value defined at `theme.opacity['50']`
  - Only uses predefined opacity values from your theme
  - This overrides the opacity rule in the wind4 preset that allows for arbitrary opacity values

## Migrating from v2 to v3

v3 rebases the preset from `presetWind3` to `presetWind4` (the Tailwind 4-compatible preset). The following changes affect your configuration and generated CSS.

### 1. `fontSize` is now `text`

The flat `fontSize` theme section was replaced by wind4's nested `text` section. Each entry is an object with a required `fontSize` and optional `lineHeight` / `letterSpacing`.

Flat string values:

```ts
// v2
fontSize: {
  sm: '0.875rem',
}

// v3
text: {
  sm: { fontSize: '0.875rem' },
}
```

Tuple values (v2 accepted `[fontSize, lineHeight]` tuples):

```ts
// v2
fontSize: {
  sm: ['0.875rem', '1.25rem'],
}

// v3
text: {
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
}
```

There is no compatibility shim — TypeScript will error on the old `fontSize` key.

### 2. New base preset and peer requirement

The preset is now built on `presetWind4` instead of `presetWind3`, and the peer dependency is `unocss ^66.7.0`. Bump your `unocss` dependency together with this preset.

### 3. Removed width/height theme sections

The `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, and `maxHeight` theme sections no longer exist (in v2 they inherited from `spacing` unless overridden). Sizing utilities (`w-*`, `h-*`, `min-*`, `max-*`, `gap-*`) now resolve from `theme.spacing` directly — define your sizes there.

### 4. Size suffixes now work when your theme defines them

In v2, size-suffixed utilities (`-xs`, `-sm`, `-md`, ... `-9xl`) were always blocked. In v3 they resolve when the corresponding key exists in your theme section: `text-sm` works if `theme.text.sm` exists, `p-sm` works if `theme.spacing.sm` exists, and both are blocked otherwise. The suffix list also covers wind4's new `2xs` and `3xs` sizes. Utilities outside the strict theme sections (`rounded-lg`, `shadow-md`, ...) remain always blocked.

### 5. Generated CSS looks different

wind4 emits CSS-variable-based output and preflights: theme values become CSS variables (e.g. `--spacing-1`, `--colors-primary`, `--text-sm-fontSize`) and declarations reference them. Visual results are unchanged when values come from your theme, but raw CSS diffs are expected.

Also note that v3 closes blocking holes v2 had: bracket values such as `w-[10px]`, `gap-[2rem]`, `mx-[10px]`, `py-[4px]`, and `mask-size-[10px]` slipped through v2's regexes and are now blocked, so you may see new block behavior for classes that previously (incorrectly) generated CSS.
