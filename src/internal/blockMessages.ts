export const staticValuesMessage = {
  message: 'Only static values and values defined in themes are allowed.',
}

export const themeValuesMessage = {
  message: `Use theme values. Arbitraty values in brackets are not allowed.`,
}

export const consistencyMessage = (insteadOf: string, use: string) => ({
  message: `For consistency with Tailwind, use ${use} instead of ${insteadOf}.`,
})
