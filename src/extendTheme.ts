import type { PresetMiniTheme } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'

export const extendTheme =
  (theme: PresetStrictDesignTheme) => (defaultTheme: PresetMiniTheme) => {
    const strictTheme: PresetStrictDesignTheme = { ...defaultTheme, ...theme }

    if (!theme.spacing) {
      throw new Error('spacing is required in theme')
    }

    // Set default values for width, height, maxWidth, and maxHeight if not
    // defined in theme.
    if (!theme.width) {
      strictTheme.width = theme.spacing
    }

    if (!theme.height) {
      strictTheme.height = theme.spacing
    }

    if (!theme.maxWidth) {
      strictTheme.maxWidth = theme.spacing
    }

    if (!theme.maxHeight) {
      strictTheme.maxHeight = theme.spacing
    }

    if (!theme.minWidth) {
      strictTheme.minWidth = theme.spacing
    }

    if (!theme.minHeight) {
      strictTheme.minHeight = theme.spacing
    }

    return strictTheme
  }
