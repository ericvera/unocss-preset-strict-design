import type { PresetWind4Theme } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'

export const extendTheme =
  (theme: PresetStrictDesignTheme) => (defaultTheme: PresetWind4Theme) => {
    if (!theme.spacing) {
      throw new Error('spacing is required in theme')
    }

    // NOTE: container is emptied because wind4's sizing utilities (w-*, h-*,
    // min-*, max-*) look up theme.container before theme.spacing, so the
    // default container scale (3xs-7xl, prose) would resolve non-theme keys.
    // NOTE: text is always provided by the user theme (validated in the
    // preset factory); wind4's default text scale (with optional fontSize)
    // must not leak through, so it is never merged in.
    const strictTheme: PresetStrictDesignTheme = {
      ...defaultTheme,
      ...theme,
      text: theme.text ?? {},
      container: {},
    }

    return strictTheme
  }
