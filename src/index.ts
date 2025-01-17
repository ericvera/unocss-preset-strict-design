import type { PresetFactory, PresetWindTheme } from 'unocss'
import { definePreset, presetWind } from 'unocss'
import { blocklist } from './blocklist.js'
import { extendTheme } from './extendTheme.js'
import { rules as localRules } from './rules.js'

export interface PresetStrictDesignTheme extends PresetWindTheme {
  opacity?: Record<string, string>
}

export interface PresetStrictDesignOptions {
  theme: PresetStrictDesignTheme
}

export const presetStrictDesign: PresetFactory<
  PresetStrictDesignTheme,
  PresetStrictDesignOptions
> = definePreset<PresetStrictDesignOptions, PresetStrictDesignTheme>(
  (options) => {
    const theme = options?.theme

    if (!theme) {
      throw new Error('theme is required')
    }

    // NOTE: Something in the types of definePreset makes it so that the theme
    // property cannot have required properties. Because of this, we need to
    // enforce the required properties here.

    if (
      !theme.colors ||
      !theme.spacing ||
      !theme.fontSize ||
      !theme.fontWeight
    ) {
      throw new Error(
        'theme with a minimum of colors, spacing, fontSize, and fontWeight is required',
      )
    }

    const wind = presetWind()

    const rules = [...localRules]

    if (wind.rules) {
      rules.push(...wind.rules)
    }

    return {
      ...wind,
      extendTheme: extendTheme(theme),
      name: 'unocss-preset-strict-design',
      blocklist: blocklist(theme),
      rules,
    }
  },
)
