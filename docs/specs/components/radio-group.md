# Component spec: `RadioGroup` / `Radio`

**Status:** Implemented in 0.2.0 · **Code:** `packages/ui/src/components/RadioGroup.tsx` · **Stories:** Forms › RadioGroup · **Used in:** Orchid Bank › Settings (market, appearance, banking tier)

## 1. Purpose

Let people choose **exactly one** of a few (2 to about 7) options they should see side by side: a market, a theme, the account to pay from.

Don't use it:
- for more than about 7 options, or options people don't need to compare at a glance → `Select`
- for on/off settings that apply immediately → `Switch`
- for "choose any number" → a `Checkbox` list

## 2. Evidence

Orchid Bank's Settings page needs three single choices, each where the option's detail matters ("HKD · FPS 轉數快", "Navy and champagne gold"). Before this component, teams hand-built bordered radios with their own CSS, and the next teams would have copied that markup along with its missing error wiring.

## 3. Anatomy

```
┌ fieldset.kit-radio-group ─────────────────────────────┐
│ legend.kit-field__label        Market and language    │
│ p.kit-field__hint              Sets the language, …   │
│ ┌ .kit-radio (card) ────────────────────────────────┐ │
│ │ (●) input.kit-radio__input  label  香港 · 繁體中文 │ │
│ │                             span.kit-radio__desc  │ │
│ └───────────────────────────────────────────────────┘ │
│ p.kit-field__error             ⚠ Choose a market      │
└───────────────────────────────────────────────────────┘
```

## 4. Variants and states

| | Unselected | Selected | Focus | Disabled option | Group error |
|---|---|---|---|---|---|
| `plain` | native radio, accent `--kit-primary` | filled | 3px `--kit-focus` ring, 2px offset | 60% opacity, skipped by arrows | message below, `aria-invalid` on the group |
| `cards` | 2px `--kit-border` box | 2px `--kit-primary` border + inset | ring on the radio | 60% | all card borders `--kit-danger` |

The whole card is the click target (a label overlay). The radio input sits above the overlay, so direct hits work too.

## 5. API

```tsx
<RadioGroup legend="Market and language" name="market" variant="cards" value={market} onValueChange={setMarket}>
  <Radio value="HK" label={<span lang="zh-HK">香港 · 繁體中文</span>} description="HKD · FPS 轉數快" />
</RadioGroup>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `legend` | `string` | required | The group's accessible name |
| `name` | `string` | required | Native `name`; used for form submission and the arrow-key group |
| `value` / `defaultValue` / `onValueChange` | `string` | `''` | Controlled or uncontrolled (`useControllableState`) |
| `hint`, `error` | `string` | | Joined in the group's `aria-describedby` |
| `required`, `disabled` | `boolean` | | `required` on each radio + `aria-required` on the group |
| `variant` | `'plain' \| 'cards'` | `'plain'` | |
| `Radio.label` | `ReactNode` | required | Accessible name. Mark other-language labels with `lang` so screen readers switch voice |
| `Radio.description` | `ReactNode` | | Accessible *description*: outside the label, so it isn't part of the name |

## 6. Accessibility

- **Pattern:** native `input[type=radio]` in `<fieldset role="radiogroup">` ([ADR 0004](../../adr/0004-native-elements-first.md)). `role="radiogroup"` is allowed on `fieldset` by ARIA in HTML, and lets `aria-invalid` / `aria-required` apply to the group.
- **Keyboard** (native):

  | Key | Action |
  |---|---|
  | Tab / Shift+Tab | Into the group (selected radio, or first) and out |
  | ↑ ↓ ← → | Move **and select**; disabled options are skipped |
  | Space | Select the focused radio |

- **Announcements:** NVDA reads "Market and language, grouping, Sets the language, currency and payment network. Singapore · English, radio button, checked, 1 of 5, SGD · PayNow".
- **WCAG:** 1.3.1 (fieldset/legend), 3.1.2 Language of Parts (`lang` on labels), 3.3.1 + 3.3.2 (error and hint text), 4.1.2, 2.5.8 (24px input; cards ≥ 44px tall), 1.4.11 (border 3.2:1).

## 7. Content

The legend is a noun phrase ("Market and language"). Errors start with a verb ("Choose a market"). Descriptions are short and factual ("HKD · FPS 轉數快").

## 8. Analytics

None by default: making a choice is not an outcome. Apps track the result, for example a market change as a page-view property.

## 9. Test plan

| Layer | Cases | Where |
|---|---|---|
| Unit | named + described group; shared `name`; description not in the name; arrows select; uncontrolled `defaultValue`; helpful error outside a group; axe in error state | `src/forms.test.tsx` |
| Browser | 24px target; contrast in every brand and theme | `src/components.browser.test.tsx`, Storybook audit |
| E2E | Settings: choosing Dark, Private and Indonesia re-themes and re-localises the app | `apps/bank/e2e/bank.spec.ts` |

## 10. Decisions made during review

- *Should the description be part of the label?* No. Testing showed the name became "Jurong West Medical Centre West", which is noisy in the radio list and breaks `getByRole` queries. It is now `aria-describedby`.
- *Custom roving-tabindex radios?* No. Native radios already behave correctly, including in forced-colours mode.
- *Card overlay hiding the input?* Found in e2e: the label overlay sat above the radio, so direct clicks hit the label. The input now sits above it (`z-index: 1`).
