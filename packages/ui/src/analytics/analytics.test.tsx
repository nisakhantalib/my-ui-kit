import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AnalyticsProvider,
  adobeAnalyticsAdapter,
  adobeDataLayerAdapter,
  adobeWebSdkAdapter,
  useTrack,
  type AdobeAppMeasurement,
} from './analytics.js';

function fakeS(): AdobeAppMeasurement {
  return { t: vi.fn(), tl: vi.fn() };
}

describe('adobeAnalyticsAdapter', () => {
  it('maps properties to eVars/props and fires a custom link call', () => {
    const s = fakeS();
    const adapter = adobeAnalyticsAdapter({
      getS: () => s,
      variableMap: { component: 'eVar5', id: 'prop3' },
      eventMap: { form_submit: 'event12' },
    });

    adapter.track({ name: 'form_submit', properties: { component: 'BookingForm', id: 'clinic', ignored: 'x' } });

    expect(s.eVar5).toBe('BookingForm');
    expect(s.prop3).toBe('clinic');
    expect(s.events).toBe('event12');
    expect(s.linkTrackVars).toBe('eVar5,prop3,events');
    expect(s.linkTrackEvents).toBe('event12');
    expect(s.tl).toHaveBeenCalledWith(true, 'o', 'form_submit');
  });

  it('sets pageName and fires a page view', () => {
    const s = fakeS();
    adobeAnalyticsAdapter({ getS: () => s }).page!('booking:details');
    expect(s.pageName).toBe('booking:details');
    expect(s.t).toHaveBeenCalledTimes(1);
  });

  it('does nothing when AppMeasurement is not loaded', () => {
    expect(() => adobeAnalyticsAdapter({ getS: () => undefined }).track({ name: 'x' })).not.toThrow();
  });
});

describe('adobeWebSdkAdapter (alloy.js)', () => {
  it('sends a link event with mapped variables under data.__adobe.analytics', () => {
    const alloy = vi.fn().mockResolvedValue({});
    adobeWebSdkAdapter({
      getAlloy: () => alloy,
      variableMap: { component: 'eVar5' },
      eventMap: { form_submit: 'event12' },
    }).track({ name: 'form_submit', properties: { component: 'BookingForm' } });

    expect(alloy).toHaveBeenCalledWith('sendEvent', {
      data: {
        __adobe: {
          analytics: { eVar5: 'BookingForm', events: 'event12', linkName: 'form_submit', linkType: 'o' },
        },
      },
    });
  });

  it('sends a page view with pageName', () => {
    const alloy = vi.fn();
    adobeWebSdkAdapter({ getAlloy: () => alloy }).page!('booking:review');
    expect(alloy).toHaveBeenCalledWith('sendEvent', {
      data: { __adobe: { analytics: { pageName: 'booking:review' } } },
    });
  });

  it('swallows a rejected sendEvent (e.g. consent denied in Adobe)', async () => {
    const alloy = vi.fn().mockRejectedValue(new Error('consent'));
    expect(() => adobeWebSdkAdapter({ getAlloy: () => alloy }).track({ name: 'x' })).not.toThrow();
    await Promise.resolve();
  });
});

describe('adobeDataLayerAdapter', () => {
  it('pushes to window.adobeDataLayer', () => {
    const w = window as unknown as { adobeDataLayer?: unknown[] };
    delete w.adobeDataLayer;
    adobeDataLayerAdapter().track({ name: 'tab_change', properties: { tab: 'review' } });
    expect(w.adobeDataLayer).toEqual([{ event: 'tab_change', eventInfo: { tab: 'review' } }]);
  });
});

describe('AnalyticsProvider', () => {
  function Tracker() {
    const track = useTrack();
    return <button onClick={() => track('clicked')}>go</button>;
  }

  it('sends nothing until consent is given', async () => {
    const track = vi.fn();
    const { rerender } = render(
      <AnalyticsProvider adapters={[{ track }]} enabled={false}>
        <Tracker />
      </AnalyticsProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(track).not.toHaveBeenCalled();

    rerender(
      <AnalyticsProvider adapters={[{ track }]} enabled>
        <Tracker />
      </AnalyticsProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(track).toHaveBeenCalledWith({ name: 'clicked', properties: undefined });
  });

  it('keeps going when one adapter throws', async () => {
    const good = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AnalyticsProvider
        adapters={[
          {
            track: () => {
              throw new Error('boom');
            },
          },
          { track: good },
        ]}
      >
        <Tracker />
      </AnalyticsProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(good).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
