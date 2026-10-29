# Spec: Clinic appointment booking (ClinicBook SG)

| | |
|---|---|
| **Status** | Built. Every acceptance criterion is covered by an automated test (right-hand column). |
| **Owner** | Front-end (design system team) |
| **Stakeholders** | Clinic operations (business), Product, UX design, Digital Services QA, Analytics |
| **Wireframes** | [docs/design/wireframes](../design/README.md#wireframes) |
| **Code** | `apps/demo/src/App.tsx`, tests in `apps/demo/e2e/booking.spec.ts` |

This shows how a business brief becomes a functional spec and then a development spec. The brief is in the stakeholders' words. Everything after it is what front-end agreed with them before building.

---

## 1. Business brief (as received)

> *"Patients phone the clinics to book, the lines are busy from 8 to 10 every morning, and about one in five calls is someone asking what to bring. We want people to book online on their phones, including our older patients who use screen readers or large text. Some of our sites have poor signal. We must not keep NRIC numbers we don't need."*
> — Head of Clinic Operations

## 2. Goals and how we measure them

| Goal | Metric | Source |
|---|---|---|
| Move bookings off the phone | Online bookings per week; booking completion rate (step 1 view → `form_submit`) | Adobe Analytics: `event12` ÷ `booking:details` page views |
| Find where people get stuck | Errors by step and field | `form_error` (`event13`) with `eVar10` = step |
| Cut "what do I bring" calls | FAQ opens | `accordion_toggle` with `prop6` = item |
| Inclusive | WCAG 2.2 AA, no critical findings in an Oobee scan or the manual screen-reader pass | CI + release checklist |

## 3. Questions we resolved with stakeholders

| Question | Answer | Effect on the build |
|---|---|---|
| Do we need the full NRIC? | Only to match the patient at the counter. The last 4 characters are enough. | Validate the full NRIC/FIN checksum client-side, **store only `*****567D`** (PDPA data minimisation) |
| What does "poor signal" mean? | Some sites have no signal at all inside the building. | PWA with an offline cache; bookings saved on the device; offline banner |
| How many clinics and slots? | 3 clinics now, about 4 fixed slots each. | Radio cards for clinics (all visible, big targets); native `<select>` for slots |
| Phone or desktop first? | About 80% phone in the existing web analytics. | Designed at 320px first; tested on a Pixel 7 viewport in CI |
| App stores? | Wanted next year. | Same build wrapped with Capacitor (ADR 0008); native share sheet now |
| Analytics before consent? | No. | Analytics adapters are disabled until the consent banner is accepted |

## 4. User stories and acceptance criteria

### US-1: Book an appointment

*As a patient, I want to book a clinic appointment on my phone so that I don't have to call during busy hours.*

| # | Given / When / Then | Verified by (e2e test) |
|---|---|---|
| 1.1 | **Given** valid details, clinic, date and time, **when** I confirm, **then** the booking appears under "My bookings" and a confirmation is shown and announced | `completes a booking and stores only a masked NRIC` |
| 1.2 | **Given** I confirm, **then** a dialog repeats the clinic, date and time, and focus starts on **Confirm** | same |
| 1.3 | **Then** only the masked NRIC is stored or shown after confirming | same (asserts `*****567D` present, `S1234567D` absent) |
| 1.4 | **Given** a confirmed booking, **when** I choose **Share**, **then** the native share sheet opens; where there is none, the details are copied and I'm told | `Share falls back to the clipboard where there is no share sheet (web)` |

### US-2: Fix mistakes easily

*As a patient who made a mistake, I want to be told exactly what is wrong and taken to it, so that I can fix it without hunting.*

| # | Given / When / Then | Verified by |
|---|---|---|
| 2.1 | **When** I continue with empty fields, **then** each field shows a specific message, focus moves to the first one, and a screen reader hears the count and the first message | `keyboard user: skip link first, then errors move focus and are announced` |
| 2.2 | **When** step 2 is incomplete, **then** the clinic group and time slot are marked invalid and focus goes to the first clinic | `step 2 errors: clinic group and time slot are flagged, focus goes to the first radio` |
| 2.3 | Messages say how to fix the problem ("Enter a valid NRIC or FIN, for example S1234567D"), not just that it's wrong | unit + e2e assertions on message text |

### US-3: Works for everyone

*As a patient using a screen reader, keyboard, or large text, I want to complete the same booking as anyone else.*

| # | Criterion | Verified by |
|---|---|---|
| 3.1 | No automated WCAG 2.2 A/AA violations, light and dark, including the open dialog | `passes WCAG 2.2 A/AA automated checks in light and dark mode`, plus the axe check inside 1.1 |
| 3.2 | No horizontal scrolling at 320px (400% zoom equivalent) | `reflows with no horizontal scrolling at 320px wide (WCAG 1.4.10)` |
| 3.3 | First Tab reaches "Skip to main content" | test in 2.1 |
| 3.4 | Focus is never hidden under the consent banner | `scroll-padding` set from the banner's height (WCAG 2.4.11); manual check |
| 3.5 | Manual NVDA / VoiceOver / TalkBack pass before release | [ACCESSIBILITY.md](../../ACCESSIBILITY.md#manual-screen-reader-checklist) |

### US-4: Works with no signal

*As a patient at a clinic with no signal, I want the app to open and let me book.*

| # | Criterion | Verified by |
|---|---|---|
| 4.1 | After one visit, the app reloads with the network off | `PWA: reloads and works offline once the service worker is installed` |
| 4.2 | An offline banner explains that bookings are saved on the device | same |

### US-5: Answer common questions

*As a patient, I want to know what to bring and the cancellation rules without calling.*

| # | Criterion | Verified by |
|---|---|---|
| 5.1 | FAQ is on the booking page; each question is a heading, expandable with keyboard, and ↑/↓ move between questions | `FAQ accordion: headings, expand state and arrow keys` |

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Accessibility | WCAG 2.2 AA (Singapore Digital Service Standards) |
| Browsers | Last 2 versions of Chrome, Edge, Safari, Firefox; iOS Safari 16+; Android Chrome |
| Performance | Library JS ≤ 7 kB brotli for all components (CI budget); LCP < 2.5 s on 4G |
| Privacy | No full NRIC stored; no analytics before consent; no form data leaves the device in the demo |
| Offline | App shell and booking work offline after first visit |
| Languages | English now. Strings are kept in components so the four official languages can be added (out of scope) |

## 6. Development spec (how it is built)

| Concern | Decision |
|---|---|
| Steps | `Tabs` with `activation="manual"`, controlled by form state. Users can move to any step with the tabs |
| Fields | `TextField` (name, NRIC, email, date), `RadioGroup variant="cards"` (clinic), `Select` (time slot) |
| Validation | One `validate(step, form)` function. **Continue** checks the current step; **Confirm booking** checks every step, so jumping ahead with the tabs can't skip validation. Messages as in §4 |
| Errors | `aria-invalid` + `aria-describedby` on each control; assertive announcement "N errors on this step. {first}."; focus to the first invalid control |
| Confirm | `Dialog` with `initialFocusRef` on Confirm; background `inert` |
| Success | `useToast` with a **Share** action (doesn't time out, WCAG 2.2.1) |
| Native | `src/native.ts` → `@capacitor/share` → Web Share API → clipboard |
| Offline | `vite-plugin-pwa` (Workbox precache); `navigator.onLine` banner via `Alert tone="warning"` |
| Persistence | `localStorage` with try/catch (private mode and blocked storage keep working in memory) |
| Analytics | Events below, through `AnalyticsProvider` gated on consent |

## 7. Analytics tracking plan

Agreed with the analytics team. Code: `ADOBE_VARIABLES` / `ADOBE_EVENTS` in `apps/demo/src/App.tsx`.

| Event (`track`) | When | Properties | Adobe Analytics |
|---|---|---|---|
| *page view* (`page`) | Each step shown | `booking:details`, `booking:clinic`, `booking:review` | `pageName`; `s.t()` / Web SDK page event |
| `button_click` | Continue / Confirm pressed | `component`, `id` (`step-details-next`, `step-clinic-next`, `confirm-booking`) | `eVar5` = component, `prop3` = id; custom link `o` |
| `tab_change` | Step tab selected | `component`, `tab` | `eVar5`, `prop5` |
| `form_error` | Continue / submit with errors | `component`, `step`, `count` | `event13`; `eVar10` = step |
| `form_submit` | Booking confirmed | `component`, `clinic`, `offline` | `event12`; `eVar11` = clinic |
| `accordion_toggle` | FAQ item opened or closed | `component`, `item`, `expanded` | `eVar5`, `prop6` = item |

Rules: no personal data in any property (no names, NRIC or email); event names are `snake_case` verbs; new events are added here first, then in code.

## 8. Out of scope (this release)

Login (Singpass), real availability API, cancellation flow, payment, translations, iOS build.
