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
import { useBank, type Receipt } from './bank';
import type { Payee } from './data';

type Step = 'details' | 'review' | 'done';
type Errors = Partial<Record<'payee' | 'amount', string>>;

const DEMO_CODE = '123456';

/** "Rahman bin Ismail" -> "RI": skip lowercase particles (bin, binti, van). CJK names -> first character. */
const initials = (name: string) => {
  const words = name.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w));
  return (words.length ? words : [name])
    .map((w) => [...w][0])
    .slice(0, 2)
    .join('');
};

export function Pay() {
  const { t, market, accounts, payees, dailyLimit, money, transfer } = useBank();
  const kit = useKit();
  const toast = useToast();
  const track = useTrack();

  const sources = accounts.filter((a) => a.kind !== 'card');
  const [step, setStep] = useState<Step>('details');
  const [fromId, setFromId] = useState(sources[0]!.id);
  const [payeeId, setPayeeId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
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
    try {
      if (navigator.share) await navigator.share({ title: t('brand'), text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: t('copied'), tone: 'success' });
      }
    } catch {
      /* share sheet closed */
    }
  }

  const stepIndex = { details: 1, review: 2, done: 3 }[step];
  const stepTitle = { details: t('stepDetails'), review: t('stepReview'), done: t('stepDone') }[step];
  const summaryErrors = submitted
    ? (Object.entries(errors) as [keyof Errors, string][])
        .filter(([, m]) => m)
        .map(([k, m]) => ({ id: k === 'payee' ? 'pay-to' : 'pay-amount', message: m }))
    : [];

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none sm:text-4xl">
          {t('payTitle')}
        </h1>
        <p className="mt-1 text-muted">{t('payIntro', { rail: market.rail })}</p>
      </div>

      {/* A visual progress bar; the step is also stated in text for everyone. */}
      <div>
        <div className="flex gap-2" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= stepIndex ? 'bg-brand' : 'bg-surface'}`} />
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold text-muted">
          {t('stepOf', { n: stepIndex })} · {stepTitle}
        </p>
      </div>

      <section className="card p-6 sm:p-8" aria-labelledby="pay-step-heading">
        <h2 id="pay-step-heading" ref={headingRef} tabIndex={-1} className="mb-6 text-xl font-bold outline-none">
          {step === 'review' ? t('reviewHeading') : step === 'done' ? t('doneHeading') : stepTitle}
        </h2>

        {step === 'details' && (
          <form noValidate onSubmit={onSubmit} className="grid gap-5">
            <ErrorSummary errors={summaryErrors} />
            <Select label={t('from')} value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {sources.map((a) => (
                <option key={a.id} value={a.id}>
                  {t(a.kind)} ···· {a.number.slice(-4)} — {fmt(a.balance)}
                </option>
              ))}
            </Select>
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
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-sm font-bold text-brand"
                  >
                    {initials(p.name)}
                  </span>
                  <span className="grid">
                    <span>{p.name}</span>
                    <span className="text-sm font-normal text-muted">{p.detail}</span>
                  </span>
                </>
              )}
              value={payeeId}
              onValueChange={(key) => {
                setPayeeId(key);
                if (errors.payee) setErrors((e) => ({ ...e, payee: undefined }));
              }}
              error={errors.payee}
              required
            />
            <AmountInput
              id="pay-amount"
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
            <div>
              <Button type="submit" size="lg" trackId="transfer-continue">
                {t('continue')}
              </Button>
            </div>
          </form>
        )}

        {step === 'review' && payee && amount !== null && (
          <div className="grid gap-6">
            <p className="money text-4xl font-bold">{fmt(amount)}</p>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
              <dt className="font-semibold text-muted">{t('to')}</dt>
              <dd className="m-0">
                {payee.name}
                <span className="block text-sm text-muted">{payee.detail}</span>
              </dd>
              <dt className="font-semibold text-muted">{t('from')}</dt>
              <dd className="m-0">
                {t(from.kind)} ···· {from.number.slice(-4)}
              </dd>
              {reference.trim() && (
                <>
                  <dt className="font-semibold text-muted">{t('referenceShort')}</dt>
                  <dd className="m-0">{reference.trim()}</dd>
                </>
              )}
              <dt className="font-semibold text-muted">{t('arrives')}</dt>
              <dd className="m-0">{t('instantly', { rail: market.rail })}</dd>
              <dt className="font-semibold text-muted">{t('fee')}</dt>
              <dd className="m-0">{t('noFee')}</dd>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => goTo('details')}>
                {t('back')}
              </Button>
              <Button size="lg" onClick={() => setApproving(true)} trackId="transfer-confirm">
                {t('confirmSend')}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && receipt && payee && amount !== null && (
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-success text-2xl font-bold text-bg"
              >
                ✓
              </span>
              <div>
                <p className="money text-3xl font-bold">{fmt(amount)}</p>
                <p className="text-muted">{t('doneTo', { name: payee.name })}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 rounded-[var(--kit-radius)] bg-surface p-4">
              <dt className="font-semibold text-muted">{t('status')}</dt>
              <dd className="m-0">
                <Badge tone="success">{t('completed')}</Badge>
              </dd>
              <dt className="font-semibold text-muted">{t('referenceNo')}</dt>
              <dd className="money m-0 font-semibold">{receipt.ref}</dd>
              <dt className="font-semibold text-muted">{t('when')}</dt>
              <dd className="m-0">
                {receipt.at.toLocaleString(market.locale, { dateStyle: 'medium', timeStyle: 'short' })}
              </dd>
              <dt className="font-semibold text-muted">{t('from')}</dt>
              <dd className="m-0">
                {t(from.kind)} ···· {from.number.slice(-4)} · {money(from.balance)}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset}>{t('another')}</Button>
              <Button variant="secondary" onClick={share}>
                {t('share')}
              </Button>
              <Button variant="ghost" onClick={() => (location.hash = '#/')}>
                {t('toOverview')}
              </Button>
            </div>
          </div>
        )}
      </section>

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
            onResend={() => toast({ title: t('approveTitle'), description: '•••• 4321' })}
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
