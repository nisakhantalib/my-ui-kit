# Design

How Orchid Bank and My UI Kit look, and why. Low-fidelity wireframes came first; the high-fidelity result is the live app and Storybook.

## What the research said

Patterns that the best banking apps share, and how this design answers each:

| Finding | Source | Here |
|---|---|---|
| The balance is the largest element; card grouping, generous whitespace, restrained colour | [Lollypop 2026](https://lollypop.design/blog/2026/june/banking-app-ui-design/), [theskinsfactory](https://www.theskinsfactory.com/uiux-design-blog/fintech-ui-ux-design) | 48px balance on a brand-surface card; white cards on a calm surface canvas |
| Trust comes from predictable states: status, fees upfront, clear confirmations | [eleken](https://www.eleken.co/blog-posts/trusted-fintech-ui-examples) | Pending/Posted badges, "Fee: Free" on review, receipt with reference number |
| Shortcuts on the home screen (DBS Simple Mode shows six; OCBC lets you choose) | [DBS](https://dbs.com.sg/i-bank/deposits/bank-with-ease/simple-mode), [OCBC](https://ocbc.com/personal-banking/digital-banking/app/home) | Six quick actions, each going somewhere real |
| Transaction lists built for scanning; category icons say more than merchant logos | [Revolut](https://www.revolut.com/en-US/blog/post/you-can-now-search-for-your-transactions/), [Monzo community](https://community.monzo.com/t/abandon-merchant-logos/49842) | Category icon + merchant + category + amount, grouped by day, searchable |
| Card management: visual card, instant freeze, limits | [Gummble 2026](https://gummble.com/blog/best-finance-app-designs-2026) | Cards page: freeze is a Switch (applies instantly), usage bar, report-lost alert dialog |
| Calm, precise web banking (Mercury), Stripe-grade tables | [AdminLTE 2026](https://adminlte.io/blog/fintech-dashboard-design-examples/) | Sidebar layout, tabular figures, sortable DataTable view |
| Premium tiers get their own look (priority / private banking) | common practice | **Private** brand: navy and champagne gold, same components |

## Design principles

1. **Numbers first.** Money is the content: tabular figures, the balance largest, everything else quieter.
2. **Calm builds trust.** One accent colour, white cards on a soft canvas, no decoration that needs explaining.
3. **Every state is designed.** Loading (skeletons with `aria-busy`), empty, error, frozen, blocked, hidden balances, offline.
4. **Native on every screen size.** Sidebar from 1024px; a bottom tab bar on phones, clear of the home indicator.
5. **Same in every mode.** Light, dark, forced colours, 200% zoom, 320px, three brands and three languages are designed states, not afterthoughts.
6. **Tokens or it didn't happen.** Every colour, radius and height comes from `packages/ui/tokens/`, and the build checks every contrast pair.

## Wireframes

Low fidelity, to agree flow and hierarchy before visual design. Generated from [`wireframes/generate.py`](wireframes/generate.py) so they stay editable and diffable.

### Phone (designed first)

![Three phone screens: Home with balance and quick actions, Pay review with OTP approval, Cards with controls](wireframes/bank-mobile.svg)

### Desktop

![Desktop Home with sidebar navigation, balance card, quick actions, recent activity, spending donut and upcoming bills](wireframes/bank-desktop.svg)

### From wireframe to build

| Wireframe decision | Implemented as |
|---|---|
| Balance card with trend | `.hero-card` on `--kit-brand-surface` tokens + decorative `Sparkline`; the change is stated in text |
| Quick actions | links (not buttons): each goes to a page, a deep link (`#/pay?to=…&amount=…`) or a filter |
| Masked account numbers | `MaskedValue` |
| Payee search | `Combobox` (APG), plus one-tap recent payees (`aria-pressed`) |
| Amount | `AmountInput`, integer minor units, locale-aware |
| OTP approval | `Dialog` + `OTPInput` (single input, `autocomplete="one-time-code"`) |
| Freeze card | `Switch`; report lost: `Dialog role="alertdialog"` with focus on Cancel |
| Transactions | grouped list, or `DataTable` view; CSV export |
| Spending | SVG donut (`role="img"` + summary) with a legend in text and a table toggle |

## Visual language

| Foundation | Orchid (personal) | Private | Rationale |
|---|---|---|---|
| **Primary** | violet `#6a1fb0` | navy `#1b2f6b` (gold in dark) | Distinctive in a market of reds and blues; ≥ 4.5:1 on white and surface |
| **Accent** | magenta `#c0267a` | champagne gold `#8c6a20` | Used sparingly: gradients, top chart segment |
| **Brand surface** | violet → magenta | navy → indigo | Stays saturated in dark mode (its own token, unlike `primary`) |
| **Canvas / cards** | `#f8f6fb` / white | `#f5f6f9` / white | Cards lift off a soft canvas without heavy shadows |
| **Type** | Inter Variable, tabular figures for money | same | Clear digits; `cv11` / `ss01` for an open, friendly feel |
| **Shape** | 14px radius, pill buttons, 20px cards | 8px radius, 6px buttons | Orchid feels approachable; Private feels formal |
| **Targets** | 48px controls, 44px icon buttons | same | Above WCAG 2.5.8's 24px; matches platform guidance |
| **Motion** | 150–350ms fades and shimmer | same | Removed under `prefers-reduced-motion` |

Every text pair is ≥ 4.5:1 and every UI and focus pair ≥ 3:1, in every brand and mode. That is 120 checks, all enforced by `npm run tokens`.

## Layout

- **≥ 1024px:** fixed 256px sidebar, sticky 64px top bar, content up to 1152px, two columns on Home (`xl:grid-cols-[minmax(0,1fr)_360px]`).
- **< 1024px:** compact top bar plus a bottom tab bar with a raised Pay action; `env(safe-area-inset-bottom)` padding.
- **Every grid column is `minmax(0,1fr)`**, so wide content (tables, carousels) scrolls inside its card instead of widening the page: no sideways scroll at 320px, tested on every page.
- `scroll-padding-top` / `-bottom` keep focused content clear of both bars (WCAG 2.4.11).

## Handoff with design tools

The token files use the W3C Design Tokens format, which Tokens Studio for Figma imports directly. A designer changes a colour in Figma and exports the JSON; a developer runs `npm run tokens`; review sees the new value and its measured contrast in one diff. If it fails contrast, the build says exactly which pair and by how much.
