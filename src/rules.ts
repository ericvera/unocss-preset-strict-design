import type { Rule } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'

export const rules: Rule<PresetStrictDesignTheme>[] = [
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
    ([, level], { theme }) =>
      level && theme.opacity?.[level]
        ? { ['opacity']: theme.opacity[level] }
        : undefined,
  ],
]
