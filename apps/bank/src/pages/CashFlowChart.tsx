import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export interface CashFlowMonth {
  label: string;
  moneyIn: number;
  moneyOut: number;
}

/**
 * Money in against money out per month (Recharts), lazy-loaded with the Activity page. The bars
 * are one labelled image; the same figures are listed as text in the table beside it.
 */
export function CashFlowChart({
  months,
  label,
  inLabel,
  outLabel,
  format,
}: {
  months: CashFlowMonth[];
  label: string;
  inLabel: string;
  outLabel: string;
  format: (minor: number) => string;
}) {
  return (
    <div role="img" aria-label={label} className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer={false} data={months} barGap={3} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--kit-border) 25%, transparent)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--kit-text-muted)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--kit-border) 12%, transparent)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid color-mix(in srgb, var(--kit-border) 30%, transparent)',
              background: 'var(--kit-bg)',
              color: 'var(--kit-text)',
            }}
            formatter={(v, name) => [format(Number(v)), name === 'moneyIn' ? inLabel : outLabel]}
          />
          <Bar dataKey="moneyIn" fill="var(--kit-success)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="moneyOut" fill="var(--kit-text)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
