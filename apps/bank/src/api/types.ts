import type { Account, Bill, CardInfo, Goal, Payee, Txn } from '../data';

export type CardState = 'active' | 'frozen' | 'blocked';

/** GET /api/:market/overview: everything the signed-in customer sees, in minor units. */
export interface Overview {
  accounts: Account[];
  payees: Payee[];
  txns: Txn[];
  bills: Bill[];
  card: CardInfo;
  cardState: CardState;
  history: number[];
  goals: Goal[];
  lastMonth: Record<string, number>;
  dailyLimit: number;
}

export interface TransferRequest {
  fromId: Account['id'];
  payeeId: string;
  amount: number;
  reference: string;
}

/** POST /api/:market/transfers: the receipt. Dates travel as ISO strings. */
export interface ReceiptDto {
  txn: Txn;
  ref: string;
  at: string;
}

/** RFC 9457 problem details, as the API returns them. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    detail: string,
  ) {
    super(detail);
  }
}
