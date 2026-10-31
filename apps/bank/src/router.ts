import { useEffect, useState } from 'react';

export type Page = 'home' | 'activity' | 'pay' | 'cards' | 'settings';
export const PAGES: Page[] = ['home', 'activity', 'pay', 'cards', 'settings'];

export interface Route {
  page: Page;
  /** Query in the hash: #/pay?to=p4&amount=14280 */
  params: URLSearchParams;
}

function read(): Route {
  const [path = '', query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const page = (PAGES as string[]).includes(path) ? (path as Page) : 'home';
  return { page, params: new URLSearchParams(query) };
}

/** Hash routing: works on static hosting (GitHub Pages) and inside the Capacitor shell, no server rewrites. */
export function useRoute(): Route {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = (page: Page, params?: Record<string, string | number>) =>
  `#/${page === 'home' ? '' : page}${params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : ''}`;

export const navigate = (page: Page, params?: Record<string, string | number>) => {
  location.hash = href(page, params);
};
