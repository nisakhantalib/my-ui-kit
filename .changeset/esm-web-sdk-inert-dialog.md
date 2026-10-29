---
'@nisakhantalib/my-ui-kit': minor
---

- Add `adobeWebSdkAdapter` for Adobe Experience Platform Web SDK (alloy.js), Adobe's replacement for AppMeasurement. Uses the same `variableMap` / `eventMap` config, so switching is a one-line change.
- `Dialog` now makes the rest of the page `inert` while open, so screen readers and Tab cannot reach content behind the modal.
- Ship ESM only (`exports` with `types` + `default`), add `engines.node >= 20.19`, and fix type resolution under `moduleResolution: node16` (verified with publint and Are the Types Wrong).
- Add `--kit-on-danger` token so danger buttons keep ≥ 4.5:1 text contrast in dark mode (was white on light coral). Dark tokens now also apply via `<html data-theme="dark">`, so apps can offer a theme toggle, and `color-scheme` follows the theme so native controls match.
