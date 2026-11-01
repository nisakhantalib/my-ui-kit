import { useLocation } from 'react-router';

export type Page = 'home' | 'activity' | 'pay' | 'cards' | 'settings';
export const PAGES: Page[] = ['home', 'activity', 'pay', 'cards', 'settings'];

export interface Route {
  page: Page;
  /** Query string: /app/pay?to=p4&amount=14280 */
  params: URLSearchParams;
}

/** The banking app lives under /app; the public site is at /. Real URLs (History API, React Router). */
export const APP = '/app';

export function pageFromPath(pathname: string): Page {
  const segment = pathname.slice(APP.length).replace(/^\//, '').split('/')[0] ?? '';
  return (PAGES as string[]).includes(segment) ? (segment as Page) : 'home';
}

/** The current app page and its query, from React Router's location. */
export function useRoute(): Route {
  const location = useLocation();
  return { page: pageFromPath(location.pathname), params: new URLSearchParams(location.search) };
}

export const href = (page: Page, params?: Record<string, string | number>) =>
  `${APP}${page === 'home' ? '' : `/${page}`}${params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : ''}`;

// Set by the router root, so code outside components (the command palette's actions) can navigate.
let go: (to: string) => void = (to) => location.assign(to);
export function setNavigator(fn: (to: string) => void) {
  go = fn;
}

export const navigate = (page: Page, params?: Record<string, string | number>) => go(href(page, params));
export const navigateTo = (to: string) => go(to);

/** Old hash links (#/pay?to=p4) from before real URLs: where they live now. */
export function fromLegacyHash(hash: string): string | null {
  if (!hash.startsWith('#/')) return null;
  const [path = '', query = ''] = hash.slice(2).split('?');
  const page = (PAGES as string[]).includes(path) ? (path as Page) : 'home';
  return `${APP}${page === 'home' ? '' : `/${page}`}${query ? `?${query}` : ''}`;
}
