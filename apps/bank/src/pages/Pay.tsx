import { useRef, useState, type FormEvent } from 'react';
import {
  AmountInput,
  Badge,
  Button,
  Combobox,
  Dialog,
  ErrorSummary,
  OTPInput,
  Select,
  TextField,
  useKit,
  useToast,
  useTrack,
} from '@nisakhantalib/my-ui-kit';
import { Check, ShieldCheck } from 'lucide-react';
import { useBank, type Receipt } from '../bank';
import type { Account, Payee } from '../data';
import { shareText } from '../native';
import { href } from '../router';
import { useOpenTxn } from '../TxnSheet';
import { Amount, Avatar, PageHeader, Panel, TxnRow } from '../ui';

type Step = 'details' | 'review' | 'done';
type Errors = Partial<Record<'payee' | 'amount', string>>;

const DEMO_CODE = '123456';

export function Pay({ params }: { params: URLSearchParams }) {
  const { t, market, accounts, payees, txns, dailyLimit, money, transfer } = useBank();
  const openTxn = useOpenTxn();
  const kit = useKit();
  const toast = useToast();
  const track = useTrack();

  const sources = accounts.filter((a) => a.id !== 'card');
  // Deep links (#/pay?to=p4&amount=14280) prefill the form, e.g. from "Pay" on an upcoming bill.
  const prefillPayee = payees.some((p) => p.id === params.get('to')) ? params.get('to') : null;
  const prefillAmount = Number(params.get('amount')) || null;

  const [step, setStep] = useState<Step>('details');
  const [fromId, setFromId] = useState<Account['id']>(sources[0]!.id);
  const [payeeId, setPayeeId] = useState<string | null>(prefillPayee);
  const [amount, setAmount] = useState<number | null>(prefillAmount);
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [approving, setApproving] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const from = sources.find((a) => a.id === fromId)!;
  const payee = payees.find((p) => p.id === payeeId) ?? null;
  const fmt = (minor: number) => kit.formatMoney(minor, { currency: market.currency });
  const recent = payees.filter((p) => p.kind === 'person').slice(0, 4);
  const payments = txns.filter(
    (x) => x.account === 'everyday' && (x.category === 'transfer' || x.category === 'bills'),
  );
  const recentPayments = payments.slice(0, 4);
  const today = new Date().toISOString().slice(0, 10);
  const sentToday = payments.filter((x) => x.date === today).reduce((s, x) => s - x.amount, 0);

  function validate(): Errors {
    const e: Errors = {};
    if (!payee) e.payee = t('errChoosePayee');
    if (amount === null || amount <= 0) e.amount = t('errAmount');
    else if (amount > from.balance) e.amount = t('errOverBalance', { available: fmt(from.balance) });
    else if (amount > dailyLimit) e.amount = t('errOverLimit', { limit: fmt(dailyLimit) });
    return e;
  }

  function goTo(next: Step) {
    setStep(next);
    // New step, same page: put focus on its heading so screen readers start there.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function choosePayee(id: string | null) {
    setPayeeId(id);
    if (errors.payee) setErrors((e) => ({ ...e, payee: undefined }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length) {
      track('form_error', { component: 'TransferForm', count: Object.keys(found).length });
      return; // ErrorSummary takes focus and lists the problems
    }
    goTo('review');
  }

  async function approve(code = otp) {
    if (code.length < 6) {
      setOtpError(t('errOtp'));
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 700)); // stand-in for the authorisation API
    setVerifying(false);
    if (code !== DEMO_CODE) {
      setOtpError(t('errOtp'));
      setOtp('');
      return;
    }
    setReceipt(transfer({ fromId, payee: payee!, amount: amount!, reference: reference.trim() }));
    track('form_submit', { component: 'TransferForm', market: market.code });
    setApproving(false);
    goTo('done');
  }

  function reset() {
    setPayeeId(null);
    setAmount(null);
    setReference('');
    setErrors({});
    setSubmitted(false);
    setOtp('');
    setOtpError(undefined);
    setReceipt(null);
    goTo('details');
  }

  async function share() {
    if (!receipt || !payee) return;
    const text = `${t('doneHeading')}: ${fmt(amount!)} → ${payee.name}. ${t('referenceNo')} ${receipt.ref}`;
    if ((await shareText(t('brand'), text)) === 'copied') toast({ title: t('copied'), tone: 'success' });
  }

  const steps = [t('stepDetails'), t('stepReview'), t('stepDone')];
  const stepIndex = { details: 0, review: 1, done: 2 }[step];
  const summaryErrors = submitted
    ? (Object.entries(errors) as [keyof Errors, string][])
        .filter(([, m]) => m)
        .map(([k, m]) => ({ id: k === 'payee' ? 'pay-to' : 'pay-amount', message: m }))
    : [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title={t('payTitle')} intro={t('payIntro', { rail: market.rail })} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
          {/* Stepper: the visual dots are decorative; the text below states the step for everyone. */}
          <div>
            <ol aria-hidden="true" className="flex items-center gap-2">
              {steps.map((label, i) => (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      i < stepIndex
                        ? 'bg-brand text-on-brand'
                        : i === stepIndex
                          ? 'bg-brand text-on-brand ring-4 ring-brand/20'
                          : 'border-2 border-line/60 bg-bg text-muted'
                    }`}
                  >
                    {i < stepIndex ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`hidden text-sm font-medium sm:inline ${i === stepIndex ? '' : 'text-muted'}`}>
                    {label}
                  </span>
                  {i < steps.length - 1 && (
                    <span className={`h-0.5 flex-1 rounded-full ${i < stepIndex ? 'bg-brand' : 'bg-line/40'}`} />
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm font-medium text-muted">
              {t('stepOf', { n: stepIndex + 1 })} · {steps[stepIndex]}
            </p>
          </div>

          <section className="card p-6 sm:p-8" aria-labelledby="pay-step-heading">
            <h2
              id="pay-step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mb-6 text-xl font-semibold outline-none"
            >
              {step === 'review' ? t('reviewHeading') : step === 'done' ? t('doneHeading') : steps[0]}
            </h2>

            {step === 'details' && (
              <form noValidate onSubmit={onSubmit} className="grid grid-cols-[minmax(0,1fr)] gap-5">
                <ErrorSummary errors={summaryErrors} />

                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted">{t('recentPayees')}</h3>
                  <ul className="flex gap-3 overflow-x-auto pb-1">
                    {recent.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          aria-pressed={payeeId === p.id}
                          onClick={() => choosePayee(p.id)}
                          className="flex w-20 flex-col items-center gap-1.5 rounded-2xl p-2 text-center text-xs font-medium hover:bg-surface aria-pressed:bg-brand/10 aria-pressed:text-brand"
                        >
                          <Avatar name={p.name} size={44} />
                          <span className="line-clamp-2">{p.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <Combobox
                  id="pay-to"
                  label={t('to')}
                  hint={t('toHint')}
                  placeholder={t('toPlaceholder')}
                  items={payees}
                  getKey={(p: Payee) => p.id}
                  getLabel={(p: Payee) => p.name}
                  filter={(p: Payee, q) => `${p.name} ${p.detail}`.toLowerCase().includes(q.trim().toLowerCase())}
                  renderOption={(p: Payee) => (
                    <>
                      <Avatar name={p.name} size={36} />
                      <span className="grid">
                        <span>{p.name}</span>
                        <span className="text-sm font-normal text-muted">{p.detail}</span>
                      </span>
                    </>
                  )}
                  value={payeeId}
                  onValueChange={(key) => choosePayee(key)}
                  error={errors.payee}
                  required
                />
                <Select label={t('from')} value={fromId} onChange={(e) => setFromId(e.target.value as Account['id'])}>
                  {sources.map((a) => (
                    <option key={a.id} value={a.id}>
                      {t(a.id)} ···· {a.number.slice(-4)} — {fmt(a.balance)}
                    </option>
                  ))}
                </Select>
                <AmountInput
                  id="pay-amount"
                  className="amount-hero"
                  label={t('amountLabel')}
                  hint={t('amountHint', { available: fmt(from.balance), limit: fmt(dailyLimit) })}
                  value={amount}
                  onValueChange={(v) => {
                    setAmount(v);
                    if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
                  }}
                  error={errors.amount}
                  required
                />
                <TextField
                  label={t('reference')}
                  hint={t('referenceHint')}
                  maxLength={35}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <div className="pt-1">
                  <Button type="submit" size="lg" className="w-full sm:w-auto" trackId="transfer-continue">
                    {t('continue')}
                  </Button>
                </div>
              </form>
            )}

            {step === 'review' && payee && amount !== null && (
              <div className="grid gap-6">
                {/* Wise-style breakdown: what leaves, what it costs, what arrives and when, in reading order. */}
                <div className="rounded-2xl border border-line/30 p-5 sm:p-6">
                  <p className="text-sm text-muted">{t('youSend')}</p>
                  <p className="money mt-1 text-[2.5rem] leading-none font-semibold tracking-[-0.03em] sm:text-5xl">
                    <Amount value={amount} />
                  </p>
                  <dl className="review-steps mt-6">
                    <div>
                      <dt>{t('fee')}</dt>
                      <dd className="font-medium text-success">{t('noFee')}</dd>
                    </div>
                    <div>
                      <dt>{t('theyReceive', { name: payee.name })}</dt>
                      <dd className="money font-semibold">{fmt(amount)}</dd>
                    </div>
                    <div>
                      <dt>{t('arrives')}</dt>
                      <dd className="font-medium">{t('instantly', { rail: market.rail })}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
                  <Avatar name={payee.name} size={48} />
                  <div className="min-w-0">
                    <p className="font-semibold">{payee.name}</p>
                    <p className="truncate text-sm text-muted">{payee.detail}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-3 text-[0.9375rem]">
                  <dt className="text-muted">{t('from')}</dt>
                  <dd className="m-0 text-right">
                    {t(from.id)} ···· {from.number.slice(-4)}
                  </dd>
                  {reference.trim() && (
                    <>
                      <dt className="text-muted">{t('referenceShort')}</dt>
                      <dd className="m-0 text-right">{reference.trim()}</dd>
                    </>
                  )}
                  <dt className="text-muted">{t('totalDebit', { account: t(from.id) })}</dt>
                  <dd className="money m-0 text-right font-semibold">{fmt(amount)}</dd>
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => goTo('details')}>
                    {t('back')}
                  </Button>
                  <Button size="lg" onClick={() => setApproving(true)} trackId="transfer-confirm">
                    <ShieldCheck aria-hidden="true" size={18} />
                    {t('confirmSend')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'done' && receipt && payee && amount !== null && (
              <div className="grid gap-6">
                <div className="grid justify-items-center gap-3 text-center">
                  <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-success text-bg">
                    <Check size={32} strokeWidth={3} />
                  </span>
                  <p className="money text-[2.75rem] leading-none font-semibold tracking-[-0.03em]">
                    <Amount value={amount} />
                  </p>
                  <p className="text-muted">{t('doneTo', { name: payee.name })}</p>
                </div>
                <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-3 rounded-2xl bg-surface p-5 text-[0.9375rem]">
                  <dt className="text-muted">{t('status')}</dt>
                  <dd className="m-0 text-right">
                    <Badge tone="success">{t('completed')}</Badge>
                  </dd>
                  <dt className="text-muted">{t('referenceNo')}</dt>
                  <dd className="money m-0 text-right font-semibold">{receipt.ref}</dd>
                  <dt className="text-muted">{t('when')}</dt>
                  <dd className="m-0 text-right">
                    {receipt.at.toLocaleString(market.locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </dd>
                  <dt className="text-muted">{t('from')}</dt>
                  <dd className="m-0 text-right">
                    {t(from.id)} ···· {from.number.slice(-4)}
                    <span className="block text-sm text-muted">{money(from.balance)}</span>
                  </dd>
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={reset}>{t('another')}</Button>
                  <Button variant="secondary" onClick={share}>
                    {t('share')}
                  </Button>
                  <Button variant="ghost" onClick={() => (location.hash = href('home'))}>
                    {t('toHome')}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Context beside the form on wide screens: how much can still go out today, and what went out lately. */}
        <aside aria-label={t('dailyLimitTitle')} className="grid grid-cols-[minmax(0,1fr)] content-start gap-6">
          <Panel title={t('dailyLimitTitle')}>
            <p className="money text-2xl font-semibold tracking-tight">
              <Amount value={Math.max(dailyLimit - sentToday, 0)} />
            </p>
            <p className="mt-1 text-sm text-muted">{t('limitLeft')}</p>
            <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-line/20">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(sentToday / dailyLimit, 1) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {t('limitUsed', { used: money(sentToday), limit: money(dailyLimit) })}
            </p>
          </Panel>
          {recentPayments.length > 0 && (
            <Panel title={t('recentPayments')}>
              <ul className="divide-y divide-line/20">
                {recentPayments.map((x) => (
                  <li key={x.id}>
                    <TxnRow txn={x} onSelect={openTxn} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      <Dialog
        open={approving}
        onClose={() => !verifying && setApproving(false)}
        title={t('approveTitle')}
        description={t('approveDesc')}
      >
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void approve();
          }}
        >
          <OTPInput
            label={t('otpLabel')}
            value={otp}
            onValueChange={(v) => {
              setOtp(v);
              setOtpError(undefined);
            }}
            onComplete={(code) => void approve(code)}
            error={otpError}
            resendAfter={30}
            onResend={() => toast({ title: t('codeResent'), description: '•••• 4321' })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setApproving(false)} disabled={verifying}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={verifying}>
              {t('approve')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
