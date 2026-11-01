import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SavingsChartProps {
  principal: number;
  years: number;
  rate: number;
  typicalRate: number;
  /** Accessible name; the figures it shows are also stated in text beside it. */
  label: string;
  orchidLabel: string;
  typicalLabel: string;
  format: (minor: number) => string;
}

/** Interest earned month by month at Orchid's rate against a typical account (Recharts). */
export function SavingsChart({
  principal,
  years,
  rate,
  typicalRate,
  label,
  orchidLabel,
  typicalLabel,
  format,
}: SavingsChartProps) {
  const data = Array.from({ length: years * 12 + 1 }, (_, m) => ({
    m,
    orchid: Math.round(principal * ((1 + rate / 12) ** m - 1)),
    typical: Math.round(principal * ((1 + typicalRate / 12) ** m - 1)),
  }));
  return (
    <figure className="mt-5" role="img" aria-label={label}>
      <div className="h-36" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart accessibilityLayer={false} data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="save-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--kit-brand-accent)" stopOpacity={0.4} />
                <stop offset="1" stopColor="var(--kit-brand-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" hide />
            <YAxis hide domain={[0, 'dataMax']} />
            <Tooltip
              cursor={{ stroke: 'rgb(255 255 255 / 0.4)' }}
              contentStyle={{ borderRadius: 12, border: 0, color: 'var(--kit-text)' }}
              labelFormatter={(m) => `${m} mo`}
              formatter={(v, name) => [format(Number(v)), name === 'orchid' ? orchidLabel : typicalLabel]}
            />
            <Area
              type="monotone"
              dataKey="typical"
              stroke="rgb(255 255 255 / 0.55)"
              strokeDasharray="5 5"
              strokeWidth={2}
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="orchid"
              stroke="var(--kit-brand-accent)"
              strokeWidth={2.5}
              fill="url(#save-fill)"
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption aria-hidden="true" className="mt-2 flex gap-5 text-xs opacity-85">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-brand-accent" />
          {orchidLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-white/60" />
          {typicalLabel}
        </span>
      </figcaption>
    </figure>
  );
}
