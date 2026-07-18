import type { PresetStrictDesignTheme } from '../index.js'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Runtime check for a plain record whose values are all strings. Shared with
 * the opacity rule, which reads the preset's `opacity` theme extension off
 * wind4's theme type.
 */
export const isStringRecord = (
  value: unknown,
): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((entry) => typeof entry === 'string')

// Matches wind4's Colors shape: string values or arbitrarily nested color
// records.
const isColorsEntry = (value: unknown): boolean =>
  typeof value === 'string' ||
  (isRecord(value) && Object.values(value).every(isColorsEntry))

const assertColors = (colors: unknown): void => {
  if (!isRecord(colors)) {
    throw new Error('theme.colors must be a record')
  }

  for (const [key, value] of Object.entries(colors)) {
    if (!isColorsEntry(value)) {
      throw new Error(
        `theme.colors.${key} must be a string or a nested record of strings`,
      )
    }
  }
}

const assertStringRecordSection = (section: unknown, path: string): void => {
  if (!isRecord(section)) {
    throw new Error(`${path} must be a record of strings`)
  }

  for (const [key, value] of Object.entries(section)) {
    if (typeof value !== 'string') {
      throw new Error(`${path}.${key} must be a string`)
    }
  }
}

const assertText = (text: unknown): void => {
  if (!isRecord(text)) {
    throw new Error('theme.text must be a record of text entries')
  }

  for (const [key, entry] of Object.entries(text)) {
    if (!isRecord(entry) || typeof entry['fontSize'] !== 'string') {
      throw new Error(`theme.text.${key} must define fontSize as a string`)
    }

    for (const optional of ['lineHeight', 'letterSpacing'] as const) {
      const value = entry[optional]

      if (value !== undefined && typeof value !== 'string') {
        throw new Error(`theme.text.${key}.${optional} must be a string`)
      }
    }
  }
}

// NOTE: The section checks below establish exactly the shape the assertion
// signature claims (parse-don't-cast). TypeScript cannot connect throw-based
// checks on individual members back to the parent object on its own, so the
// narrowing is declared as an assertion signature — a checked type predicate,
// not a cast.
function assertStrictDesignTheme(
  theme: Record<string, unknown>,
): asserts theme is Record<string, unknown> & PresetStrictDesignTheme {
  assertColors(theme['colors'])
  assertStringRecordSection(theme['spacing'], 'theme.spacing')
  assertText(theme['text'])
  assertStringRecordSection(theme['fontWeight'], 'theme.fontWeight')

  if (theme['opacity'] !== undefined) {
    assertStringRecordSection(theme['opacity'], 'theme.opacity')
  }
}

/**
 * Parses and validates the user-supplied theme at preset creation.
 *
 * NOTE: definePreset's option typing cannot enforce required theme
 * properties, so the required sections (colors, spacing, text, fontWeight)
 * are enforced here at runtime, followed by per-section shape checks with
 * errors naming the offending key.
 */
export const parseTheme = (input: unknown): PresetStrictDesignTheme => {
  if (!isRecord(input)) {
    throw new Error('theme is required')
  }

  if (
    !input['colors'] ||
    !input['spacing'] ||
    !input['text'] ||
    !input['fontWeight']
  ) {
    throw new Error(
      'theme with a minimum of colors, spacing, text, and fontWeight is required',
    )
  }

  assertStrictDesignTheme(input)

  return input
}
