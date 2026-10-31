# 0007. Vendor-neutral analytics, with Adobe adapters

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Agencies commonly run Adobe Analytics. Some properties still use **AppMeasurement** (`s.t()`, `s.tl()`, the Omniture lineage), others are migrating to the **Adobe Experience Platform Web SDK** (`alloy`), often with the **Adobe Client Data Layer** in front. Components must report interactions (tab changes, errors, submits) without importing any vendor SDK, and must send nothing before the user consents (PDPA).

## Decision

- Components call `useTrack()` with a small, stable event vocabulary (`button_click`, `tab_change`, `switch_toggle`, `accordion_toggle`, plus app events like `form_error` and `form_submit`).
- `<AnalyticsProvider adapters={[…]} enabled={consent}>` routes events to adapters:
  - `adobeAnalyticsAdapter`: maps properties to eVars and props with `variableMap`, events with `eventMap`; `track` → `s.tl(true, 'o', name)` with `linkTrackVars` set; `page` → `s.t()`
  - `adobeWebSdkAdapter`: the **same config**, sent as `data.__adobe.analytics`, so no XDM schema is needed. Migrating is a one-line adapter swap.
  - `adobeDataLayerAdapter`: pushes to `window.adobeDataLayer` for Adobe Tags rules
  - `consoleAdapter` for development, or your own
- With `enabled={false}` the provider gives no-op functions, so nothing is collected before consent.
- Adapter errors are caught and logged. Analytics must never break the UI.
- A missing SDK (ad blocker, not loaded yet) is a silent no-op.

## Consequences

- The library has no analytics dependency. Apps choose vendors, and can use several at once during a migration.
- The tracking plan ([docs/specs/transfer-flow.md](../specs/transfer-flow.md#4-analytics)) maps every event to Adobe variables, so analysts and developers share one reference.
