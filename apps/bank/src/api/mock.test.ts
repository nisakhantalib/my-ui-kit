import { describe, expect, it } from 'vitest';
import { api } from './client';
import { ApiError } from './types';

// Each test uses its own market: the mock server keeps one customer profile per market.
describe('banking API (mock server)', () => {
  it('returns the overview in minor units, with server-owned card state', async () => {
    const overview = await api.overview('SG');
    expect(overview.accounts.map((a) => a.id)).toEqual(['everyday', 'savings', 'card']);
    expect(overview.accounts[0]!.balance).toBe(1_248_055);
    expect(overview.cardState).toBe('active');
  });

  it('debits the account, records the transaction and settles a paid bill', async () => {
    const before = await api.overview('HK');
    const biller = before.payees.find((p) => p.kind === 'biller')!;
    const receipt = await api.transfer('HK', { fromId: 'everyday', payeeId: biller.id, amount: 100, reference: '' });
    expect(receipt.ref).toMatch(/^OB\d{9}$/);
    const after = await api.overview('HK');
    expect(after.accounts[0]!.balance).toBe(before.accounts[0]!.balance - 100);
    expect(after.txns[0]).toMatchObject({ desc: biller.name, amount: -100, category: 'bills' });
    expect(after.bills.some((b) => b.payeeId === biller.id)).toBe(false);
  });

  it('refuses a transfer the account cannot cover, as a problem response', async () => {
    const { payees, accounts } = await api.overview('TW');
    const error = await api
      .transfer('TW', { fromId: 'everyday', payeeId: payees[0]!.id, amount: accounts[0]!.balance + 1, reference: '' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: 'insufficient_funds' });
  });

  it('keeps a blocked card blocked', async () => {
    await api.setCardState('ID', 'blocked');
    await expect(api.setCardState('ID', 'active')).rejects.toMatchObject({ status: 409, code: 'card_blocked' });
  });
});
