# Accessibility

**Target:** WCAG 2.2 Level A and AA.
This covers Singapore's Digital Service Standards (DSS), which require WCAG Levels A and AA for government digital services.

## How it is checked

| Layer | Tool | Runs | Catches |
|---|---|---|---|
| Component, jsdom | Vitest + Testing Library + axe-core | every push | missing names, roles, ARIA misuse, label/description wiring |
| Component, real Chromium | Vitest Browser Mode + axe-core (WCAG 2.0–2.2 A/AA tags) | every push | **colour contrast**, focus-ring contrast (≥ 3:1, measured in both themes), real keyboard focus, target size |
| Every Storybook story | built Storybook + axe-core, light **and** dark | every push | every documented state of every component; new stories are covered automatically |
| Lint | eslint-plugin-jsx-a11y (strict) | every push, and in the editor | static mistakes: missing alt, invalid ARIA, non-interactive handlers |
| Whole app | Playwright + @axe-core/playwright, desktop + Pixel 7 | every push | light and dark mode, 320px reflow, full booking flow, offline PWA |
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
| Demo app | 1.4.10 Reflow (no sideways scroll at 320px, tested) · 2.4.11 Focus Not Obscured (scroll padding under the consent banner) · 3.3.1 errors summarised and announced, focus moved to first error |

## Manual screen-reader checklist

1. **NVDA + Chrome (Windows).** Tab through the booking form. Each field reads its label, "required", and the hint.
2. **Submit step 1 empty.** You hear "3 errors on this step. Enter your full name." Focus lands on Full name.
3. **Arrow through the step tabs.** You hear "tab, 2 of 3", selected or not selected.
4. **Open the Confirm dialog.** You hear the title and description. Tab cannot leave the dialog, and the virtual cursor cannot reach the page behind it. Escape returns focus to "Confirm booking".
5. **Step 2, choose nothing, Continue.** You hear "3 errors on this step. Choose a clinic." Focus is on the first clinic, which reads "Tampines Family Clinic, radio button, not checked, 1 of 3, East region".
6. **Confirm a booking.** The toast is read once: "Booking confirmed. Toa Payoh Health Hub on … at 2:00 pm." Focus stays where it was; Tab reaches the Share button.
7. **FAQ.** Jump by heading (H in NVDA browse mode) to "What should I bring?". Enter expands it and you hear "expanded".
8. **VoiceOver + Safari (iOS), installed as a PWA, airplane mode on.** A booking still saves and the offline banner is read.
9. **TalkBack, Android app (Capacitor build).** Same flow; Share opens the system share sheet.

## Known limitations

- Native `<select>`'s open list can't be styled, by design (ADR 0004).
- The date field uses the browser's native picker, whose screen-reader quality varies by browser. A text-entry fallback (day / month / year fields, GOV.UK style) is the planned alternative if testing shows problems.

## Working alongside SGDS

The [Singapore Government Design System](https://www.designsystem.tech.gov.sg/) ships Lit web components with React wrappers (`@govtechsg/sgds-web-component/react`). This kit uses the same approach to accessibility: native elements first, WAI-ARIA Authoring Practices patterns, and tokens as CSS custom properties. Its components can sit beside SGDS ones, or its tokens can be mapped to SGDS tokens.
