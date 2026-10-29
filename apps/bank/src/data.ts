/**
 * Mock data for Orchid Bank, a fictional bank. Everything is generated per market from SGD base
 * amounts so the five markets look realistic without five hand-written data sets.
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
  /** The signed-in (fictional) customer's first name. */
  customer: string;
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

export interface Account {
  id: string;
  name: string;
  number: string;
  /** Minor units. */
  balance: number;
  kind: 'everyday' | 'savings' | 'card';
}

export interface Payee {
  id: string;
  name: string;
  detail: string;
}

export interface Txn {
  id: string;
  date: string;
  desc: string;
  category: Category;
  amount: number;
  status: 'posted' | 'pending';
}

export type Category = 'income' | 'groceries' | 'dining' | 'transport' | 'bills' | 'shopping' | 'transfer';

const PAYEES: Record<Market['code'], [string, string][]> = {
  SG: [
    ['Tan Wei Ling', 'Orchid Bank ···· 4821'],
    ['Lim Jia Hui', 'PayNow +65 •••• 0193'],
    ['Rahman bin Ismail', 'Orchid Bank ···· 7730'],
    ['Priya Nair', 'PayNow +65 •••• 5512'],
    ['SP Group', 'UEN 199504470N · Utilities'],
  ],
  HK: [
    ['陳大文', 'FPS +852 •••• 3381'],
    ['李嘉欣', 'Orchid Bank ···· 2290'],
    ['黃志強', 'FPS +852 •••• 7765'],
    ['中華電力 CLP', '商戶編號 0021 · 電費'],
  ],
  TW: [
    ['林志明', 'Orchid Bank ···· 5521'],
    ['陳怡君', '轉帳 ···· 8830'],
    ['王建宏', '轉帳 ···· 1147'],
    ['台灣電力公司', '電號 01-2345-67 · 電費'],
  ],
  ID: [
    ['Budi Santoso', 'BI-FAST ···· 6612'],
    ['Siti Rahmawati', 'Orchid Bank ···· 3309'],
    ['Agus Pratama', 'BI-FAST ···· 9017'],
    ['PLN', 'ID pelanggan 5321 · Listrik'],
  ],
  IN: [
    ['Priya Nair', 'UPI priya@orchid'],
    ['Arjun Mehta', 'Orchid Bank ···· 4410'],
    ['Kavya Reddy', 'UPI kavya@orchid'],
    ['Tata Power', 'Consumer 55120 · Electricity'],
  ],
};

const MERCHANTS: Record<Market['code'], Record<Exclude<Category, 'income' | 'transfer'>, string>> = {
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

/** [days ago, category, SGD amount, status] */
const TXN_PLAN: [number, Exclude<Category, 'transfer'>, number, Txn['status']][] = [
  [0, 'dining', -6.8, 'pending'],
  [0, 'transport', -14.9, 'pending'],
  [1, 'groceries', -86.4, 'posted'],
  [2, 'income', 5200, 'posted'],
  [3, 'shopping', -129, 'posted'],
  [4, 'bills', -135.2, 'posted'],
  [5, 'dining', -42.5, 'posted'],
  [6, 'groceries', -61.15, 'posted'],
  [8, 'transport', -22.4, 'posted'],
  [9, 'shopping', -58.9, 'posted'],
];

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

export function seed(market: Market, digits: number) {
  const amt = (sgd: number) => localAmount(market, sgd, digits);
  const accounts: Account[] = [
    { id: 'everyday', name: 'everyday', number: '0123456789', balance: amt(12480.55), kind: 'everyday' },
    { id: 'savings', name: 'savings', number: '0123998877', balance: amt(48210), kind: 'savings' },
    { id: 'card', name: 'card', number: '4539112233445566', balance: amt(-1320.4), kind: 'card' },
  ];
  const payees: Payee[] = PAYEES[market.code].map(([name, detail], i) => ({ id: `p${i}`, name, detail }));
  const txns: Txn[] = TXN_PLAN.map(([days, category, sgd, status], i) => ({
    id: `t${i}`,
    date: isoDaysAgo(days),
    desc:
      category === 'income'
        ? market.lang === 'en'
          ? 'Salary — Acme Pte Ltd'
          : market.lang === 'id'
            ? 'Gaji — Acme'
            : '薪資 — Acme'
        : MERCHANTS[market.code][category],
    category,
    amount: amt(sgd),
    status,
  }));
  return { accounts, payees, txns, dailyLimit: amt(market.dailyLimitSgd) };
}
