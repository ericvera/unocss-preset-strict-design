import type { Preset, PresetFactory, PresetWind4Theme } from 'unocss'
import { definePreset, presetWind4 } from 'unocss'
import { blocklist } from './blocklist.js'
import { extendTheme } from './extendTheme.js'
import { rules as localRules } from './rules.js'

export interface PresetStrictDesignTheme extends PresetWind4Theme {
  text?: Record<
    string,
    { fontSize: string; lineHeight?: string; letterSpacing?: string }
  >
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

    if (!theme.colors || !theme.spacing || !theme.text || !theme.fontWeight) {
      throw new Error(
        'theme with a minimum of colors, spacing, text, and fontWeight is required',
      )
    }

    // NOTE: The cast realigns the wind4 preset (typed against its own Theme)
    // with PresetStrictDesignTheme, a structural extension of that theme.
    const wind = presetWind4() as unknown as Preset<PresetStrictDesignTheme>

    // Remove wind4's native mask-size rule. Its handler resolves non-theme
    // forms (brackets, $vars, globals, fractions, unit and bare numeric
    // values) that the blocklist cannot catch, so it must not remain as a
    // fallback behind the themed mask-size rule.
    const windRules = (wind.rules ?? []).filter(
      (rule) => String(rule[0]) !== String(/^mask-size-(.+)$/),
    )

    return {
      ...wind,
      extendTheme: extendTheme(theme),
      name: 'unocss-preset-strict-design',
      blocklist: blocklist(theme),
      // NOTE: UnoCSS tries later-registered rules first, so the local rules
      // go last to take precedence over wind4's native rules.
      rules: [...windRules, ...localRules],
    }
  },
)
