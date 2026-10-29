import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Locale, currency and the library's own words (button labels, announcements) for one market.
 *
 *   <KitProvider locale="zh-HK" currency="HKD">…</KitProvider>
 *
 * Without a provider everything is English, en-SG, SGD. Apps translate their own content;
 * this only covers text the components write themselves.
 */

const en = {
  'toast.region': 'Notifications',
  'toast.dismiss': 'Dismiss: {title}',
  'errorSummary.title': 'There is a problem',
  'errorSummary.count': '{count, plural, one {# error} other {# errors}}',
  'alert.info': 'Information',
  'alert.success': 'Success',
  'alert.warning': 'Warning',
  'alert.danger': 'Error',
  'amount.invalid': 'Enter an amount like {example}',
  'amount.currency': 'Currency: {currency}',
  'otp.resend': 'Resend code',
  'otp.resendIn': 'Resend code in {seconds}s',
  'otp.canResend': 'You can now request a new code',
  'otp.sent': 'A new code has been sent',
  'combobox.showOptions': 'Show options',
  'combobox.results': '{count, plural, =0 {No results} one {# result available} other {# results available}}',
  'combobox.empty': 'No matches',
  'masked.show': 'Show {label}',
  'masked.endingIn': '{label} ending {last}',
  'table.sortedBy': 'Sorted by {column}, {direction}',
  'table.ascending': 'ascending',
  'table.descending': 'descending',
  'table.empty': 'Nothing to show',
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

const zhHant: Messages = {
  'toast.region': '通知',
  'toast.dismiss': '關閉：{title}',
  'errorSummary.title': '請修正以下問題',
  'errorSummary.count': '{count} 個錯誤',
  'alert.info': '資訊',
  'alert.success': '成功',
  'alert.warning': '注意',
  'alert.danger': '錯誤',
  'amount.invalid': '請輸入金額，例如 {example}',
  'amount.currency': '幣種：{currency}',
  'otp.resend': '重新發送驗證碼',
  'otp.resendIn': '{seconds} 秒後可重新發送',
  'otp.canResend': '現在可以重新發送驗證碼',
  'otp.sent': '已發送新的驗證碼',
  'combobox.showOptions': '顯示選項',
  'combobox.results': '{count, plural, =0 {沒有結果} other {共 # 個結果}}',
  'combobox.empty': '沒有符合的項目',
  'masked.show': '顯示{label}',
  'masked.endingIn': '{label}尾號 {last}',
  'table.sortedBy': '按{column}{direction}排列',
  'table.ascending': '升序',
  'table.descending': '降序',
  'table.empty': '沒有資料',
};

const id: Messages = {
  'toast.region': 'Notifikasi',
  'toast.dismiss': 'Tutup: {title}',
  'errorSummary.title': 'Ada masalah',
  'errorSummary.count': '{count} kesalahan',
  'alert.info': 'Informasi',
  'alert.success': 'Berhasil',
  'alert.warning': 'Perhatian',
  'alert.danger': 'Kesalahan',
  'amount.invalid': 'Masukkan jumlah seperti {example}',
  'amount.currency': 'Mata uang: {currency}',
  'otp.resend': 'Kirim ulang kode',
  'otp.resendIn': 'Kirim ulang kode dalam {seconds} detik',
  'otp.canResend': 'Sekarang Anda dapat meminta kode baru',
  'otp.sent': 'Kode baru telah dikirim',
  'combobox.showOptions': 'Tampilkan pilihan',
  'combobox.results': '{count, plural, =0 {Tidak ada hasil} other {# hasil tersedia}}',
  'combobox.empty': 'Tidak ada yang cocok',
  'masked.show': 'Tampilkan {label}',
  'masked.endingIn': '{label} berakhiran {last}',
  'table.sortedBy': 'Diurutkan menurut {column}, {direction}',
  'table.ascending': 'naik',
  'table.descending': 'turun',
  'table.empty': 'Tidak ada data',
};

/** Built-in catalogues, picked by language: zh-HK / zh-TW -> zh-Hant, id-ID -> id, otherwise English. */
export const catalogues: Record<'en' | 'zh-Hant' | 'id', Messages> = { en, 'zh-Hant': zhHant, id };

function catalogueFor(locale: string): Messages {
  const lang = locale.toLowerCase();
  if (lang.startsWith('zh')) return zhHant;
  if (lang.startsWith('id')) return id;
  return en;
}

/**
 * Minimal ICU-style formatting: {name} and {count, plural, =0 {…} one {…} other {…}} with #.
 * Enough for the library's own strings without shipping a full i18n runtime.
 */
function format(template: string, vars: Record<string, string | number>, locale: string): string {
  const plural = /\{(\w+), plural, ((?:[^{}]*\{[^{}]*\})+)\s*\}/g;
  const withPlurals = template.replace(plural, (_, name: string, body: string) => {
    const n = Number(vars[name]);
    const cases = Object.fromEntries([...body.matchAll(/(=\d+|\w+)\s*\{([^{}]*)\}/g)].map((m) => [m[1], m[2]]));
    const chosen = cases[`=${n}`] ?? cases[new Intl.PluralRules(locale).select(n)] ?? cases.other ?? '';
    return chosen.replace(/#/g, new Intl.NumberFormat(locale).format(n));
  });
  return withPlurals.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export interface KitContextValue {
  locale: string;
  currency: string;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** Number of decimal places for a currency in this locale: SGD 2, IDR 0, JPY 0. */
  currencyDigits: (currency?: string) => number;
  /** Minor units (cents) -> "S$1,234.50". `display: 'code'` -> "SGD 1,234.50". */
  formatMoney: (
    minor: number,
    options?: {
      currency?: string;
      display?: 'symbol' | 'code' | 'none';
      signDisplay?: Intl.NumberFormatOptions['signDisplay'];
    },
  ) => string;
  /** Locale text -> minor units, or null if it isn't a valid amount. Exact: no floating point. */
  parseMoney: (text: string, currency?: string) => number | null;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** "Singapore dollars", "港元" */
  currencyName: (currency?: string) => string;
  /** The locale's digit-group and decimal signs: { group: ',', decimal: '.' } in en-SG. */
  separators: { group: string; decimal: string };
}

function createKit(locale: string, currency: string, overrides?: Partial<Messages>): KitContextValue {
  const messages = { ...catalogueFor(locale), ...overrides };
  const digitsCache = new Map<string, number>();
  const currencyDigits = (cur = currency) => {
    if (!digitsCache.has(cur)) {
      digitsCache.set(
        cur,
        new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).resolvedOptions().maximumFractionDigits ??
          2,
      );
    }
    return digitsCache.get(cur)!;
  };
  // Separators come from the locale itself: "1.234,5" in id-ID, "1,234.5" in en-SG.
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';

  return {
    locale,
    currency,
    separators: { group, decimal },
    t: (key, vars = {}) => format(messages[key], vars, locale),
    currencyDigits,
    formatMoney: (minor, { currency: cur = currency, display = 'symbol', signDisplay } = {}) => {
      const digits = currencyDigits(cur);
      const nf = new Intl.NumberFormat(locale, {
        ...(display === 'none'
          ? { minimumFractionDigits: digits, maximumFractionDigits: digits }
          : { style: 'currency', currency: cur, currencyDisplay: display }),
        signDisplay,
      });
      return nf.format(minor / 10 ** digits);
    },
    parseMoney: (text, cur = currency) => {
      const digits = currencyDigits(cur);
      const cleaned = text.trim().replaceAll(group, '').replaceAll(/\s/g, '').replace(decimal, '.');
      const match = /^(\d+)(?:\.(\d*))?$/.exec(cleaned);
      if (!match) return null;
      const [, whole, frac = ''] = match;
      if (frac.length > digits) return null;
      // String arithmetic: "19.99" -> 1999, never 1998.9999999.
      return Number(whole + frac.padEnd(digits, '0'));
    },
    formatDate: (date, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
      const d = typeof date === 'string' ? new Date(date.length === 10 ? `${date}T00:00` : date) : date;
      return d.toLocaleDateString(locale, options);
    },
    currencyName: (cur = currency) => {
      try {
        return new Intl.DisplayNames(locale, { type: 'currency' }).of(cur) ?? cur;
      } catch {
        return cur;
      }
    },
  };
}

const defaultKit = createKit('en-SG', 'SGD');
const KitContext = createContext<KitContextValue>(defaultKit);

export interface KitProviderProps {
  locale?: string;
  currency?: string;
  /** Override or add to the built-in strings, e.g. for a language we don't ship. */
  messages?: Partial<Messages>;
  children: ReactNode;
}

export function KitProvider({ locale = 'en-SG', currency = 'SGD', messages, children }: KitProviderProps) {
  const value = useMemo(() => createKit(locale, currency, messages), [locale, currency, messages]);
  return <KitContext.Provider value={value}>{children}</KitContext.Provider>;
}

/** Locale-aware helpers and the library's translated strings. Works without a provider (en-SG, SGD). */
export function useKit(): KitContextValue {
  return useContext(KitContext);
}
