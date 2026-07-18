import { createGenerator } from 'unocss'
import { describe, expect, it } from 'vitest'
import type { PresetStrictDesignTheme } from './index.js'
import { presetStrictDesign } from './index.js'

const theme: PresetStrictDesignTheme = {
  colors: { primary: '#0066cc' },
  spacing: { '1': '0.3rem', '2': '0.6rem', sm: '0.9rem' },
  text: {
    '1': { fontSize: '0.8rem' },
    '2': { fontSize: '1.1rem', lineHeight: '1.6' },
  },
  fontWeight: { normal: '450', bold: '750' },
  opacity: { '80': '0.75' },
}

/**
 * Structural pass: which declarations/selectors appear (no preflights).
 */
const generateCss = async (
  classes: string,
  themeOverride: PresetStrictDesignTheme = theme,
): Promise<string> => {
  const uno = await createGenerator({
    presets: [presetStrictDesign({ theme: themeOverride })],
  })
  const { css } = await uno.generate(classes, { preflights: false })

  return css
}

/**
 * Value pass: preflights on, so the theme layer maps CSS variables to the
 * fixture literals.
 */
const generateCssWithPreflights = async (classes: string): Promise<string> => {
  const uno = await createGenerator({
    presets: [presetStrictDesign({ theme })],
  })
  const { css } = await uno.generate(classes)

  return css
}

/**
 * Escapes a class name the way UnoCSS does when it emits a selector, so
 * absence assertions target the exact emitted form (blocked classes may
 * still leave `@property` blocks behind — never assert on empty CSS).
 */
const escapeSelector = (className: string): string =>
  `.${className.replace(/[^a-zA-Z0-9-]/g, (char) => `\\${char}`)}`

describe('suffix-conditional blocking', () => {
  it('emits p-sm as a literal when the user theme defines spacing.sm', async () => {
    const css = await generateCss('p-sm')

    expect(css).toContain('.p-sm{padding:0.9rem;}')
  })

  it('blocks text-sm when the user theme has no text.sm', async () => {
    const css = await generateCss('text-sm')

    expect(css).not.toContain('.text-sm')
  })

  it('emits text-sm when the user theme defines text.sm', async () => {
    const css = await generateCss('text-sm', {
      ...theme,
      text: { ...theme.text, sm: { fontSize: '0.95rem' } },
    })

    expect(css).toContain('.text-sm{font-size:var(--text-sm-fontSize)')
  })

  it('blocks size suffixes with no user theme backing', async () => {
    const blocked = [
      'rounded-lg',
      'shadow-md',
      'shadow-2xs',
      'inset-shadow-2xs',
      'w-2xs',
      'w-xl',
      'm-3xs',
    ]
    const css = await generateCss(blocked.join(' '))

    for (const className of blocked) {
      expect(css).not.toContain(`.${className}`)
    }
  })
})

describe('arbitrary bracket values', () => {
  it('blocks every arbitrary-value bracket form', async () => {
    const blocked = [
      'bg-[#fff]',
      'text-[20px]',
      'm-[10px]',
      'p-[10px]',
      'mx-[10px]',
      'my-[10px]',
      'px-[4px]',
      'py-[4px]',
      '-m-[10px]',
      '-mt-[10px]',
      'gap-[2rem]',
      'gap-x-[1rem]',
      'gap-y-[1rem]',
      'w-[10px]',
      'h-[10px]',
      'min-w-[10px]',
      'min-h-[10px]',
      'max-w-[10px]',
      'max-h-[10px]',
      'mask-size-[10px]',
      'opacity-[0.3]',
    ]
    const css = await generateCss(blocked.join(' '))

    for (const className of blocked) {
      expect(css).not.toContain(escapeSelector(className))
    }

    // Belt and suspenders: none of the arbitrary values may leak into
    // declarations regardless of selector escaping.
    expect(css).not.toContain('10px')
    expect(css).not.toContain('4px')
    expect(css).not.toContain('20px')
    expect(css).not.toContain('#fff')
    expect(css).not.toContain('1rem')
    expect(css).not.toContain('2rem')
    expect(css).not.toContain('opacity:')
  })
})

describe('numeric values outside the theme', () => {
  const numericClasses = 'p-5 w-9 gap-7 text-9 font-100 opacity-55 mask-size-3'

  it('blocks numeric keys absent from the theme sections', async () => {
    const css = await generateCss(numericClasses)

    expect(css).not.toContain('.p-5')
    expect(css).not.toContain('.w-9')
    expect(css).not.toContain('.gap-7')
    expect(css).not.toContain('.text-9')
    expect(css).not.toContain('.font-100')
    expect(css).not.toContain('.opacity-55')
    expect(css).not.toContain('.mask-size-3')
  })

  it('never emits the wind4 --spacing multiplier', async () => {
    const css = await generateCssWithPreflights(numericClasses)

    expect(css).not.toContain('calc(var(--spacing)')
  })
})

describe('consistency renames', () => {
  it('blocks color-* and fw-*', async () => {
    const css = await generateCss('color-primary fw-bold')

    expect(css).not.toContain('.color-primary')
    expect(css).not.toContain('.fw-bold')
  })
})

describe('statics survive blocking', () => {
  it('still resolves wind4 statics', async () => {
    const css = await generateCss('w-full m-auto w-1/2')

    expect(css).toContain('.w-full{width:100%;}')
    expect(css).toContain('.m-auto{margin:auto;}')
    expect(css).toContain('.w-1\\/2{width:50%;}')
  })
})
