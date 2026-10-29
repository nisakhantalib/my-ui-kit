import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Vendor-neutral analytics layer.
 * Components call `useTrack()`; the app decides where events go by passing adapters
 * (Adobe Analytics AppMeasurement, Adobe Client Data Layer, console, or your own).
 */

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsEvent {
  name: string;
  properties?: AnalyticsProps;
}

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void;
  page?(pageName: string, properties?: AnalyticsProps): void;
}

// ---------- Adapters ----------

/** Logs events in development. */
export const consoleAdapter: AnalyticsAdapter = {
  track: (e) => console.info('[analytics] track', e.name, e.properties ?? {}),
  page: (name, props) => console.info('[analytics] page', name, props ?? {}),
};

/** Minimal shape of the Adobe AppMeasurement `s` object we rely on. */
export interface AdobeAppMeasurement {
  pageName?: string;
  linkTrackVars?: string;
  linkTrackEvents?: string;
  events?: string;
  t(): void;
  tl(linkObject: boolean | HTMLElement, linkType: 'o' | 'd' | 'e', linkName: string): void;
  [eVarOrProp: string]: unknown;
}

export interface AdobeAdapterOptions {
  /** Returns the AppMeasurement instance. Defaults to window.s. */
  getS?: () => AdobeAppMeasurement | undefined;
  /** Maps a property key to an Adobe variable, e.g. { component: 'eVar5', label: 'prop3' }. */
  variableMap?: Record<string, string>;
  /** Maps an event name to a success event, e.g. { form_submit: 'event12' }. */
  eventMap?: Record<string, string>;
}

/**
 * Adobe Analytics (AppMeasurement / Omniture) adapter.
 * track() -> s.tl(true, 'o', name)   (custom link call, does not count as a page view)
 * page()  -> s.pageName = name; s.t() (page view call)
 */
export function adobeAnalyticsAdapter(options: AdobeAdapterOptions = {}): AnalyticsAdapter {
  const getS = options.getS ?? (() => (globalThis as unknown as { s?: AdobeAppMeasurement }).s);
  const variableMap = options.variableMap ?? {};
  const eventMap = options.eventMap ?? {};

  function assignVars(s: AdobeAppMeasurement, props: AnalyticsProps = {}): string[] {
    const used: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      const adobeVar = variableMap[key];
      if (adobeVar && value !== undefined) {
        s[adobeVar] = String(value);
        used.push(adobeVar);
      }
    }
    return used;
  }

  return {
    track({ name, properties }) {
      const s = getS();
      if (!s) return; // library not loaded (ad blocker, consent not given) -> fail silently
      const vars = assignVars(s, properties);
      const successEvent = eventMap[name];
      if (successEvent) {
        s.events = successEvent;
        s.linkTrackEvents = successEvent;
        vars.push('events');
      }
      s.linkTrackVars = vars.join(',') || 'None';
      s.tl(true, 'o', name);
    },
    page(pageName, properties) {
      const s = getS();
      if (!s) return;
      s.pageName = pageName;
      assignVars(s, properties);
      s.t();
    },
  };
}

/** The Adobe Experience Platform Web SDK command function (window.alloy). */
export type Alloy = (command: 'sendEvent', options: Record<string, unknown>) => Promise<unknown> | void;

export interface AdobeWebSdkAdapterOptions {
  /** Returns the alloy instance. Defaults to window.alloy. */
  getAlloy?: () => Alloy | undefined;
  /** Same mapping as the AppMeasurement adapter, e.g. { component: 'eVar5' }. */
  variableMap?: Record<string, string>;
  eventMap?: Record<string, string>;
}

/**
 * Adobe Experience Platform Web SDK (alloy.js) adapter — Adobe's current recommended
 * collection library, replacing AppMeasurement. Uses the `data.__adobe.analytics` object,
 * so variable names stay the same as AppMeasurement (eVar5, prop3, event12) and no XDM
 * schema is required. Same mapping config means migration is a one-line adapter swap.
 *
 * track('button_click', { component: 'Button' }) ->
 *   alloy('sendEvent', { data: { __adobe: { analytics: {
 *     eVar5: 'Button', linkName: 'button_click', linkType: 'o' } } } })
 */
export function adobeWebSdkAdapter(options: AdobeWebSdkAdapterOptions = {}): AnalyticsAdapter {
  const getAlloy = options.getAlloy ?? (() => (globalThis as unknown as { alloy?: Alloy }).alloy);
  const variableMap = options.variableMap ?? {};
  const eventMap = options.eventMap ?? {};

  function vars(props: AnalyticsProps = {}): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(props)) {
      const adobeVar = variableMap[key];
      if (adobeVar && value !== undefined) out[adobeVar] = String(value);
    }
    return out;
  }

  function send(analytics: Record<string, string>) {
    const alloy = getAlloy();
    if (!alloy) return;
    // sendEvent returns a promise; a network/consent rejection must not surface as an unhandled error.
    void Promise.resolve(alloy('sendEvent', { data: { __adobe: { analytics } } })).catch(() => {});
  }

  return {
    track({ name, properties }) {
      const successEvent = eventMap[name];
      send({
        ...vars(properties),
        ...(successEvent ? { events: successEvent } : {}),
        linkName: name,
        linkType: 'o', // custom link: does not count as a page view
      });
    },
    page(pageName, properties) {
      send({ ...vars(properties), pageName });
    },
  };
}

/** Adobe Client Data Layer (window.adobeDataLayer) adapter, used with Adobe Launch / Web SDK. */
export function adobeDataLayerAdapter(): AnalyticsAdapter {
  const layer = () => {
    const w = globalThis as unknown as { adobeDataLayer?: unknown[] };
    w.adobeDataLayer = w.adobeDataLayer ?? [];
    return w.adobeDataLayer;
  };
  return {
    track: ({ name, properties }) => layer().push({ event: name, eventInfo: properties ?? {} }),
    page: (pageName, properties) => layer().push({ event: 'page_view', page: { pageName, ...properties } }),
  };
}

// ---------- React bindings ----------

interface AnalyticsContextValue {
  track: (name: string, properties?: AnalyticsProps) => void;
  page: (pageName: string, properties?: AnalyticsProps) => void;
}

const noop: AnalyticsContextValue = { track: () => {}, page: () => {} };
const AnalyticsContext = createContext<AnalyticsContextValue>(noop);

export interface AnalyticsProviderProps {
  adapters: AnalyticsAdapter[];
  /** Set false until the user gives tracking consent. */
  enabled?: boolean;
  children: ReactNode;
}

export function AnalyticsProvider({ adapters, enabled = true, children }: AnalyticsProviderProps) {
  const value = useMemo<AnalyticsContextValue>(() => {
    if (!enabled) return noop;
    const safe = (fn: () => void) => {
      try {
        fn();
      } catch (err) {
        // Analytics must never break the UI.
        console.warn('[analytics] adapter error', err);
      }
    };
    return {
      track: (name, properties) => adapters.forEach((a) => safe(() => a.track({ name, properties }))),
      page: (pageName, properties) => adapters.forEach((a) => a.page && safe(() => a.page!(pageName, properties))),
    };
  }, [adapters, enabled]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/** Returns a stable track function (memoised by the provider). Safe to call outside a provider (no-op). */
export function useTrack() {
  return useContext(AnalyticsContext).track;
}

export function usePageView() {
  return useContext(AnalyticsContext).page;
}
