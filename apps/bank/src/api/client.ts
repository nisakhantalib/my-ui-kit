import { ApiError, type CardState, type Overview, type ReceiptDto, type TransferRequest } from './types';

/**
 * The banking API is mocked in the browser (Mock Service Worker): the app sends the same fetch
 * calls a real gateway would get. The worker starts on the first API call, so the public site never
 * downloads it. With a real backend, delete this and the mock.
 */
let mockServer: Promise<unknown> | null = null;
const startMockServer = () =>
  // No service workers (unit tests, which use MSW's Node server instead): nothing to start.
  !('serviceWorker' in navigator)
    ? Promise.resolve()
    : (mockServer ??= Promise.all([import('msw/browser'), import('./mock')]).then(([{ setupWorker }, { handlers }]) =>
        setupWorker(...handlers).start({ quiet: true, onUnhandledFrame: 'bypass' }),
      ));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  await startMockServer();
  const res = await fetch(new URL(`/api/${path}`, location.origin), {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string; detail?: string };
    throw new ApiError(res.status, body.code ?? 'http_error', body.detail ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** The banking API, typed. One function per endpoint; TanStack Query handles caching and retries. */
export const api = {
  overview: (market: string) => request<Overview>(`${market}/overview`),
  transfer: (market: string, body: TransferRequest) =>
    request<ReceiptDto>(`${market}/transfers`, { method: 'POST', body: JSON.stringify(body) }),
  setCardState: (market: string, state: CardState) =>
    request<{ state: CardState }>(`${market}/card`, { method: 'PUT', body: JSON.stringify({ state }) }),
};

export const overviewKey = (market: string) => ['overview', market] as const;
