import { expect, it } from 'vitest'
import { parseTheme } from './parseTheme.js'

const validTheme = {
  colors: { primary: '#0066cc', brand: { DEFAULT: '#ffffff', dark: '#000' } },
  spacing: { '1': '0.3rem', sm: '0.9rem' },
  text: {
    '1': { fontSize: '0.8rem' },
    '2': { fontSize: '1.1rem', lineHeight: '1.6' },
  },
  fontWeight: { normal: '450', bold: '750' },
  opacity: { '80': '0.75' },
}

it('should return a valid theme unchanged', () => {
  expect(parseTheme(validTheme)).toBe(validTheme)
})

it('should accept a valid theme without opacity', () => {
  const { colors, spacing, text, fontWeight } = validTheme
  const withoutOpacity = { colors, spacing, text, fontWeight }

  expect(parseTheme(withoutOpacity)).toBe(withoutOpacity)
})

it('should throw when the theme is missing or not an object', () => {
  expect(() => parseTheme(undefined)).toThrow('theme is required')
  expect(() => parseTheme(null)).toThrow('theme is required')
  expect(() => parseTheme('theme')).toThrow('theme is required')
})

it('should throw the collective message when a required section is missing', () => {
  const { colors, spacing, fontWeight, opacity } = validTheme
  const withoutText = { colors, spacing, fontWeight, opacity }

  expect(() => parseTheme(withoutText)).toThrow(
    'theme with a minimum of colors, spacing, text, and fontWeight is required',
  )
})

it('should throw when a text entry does not define fontSize', () => {
  expect(() => parseTheme({ ...validTheme, text: { sm: {} } })).toThrow(
    'theme.text.sm must define fontSize as a string',
  )
})

it('should throw when a text entry has a non-string lineHeight', () => {
  expect(() =>
    parseTheme({
      ...validTheme,
      text: { sm: { fontSize: '1rem', lineHeight: 1.5 } },
    }),
  ).toThrow('theme.text.sm.lineHeight must be a string')
})

it('should throw when a spacing value is not a string', () => {
  expect(() => parseTheme({ ...validTheme, spacing: { '1': 4 } })).toThrow(
    'theme.spacing.1 must be a string',
  )
})

it('should throw when a fontWeight value is not a string', () => {
  expect(() =>
    parseTheme({ ...validTheme, fontWeight: { bold: 750 } }),
  ).toThrow('theme.fontWeight.bold must be a string')
})

it('should throw when a colors value is neither a string nor a nested record', () => {
  expect(() => parseTheme({ ...validTheme, colors: { primary: 42 } })).toThrow(
    'theme.colors.primary must be a string or a nested record of strings',
  )
})

it('should accept deeply nested color records', () => {
  const theme = {
    ...validTheme,
    colors: { brand: { light: { DEFAULT: '#eee', hover: '#ddd' } } },
  }

  expect(parseTheme(theme)).toBe(theme)
})

it('should throw when an opacity value is not a string', () => {
  expect(() => parseTheme({ ...validTheme, opacity: { '80': 0.75 } })).toThrow(
    'theme.opacity.80 must be a string',
  )
})

it('should throw when opacity is not a record', () => {
  expect(() => parseTheme({ ...validTheme, opacity: '0.75' })).toThrow(
    'theme.opacity must be a record of strings',
  )
})
