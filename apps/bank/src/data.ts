/**
 * Mock data for Orchid Bank, a fictional bank. Everything is generated per market from SGD base
 * amounts, so the five markets look realistic without five hand-written data sets.
 * Amounts are integers in minor units throughout, as they would be from a real banking API.
 */

export type Lang = 'en' | 'zh-Hant' | 'id';

export interface Market {
  code: 'SG' | 'HK' | 'TW' | 'ID' | 'IN';
  name: string;
  locale: string;
  currency: string;
  lang: Lang;
  /** Local instant-payment rail, shown on payees and receipts. */
  rail: string;
  /** How many units of this currency one SGD buys (rough, for mock data only). */
  rate: number;
  dailyLimitSgd: number;
  /** The signed-in (fictional) customer. */
  customer: string;
  customerFull: string;
}

export const MARKETS: Market[] = [
  {
    code: 'SG',
    name: 'Singapore · English',
    locale: 'en-SG',
    currency: 'SGD',
    lang: 'en',
    rail: 'PayNow',
    rate: 1,
    dailyLimitSgd: 5000,
    customer: 'Wei Ling',
    customerFull: 'Tan Wei Ling',
  },
  {
    code: 'HK',
    name: '香港 · 繁體中文',
    locale: 'zh-HK',
    currency: 'HKD',
    lang: 'zh-Hant',
    rail: 'FPS 轉數快',
    rate: 5.8,
    dailyLimitSgd: 5000,
    customer: '嘉欣',
    customerFull: '李嘉欣',
  },
  {
    code: 'TW',
    name: '台灣 · 繁體中文',
    locale: 'zh-TW',
    currency: 'TWD',
    lang: 'zh-Hant',
    rail: '即時轉帳',
    rate: 24,
    dailyLimitSgd: 5000,
    customer: '怡君',
    customerFull: '陳怡君',
  },
  {
    code: 'ID',
    name: 'Indonesia · Bahasa',
    locale: 'id-ID',
    currency: 'IDR',
    lang: 'id',
    rail: 'BI-FAST',
    rate: 12000,
    dailyLimitSgd: 4000,
    customer: 'Siti',
    customerFull: 'Siti Rahmawati',
  },
  {
    code: 'IN',
    name: 'India · English',
    locale: 'en-IN',
    currency: 'INR',
    lang: 'en',
    rail: 'UPI',
    rate: 64,
    dailyLimitSgd: 2000,
    customer: 'Priya',
    customerFull: 'Priya Nair',
  },
];

/** SGD amount -> this market's minor units, rounded to a figure a person would plausibly see. */
export function localAmount(market: Market, sgd: number, digits: number): number {
  if (market.rate === 1) return Math.round(sgd * 10 ** digits);
  // Three significant figures: S$86.40 -> HK$501, Rp1.040.000, ₹5,530.
  const major = sgd * market.rate;
  const step = 10 ** (Math.floor(Math.log10(Math.abs(major))) - 2);
  return Math.round(Math.round(major / step) * step * 10 ** digits);
}

export type Category = 'income' | 'groceries' | 'dining' | 'transport' | 'bills' | 'shopping' | 'transfer';
export const SPEND_CATEGORIES: Exclude<Category, 'income' | 'transfer'>[] = [
  'shopping',
  'groceries',
  'bills',
  'dining',
  'transport',
];

export interface Account {
  id: 'everyday' | 'savings' | 'card';
  number: string;
  /** Minor units. Negative for the card: what is owed. */
  balance: number;
}

export interface Payee {
  id: string;
  name: string;
  detail: string;
  kind: 'person' | 'biller';
}

export interface Txn {
  id: string;
  date: string;
  desc: string;
  category: Category;
  amount: number;
  status: 'posted' | 'pending';
  account: 'everyday' | 'card';
  /** Local time of day, for the detail view. */
  time: string;
}

export interface Goal {
  id: 'travel' | 'home' | 'safety';
  saved: number;
  target: number;
}

export interface Bill {
  id: string;
  payeeId: string;
  dueInDays: number;
  amount: number;
}

export interface CardInfo {
  number: string;
  expiry: string;
  limit: number;
  statementDay: number;
}

const PAYEES: Record<Market['code'], [string, string, Payee['kind']][]> = {
  SG: [
    ['Tan Wei Ling', 'Orchid Bank ···· 4821', 'person'],
    ['Lim Jia Hui', 'PayNow +65 •••• 0193', 'person'],
    ['Rahman bin Ismail', 'Orchid Bank ···· 7730', 'person'],
    ['Priya Nair', 'PayNow +65 •••• 5512', 'person'],
    ['SP Group', 'UEN 199504470N · Utilities', 'biller'],
  ],
  HK: [
    ['陳大文', 'FPS +852 •••• 3381', 'person'],
    ['李嘉欣', 'Orchid Bank ···· 2290', 'person'],
    ['黃志強', 'FPS +852 •••• 7765', 'person'],
    ['中華電力 CLP', '商戶編號 0021 · 電費', 'biller'],
  ],
  TW: [
    ['林志明', 'Orchid Bank ···· 5521', 'person'],
    ['陳怡君', '轉帳 ···· 8830', 'person'],
    ['王建宏', '轉帳 ···· 1147', 'person'],
    ['台灣電力公司', '電號 01-2345-67 · 電費', 'biller'],
  ],
  ID: [
    ['Budi Santoso', 'BI-FAST ···· 6612', 'person'],
    ['Siti Rahmawati', 'Orchid Bank ···· 3309', 'person'],
    ['Agus Pratama', 'BI-FAST ···· 9017', 'person'],
    ['PLN', 'ID pelanggan 5321 · Listrik', 'biller'],
  ],
  IN: [
    ['Priya Nair', 'UPI priya@orchid', 'person'],
    ['Arjun Mehta', 'Orchid Bank ···· 4410', 'person'],
    ['Kavya Reddy', 'UPI kavya@orchid', 'person'],
    ['Tata Power', 'Consumer 55120 · Electricity', 'biller'],
  ],
};

const MERCHANTS: Record<Market['code'], Record<(typeof SPEND_CATEGORIES)[number], string>> = {
  SG: {
    groceries: 'NTUC FairPrice',
    dining: 'Ya Kun Kaya Toast',
    transport: 'Grab',
    bills: 'SP Group',
    shopping: 'Shopee',
  },
  HK: {
    groceries: '百佳 PARKnSHOP',
    dining: '翠華餐廳',
    transport: '港鐵 MTR',
    bills: '中華電力 CLP',
    shopping: 'HKTVmall',
  },
  TW: {
    groceries: '全聯福利中心',
    dining: '鼎泰豐',
    transport: '台北捷運',
    bills: '台灣電力公司',
    shopping: 'momo購物網',
  },
  ID: { groceries: 'Indomaret', dining: 'Kopi Kenangan', transport: 'Gojek', bills: 'PLN', shopping: 'Tokopedia' },
  IN: { groceries: 'BigBasket', dining: 'Swiggy', transport: 'Ola', bills: 'Tata Power', shopping: 'Flipkart' },
};

/** [days ago, category, SGD amount, status, account] */
const TXN_PLAN: [number, Exclude<Category, 'transfer'>, number, Txn['status'], Txn['account']][] = [
  [0, 'dining', -6.8, 'pending', 'card'],
  [0, 'transport', -14.9, 'pending', 'card'],
  [1, 'groceries', -86.4, 'posted', 'everyday'],
  [2, 'income', 5200, 'posted', 'everyday'],
  [3, 'shopping', -129, 'posted', 'card'],
  [4, 'bills', -135.2, 'posted', 'everyday'],
  [5, 'dining', -42.5, 'posted', 'card'],
  [6, 'groceries', -61.15, 'posted', 'everyday'],
  [8, 'transport', -22.4, 'posted', 'card'],
  [9, 'shopping', -58.9, 'posted', 'card'],
  [11, 'dining', -18.6, 'posted', 'card'],
  [13, 'groceries', -74.3, 'posted', 'everyday'],
];

const SALARY: Record<Lang, string> = { en: 'Salary · Acme Pte Ltd', 'zh-Hant': '薪資 · Acme', id: 'Gaji · Acme' };

const isoDaysAgo = (days: number, now: number) => new Date(now - days * 86_400_000).toISOString().slice(0, 10);

export function seed(market: Market, digits: number, now = Date.now()) {
  const amt = (sgd: number) => localAmount(market, sgd, digits);
  const accounts: Account[] = [
    { id: 'everyday', number: '0123456789', balance: amt(12480.55) },
    { id: 'savings', number: '0123998877', balance: amt(48210) },
    { id: 'card', number: '4539112233445566', balance: amt(-1320.4) },
  ];
  const payees: Payee[] = PAYEES[market.code].map(([name, detail, kind], i) => ({ id: `p${i}`, name, detail, kind }));
  const txns: Txn[] = TXN_PLAN.map(([days, category, sgd, status, account], i) => ({
    id: `t${i}`,
    date: isoDaysAgo(days, now),
    desc: category === 'income' ? SALARY[market.lang] : MERCHANTS[market.code][category],
    category,
    amount: amt(sgd),
    status,
    account,
    time: `${String(8 + ((i * 5) % 12)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
  }));
  const biller = payees.find((p) => p.kind === 'biller')!;
  const bills: Bill[] = [
    { id: 'b-utility', payeeId: biller.id, dueInDays: 4, amount: amt(142.8) },
    { id: 'b-card', payeeId: 'card', dueInDays: 12, amount: amt(1320.4) },
  ];
  const card: CardInfo = { number: accounts[2]!.number, expiry: '08/29', limit: amt(8000), statementDay: 15 };
  const total = accounts[0]!.balance + accounts[1]!.balance;
  // A year of daily balances ending at today's total: a steady climb, monthly salary steps and
  // small daily spending, so every chart range (7D to 1Y) looks like a real account. Deterministic.
  const days = 365;
  const history = Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    const trend = 0.78 + 0.22 * t ** 1.2;
    const monthly = ((i % 30) / 30) * -0.03; // spending through the month, reset on payday
    const wobble = Math.sin(i * 1.7) * 0.0015 + Math.sin(i / 11) * 0.008;
    return Math.round(total * (trend + monthly + wobble));
  });
  history[days - 1] = total;
  const goals: Goal[] = [
    { id: 'travel', saved: amt(3720), target: amt(6000) },
    { id: 'home', saved: amt(18400), target: amt(60000) },
    { id: 'safety', saved: amt(9100), target: amt(10000) },
  ];
  // Last month's spending per category, for the month-on-month insight.
  const lastMonth: Record<(typeof SPEND_CATEGORIES)[number], number> = {
    shopping: amt(240.5),
    groceries: amt(198.2),
    bills: amt(142.8),
    dining: amt(96.4),
    transport: amt(61.9),
  };
  return { accounts, payees, txns, bills, card, history, goals, lastMonth, dailyLimit: amt(market.dailyLimitSgd) };
}
