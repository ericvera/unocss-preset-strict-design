import type { PresetWindTheme } from 'unocss'
import { definePreset, presetWind } from 'unocss'
import { blocklist } from './blocklist.js'
import { extendTheme } from './extendTheme.js'
import type { WithRequired } from './internal/types.js'
import { rules } from './rules.js'

export interface PresetStrictDesignTheme
  extends WithRequired<
    PresetWindTheme,
    'colors' | 'spacing' | 'fontSize' | 'fontWeight'
  > {
  opacity: Record<string, string>
}

export interface PresetStrictDesignOptions {
  theme: PresetStrictDesignTheme
}

export const presetStrictDesign = definePreset(
  (options: PresetStrictDesignOptions) => {
    const { theme } = options

    return {
      ...presetWind(),
      extendTheme: extendTheme(theme),
      name: 'unocss-preset-strict-design',
      blocklist: blocklist(theme),
      rules,
    }
  },
)
