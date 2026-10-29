# Accessibility

**Target:** WCAG 2.2 Level A and AA.
This covers Singapore's Digital Service Standards (DSS), which require WCAG Levels A and AA for government digital services.

## How it is checked

| Layer | Tool | Runs | Catches |
|---|---|---|---|
| Component, jsdom | Vitest + Testing Library + axe-core | every push | missing names, roles, ARIA misuse, label/description wiring |
| Component, real Chromium | Vitest Browser Mode + axe-core (WCAG 2.0–2.2 A/AA tags) | every push | **colour contrast**, visible focus, real keyboard focus, target size |
| Whole app | Playwright + @axe-core/playwright, desktop + Pixel 7 | every push | light and dark mode, 320px reflow, full booking flow, offline PWA |
| Before release | [Oobee](https://github.com/GovTechSG/oobee) (GovTech Singapore) | manual | site-wide crawl report, DSS-mapped findings |
| Before release | NVDA + Chrome, VoiceOver + Safari (iOS), TalkBack | manual | what automated tools cannot judge: reading order, announcements, sense |

Automated tools find roughly a third of WCAG issues. The manual screen-reader pass is required.

## Success criteria by component

| Component | WCAG 2.2 criteria it handles |
|---|---|
| `Button` | 4.1.2 Name, Role, Value (`aria-busy`, `aria-disabled` keeps it discoverable) · 2.4.7 Focus Visible · 2.5.8 Target Size (44px, minimum is 24px) |
| `TextField` | 1.3.1 Info and Relationships (label `for`, hint + error in `aria-describedby`) · 3.3.1 Error Identification (`aria-invalid` + text) · 3.3.2 Labels or Instructions · 4.1.3 Status Messages (error live region) |
| `Tabs` | 2.1.1 Keyboard (←/→, Home, End) · 4.1.2 (`tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`) · 2.4.3 Focus Order (roving tabindex) |
| `Dialog` | 2.1.2 No Keyboard Trap (Escape always exits) · 2.4.3 Focus Order (focus in, returned to trigger) · background made `inert` so assistive tech cannot reach it |
| `AnnouncerProvider` | 4.1.3 Status Messages (polite + assertive live regions) |
| `SkipLink` | 2.4.1 Bypass Blocks |
| Styles | 1.4.3 Contrast (≥ 4.5:1 text, light and dark) · 1.4.11 Non-text Contrast · 2.3.3 Animation from Interactions (`prefers-reduced-motion`) · forced-colours (Windows High Contrast) |
| Demo app | 1.4.10 Reflow (no sideways scroll at 320px, tested) · 2.4.11 Focus Not Obscured (scroll padding under the consent banner) · 3.3.1 errors summarised and announced, focus moved to first error |

## Manual screen-reader checklist

1. **NVDA + Chrome (Windows).** Tab through the booking form. Each field reads its label, "required", and the hint.
2. **Submit step 1 empty.** You hear "3 errors on this step. Enter your full name." Focus lands on Full name.
3. **Arrow through the step tabs.** You hear "tab, 2 of 3", selected or not selected.
4. **Open the Confirm dialog.** You hear the title and description. Tab cannot leave the dialog, and the virtual cursor cannot reach the page behind it. Escape returns focus to "Confirm booking".
5. **VoiceOver + Safari (iOS), installed as a PWA, airplane mode on.** A booking still saves.

## Working alongside SGDS

The [Singapore Government Design System](https://www.designsystem.tech.gov.sg/) ships Lit web components with React wrappers (`@govtechsg/sgds-web-component/react`). This kit uses the same approach to accessibility: native elements first, WAI-ARIA Authoring Practices patterns, and tokens as CSS custom properties. Its components can sit beside SGDS ones, or its tokens can be mapped to SGDS tokens.
