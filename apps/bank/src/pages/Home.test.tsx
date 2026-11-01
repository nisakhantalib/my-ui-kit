import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { AnnouncerProvider, KitProvider, ToastProvider } from '@nisakhantalib/my-ui-kit';
import { describe, expect, it } from 'vitest';
import { BankProvider } from '../bank';
import { MARKETS } from '../data';
import { server } from '../test/setup';
import { TxnSheetProvider } from '../TxnSheet';
import { Home } from './Home';

function renderHome({ market = MARKETS[4]!, hideBalances = false } = {}) {
  // A fresh cache per test, no retries: failures surface straight away.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <KitProvider locale={market.locale} currency={market.currency}>
        <AnnouncerProvider>
          <ToastProvider>{children}</ToastProvider>
        </AnnouncerProvider>
      </KitProvider>
    </QueryClientProvider>
  );
  return render(
    <BankProvider
      market={market}
      hideBalances={hideBalances}
      setHideBalances={() => {}}
      tier="personal"
      loading={<p>Loading accounts</p>}
    >
      <TxnSheetProvider>
        <Home />
      </TxnSheetProvider>
    </BankProvider>,
    { wrapper },
  );
}

describe('Home', () => {
  it('shows the loading state, then the accounts from the API', async () => {
    renderHome();
    expect(screen.getByText('Loading accounts')).toBeInTheDocument();
    const total = await screen.findByRole('region', { name: 'Total balance' });
    const accounts = within(total).getByRole('list', { name: 'Your accounts' });
    expect(within(accounts).getAllByRole('button')).toHaveLength(3);
    expect(within(accounts).getByRole('button', { name: /Everyday Account/ })).toHaveTextContent(/₹/);
  });

  it('selects an account card from the list (aria-pressed)', async () => {
    renderHome();
    const savings = await screen.findByRole('button', { name: /Savings Account/ });
    await userEvent.click(savings);
    expect(savings).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Everyday Account/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides every figure while balances are hidden', async () => {
    renderHome({ hideBalances: true });
    const total = await screen.findByRole('region', { name: 'Total balance' });
    expect(total).not.toHaveTextContent(/₹\s?\d/);
    expect(within(total).getAllByText('Hidden').length).toBeGreaterThan(0);
  });

  it('offers a retry when the API fails, and recovers', async () => {
    server.use(
      http.get('*/api/:market/overview', () => HttpResponse.json({ code: 'down' }, { status: 503 }), { once: true }),
    );
    renderHome();
    // The message sits inside a role="alert" region, so screen readers announce it.
    const message = await screen.findByText("We couldn't load your accounts");
    expect(message.closest('[role="alert"]')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Total balance' })).toBeInTheDocument();
  });
});
