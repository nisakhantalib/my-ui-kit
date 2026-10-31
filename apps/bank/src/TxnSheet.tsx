import { createContext, useContext, useState, type ReactNode } from 'react';
import { Badge, Button, Dialog, useKit, useToast } from '@nisakhantalib/my-ui-kit';
import { Clock, Flag } from 'lucide-react';
import { useBank } from './bank';
import type { Txn } from './data';
import type { StringKey } from './strings';
import { Amount, CATEGORY_COLOR, Monogram } from './ui';

const OpenTxnContext = createContext<(txn: Txn) => void>(() => {});

/** Opens a transaction's details in a side sheet, from any page (Home, Activity, search). */
export function useOpenTxn() {
  return useContext(OpenTxnContext);
}

export function TxnSheetProvider({ children }: { children: ReactNode }) {
  const [txn, setTxn] = useState<Txn | null>(null);
  return (
    <OpenTxnContext.Provider value={setTxn}>
      {children}
      <TxnSheet txn={txn} onClose={() => setTxn(null)} />
    </OpenTxnContext.Provider>
  );
}

function TxnSheet({ txn, onClose }: { txn: Txn | null; onClose: () => void }) {
  const { t } = useBank();
  const kit = useKit();
  const toast = useToast();
  if (!txn) return <Dialog open={false} onClose={onClose} title="" />;

  const pending = txn.status === 'pending';
  const rows: [StringKey, ReactNode][] = [
    ['date', kit.formatDate(txn.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['time', txn.time],
    ['category', t(`cat.${txn.category}` as StringKey)],
    ['account', t(txn.account === 'card' ? 'card' : 'everyday')],
    [
      'transactionId',
      <span
        key="id"
        className="font-mono text-[0.9375rem]"
      >{`OB-${txn.id.toUpperCase()}-${txn.date.replaceAll('-', '')}`}</span>,
    ],
  ];

  return (
    <Dialog open onClose={onClose} title={t('txnDetails')} placement="sheet" showClose>
      <div className="grid gap-6">
        <div className="grid justify-items-center gap-3 rounded-2xl bg-surface px-4 py-7 text-center">
          <Monogram name={txn.desc} dot={CATEGORY_COLOR[txn.category]} size={60} />
          <p className="text-lg font-semibold">{txn.desc}</p>
          <p
            className={`money text-[2.5rem] leading-none font-semibold tracking-tight ${txn.amount > 0 ? 'text-success' : ''}`}
          >
            <Amount value={txn.amount} signDisplay="exceptZero" />
          </p>
          <Badge tone={pending ? 'warning' : 'success'}>{t(pending ? 'pending' : 'completed')}</Badge>
        </div>

        {pending && (
          <p className="flex gap-3 rounded-xl border border-line/30 p-4 text-sm">
            <Clock aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-muted" />
            {t('pendingNote')}
          </p>
        )}

        <dl className="divide-y divide-line/20">
          {rows.map(([key, value]) => (
            <div key={key} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
              <dt className="text-muted">{t(key)}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <Button
          variant="secondary"
          onClick={() => {
            toast({ title: t('issueReported'), tone: 'success' });
            onClose();
          }}
        >
          <Flag aria-hidden="true" size={18} />
          {t('reportIssue')}
        </Button>
      </div>
    </Dialog>
  );
}
