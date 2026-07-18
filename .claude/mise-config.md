# Mise Configuration

Mise directory: .mise/
Branch convention: feat/<slug> for features, fix/<slug> for bug fixes

## Quality commands

- Format: yarn prettier --write .
- Check: yarn smoke
- Unit tests: yarn test

## Test conventions

Tests live next to source as `*.test.ts` (e.g. `src/internal/shouldBeBlocked.test.ts`), using vitest.

## Test exceptions

- Anything that would need an e2e test (no e2e infrastructure exists) — verify with unit tests plus manual verification
