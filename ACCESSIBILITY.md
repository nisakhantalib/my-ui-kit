# Accessibility

**Target:** WCAG 2.2 Level A and AA.
This covers Singapore's Digital Service Standards (DSS), which require WCAG Levels A and AA for government digital services.

## How it is checked

| Layer | Tool | Runs | Catches |
|---|---|---|---|
| Component, jsdom | Vitest + Testing Library + axe-core | every push | missing names, roles, ARIA misuse, label/description wiring |
| Component, real Chromium | Vitest Browser Mode + axe-core (WCAG 2.0–2.2 A/AA tags) | every push | **colour contrast**, focus-ring contrast (≥ 3:1, measured in both themes), real keyboard focus, target size |
| Every Storybook story | built Storybook + axe-core, **every brand × light and dark** (45 stories × 4) | every push | every documented state of every component; new stories and new brands are covered automatically |
| Design tokens | `npm run tokens` contrast gate (80 pairs: every brand × mode) | every build | a brand or palette change that drops any text, UI or focus pair below WCAG minimums cannot ship |
| Lint | eslint-plugin-jsx-a11y (strict) | every push, and in the editor | static mistakes: missing alt, invalid ARIA, non-interactive handlers |
| Whole apps | Playwright + @axe-core/playwright, desktop + Pixel 7 | every push | Orchid Bank: every page in light and dark, the Private brand, two markets and languages, 320px reflow, transfer / card / activity journeys, OTP and alert dialogs, strict CSP, the public site, deep links |
| Lighthouse | @lhci/cli on Orchid Bank | every push | accessibility score must be 100 |
| Before release | [Oobee](https://github.com/GovTechSG/oobee) (GovTech Singapore) | manual | site-wide crawl report, DSS-mapped findings |
| Before release | NVDA + Chrome, VoiceOver + Safari (iOS), TalkBack | manual | what automated tools cannot judge: reading order, announcements, sense |

Automated tools find roughly a third of WCAG issues. The manual screen-reader pass is required.

## Success criteria by component

| Component | WCAG 2.2 criteria it handles |
|---|---|
| `Button` | 4.1.2 Name, Role, Value (`aria-busy`, `aria-disabled` keeps it discoverable) · 2.4.7 Focus Visible · 2.5.8 Target Size (44px, minimum is 24px) |
| `TextField`, `Select` | 1.3.1 Info and Relationships (label `for`, hint + error in `aria-describedby`) · 3.3.1 Error Identification (`aria-invalid` + text) · 3.3.2 Labels or Instructions · 4.1.3 Status Messages (error live region) |
| `Checkbox` | 1.3.1 (label `for`) · 4.1.2 (`indeterminate` read as "mixed") · 3.3.1 (`aria-invalid` + text) · 2.5.8 (24px box; the label adds to the target) |
| `RadioGroup` / `Radio` | 1.3.1 (`fieldset` + `legend`; description in `aria-describedby`, not in the name) · 2.1.1 (native arrow keys) · 3.3.1 (`aria-invalid` on `role="radiogroup"`) · 2.5.8 (cards ≥ 44px tall) |
| `AmountInput` | 1.3.1 (label + currency spoken as description: "Currency: Singapore Dollar") · 3.3.1 (built-in message for text that isn't an amount) · 3.3.3 Error Suggestion ("Enter an amount like 1,234.50") · text input with `inputmode`, not `type=number`, which screen readers read inconsistently |
| `OTPInput` | 1.3.5 Identify Input Purpose (`autocomplete="one-time-code"`) · one labelled field instead of six unlabelled ones · 2.2.1 resend countdown is not a live ticker; it is announced once when available · 3.3.8 Accessible Authentication (paste and autofill always work) |
| `Combobox` | 4.1.2 (`role=combobox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) · 4.1.3 result count announced politely · 2.1.1 ↓/↑/Enter/Escape · focus never leaves the input |
| `DataTable` | 1.3.1 (real `<table>`, `caption`, `scope`, row headers) · `aria-sort` plus the sort stated in the caption · 2.1.1 scrollable region is focusable · 1.4.10 scrolls inside itself at 320px |
| `MaskedValue` | masked value spoken as "account number ending 6789" · toggle button with constant label and `aria-pressed` |
| `Badge`, `Skeleton` | 1.4.1 status is text, not colour · skeletons are `aria-hidden`; loading regions use `aria-busy` and announce when ready |
| `Switch` | 4.1.2 (`role="switch"`, `aria-checked`) · 1.4.11 (off-state thumb ≥ 3:1) · 2.1.1 (Space/Enter) · forced-colours state colours |
| `Tabs` | 2.1.1 Keyboard (←/→, Home, End) · 4.1.2 (`tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`) · 2.4.3 Focus Order (roving tabindex) |
| `Dialog` | 2.1.2 No Keyboard Trap (Escape always exits) · 2.4.3 Focus Order (focus in, returned to trigger) · background made `inert` so assistive tech cannot reach it |
| `Accordion` | 1.3.1 (real headings, `headingLevel` matches the outline) · 4.1.2 (`aria-expanded`, `aria-controls`, labelled `region`) · 2.1.1 (↑/↓/Home/End between headers) |
| `Alert` | 1.4.1 Use of Color (tone is spoken: "Warning: …") · 4.1.3 (`role="status"` / `"alert"` only for messages that appear after an action) |
| `ErrorSummary` | 3.3.1 · 2.4.3 (focus moves to the summary; links move focus to the field and scroll its label into view) |
| `ToastProvider` / `useToast` | 4.1.3 (announced through a live region that exists before the toast) · 2.2.1 Timing Adjustable (pauses on hover/focus; never times out with an action) · never steals focus |
| `AnnouncerProvider` | 4.1.3 Status Messages (polite + assertive live regions) |
| `SkipLink` | 2.4.1 Bypass Blocks |
| Styles | 1.4.3 Contrast (≥ 4.5:1 text, light and dark) · 1.4.11 Non-text Contrast (borders, switch, **focus ring ≥ 3:1**) · 2.3.3 Animation from Interactions (`prefers-reduced-motion`) · forced-colours (Windows High Contrast) |
| Orchid Bank | 1.4.10 Reflow (no sideways scroll at 320px on every page, tested) · 2.4.11 Focus Not Obscured (scroll padding under the sticky top bar and bottom tab bar) · 2.4.3 focus moves to each new page's heading · 2.5.3 Label in Name (visible text is always part of the accessible name) · 3.3.1 error summary + field errors |

## Manual screen-reader checklist

1. **NVDA + Chrome, Pay & transfer.** Type "ta" in *Pay to*: you hear "2 results available". ↓ reads "Tan Wei Ling, Orchid Bank ···· 4821". Enter selects it.
2. **Amount field.** You hear "Amount, required, edit, Currency: Singapore Dollar, Available …". Type 99999 and continue: focus goes to the error summary, which reads "There is a problem (1 error)".
3. **Approve dialog.** It opens with focus in the code field; iOS offers the SMS code above the keyboard. A wrong code is read as an error, and the page behind is unreachable.
4. **Receipt.** Focus lands on "Transfer sent", then the amount and payee.
5. **Home with Hide balances on.** Every balance reads "Hidden", including the chart.
6. **Market switch to 香港.** VoiceOver switches to its Cantonese voice because `lang="zh-HK"` is set on the page.
7. **Cards › Freeze card.** You hear "Freeze card, switch, off", then "on" and the toast "Card frozen". **Report lost or stolen** opens an alert dialog with focus on Cancel.
8. **Activity.** Type "grab": after a pause you hear "2 transactions". The filter chips read "Money in, toggle button, not pressed".
9. **Phone, bottom tab bar.** Swipe through: five links, the current one announced as "current page".
10. **VoiceOver + Safari (iOS), added to the Home Screen.** The app opens at `/app` and Home renders.
11. **TalkBack, Android app (Capacitor build).** Same transfer journey; Share opens the system share sheet.

## Known limitations

- Native `<select>`'s open list can't be styled, by design (ADR 0004).
- The date field uses the browser's native picker, whose screen-reader quality varies by browser. A text-entry fallback (day / month / year fields, GOV.UK style) is the planned alternative if testing shows problems.

## Working alongside SGDS

The [Singapore Government Design System](https://www.designsystem.tech.gov.sg/) ships Lit web components with React wrappers (`@govtechsg/sgds-web-component/react`). This kit uses the same approach to accessibility: native elements first, WAI-ARIA Authoring Practices patterns, and tokens as CSS custom properties. Its components can sit beside SGDS ones, or its tokens can be mapped to SGDS tokens.
