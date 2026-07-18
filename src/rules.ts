import type { CSSObject, PresetWind4Theme, Rule } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'

const spacingPropertyBase: Record<string, string> = {
  m: 'margin',
  p: 'padding',
}

const spacingDirections: Record<string, string[]> = {
  '': [''],
  x: ['-left', '-right'],
  y: ['-top', '-bottom'],
  t: ['-top'],
  r: ['-right'],
  b: ['-bottom'],
  l: ['-left'],
  s: ['-inline-start'],
  e: ['-inline-end'],
}

export const rules: Rule<PresetWind4Theme>[] = [
  /**
   * Mask Size
   * NOTE: There does not seem to be a mask-size rule in Tailwind so keeping
   * this one to allow for mask-size-* with themed spacing values.
   */
  [
    /^mask-size-(.+)$/,
    ([, level], { theme }) => {
      if (!level || !theme.spacing?.[level]) {
        return
      }

      return {
        'mask-size': `auto ${theme.spacing[level]}`,
      }
    },
  ],

  /**
   * Opacity
   * Ref: https://tailwindcss.com/docs/opacity#changing-an-elements-opacity
   * NOTE: The opacity rule in UnoCSS is not themable so this is a workaround
   * to allow for opacity-* with themed opacity values.
   */
  [
    /^opacity-(.+)$/,
    ([, level], { theme }) => {
      // NOTE: opacity is this preset's theme extension; the merged runtime
      // theme carries it, but wind4's Theme type does not.
      const { opacity } = theme as PresetStrictDesignTheme

      return level && opacity?.[level]
        ? { ['opacity']: opacity[level] }
        : undefined
    },
  ],

  /**
   * Margin/Padding
   * NOTE: wind4's directionSize handler resolves numeric values through the
   * calc(var(--spacing) * n) multiplier path before consulting theme.spacing,
   * so numeric theme keys would never resolve to their themed values. These
   * rules resolve theme.spacing directly and fall through (undefined) for
   * unthemed keys so statics like m-auto reach wind4's native handler.
   * Negative values (-m-*) are handled by wind4's negative variant, which
   * strips the leading dash before matching and negates the emitted values.
   */
  [
    /^([mp])([xytrblse]?)-(.+)$/,
    ([, prop, direction, level], { theme }) => {
      if (
        !prop ||
        direction === undefined ||
        !level ||
        !theme.spacing?.[level]
      ) {
        return
      }

      const base = spacingPropertyBase[prop]
      const suffixes = spacingDirections[direction]

      if (!base || !suffixes) {
        return
      }

      const css: CSSObject = {}

      for (const suffix of suffixes) {
        css[`${base}${suffix}`] = theme.spacing[level]
      }

      return css
    },
  ],

  /**
   * Gap
   * NOTE: Same numeric multiplier issue as margin/padding — wind4's native
   * gap handler never consults theme.spacing for numeric keys.
   */
  [
    /^gap(?:-([xy]))?-(.+)$/,
    ([, direction, level], { theme }) => {
      if (!level || !theme.spacing?.[level]) {
        return
      }

      const property =
        direction === 'x' ? 'column-gap' : direction === 'y' ? 'row-gap' : 'gap'

      return { [property]: theme.spacing[level] }
    },
  ],
]
