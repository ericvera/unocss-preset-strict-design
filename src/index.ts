import type { PresetFactory, PresetWind4Theme } from 'unocss'
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

// NOTE: The preset is internally typed against wind4's theme
// (PresetWind4Theme) because Preset<Theme> is invariant in Theme, so the
// wind4 preset cannot be re-typed to PresetStrictDesignTheme without a cast.
// The strict theme is enforced at the options boundary instead:
// PresetStrictDesignOptions.theme is PresetStrictDesignTheme (required nested
// text, opacity extension, no flat fontSize).
export const presetStrictDesign: PresetFactory<
  PresetWind4Theme,
  PresetStrictDesignOptions
> = definePreset<PresetStrictDesignOptions, PresetWind4Theme>((options) => {
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

  const wind = presetWind4()

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
})
