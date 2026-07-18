import { expect, it } from 'vitest'
import type { PresetStrictDesignTheme } from '../index.js'
import { shouldBeSuffixBlocked } from './shouldBeSuffixBlocked.js'

const theme: PresetStrictDesignTheme = {
  colors: { primary: '#0066cc' },
  spacing: { '1': '0.3rem', sm: '0.9rem', xl: '2rem' },
  text: { md: { fontSize: '1rem' } },
  fontWeight: { lg: '700' },
  opacity: { xs: '0.2' },
}

const shouldBlock = shouldBeSuffixBlocked(theme)

it('should return false when selector has no size suffix', () => {
  expect(shouldBlock('p-1')).toBe(false)
  expect(shouldBlock('w-full')).toBe(false)
  expect(shouldBlock('bg-primary')).toBe(false)
  expect(shouldBlock('text-[20px]')).toBe(false)
  expect(shouldBlock('sm')).toBe(false)
})

it('should return true for prefixes with no theme-backed section', () => {
  expect(shouldBlock('rounded-lg')).toBe(true)
  expect(shouldBlock('shadow-md')).toBe(true)
  expect(shouldBlock('shadow-2xs')).toBe(true)
  expect(shouldBlock('inset-shadow-2xs')).toBe(true)
  expect(shouldBlock('blur-sm')).toBe(true)
})

it('should return false for spacing-backed utilities when the key exists', () => {
  expect(shouldBlock('p-sm')).toBe(false)
  expect(shouldBlock('m-sm')).toBe(false)
  expect(shouldBlock('mx-sm')).toBe(false)
  expect(shouldBlock('-m-sm')).toBe(false)
  expect(shouldBlock('-mt-sm')).toBe(false)
  expect(shouldBlock('gap-sm')).toBe(false)
  expect(shouldBlock('gap-x-sm')).toBe(false)
  expect(shouldBlock('gap-y-sm')).toBe(false)
  expect(shouldBlock('w-sm')).toBe(false)
  expect(shouldBlock('h-sm')).toBe(false)
  expect(shouldBlock('min-w-sm')).toBe(false)
  expect(shouldBlock('min-h-sm')).toBe(false)
  expect(shouldBlock('max-w-sm')).toBe(false)
  expect(shouldBlock('max-h-sm')).toBe(false)
  expect(shouldBlock('mask-size-sm')).toBe(false)
})

it('should return true for spacing-backed utilities when the key is missing', () => {
  expect(shouldBlock('p-md')).toBe(true)
  expect(shouldBlock('m-3xs')).toBe(true)
  expect(shouldBlock('w-2xs')).toBe(true)
  expect(shouldBlock('max-h-2xl')).toBe(true)
  expect(shouldBlock('gap-md')).toBe(true)
  expect(shouldBlock('mask-size-lg')).toBe(true)
})

it('should check text-* against theme.text only', () => {
  expect(shouldBlock('text-md')).toBe(false)
  // spacing.sm exists but text.sm does not
  expect(shouldBlock('text-sm')).toBe(true)
})

it('should check font-* against theme.fontWeight', () => {
  expect(shouldBlock('font-lg')).toBe(false)
  expect(shouldBlock('font-sm')).toBe(true)
})

it('should check opacity-* against theme.opacity', () => {
  expect(shouldBlock('opacity-xs')).toBe(false)
  expect(shouldBlock('opacity-sm')).toBe(true)
})

it('should not treat a multi-char suffix as its short counterpart', () => {
  // spacing.xl exists, spacing.2xl does not
  expect(shouldBlock('w-xl')).toBe(false)
  expect(shouldBlock('w-2xl')).toBe(true)
})

it('should block when the mapped section is absent from the theme', () => {
  const shouldBlockEmpty = shouldBeSuffixBlocked({})

  expect(shouldBlockEmpty('opacity-xs')).toBe(true)
  expect(shouldBlockEmpty('p-sm')).toBe(true)
  expect(shouldBlockEmpty('text-md')).toBe(true)
})
