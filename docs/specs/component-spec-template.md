# Component spec: `<Name>`

> Copy to `docs/specs/components/<name>.md`. Fill it in with design and at least one consumer team **before** writing code. Sections marked * are required.

## 1. Purpose *

One sentence: what user problem does it solve? When should teams **not** use it (and what should they use instead)?

## 2. Evidence

Who asked, how many products need it, research or analytics. Link the issue.

## 3. Anatomy *

Labelled sketch or Figma frame. Name each part; these become the BEM elements (`kit-name__part`).

## 4. Variants and states *

| | Default | Hover | Focus | Active / selected | Disabled | Error | Loading |
|---|---|---|---|---|---|---|---|
| Variant A | | | | | | | |

Include light **and** dark, and the 320px layout.

## 5. API *

```tsx
<Name value={…} onValueChange={…} />
```

| Prop | Type | Default | Notes |
|---|---|---|---|

Check it against the API conventions in CONTRIBUTING.md (native props extended, ref forwarded, controlled/uncontrolled, string-union variants).

## 6. Accessibility *

- **Pattern:** native element / APG pattern name + link
- **Role, name, description, state:** where each comes from
- **Keyboard:**

  | Key | Action |
  |---|---|

- **Announcements:** what a screen reader says on entry and on change
- **WCAG criteria:** e.g. 1.3.1, 2.1.1, 2.4.7, 2.5.8, 4.1.2
- **Contrast and target size:** which tokens; minimum sizes

## 7. Content guidelines

Label and error message patterns, for example "Choose a clinic", not "Clinic is required".

## 8. Analytics

| Event | When | Properties |
|---|---|---|

## 9. Test plan *

| Layer | Cases |
|---|---|
| Unit (jsdom) | |
| Browser | |
| Story audit | stories for every state in §4 |
| E2E | where it's used in the reference app |
| Manual | NVDA + Chrome, VoiceOver + Safari iOS, TalkBack |

## 10. Open questions

## 11. Sign-off

| Role | Name | Date |
|---|---|---|
| Design | | |
| Accessibility | | |
| Consumer team | | |
| Design-system maintainer | | |
