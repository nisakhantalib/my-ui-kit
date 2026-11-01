import { describe, expect, it } from 'vitest';
import { fromLegacyHash, href, pageFromPath } from './router';

describe('router helpers', () => {
  it('builds app URLs with an optional query', () => {
    expect(href('home')).toBe('/app');
    expect(href('pay', { to: 'p4', amount: 14280 })).toBe('/app/pay?to=p4&amount=14280');
  });

  it('reads the page from a path, falling back to Home', () => {
    expect(pageFromPath('/app')).toBe('home');
    expect(pageFromPath('/app/cards')).toBe('cards');
    expect(pageFromPath('/app/cards/extra')).toBe('cards');
    expect(pageFromPath('/app/nope')).toBe('home');
  });

  it('forwards old hash links to their real URLs', () => {
    expect(fromLegacyHash('#/pay?to=p4')).toBe('/app/pay?to=p4');
    expect(fromLegacyHash('#/')).toBe('/app');
    expect(fromLegacyHash('#section')).toBeNull();
  });
});
