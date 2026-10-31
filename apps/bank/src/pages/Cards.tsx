import { useRef, useState } from 'react';
import { Badge, Button, Dialog, Guilloche, MaskedValue, Switch, useKit, useToast } from '@nisakhantalib/my-ui-kit';
import { Ban, Lock, Snowflake } from 'lucide-react';
import { useBank } from '../bank';
import { Logo } from '../Logo';
import { useOpenTxn } from '../TxnSheet';
import { PageHeader, Panel, TxnRow } from '../ui';

export function Cards() {
  const { t, market, accounts, card, cardState, setCardState, money, txns } = useBank();
  const kit = useKit();
  const toast = useToast();
  const openTxn = useOpenTxn();
  const [online, setOnline] = useState(true);
  const [overseas, setOverseas] = useState(false);
  const [reporting, setReporting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const owed = Math.abs(accounts.find((a) => a.id === 'card')!.balance);
  const used = Math.min(owed / card.limit, 1);
  const blocked = cardState === 'blocked';
  const cardTxns = txns.filter((x) => x.account === 'card').slice(0, 4);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title={t('cardsTitle')} intro={t('cardsIntro')} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          {/* The card itself: decorative art plus real text (name, masked number, expiry). */}
          <div
            className={`credit-card relative aspect-[1.586] w-full max-w-[26rem] overflow-hidden rounded-[1.25rem] p-6 sm:p-7 ${cardState !== 'active' ? 'credit-card--off' : ''}`}
          >
            <Guilloche
              variant="waves"
              color="var(--kit-brand-accent)"
              accentColor="#c8a25a"
              className="inset-0 size-full"
            />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="display flex items-center gap-2 text-lg font-bold tracking-[0.02em] uppercase">
                  <Logo size={28} />
                  Orchid
                </span>
                <span className="text-xs font-semibold tracking-[0.14em] uppercase opacity-75">{t('credit')}</span>
              </div>
              <span aria-hidden="true" className="credit-card__chip" />
              <div className="grid gap-3">
                <div className="serial text-lg tracking-[0.14em]">
                  <MaskedValue value={card.number} label={t('cardNumber')} />
                </div>
                <div className="flex items-end justify-between text-sm">
                  <div>
                    <p className="text-[0.6875rem] tracking-wider uppercase opacity-75">{t('cardholder')}</p>
                    <p className="font-medium">{market.customerFull}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.6875rem] tracking-wider uppercase opacity-75">{t('expires')}</p>
                    <p className="money font-medium">{card.expiry}</p>
                  </div>
                </div>
              </div>
            </div>
            {cardState !== 'active' && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/35 backdrop-blur-[2px]">
                <Badge tone={blocked ? 'danger' : 'info'}>
                  {blocked ? <Ban aria-hidden="true" size={14} /> : <Snowflake aria-hidden="true" size={14} />}
                  {t(blocked ? 'blocked' : 'frozen')}
                </Badge>
              </div>
            )}
          </div>

          <Panel title={t('monthlySpend')}>
            <p className="money text-2xl font-semibold">{money(owed)}</p>
            {/* Visual bar; the same information is in the sentence below it. */}
            <div aria-hidden="true" className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(used * 100, 2)}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">{t('usedOf', { used: money(owed), limit: money(card.limit) })}</p>
          </Panel>

          <Panel title={t('recentActivity')}>
            <ul className="divide-y divide-line/20">
              {cardTxns.map((x) => (
                <li key={x.id}>
                  <TxnRow txn={x} onSelect={openTxn} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <Panel title={t('controls')}>
            <div className="grid gap-5">
              <Switch
                label={t('freezeCard')}
                description={t('freezeHint')}
                checked={cardState !== 'active'}
                disabled={blocked}
                onCheckedChange={(on) => {
                  setCardState(on ? 'frozen' : 'active');
                  toast({ title: t(on ? 'cardFrozen' : 'cardUnfrozen'), tone: 'success' });
                }}
                trackId="card-freeze"
              />
              <Switch
                label={t('onlinePayments')}
                description={t('onlineHint')}
                checked={online}
                disabled={cardState !== 'active'}
                onCheckedChange={setOnline}
              />
              <Switch
                label={t('overseasUse')}
                description={t('overseasHint')}
                checked={overseas}
                disabled={cardState !== 'active'}
                onCheckedChange={setOverseas}
              />
            </div>
          </Panel>

          <Panel title={t('details')}>
            <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 text-[0.9375rem]">
              <dt className="text-muted">{t('creditLimit')}</dt>
              <dd className="money m-0 text-right font-medium">{money(card.limit)}</dd>
              <dt className="text-muted">{t('availableCredit')}</dt>
              <dd className="money m-0 text-right font-medium">{money(card.limit - owed)}</dd>
              <dt className="text-muted">{t('minimumDue')}</dt>
              <dd className="money m-0 text-right font-medium">{money(Math.round(owed * 0.03))}</dd>
              <dt className="text-muted">{t('statementDate')}</dt>
              <dd className="m-0 text-right font-medium">
                {t('statementDay', { day: new Intl.NumberFormat(kit.locale).format(card.statementDay) })}
              </dd>
            </dl>
            <div className="mt-6 border-t border-line/20 pt-5">
              <Button variant="danger" disabled={blocked} onClick={() => setReporting(true)}>
                <Lock aria-hidden="true" size={18} />
                {t('reportLost')}
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog
        open={reporting}
        onClose={() => setReporting(false)}
        role="alertdialog"
        title={t('reportTitle')}
        description={t('reportDesc')}
        initialFocusRef={cancelRef}
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button ref={cancelRef} variant="ghost" onClick={() => setReporting(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setCardState('blocked');
              setReporting(false);
              toast({ title: t('cardBlocked'), tone: 'success' });
            }}
          >
            {t('reportConfirm')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
