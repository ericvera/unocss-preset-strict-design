import type { PresetMiniTheme } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'

export const extendTheme =
  (theme: PresetStrictDesignTheme) => (defaultTheme: PresetMiniTheme) => {
    const strictTheme: PresetStrictDesignTheme = { ...defaultTheme, ...theme }

    // Set default values for width, height, maxWidth, and maxHeight if not
    // defined in theme.
    if (!strictTheme.width) {
      strictTheme.width = theme.spacing
    }

    if (!strictTheme.height) {
      strictTheme.height = theme.spacing
    }

    if (!strictTheme.maxWidth) {
      strictTheme.maxWidth = theme.spacing
    }

    if (!strictTheme.maxHeight) {
      strictTheme.maxHeight = theme.spacing
    }

    if (!strictTheme.minWidth) {
      strictTheme.minWidth = theme.spacing
    }

    if (!strictTheme.minHeight) {
      strictTheme.minHeight = theme.spacing
    }

    return strictTheme
  }
