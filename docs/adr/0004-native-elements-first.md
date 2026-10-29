# 0004. Native HTML elements first; custom ARIA widgets only when needed

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Custom widgets (a div-based listbox, a custom radio) must re-implement keyboard handling, screen-reader semantics, form participation, autofill and mobile pickers. Each one becomes a long-term a11y liability. The first rule of ARIA is: don't use ARIA if a native element does the job.

## Decision

| Need | We use | Instead of |
|---|---|---|
| Pick one of a few options | native radios in `<fieldset role="radiogroup">` | `div[role=radio]` with roving tabindex |
| Pick from a long list | native `<select>`, styled | custom listbox / combobox |
| Yes / no on submit | native checkbox (`indeterminate` supported) | custom checkbox |
| On/off that applies now | `<button role="switch">` | there is no native switch, so this is the APG pattern |
| Tabs, accordion, dialog | APG patterns on native `<button>`s | — (no native element fits; `<dialog>` still has inconsistent AT support for our needs) |

Native radios give us arrow-key selection, "1 of 3" announcements, `required` and form submission for free. A native `<select>` opens the phone's own picker, which is the best mobile UX there is.

## Consequences

- Less code, fewer bugs, and behaviour users already know from their platform.
- Less visual control: a native `<select>`'s open list can't be styled. Accepted for public-service forms. If a searchable combobox is ever needed, it gets its own spec and ADR.
- `accent-color` themes native checkboxes and radios; forced-colours mode works with no extra code.
