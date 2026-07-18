import type { PresetStrictDesignTheme } from '../index.js'

// Multi-char suffixes (2xs/3xs/2xl-9xl) are listed before their short
// counterparts and the whole suffix is anchored between a `-` and the end of
// the selector, so `-2xl` can never be misread as `-xl`.
const suffixPattern =
  /^(.+)-(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/

// Utility heads that resolve their values from theme.spacing: margin/padding
// (including negatives and directional variants), gap(-x/-y), sizing, and
// mask-size. Matched against the full utility head (e.g. `min-w`), never a
// dash-split fragment.
const spacingHeadPattern =
  /^(?:-?m[rltbxyse]?|p[rltbxyse]?|gap(?:-[xy])?|w|h|min-w|min-h|max-w|max-h|mask-size)$/

const sectionFor = (
  head: string,
  theme: PresetStrictDesignTheme,
): Record<string, unknown> | undefined => {
  if (head === 'text') {
    return theme.text
  }

  if (head === 'font') {
    return theme.fontWeight
  }

  if (head === 'opacity') {
    return theme.opacity
  }

  if (spacingHeadPattern.test(head)) {
    return theme.spacing
  }

  return undefined
}

/**
 * Blocks size-suffixed selectors (`-sm`, `-2xl`, ...) unless the USER theme
 * defines the suffix as a key in the single section the utility resolves
 * from. Utilities with no theme-backed section (e.g. `rounded-lg`,
 * `shadow-2xs`) are always blocked — wind4 defaults surviving the theme
 * merge must never satisfy the check.
 */
export const shouldBeSuffixBlocked =
  (theme: PresetStrictDesignTheme) =>
  (selector: string): boolean => {
    const match = suffixPattern.exec(selector)

    if (!match) {
      return false
    }

    const [, head, suffix] = match

    if (!head || !suffix) {
      return false
    }

    const section = sectionFor(head, theme)

    if (!section) {
      return true
    }

    return !section[suffix]
  }
