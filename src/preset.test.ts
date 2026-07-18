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
const generateCss = async (classes: string): Promise<string> => {
  const uno = await createGenerator({
    presets: [presetStrictDesign({ theme })],
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

describe('text (font size)', () => {
  it('resolves themed text keys to font-size variables', async () => {
    const css = await generateCss('text-1 text-2')

    expect(css).toContain('.text-1{font-size:var(--text-1-fontSize)')
    expect(css).toContain(
      '.text-2{font-size:var(--text-2-fontSize);line-height:var(--un-leading, var(--text-2-lineHeight));}',
    )
  })

  it('defines the text variables with the fixture literals', async () => {
    const css = await generateCssWithPreflights('text-1 text-2')

    expect(css).toContain('--text-1-fontSize: 0.8rem;')
    expect(css).toContain('--text-2-fontSize: 1.1rem;')
    expect(css).toContain('--text-2-lineHeight: 1.6;')
  })
})

describe('font weight', () => {
  it('resolves themed font weight keys to variables', async () => {
    const css = await generateCss('font-bold')

    expect(css).toContain('font-weight:var(--fontWeight-bold)')
  })

  it('defines the font weight variable with the fixture literal', async () => {
    const css = await generateCssWithPreflights('font-bold')

    expect(css).toContain('--fontWeight-bold: 750;')
  })
})

describe('margin/padding/gap (custom themed rules)', () => {
  it('emits theme literals for themed spacing keys', async () => {
    const css = await generateCss('p-1 m-2 -m-1 mx-1 gap-1 gap-x-2')

    expect(css).toContain('.p-1{padding:0.3rem;}')
    expect(css).toContain('.m-2{margin:0.6rem;}')
    expect(css).toContain('.-m-1{margin:-0.3rem;}')
    expect(css).toContain('.mx-1{margin-left:0.3rem;margin-right:0.3rem;}')
    expect(css).toContain('.gap-1{gap:0.3rem;}')
    expect(css).toContain('.gap-x-2{column-gap:0.6rem;}')
  })

  it('never falls back to the wind4 --spacing multiplier', async () => {
    const css = await generateCssWithPreflights(
      'p-1 m-2 -m-1 mx-1 gap-1 gap-x-2',
    )

    expect(css).not.toContain('calc(var(--spacing)')
  })
})

describe('sizing (w/h/min/max)', () => {
  it('resolves themed spacing keys to spacing variables', async () => {
    const css = await generateCss('w-1 h-2 max-w-1')

    expect(css).toContain('.w-1{width:var(--spacing-1);}')
    expect(css).toContain('.h-2{height:var(--spacing-2);}')
    expect(css).toContain('.max-w-1{max-width:var(--spacing-1);}')
  })

  it('defines the spacing variables with the fixture literals', async () => {
    const css = await generateCssWithPreflights('w-1 h-2 max-w-1')

    expect(css).toContain('--spacing-1: 0.3rem;')
    expect(css).toContain('--spacing-2: 0.6rem;')
  })
})

describe('colors', () => {
  it('resolves themed colors through the color variable', async () => {
    const css = await generateCss('bg-primary')

    expect(css).toContain(
      '.bg-primary{background-color:color-mix(in srgb, var(--colors-primary)',
    )
  })

  it('defines the color variable with the fixture literal', async () => {
    const css = await generateCssWithPreflights('bg-primary')

    expect(css).toContain('--colors-primary: #0066cc;')
  })
})

describe('opacity (custom themed rule)', () => {
  it('resolves the theme value, not the wind4 percent handler', async () => {
    const css = await generateCss('opacity-80')

    expect(css).toContain('.opacity-80{opacity:0.75;}')
    expect(css).not.toContain('opacity:0.8;')
  })
})

describe('mask-size (custom themed rule, native rule removed)', () => {
  it('resolves themed spacing keys to literals', async () => {
    const css = await generateCss('mask-size-1')

    expect(css).toContain('.mask-size-1{mask-size:auto 0.3rem;}')
  })

  it('does not resolve non-theme forms the native rule supported', async () => {
    const css = await generateCss(
      'mask-size-1/2 mask-size-10px mask-size-inherit mask-size-$foo',
    )

    expect(css).not.toContain('mask-size')
  })
})

describe('static utilities', () => {
  it('still resolves wind4 statics', async () => {
    const css = await generateCss('w-full m-auto w-1/2')

    expect(css).toContain('.w-full{width:100%;}')
    expect(css).toContain('.m-auto{margin:auto;}')
    expect(css).toContain('.w-1\\/2{width:50%;}')
  })
})

describe('container neutralization', () => {
  it('does not resolve wind4 default container keys', async () => {
    const css = await generateCss('w-prose max-w-prose w-2xs w-xl')

    expect(css).not.toContain('.w-prose')
    expect(css).not.toContain('.max-w-prose')
    expect(css).not.toContain('.w-2xs')
    expect(css).not.toContain('.w-xl')
  })
})

describe('theme replacement', () => {
  it('does not resolve wind4 default palette colors', async () => {
    const css = await generateCss('bg-red-500')

    expect(css).not.toContain('.bg-red-500')
  })
})

describe('validation', () => {
  it('throws without a theme', () => {
    expect(() => presetStrictDesign()).toThrow('theme is required')
  })

  it('throws when text is missing, naming all four sections', () => {
    expect(() =>
      presetStrictDesign({
        theme: {
          colors: { primary: '#0066cc' },
          spacing: { '1': '0.3rem' },
          fontWeight: { bold: '750' },
        },
      }),
    ).toThrow(
      'theme with a minimum of colors, spacing, text, and fontWeight is required',
    )
  })

  it('rejects the removed flat fontSize theme section at the type level', () => {
    const invalidTheme: PresetStrictDesignTheme = {
      ...theme,
      // @ts-expect-error fontSize was replaced by the nested text section
      fontSize: { '1': '0.8rem' },
    }

    expect(invalidTheme).toBeDefined()
  })
})
