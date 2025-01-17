import { staticValuesMessage } from './internal/blockMessages.js'

import { BlocklistRule } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'
import {
  consistencyMessage,
  themeValuesMessage,
} from './internal/blockMessages.js'
import { shouldBeBlocked } from './internal/shouldBeBlocked.js'

export const blocklist: (theme: PresetStrictDesignTheme) => BlocklistRule[] = (
  theme,
) => [
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
  [shouldBeBlocked(/^text-(.*)$/, { ...theme.fontSize }), staticValuesMessage],

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
]
