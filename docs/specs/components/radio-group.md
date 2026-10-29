# Component spec: `RadioGroup` / `Radio`

**Status:** Implemented in 0.2.0 · **Code:** `packages/ui/src/components/RadioGroup.tsx` · **Stories:** Forms › RadioGroup

## 1. Purpose

Let people choose **exactly one** of a few (2 to about 7) options that they should see side by side, for example a clinic or a contact method.

Don't use it:
- for more than about 7 options, or options people can't compare at a glance → `Select`
- for on/off settings that apply immediately → `Switch`
- for "choose any number" → `Checkbox` list

## 2. Evidence

The booking flow (US-1) needs a clinic choice where the region matters. Before this, the demo app hand-built bordered radios with Tailwind; the next two services would have copied that markup and its missing error wiring.

## 3. Anatomy

```
┌ fieldset.kit-radio-group ─────────────────────────────┐
│ legend.kit-field__label        Clinic *               │
│ p.kit-field__hint              Pick the one nearest…  │
│ ┌ .kit-radio (card) ────────────────────────────────┐ │
│ │ (●) input.kit-radio__input  label  Tampines…      │ │
│ │                             span.kit-radio__desc  │ │
│ └───────────────────────────────────────────────────┘ │
│ p.kit-field__error             ⚠ Choose a clinic      │
└───────────────────────────────────────────────────────┘
```

## 4. Variants and states

| | Unselected | Selected | Focus | Disabled option | Group error |
|---|---|---|---|---|---|
| `plain` | native radio, accent `--kit-primary` | filled | 3px `--kit-focus` ring, 2px offset | 60% opacity, skipped by arrows | message below, `aria-invalid` on the group |
| `cards` | 2px `--kit-border` box | 2px `--kit-primary` border + inset | ring on the radio | 60% | all card borders `--kit-danger` |

The whole card is the click target (label overlay); the radio input sits above the overlay so direct hits work too.

## 5. API

```tsx
<RadioGroup legend="Clinic" name="clinic" value={clinic} onValueChange={setClinic} error={err} variant="cards" required>
  <Radio value="tampines" label="Tampines Family Clinic" description="East region" />
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
| `Radio.label` | `ReactNode` | required | Accessible name |
| `Radio.description` | `ReactNode` | | Accessible *description*: outside the label, so it isn't part of the name |

## 6. Accessibility

- **Pattern:** native `input[type=radio]` in `<fieldset role="radiogroup">` ([ADR 0004](../../adr/0004-native-elements-first.md)). `role="radiogroup"` is allowed on `fieldset` by ARIA in HTML, and lets `aria-invalid` / `aria-required` apply to the group.
- **Keyboard** (native):

  | Key | Action |
  |---|---|
  | Tab / Shift+Tab | Into the group (selected radio, or first) and out |
  | ↑ ↓ ← → | Move **and select**; disabled options are skipped |
  | Space | Select the focused radio |

- **Announcements:** NVDA reads "Clinic, grouping, required, Pick the one nearest you. Tampines Family Clinic, radio button, not checked, 1 of 3, East region."
- **WCAG:** 1.3.1 (fieldset/legend), 3.3.1 + 3.3.2 (error and hint text), 4.1.2, 2.5.8 (24px input; cards ≥ 44px tall), 1.4.11 (border 3.2:1).

## 7. Content

Legend is a noun ("Clinic"). Error starts with a verb: "Choose a clinic". Descriptions are short and factual ("East region", "Fully booked").

## 8. Analytics

None by default: choosing an option is not an outcome. Apps track the submitted value (`form_submit.clinic`).

## 9. Test plan

| Layer | Cases | Where |
|---|---|---|
| Unit | named + described group; shared `name`; description not in the name; arrows select; uncontrolled `defaultValue`; helpful error outside a group; axe in error state | `src/forms.test.tsx` |
| Browser | 24px target; contrast in both themes | `src/components.browser.test.tsx` |
| Story audit | `Forms/RadioGroup` (cards + plain-with-error), light + dark | `scripts/storybook-a11y.mjs` |
| E2E | step 2 error focuses the first radio; booking selects by role + name | `apps/demo/e2e/booking.spec.ts` |

## 10. Decisions made during review

- *Should the description be part of the label?* No. Testing showed the name became "Jurong West Medical Centre West", which is noisy in the radio list and breaks `getByRole` queries. It is now `aria-describedby`.
- *Custom roving-tabindex radios?* No. Native radios already behave correctly, including in forced-colours mode.
