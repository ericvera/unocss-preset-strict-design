import { CSSObject } from 'unocss'

export const shouldBeBlocked =
  (
    regex: RegExp,
    themeSection: Record<
      string,
      string | [string, string | CSSObject] | [string, string, string]
    >,
  ) =>
  (selector: string): boolean => {
    const match = regex.exec(selector)

    if (!match) {
      return false
    }

    const [, value] = match

    if (!value || value === '') {
      return true
    }

    // Returns true if value is not defined in theme and is a number
    return !themeSection[value] && !isNaN(Number(value))
  }
