import type { PresetFactory, PresetWind4Theme } from 'unocss'
import { definePreset, presetWind4 } from 'unocss'
import { blocklist } from './blocklist.js'
import { extendTheme } from './extendTheme.js'
import { parseTheme } from './internal/parseTheme.js'
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

// NOTE: The factory is built against wind4's theme (PresetWind4Theme) because
// presetWind4's rules and variants are typed to it and Preset<Theme> is
// invariant in Theme, so they cannot be re-typed to PresetStrictDesignTheme
// without internal casts.
const factory = definePreset<PresetStrictDesignOptions, PresetWind4Theme>(
  (options) => {
    const theme = parseTheme(options?.theme)

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
  },
)

// NOTE: UnoCSS's Preset<Theme> is invariant in Theme (RuleContext embeds the
// invariant UnoGenerator), so this single boundary assertion is unprovable in
// TypeScript — but it is true at runtime: the factory validates the theme via
// parseTheme at creation, and extendTheme replaces `text` wholesale with the
// user's entries and empties `container`, so every theme a consumer handler
// observes satisfies PresetStrictDesignTheme. A cast-free version needs
// upstream UnoCSS to type presetWind4 as a generic factory.
export const presetStrictDesign = factory as unknown as PresetFactory<
  PresetStrictDesignTheme,
  PresetStrictDesignOptions
>
