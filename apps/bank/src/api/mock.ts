import { http, HttpResponse } from 'msw/http';
import { MARKETS, seed, type Account, type Market, type Txn } from '../data';
import type { CardState, Overview, ReceiptDto, TransferRequest } from './types';

/**
 * The mock banking API (Mock Service Worker). The app talks to it with fetch, exactly as it would
 * to a real gateway: JSON over /api, latency, validation errors and server-owned state. Swapping
 * in a real backend means deleting this file, not changing the app.
 */

interface Db extends Overview {
  sentToday: number;
}

const minorDigits = (currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;

// One customer profile per market, created on first request and kept for the session.
const dbs = new Map<Market['code'], Db>();
function db(code: string): Db | null {
  const market = MARKETS.find((m) => m.code === code);
  if (!market) return null;
  let hit = dbs.get(market.code);
  if (!hit) {
    hit = { ...seed(market, minorDigits(market.currency)), cardState: 'active', sentToday: 0 };
    dbs.set(market.code, hit);
  }
  return hit;
}

const problem = (status: number, code: string, detail: string) =>
  HttpResponse.json({ code, detail }, { status, headers: { 'Content-Type': 'application/problem+json' } });

// Real-world latency, so loading states are designed rather than an afterthought.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const LATENCY = { read: 350, write: 650 };

export const handlers = [
  http.get('/api/:market/overview', async ({ params }) => {
    await delay(LATENCY.read);
    const d = db(String(params.market));
    if (!d) return problem(404, 'unknown_market', 'No such market');
    const { sentToday: _sent, ...overview } = d;
    return HttpResponse.json<Overview>(overview);
  }),

  http.post('/api/:market/transfers', async ({ params, request }) => {
    await delay(LATENCY.write);
    const d = db(String(params.market));
    if (!d) return problem(404, 'unknown_market', 'No such market');
    const body = (await request.json()) as TransferRequest;
    const from = d.accounts.find((a) => a.id === body.fromId && a.id !== 'card');
    const payee = d.payees.find((p) => p.id === body.payeeId);
    if (!from || !payee) return problem(422, 'invalid_transfer', 'Unknown account or payee');
    if (!Number.isInteger(body.amount) || body.amount <= 0)
      return problem(422, 'invalid_amount', 'Amount must be positive');
    if (body.amount > from.balance) return problem(422, 'insufficient_funds', 'Not enough money in the account');
    if (d.sentToday + body.amount > d.dailyLimit) return problem(422, 'over_limit', 'Over the daily limit');

    const now = new Date();
    const txn: Txn = {
      id: `t${now.getTime()}`,
      date: now.toISOString().slice(0, 10),
      desc: body.reference ? `${payee.name} · ${body.reference}` : payee.name,
      category: payee.kind === 'biller' ? 'bills' : 'transfer',
      amount: -body.amount,
      status: 'posted',
      account: 'everyday',
      time: now.toTimeString().slice(0, 5),
    };
    d.accounts = d.accounts.map((a: Account) => (a.id === from.id ? { ...a, balance: a.balance - body.amount } : a));
    d.txns = [txn, ...d.txns];
    d.bills = d.bills.filter((b) => b.payeeId !== payee.id); // paying a biller settles its bill
    d.sentToday += body.amount;
    return HttpResponse.json<ReceiptDto>(
      { txn, ref: `OB${now.getTime().toString().slice(-9)}`, at: now.toISOString() },
      { status: 201 },
    );
  }),

  http.put('/api/:market/card', async ({ params, request }) => {
    await delay(LATENCY.read);
    const d = db(String(params.market));
    if (!d) return problem(404, 'unknown_market', 'No such market');
    const { state } = (await request.json()) as { state: CardState };
    if (d.cardState === 'blocked') return problem(409, 'card_blocked', 'A blocked card cannot be changed');
    d.cardState = state;
    return HttpResponse.json({ state });
  }),
];
