import type { CSSObject } from 'unocss'
import { expect, it } from 'vitest'
import { shouldBeBlocked } from './shouldBeBlocked.js'

const mockThemeSection: Record<
  string,
  string | [string, string | CSSObject] | [string, string, string]
> = {
  primary: '0.5rem',
  secondary: '1rem',
  tertiary: '2rem',
  custom: ['16px', { color: 'red' }],
  special: ['20px', '1.5', 'bold'],
}

const testRegex = /^test-(.*)$/

const shouldBlock = shouldBeBlocked(testRegex, mockThemeSection)

it('should return false when selector does not match regex', () => {
  expect(shouldBlock('no-match')).toBe(false)
})

it('should return false when value is not defined in theme but is not a number', () => {
  expect(shouldBlock('test-unknown')).toBe(false)
})

it('should return true when value is a number not defined in theme', () => {
  expect(shouldBlock('test-123')).toBe(true)
})

it('should return false when value exists in theme', () => {
  expect(shouldBlock('test-primary')).toBe(false)
  expect(shouldBlock('test-secondary')).toBe(false)
  expect(shouldBlock('test-tertiary')).toBe(false)
})

it('should return false for complex theme values', () => {
  expect(shouldBlock('test-custom')).toBe(false)
  expect(shouldBlock('test-special')).toBe(false)
})

it('should return true for empty value', () => {
  expect(shouldBlock('test-')).toBe(true)
})

it('should return false for numbers with units', () => {
  expect(shouldBlock('test-16px')).toBe(false)
})
