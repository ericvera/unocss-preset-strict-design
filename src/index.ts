import type { Preset, PresetMiniTheme } from 'unocss'
import { definePreset, presetMini } from 'unocss'
import {
  consistencyMessage,
  staticValuesMessage,
  themeValuesMessage,
} from './internal/blockMessages.js'
import { shouldBeBlocked } from './internal/shouldBeBlocked.js'
import type { WithRequired } from './internal/types.js'

interface StrictDesignTheme extends PresetMiniTheme {
  opacity?: Record<string, string>
}

interface StrictDesignPresetOptions {
  theme: WithRequired<
    StrictDesignTheme,
    'colors' | 'spacing' | 'fontSize' | 'fontWeight' | 'opacity'
  >
}

export default definePreset(
  ({
    theme,
  }: StrictDesignPresetOptions): Preset<
    StrictDesignTheme & PresetMiniTheme
  > => {
    const mini = presetMini()

    return {
      ...mini,

      name: 'strict-design',

      extendTheme: (defaultTheme) => {
        const strictTheme = { ...defaultTheme, ...theme }

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
      },

      blocklist: [
        // Block anything with -sm, -md, -lg, -xl, etc.
        [
          /^(.+)-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
          { message: 'Use theme values.' },
        ],

        // Background/Color
        // Disable color-* and force text-* for consistency with tailwind
        [/^color-(.*)$/, consistencyMessage('color-*', 'text-*')],
        // Disable arbitraty values for bg-[*]
        [/^bg-\[(.*)\]$/, themeValuesMessage],

        // Font Weight
        // Disable fw, and force font-* for consistency with tailwind
        [/^fw-(.*)$/, consistencyMessage('fw-*', 'font-*')],
        [
          shouldBeBlocked(/^font-(.*)$/, { ...theme.fontWeight }),
          staticValuesMessage,
        ],

        // Text/Font Size
        // Disable arbitraty values for text-[*]
        [/^text-\[(.*)\]$/, themeValuesMessage],
        // Block numeric values not defined in theme
        [
          shouldBeBlocked(/^text-(.*)$/, { ...theme.fontSize }),
          staticValuesMessage,
        ],

        // Margins and Padding
        // Disable arbitraty values for mX-[*] and pX-[*]
        [/^(-m|m|p)([rltbse]?)-\[.+\]$/, themeValuesMessage],
        // Only allow values defined in themes
        [
          shouldBeBlocked(/^(?:-m|m|p)(?:[rltbxyse]?)-(.*)$/, {
            ...theme.spacing,
          }),
          staticValuesMessage,
        ],

        // Width, Height, Gap
        // Disable arbitraty values
        [/^(gap|h|min-h|max-h|w|min-w|max-w)-[.+]$/, themeValuesMessage],
        // Only allow values defined in themes
        [
          shouldBeBlocked(/^(?:gap|h|min-h|max-h|w|min-w|max-w)-(.+)$/, {
            ...theme.spacing,
          }),
          staticValuesMessage,
        ],

        // Opacity
        // Disable arbitraty values for opacity-[*]
        [/^opacity-\[(.*)\]$/, themeValuesMessage],
        // Only allow values defined in themes
        [
          shouldBeBlocked(/^opacity-(.*)$/, { ...theme.opacity }),
          staticValuesMessage,
        ],

        // NOTE: There are likely more rules to add here. If missing open a pull
        // request to add them.
      ],
      rules: [
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
      ],
    }
  },
)
