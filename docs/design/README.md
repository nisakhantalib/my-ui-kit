# Design

How Orchid Bank and My UI Kit look, and why. Low-fidelity wireframes came first; the high-fidelity result is the live app and Storybook.

## What the research said

Patterns that the best banking apps share, and how this design answers each:

| Finding | Source | Here |
|---|---|---|
| The balance is the largest element; card grouping, generous whitespace, restrained colour | [Lollypop 2026](https://lollypop.design/blog/2026/june/banking-app-ui-design/), [theskinsfactory](https://www.theskinsfactory.com/uiux-design-blog/fintech-ui-ux-design) | 52px balance with raised cents; white cards on a calm surface canvas |
| Trust comes from predictable states: status, fees upfront, clear confirmations | [eleken](https://www.eleken.co/blog-posts/trusted-fintech-ui-examples) | Pending/Posted badges, "Fee: Free" on review, receipt with reference number |
| Shortcuts on the home screen (DBS Simple Mode shows six; OCBC lets you choose) | [DBS](https://dbs.com.sg/i-bank/deposits/bank-with-ease/simple-mode), [OCBC](https://ocbc.com/personal-banking/digital-banking/app/home) | Five action chips, each going somewhere real |
| Transaction lists built for scanning; category icons say more than merchant logos | [Revolut](https://www.revolut.com/en-US/blog/post/you-can-now-search-for-your-transactions/), [Monzo community](https://community.monzo.com/t/abandon-merchant-logos/49842) | Category icon + merchant + category + amount, grouped by day, searchable |
| Card management: visual card, instant freeze, limits | [Gummble 2026](https://gummble.com/blog/best-finance-app-designs-2026) | Cards page: freeze is a Switch (applies instantly), usage bar, report-lost alert dialog |
| Calm, precise web banking (Mercury), Stripe-grade tables | [AdminLTE 2026](https://adminlte.io/blog/fintech-dashboard-design-examples/) | Sidebar layout, tabular figures, sortable DataTable view |
| Premium tiers get their own look (priority / private banking) | common practice | **Private** brand: navy and champagne gold, same components |

### Five reference products, and what was taken from each

Patterns only: no branding, copy or assets were reused.

| Product | Pattern | Here |
|---|---|---|
| [Mercury](https://mercury.com) | ⌘K search; action chips under the greeting; a balance with small raised cents; an interactive balance chart with a period switch and money in/out; a credit widget with one stacked bar | `CommandPalette` (APG combobox), chips, kit `Money`, `AreaChart` (an ARIA slider over the days, plus a table view), `RadioGroup variant="segmented"`, credit widget |
| [Revolut](https://revolut.com) | The balance as the hero; glass cards on a saturated brand panel | 52px balance; frosted preview on the sign-in brand panel |
| [Wise](https://wise.com) | Transfer review as a timeline: you send, fee, they receive, arrives | `.review-steps` on the review step, total debit stated |
| [Monzo](https://monzo.com) | Savings pots with progress; tap a transaction for a details sheet | Savings goals; `Dialog placement="sheet"` from any transaction row or search result |
| [Ramp](https://ramp.com) | Hairline borders, quiet canvas, dense tabular figures | Hairline chips and cards, tabular numerals everywhere |
| All five | A polished sign-in landing | Split brand panel + market picker + one "View demo account" button |

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
| Balance with trend | white card, kit `Money`, `AreaChart` with a period switch and a table toggle; the change is stated in text |
| Quick actions | chips in a labelled `nav`; links (not buttons), each to a page or a deep link (`#/pay?to=…&amount=…`) |
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
| **Direction** | "Intaglio": what banks print. Banknote and cheque engraving (guilloché) is the one signature | private banking | Chosen from three directions (Intaglio, Harbour, Daylight), each mocked up before building |
| **Primary** | treasury green `#0b3d36` (mint in dark) | navy `#1b2f6b` (gold in dark) | Primary buttons and the brand surface share one deep green; ≥ 4.5:1 on white and paper |
| **Accent** | jade `#087a66` for links and gains; mint `#7fd8c1` on the brand surface (`brand-accent`) | champagne gold `#8c6a20` | Links stay recognisable; gains read green without a second hue |
| **Brand surface** | treasury `#0b3d36` → `#082a2f`, with the `Guilloche` rosette | navy → indigo | Account cards, the balance-over-time panel, the payment summary and sign-in; stays dark in dark mode |
| **Canvas / cards** | paper `#eef1ee` / white (dark: `#0b1215` / `#131c20`) | `#f5f6f9` / white | A cool, slightly green paper canvas; white cards with a two-layer shadow |
| **Data colour** | 5 validated categorical hues (blue, orange, aqua, yellow, magenta), each category always the same hue | same | Distinct for colour-blind readers on adjacent segments; never the only cue (legend text, table view) |
| **Type** | Archivo (display, set at 112–122% width), Hanken Grotesk (text), IBM Plex Mono (account numbers) | Inter Variable | Wide display figures look minted; numbers set like banknote serials. Tokens: `--kit-font-display`, `--kit-font`, `--kit-font-mono` |
| **Shape** | 12px radius and buttons, 20px cards, pill chips, card-shaped accounts | 8px radius, 6px buttons | Accounts are drawn as a stack of cards (wallet-style); Private a step more formal |
| **Targets** | 48px controls, 44px icon buttons | same | Above WCAG 2.5.8's 24px; matches platform guidance |
| **Motion** | One entrance (the engraving draws in, the total counts up, panels rise in sequence), one celebration (payment sent), 150–350ms elsewhere | same | Removed under `prefers-reduced-motion` |

Every text pair is ≥ 4.5:1 and every UI and focus pair ≥ 3:1, in every brand and mode. That is 138 checks, all enforced by `npm run tokens`.

## Layout

- **≥ 1024px:** fixed 256px sidebar, sticky 64px top bar, content up to 1152px, two columns on Home (`xl:grid-cols-[minmax(0,1fr)_360px]`).
- **< 1024px:** compact top bar plus a bottom tab bar with a raised Pay action; `env(safe-area-inset-bottom)` padding.
- **Every grid column is `minmax(0,1fr)`**, so wide content (tables, carousels) scrolls inside its card instead of widening the page: no sideways scroll at 320px, tested on every page.
- `scroll-padding-top` / `-bottom` keep focused content clear of both bars (WCAG 2.4.11).

## Handoff with design tools

The token files use the W3C Design Tokens format, which Tokens Studio for Figma imports directly. A designer changes a colour in Figma and exports the JSON; a developer runs `npm run tokens`; review sees the new value and its measured contrast in one diff. If it fails contrast, the build says exactly which pair and by how much.
