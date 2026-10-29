# @nisakhantalib/my-ui-kit adoption report

Generated 2026-10-29T16:16:30.278Z by `kit-scan apps`.

## Summary

| Metric | Value |
| --- | ---: |
| Files scanned | 19 |
| Files importing the kit | 6 |
| Kit components used | 28 |
| JSX usages of kit components | 127 |
| Deprecated prop usages | 0 |
| Raw `<button>` / `<input>` / `<select>` in kit files | 0 |

## Kit version by package

| package.json | Package | Kit version | Dependency type |
| --- | --- | --- | --- |
| apps/bank/package.json | bank | `^0.1.0` | dependencies |
| apps/demo/package.json | demo | `^0.1.0` | dependencies |

## Components

| Component | Usages | Files | Most-used props |
| --- | ---: | ---: | --- |
| Button | 38 | 5 | `onClick` (26), `variant` (21), `size` (7), `trackId` (6), `loading` (4), `aria-pressed` (3) |
| TextField | 11 | 3 | `label` (11), `error` (7), `value` (7), `onChange` (6), `required` (6), `hint` (4) |
| Tab | 7 | 2 | `value` (7), `disabled` (1) |
| TabPanel | 7 | 2 | `value` (7) |
| AccordionItem | 6 | 2 | `title` (6), `value` (6), `disabled` (1) |
| Radio | 6 | 2 | `label` (6), `value` (6), `description` (4), `disabled` (1), `key` (1) |
| Alert | 5 | 2 | `title` (5), `tone` (5), `className` (1) |
| Select | 5 | 4 | `label` (5), `onChange` (3), `placeholder` (3), `value` (3), `defaultValue` (2), `error` (2) |
| Checkbox | 4 | 1 | `label` (4), `checked` (3), `onChange` (3), `error` (1), `hint` (1), `indeterminate` (1) |
| Skeleton | 4 | 1 | `lines` (2), `className` (1), `shape` (1), `width` (1) |
| Dialog | 3 | 3 | `description` (3), `onClose` (3), `open` (3), `title` (3), `initialFocusRef` (1), `role` (1) |
| RadioGroup | 3 | 2 | `legend` (3), `name` (3), `error` (2), `variant` (2), `defaultValue` (1), `hint` (1) |
| Switch | 3 | 2 | `label` (3), `checked` (1), `defaultChecked` (1), `description` (1), `onCheckedChange` (1) |
| Accordion | 2 | 2 | `headingLevel` (2), `type` (2), `defaultValue` (1) |
| AnalyticsProvider | 2 | 2 | `adapters` (2), `enabled` (1) |
| AnnouncerProvider | 2 | 2 | — |
| Badge | 2 | 2 | `tone` (2) |
| DataTable | 2 | 1 | `caption` (2), `columns` (2), `getRowKey` (2), `rows` (2), `captionHidden` (1), `defaultSort` (1) |
| ErrorSummary | 2 | 2 | `errors` (2) |
| SkipLink | 2 | 2 | — |
| TabList | 2 | 2 | `label` (2) |
| Tabs | 2 | 2 | `activation` (1), `defaultValue` (1), `onValueChange` (1), `value` (1) |
| ToastProvider | 2 | 2 | — |
| AmountInput | 1 | 1 | `error` (1), `hint` (1), `id` (1), `label` (1), `onValueChange` (1), `required` (1) |
| Combobox | 1 | 1 | `error` (1), `filter` (1), `getKey` (1), `getLabel` (1), `hint` (1), `id` (1) |
| KitProvider | 1 | 1 | `currency` (1), `locale` (1) |
| MaskedValue | 1 | 1 | `label` (1), `value` (1) |
| OTPInput | 1 | 1 | `error` (1), `label` (1), `onComplete` (1), `onResend` (1), `onValueChange` (1), `resendAfter` (1) |

## Deprecated prop usages

None. Nothing blocks the next major.

## Adoption gaps (raw controls in files that import the kit)

None.
