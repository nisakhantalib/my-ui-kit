# Spec: Instant transfer (Orchid Bank)

| | |
|---|---|
| **Status** | Built. Every criterion below maps to an automated test in `apps/bank/e2e/bank.spec.ts`. |
| **Stakeholders** | Retail digital banking (product owner), Payments ops, Fraud & risk, Compliance, Design, Market teams (SG, HK, TW, ID, IN), Accessibility |
| **Code** | `apps/bank/src/Pay.tsx`; shared components `Combobox`, `AmountInput`, `OTPInput`, `ErrorSummary`, `Dialog` |
| **Bank** | Orchid Bank is fictional. The requirements are typical of a regional retail bank. |

## 1. Brief (as received)

> *"One transfer journey for all five markets, on the same component library, in the local language, currency and payment rail. Customers must never send the wrong amount, never exceed their limits, and must approve with a one-time code. It has to work with screen readers and on a phone. Security says: no inline scripts, nothing from third-party domains."*
> — Head of Digital Retail, with Payments and Security

## 2. Questions resolved before building

| Question | Answer | Effect on the build |
|---|---|---|
| How are amounts represented? | Integers in minor units, like the core banking API | `AmountInput` emits minor units. Parsing is string-based, so no floating-point maths. Rupiah has no decimals |
| What's the daily limit? | Per market (SGD 5,000 equivalent; ID and IN lower) | Validated client-side before review. The server stays the authority (out of scope here) |
| Which payment rail is named? | The local one | PayNow (SG), FPS 轉數快 (HK), 即時轉帳 (TW), BI-FAST (ID), UPI (IN), from market config |
| How do customers approve? | SMS OTP, with resend after 30s | `OTPInput`: one field with `autocomplete="one-time-code"` so the phone can fill it |
| What about shared screens? | Account numbers masked by default; option to hide all balances | `MaskedValue`, plus a "Hide balances" switch that is remembered |
| CSP? | `script-src 'self'; style-src 'self'`, nothing third-party | No inline styles in the kit; assets are never inlined as `data:`; tested |
| Languages? | English, Traditional Chinese, Bahasa Indonesia | The kit translates its own words (`KitProvider`); the app owns its copy |

## 3. Acceptance criteria

### US-1: Send money

*As a customer, I want to send money to a saved payee instantly, so that I can pay someone without a branch visit.*

| # | Given / When / Then | Test |
|---|---|---|
| 1.1 | **Given** a saved payee, **when** I type part of their name, **then** matching payees are listed, the count is announced, and I can choose one with ↓ and Enter | `transfer: payee by keyboard, …` |
| 1.2 | **When** I continue with a valid amount, **then** I see a review with the payee, account, amount, rail and fee, and focus moves to its heading | same |
| 1.3 | **When** I confirm, **then** an approval dialog asks for the code; the code field is focused and can be filled by the phone | same |
| 1.4 | **Given** a wrong code, **then** I'm told what to do and can retry; **given** the right code, **then** I see a receipt with a reference number, and focus moves to "Transfer sent" | same |
| 1.5 | **Then** the account balance and transaction list are updated | same |

### US-2: Never send the wrong amount

| # | Criterion | Test |
|---|---|---|
| 2.1 | Continuing with missing details shows an error summary that takes focus; each link moves focus to the field | `validation: summary takes focus, …` |
| 2.2 | An amount above the available balance is refused, with the balance in the message | same |
| 2.3 | An amount above the daily limit is refused, with the limit in the message | same |
| 2.4 | Amounts are exact: "19.99" is 1999 cents; "12.345" in SGD is invalid; select-all and retype replaces the amount | `AmountInput` unit tests (`banking.test.tsx`) |

### US-3: My market, my language

| # | Criterion | Test |
|---|---|---|
| 3.1 | In Indonesia, amounts have no decimals, use "." for thousands, and the page is in Bahasa with BI-FAST named | `markets: Indonesian rupiah …` |
| 3.2 | In Hong Kong, the page is in Traditional Chinese, `lang="zh-HK"`, and still passes WCAG 2.2 AA | `overview passes WCAG 2.2 A/AA …` |

### US-4: Privacy on a shared screen

| # | Criterion | Test |
|---|---|---|
| 4.1 | Account numbers show the last 4 digits only; screen readers hear "account number ending 6789"; a pressed toggle reveals them | `account numbers are masked …` |
| 4.2 | "Hide balances" hides every amount, for sighted and screen-reader users alike, and is remembered | `hide balances: …` |

### US-5: Accessible, secure, fast

| # | Criterion | Test |
|---|---|---|
| 5.1 | WCAG 2.2 A/AA (axe) on overview and transfer, light and dark, including the open OTP dialog | `overview passes …`, `transfer: …` |
| 5.2 | No horizontal scroll at 320px on any page (WCAG 1.4.10) | `reflows at 320px …` |
| 5.3 | Focus is never hidden behind the sticky header (WCAG 2.4.11) | header sticky only from 640px, `scroll-padding-top`; checked in the phone screenshots |
| 5.4 | Zero CSP violations under the production policy | `runs under a strict Content-Security-Policy …` |
| 5.5 | Lighthouse: accessibility 100, best practices ≥ 95, performance ≥ 90, LCP ≤ 2.5s, CLS ≤ 0.1 | `apps/bank/lighthouserc.json` in CI |
| 5.6 | No unintended visual change | visual regression job (pinned Linux image) |

## 4. Analytics

| Event | When | Properties |
|---|---|---|
| page view | route change | `bank:overview`, `bank:pay`; `market` |
| `button_click` | Continue / Confirm | `id`: `transfer-continue`, `transfer-confirm`, `hero-pay` |
| `form_error` | Continue with errors | `component: TransferForm`, `count` |
| `form_submit` | Transfer approved | `component: TransferForm`, `market` |

No amounts, names or account numbers in analytics.

## 5. Out of scope

Real authentication (Singpass / biometrics), the payments API and server-side limit checks, scheduled and recurring transfers, adding new payees, foreign-currency transfers.
