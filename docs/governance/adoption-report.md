# @nisakhantalib/my-ui-kit adoption report

Generated 2026-10-31T02:28:53.807Z by `kit-scan apps`.

## Summary

| Metric | Value |
| --- | ---: |
| Files scanned | 18 |
| Files importing the kit | 8 |
| Kit components used | 21 |
| JSX usages of kit components | 62 |
| Deprecated prop usages | 0 |
| Raw `<button>` / `<input>` / `<select>` in kit files | 2 |

## Kit version by package

| package.json | Package | Kit version | Dependency type |
| --- | --- | --- | --- |
| apps/bank/package.json | bank | `^0.1.0` | dependencies |

## Components

| Component | Usages | Files | Most-used props |
| --- | ---: | ---: | --- |
| Button | 15 | 5 | `onClick` (13), `variant` (10), `trackId` (4), `disabled` (3), `size` (3), `className` (2) |
| Badge | 6 | 5 | `tone` (6) |
| Radio | 6 | 1 | `label` (6), `value` (6), `description` (3), `key` (1) |
| IconButton | 4 | 2 | `icon` (4), `label` (4), `onClick` (4), `aria-pressed` (3), `badge` (1) |
| Skeleton | 4 | 1 | `lines` (2), `className` (1), `shape` (1), `width` (1) |
| Switch | 4 | 2 | `checked` (4), `label` (4), `onCheckedChange` (4), `disabled` (3), `description` (2), `trackId` (1) |
| Dialog | 3 | 3 | `onClose` (3), `open` (3), `title` (3), `description` (2), `initialFocusRef` (1), `role` (1) |
| RadioGroup | 3 | 1 | `legend` (3), `name` (3), `onValueChange` (3), `value` (3), `variant` (3), `hint` (2) |
| DataTable | 2 | 2 | `caption` (2), `captionHidden` (2), `columns` (2), `getRowKey` (2), `rows` (2), `defaultSort` (1) |
| MaskedValue | 2 | 2 | `label` (2), `value` (2) |
| Select | 2 | 2 | `label` (2), `onChange` (2), `value` (2) |
| TextField | 2 | 2 | `hint` (2), `label` (2), `onChange` (2), `value` (2), `maxLength` (1), `type` (1) |
| AmountInput | 1 | 1 | `error` (1), `hint` (1), `id` (1), `label` (1), `onValueChange` (1), `required` (1) |
| AnalyticsProvider | 1 | 1 | `adapters` (1) |
| AnnouncerProvider | 1 | 1 | — |
| Combobox | 1 | 1 | `error` (1), `filter` (1), `getKey` (1), `getLabel` (1), `hint` (1), `id` (1) |
| ErrorSummary | 1 | 1 | `errors` (1) |
| KitProvider | 1 | 1 | `currency` (1), `locale` (1) |
| OTPInput | 1 | 1 | `error` (1), `label` (1), `onComplete` (1), `onResend` (1), `onValueChange` (1), `resendAfter` (1) |
| SkipLink | 1 | 1 | — |
| ToastProvider | 1 | 1 | — |

## Deprecated prop usages

None. Nothing blocks the next major.

## Adoption gaps (raw controls in files that import the kit)

| File | Raw elements |
| --- | --- |
| apps/bank/src/pages/Activity.tsx | `<button>` × 1 |
| apps/bank/src/pages/Pay.tsx | `<button>` × 1 |
