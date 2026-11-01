import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, useKit } from '@nisakhantalib/my-ui-kit';
import { CloudOff } from 'lucide-react';
import { api, overviewKey } from './api/client';
import type { CardState, Overview } from './api/types';
import type { Account, Bill, CardInfo, Goal, Market, Payee, Txn } from './data';
import { translator, type T } from './strings';

export type { CardState };

export interface Receipt {
  txn: Txn;
  ref: string;
  at: Date;
}

interface BankState {
  market: Market;
  t: T;
  accounts: Account[];
  payees: Payee[];
  txns: Txn[];
  bills: Bill[];
  card: CardInfo;
  cardState: CardState;
  setCardState: (state: CardState) => void;
  history: number[];
  goals: Goal[];
  lastMonth: Record<string, number>;
  dailyLimit: number;
  hideBalances: boolean;
  setHideBalances: (hide: boolean) => void;
  tier: 'personal' | 'private';
  /** Formatted money, or "Hidden" while balances are hidden. */
  money: (minor: number, options?: { signDisplay?: Intl.NumberFormatOptions['signDisplay'] }) => string;
  /** POST /transfers: the server debits the account and returns the receipt. */
  transfer: (input: { fromId: Account['id']; payee: Payee; amount: number; reference: string }) => Promise<Receipt>;
}

const BankContext = createContext<BankState | null>(null);

interface BankProviderProps {
  market: Market;
  hideBalances: boolean;
  setHideBalances: (hide: boolean) => void;
  tier: 'personal' | 'private';
  /** Shown while the first overview request is in flight (the app shell's skeleton). */
  loading?: ReactNode;
  children: ReactNode;
}

/**
 * App state for one signed-in customer in one market, from the banking API (TanStack Query over
 * fetch; the mock server is MSW). Mount it with key={market.code}: a new market is a different
 * customer profile.
 */
export function BankProvider({ market, hideBalances, setHideBalances, tier, loading, children }: BankProviderProps) {
  const kit = useKit();
  const queryClient = useQueryClient();
  const key = overviewKey(market.code);
  const overview = useQuery({ queryKey: key, queryFn: () => api.overview(market.code) });
  const t = useMemo(() => translator(market.lang), [market.lang]);

  const money = useCallback<BankState['money']>(
    (minor, options) =>
      hideBalances ? t('hidden') : kit.formatMoney(minor, { currency: market.currency, ...options }),
    [hideBalances, kit, market.currency, t],
  );

  // Card controls apply instantly (optimistic), and roll back if the server refuses.
  const card = useMutation({
    mutationFn: (state: CardState) => api.setCardState(market.code, state),
    onMutate: async (state) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Overview>(key);
      queryClient.setQueryData<Overview>(key, (d) => d && { ...d, cardState: state });
      return { previous };
    },
    onError: (_e, _s, context) => context?.previous && queryClient.setQueryData(key, context.previous),
  });

  const transfer = useCallback<BankState['transfer']>(
    async ({ fromId, payee, amount, reference }) => {
      const dto = await api.transfer(market.code, { fromId, payeeId: payee.id, amount, reference });
      // Show the result straight away, then let the server's view replace it.
      queryClient.setQueryData<Overview>(
        key,
        (d) =>
          d && {
            ...d,
            accounts: d.accounts.map((a) => (a.id === fromId ? { ...a, balance: a.balance - amount } : a)),
            txns: [dto.txn, ...d.txns],
            bills: d.bills.filter((b) => b.payeeId !== payee.id),
          },
      );
      void queryClient.invalidateQueries({ queryKey: key });
      return { txn: dto.txn, ref: dto.ref, at: new Date(dto.at) };
    },
    [market.code, queryClient, key],
  );

  const setCardState = card.mutate;
  const data = overview.data;
  // Memoised so pages re-render when the data or a preference changes, not on every parent render.
  const value = useMemo<BankState | null>(
    () => (data ? { market, t, ...data, setCardState, hideBalances, setHideBalances, tier, money, transfer } : null),
    [data, market, t, setCardState, hideBalances, setHideBalances, tier, money, transfer],
  );

  if (overview.isPending) return <>{loading}</>;
  if (overview.isError)
    return <LoadError t={t} onRetry={() => void overview.refetch()} retrying={overview.isFetching} />;

  return <BankContext.Provider value={value!}>{children}</BankContext.Provider>;
}

/** The overview request failed: say what happened and offer the one thing that helps. */
function LoadError({ t, onRetry, retrying }: { t: T; onRetry: () => void; retrying: boolean }) {
  return (
    <div role="alert" className="mx-auto grid max-w-md justify-items-center gap-3 px-6 py-24 text-center">
      <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-surface text-muted">
        <CloudOff size={26} />
      </span>
      <h1 className="text-2xl font-semibold">{t('loadErrorTitle')}</h1>
      <p className="text-muted">{t('loadErrorHint')}</p>
      <Button onClick={onRetry} loading={retrying} className="mt-2">
        {t('retry')}
      </Button>
    </div>
  );
}

export function useBank(): BankState {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used inside <BankProvider>.');
  return ctx;
}
