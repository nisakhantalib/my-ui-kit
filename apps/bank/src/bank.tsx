import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useKit } from '@nisakhantalib/my-ui-kit';
import { seed, type Account, type Bill, type CardInfo, type Market, type Payee, type Txn } from './data';
import { translator, type T } from './strings';

export type CardState = 'active' | 'frozen' | 'blocked';

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
  dailyLimit: number;
  hideBalances: boolean;
  setHideBalances: (hide: boolean) => void;
  tier: 'personal' | 'private';
  /** Formatted money, or "Hidden" while balances are hidden. */
  money: (minor: number, options?: { signDisplay?: Intl.NumberFormatOptions['signDisplay'] }) => string;
  /** Stand-in for the payments API: debits the account and returns the receipt the server would. */
  transfer: (input: { fromId: Account['id']; payee: Payee; amount: number; reference: string }) => Receipt;
}

const BankContext = createContext<BankState | null>(null);

interface BankProviderProps {
  market: Market;
  hideBalances: boolean;
  setHideBalances: (hide: boolean) => void;
  tier: 'personal' | 'private';
  children: ReactNode;
}

/**
 * App state for one signed-in customer in one market. A real app would load this from an API.
 * Mount it with key={market.code}: a new market is a different customer profile, so state starts fresh.
 */
export function BankProvider({ market, hideBalances, setHideBalances, tier, children }: BankProviderProps) {
  const kit = useKit();
  const digits = kit.currencyDigits(market.currency);
  const [initial] = useState(() => seed(market, digits));
  const [accounts, setAccounts] = useState(initial.accounts);
  const [txns, setTxns] = useState(initial.txns);
  const [bills, setBills] = useState(initial.bills);
  const [cardState, setCardState] = useState<CardState>('active');

  const t = useMemo(() => translator(market.lang), [market.lang]);

  const money = useCallback<BankState['money']>(
    (minor, options) =>
      hideBalances ? t('hidden') : kit.formatMoney(minor, { currency: market.currency, ...options }),
    [hideBalances, kit, market.currency, t],
  );

  const transfer = useCallback<BankState['transfer']>(({ fromId, payee, amount, reference }) => {
    const txn: Txn = {
      id: `t${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      desc: reference ? `${payee.name} · ${reference}` : payee.name,
      category: payee.kind === 'biller' ? 'bills' : 'transfer',
      amount: -amount,
      status: 'posted',
      account: 'everyday',
    };
    setAccounts((all) => all.map((a) => (a.id === fromId ? { ...a, balance: a.balance - amount } : a)));
    setTxns((all) => [txn, ...all]);
    // Paying a biller settles its upcoming bill.
    setBills((all) => all.filter((b) => b.payeeId !== payee.id));
    return { txn, ref: `OB${Date.now().toString().slice(-9)}`, at: new Date() };
  }, []);

  const value: BankState = {
    market,
    t,
    accounts,
    payees: initial.payees,
    txns,
    bills,
    card: initial.card,
    cardState,
    setCardState,
    history: initial.history,
    dailyLimit: initial.dailyLimit,
    hideBalances,
    setHideBalances,
    tier,
    money,
    transfer,
  };
  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankState {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used inside <BankProvider>.');
  return ctx;
}
