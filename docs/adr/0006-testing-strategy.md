# 0006. Four test layers, with real-browser tests for anything visual

- **Status:** Accepted
- **Date:** 2026-10-22

## Context

jsdom has no layout engine, so it can't check colour contrast, focus rings, target sizes or real keyboard focus. Those are exactly the things that fail accessibility audits. End-to-end tests catch them but are slow, and when they fail it's hard to tell which component broke.

## Decision

| Layer | Tool | Count | Speed | Owns |
|---|---|---|---|---|
| Unit | Vitest + Testing Library + axe-core, jsdom | 52 | ~5 s | Behaviour, ARIA wiring, keyboard models, controlled/uncontrolled, analytics calls |
| Component in a real browser | Vitest Browser Mode (Playwright Chromium) + axe with contrast | 8 | ~10 s | Contrast in both themes, focus-ring contrast, target size, real Tab/Space |
| Story audit | Built Storybook + axe, every story × light/dark | 24 × 2 | ~30 s | Every documented state stays accessible, and new stories are covered automatically |
| End to end | Playwright + @axe-core/playwright, desktop + Pixel 7 | 9 × 2 | ~40 s | Whole journeys, reflow at 320px, offline PWA, Share fallback, consent |

Rules:

- Query by **role and accessible name** (`getByRole('radio', { name: 'Tampines' })`), never by class or test id, so the tests also prove the accessibility tree.
- Every test that can't fail is suspect. New checks are first run against a deliberately broken build. For example, the focus-contrast test fails on the old amber (2.04:1), and the story audit fails when muted text is lightened.
- Coverage floors (90% statements, 80% branches) stop quiet erosion. They are floors, not targets.
- Automated tools find about a third of WCAG issues, so the manual screen-reader checklist in ACCESSIBILITY.md runs before each release.

Visual regression snapshots are deliberately not used yet: screenshot baselines differ between OS font renderers and create noise. The Storybook build is uploaded from every CI run, so Chromatic or Playwright snapshots can be added on a pinned Linux image when a designer is in the review loop.

## Consequences

- A failure points at a layer: unit → logic, browser → CSS/tokens, story → a documented state, e2e → integration.
- CI needs Chromium (`npx playwright install --with-deps chromium`), which takes about 30 s.
