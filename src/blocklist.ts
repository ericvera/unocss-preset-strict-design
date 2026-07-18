import { staticValuesMessage } from './internal/blockMessages.js'

import { BlocklistRule } from 'unocss'
import type { PresetStrictDesignTheme } from './index.js'
import {
  consistencyMessage,
  themeValuesMessage,
} from './internal/blockMessages.js'
import { shouldBeBlocked } from './internal/shouldBeBlocked.js'
import { shouldBeSuffixBlocked } from './internal/shouldBeSuffixBlocked.js'

export const blocklist: (theme: PresetStrictDesignTheme) => BlocklistRule[] = (
  theme,
) => [
  // Block size suffixes (-sm, -md, -2xl, ...) unless the user theme defines
  // the key in the section the utility resolves from.
  [shouldBeSuffixBlocked(theme), { message: 'Use theme values.' }],

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
  [shouldBeBlocked(/^text-(.*)$/, { ...theme.text }), staticValuesMessage],

  // Margins and Padding
  // Disable arbitraty values for mX-[*] and pX-[*]
  [/^(-?m|p)([rltbxyse]?)-\[.+\]$/, themeValuesMessage],
  // Only allow values defined in themes
  [
    shouldBeBlocked(/^(?:-m|m|p)(?:[rltbxyse]?)-(.*)$/, {
      ...theme.spacing,
    }),
    staticValuesMessage,
  ],

  // Width, Height, Gap
  // Disable arbitraty values
  [/^(gap(?:-[xy])?|h|min-h|max-h|w|min-w|max-w)-\[.+\]$/, themeValuesMessage],
  // Only allow values defined in themes
  [
    shouldBeBlocked(/^(?:gap|h|min-h|max-h|w|min-w|max-w)-(.+)$/, {
      ...theme.spacing,
    }),
    staticValuesMessage,
  ],

  // Mask Size
  // Disable arbitraty values for mask-size-[*]
  [/^mask-size-\[.+\]$/, themeValuesMessage],
  // Only allow values defined in themes
  [
    shouldBeBlocked(/^mask-size-(.+)$/, { ...theme.spacing }),
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
