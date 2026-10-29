import { createRoot, type Root } from 'react-dom/client';
import type { ComponentType } from 'react';
import { KitProvider } from '@nisakhantalib/my-ui-kit';

type PropType = 'string' | 'number' | 'boolean';

export interface ElementSpec<P> {
  /** Attribute (kebab-case) -> prop, with how to parse it. */
  attributes: Record<string, { prop: keyof P & string; type: PropType }>;
  /** Callback props turned into DOM events: { onValueChange: 'kit-change' } -> CustomEvent detail { value }. */
  events?: Partial<Record<keyof P & string, string>>;
  /** Pass the element's original text content as this prop (e.g. an Alert's message). */
  textProp?: keyof P & string;
}

/**
 * Wraps a kit React component as a custom element, rendered into light DOM so the kit's stylesheet,
 * tokens, brands and dark mode apply exactly as in React. React is bundled, so the page needs none.
 *
 * Locale and currency come from the nearest `lang` attribute and `data-currency` attribute, so a
 * whole page (or one section) is configured once, like `<html lang="zh-HK" data-currency="HKD">`.
 */
export function define<P extends object>(tag: string, Component: ComponentType<P>, spec: ElementSpec<P>) {
  if (customElements.get(tag)) return;

  class KitElement extends HTMLElement {
    static observedAttributes = Object.keys(spec.attributes);
    #root: Root | null = null;
    #text = '';
    #state: Record<string, unknown> = {};

    connectedCallback() {
      if (!this.#root) {
        this.#text = this.textContent?.trim() ?? '';
        this.textContent = '';
        this.#root = createRoot(this);
      }
      this.#render();
    }

    disconnectedCallback() {
      // Defer: the element may only be moving within the document.
      queueMicrotask(() => {
        if (!this.isConnected) {
          this.#root?.unmount();
          this.#root = null;
        }
      });
    }

    attributeChangedCallback() {
      if (this.#root) this.#render();
    }

    #props(): P {
      const props: Record<string, unknown> = { ...this.#state };
      for (const [attr, { prop, type }] of Object.entries(spec.attributes)) {
        const raw = this.getAttribute(attr);
        if (type === 'boolean') props[prop] = raw !== null && raw !== 'false';
        else if (raw === null) continue;
        else props[prop] = type === 'number' ? Number(raw) : raw;
      }
      for (const [prop, eventName] of Object.entries(spec.events ?? {}) as [string, string][]) {
        props[prop] = (value: unknown) => {
          this.dispatchEvent(new CustomEvent(eventName, { detail: { value }, bubbles: true, composed: true }));
        };
      }
      if (spec.textProp && this.#text) props[spec.textProp] = this.#text;
      return props as P;
    }

    #render() {
      const locale = this.closest('[lang]')?.getAttribute('lang') ?? 'en-SG';
      const currency = this.closest('[data-currency]')?.getAttribute('data-currency') ?? 'SGD';
      this.#root!.render(
        <KitProvider locale={locale} currency={currency}>
          <Component {...this.#props()} />
        </KitProvider>,
      );
    }
  }

  customElements.define(tag, KitElement);
}
