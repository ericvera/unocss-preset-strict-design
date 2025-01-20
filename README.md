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
        fontSize: {
          // Your font sizes
          sm: '0.875rem',
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

### Theme Value Inheritance

For convenience, if not explicitly defined, the following theme properties will automatically inherit values from `theme.spacing`:

- `width`
- `height`
- `maxWidth`
- `maxHeight`
- `minWidth`
- `minHeight`

This means you can use your spacing scale values for these properties without additional configuration.

## Restrictions

This preset enforces several restrictions to maintain design consistency:

1. **Theme Values Only**: All properties must use predefined theme values

   - ❌ `text-[20px]`, `m-[10px]`, `bg-[#fff]`
   - ✅ `text-sm`, `m-4`, `bg-primary`

2. **Consistent Class Names**: Enforces consistent naming conventions

   - ❌ `color-red`, `fw-bold`
   - ✅ `text-red`, `font-bold`

3. **Required Theme Properties**: The theme configuration must include:
   - `colors`
   - `spacing`
   - `fontSize`
   - `fontWeight`
   - `opacity`

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
  - This overrides the opacity rule in the wind preset that allows for arbitrary opacity values

## License

MIT
