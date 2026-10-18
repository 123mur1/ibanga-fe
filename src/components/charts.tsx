const tones = {
  brand: "bg-brand",
  accent: "bg-brand/70",
  good: "bg-brand/85",
  warn: "bg-brand/50",
  bad: "bg-brand-dark",
  muted: "bg-line",
} as const;

export type MonthPoint = { label: string; value: number };

/** The last `count` calendar months (oldest first), summing `value` of each record into its month. */
export function bucketByMonth<T>(
  records: T[],
  getDate: (record: T) => string | undefined | null,
  getValue: (record: T) => number = () => 1,
  count = 6,
): MonthPoint[] {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));
  const months = Array.from({ length: count }, (_, index) => ({
    label: new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + index, 1)).toLocaleDateString("en", {
      month: "short",
      timeZone: "UTC",
    }),
    value: 0,
  }));
  for (const record of records) {
    const raw = getDate(record);
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const index = (date.getUTCFullYear() - first.getUTCFullYear()) * 12 + date.getUTCMonth() - first.getUTCMonth();
    if (index >= 0 && index < count) months[index].value += getValue(record);
  }
  return months;
}

function CardHeader({ title, caption, badge }: { title: string; caption: string; badge?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-lg text-navy">{title}</h3>
        <p className="mt-1 text-sm text-muted">{caption}</p>
      </div>
      {badge ? <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">{badge}</span> : null}
    </div>
  );
}

export function LineChartCard({
  title,
  caption,
  badge,
  points,
  unit,
}: {
  title: string;
  caption: string;
  badge?: string;
  points: MonthPoint[];
  unit: string;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const coords = points.map((point, index) => ({
    ...point,
    x: 44 + (index * 552) / Math.max(1, points.length - 1),
    y: 166 - (point.value / max) * 126,
  }));
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L596,166 L44,166 Z`;
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
      <CardHeader title={title} caption={caption} badge={badge} />
      <svg
        className="mt-5 h-52 w-full overflow-visible"
        viewBox="0 0 620 190"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}: ${points.map((point) => `${point.label} ${point.value}`).join(", ")}`}
      >
        {[40, 103, 166].map((y) => (
          <line key={y} x1="44" x2="596" y1={y} y2={y} stroke="#d5e0e7" strokeDasharray={y === 166 ? undefined : "4 5"} />
        ))}
        <text x="8" y="44" fill="#4d6470" fontSize="11">{max}</text>
        <text x="8" y="107" fill="#4d6470" fontSize="11">{Math.ceil(max / 2)}</text>
        <text x="8" y="170" fill="#4d6470" fontSize="11">0</text>
        <path d={area} fill="#e5f2f7" />
        <path d={line} fill="none" stroke="#00628b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#00628b" strokeWidth="3">
            <title>{`${point.label}: ${point.value} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="ml-11 mt-1 grid text-center text-xs font-medium text-muted" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        {points.map((point) => <span key={point.label}>{point.label}</span>)}
      </div>
    </article>
  );
}

export function BarChartCard({
  title,
  caption,
  badge,
  points,
  format,
  empty,
}: {
  title: string;
  caption: string;
  badge?: string;
  points: MonthPoint[];
  format: (value: number) => string;
  empty: string;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
      <CardHeader title={title} caption={caption} badge={badge} />
      <div
        className="mt-5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${title}: ${points.map((point) => `${point.label} ${format(point.value)}`).join(", ")}`}
      >
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <span className="h-4 max-w-full truncate text-[10px] font-medium tabular-nums text-muted">
              {point.value ? new Intl.NumberFormat("en-RW", { notation: "compact", maximumFractionDigits: 1 }).format(point.value) : ""}
            </span>
            <div className="flex h-32 w-full items-end rounded-lg bg-background px-1.5">
              <span
                className="block w-full rounded-t-md bg-brand transition-all"
                style={{ height: `${point.value ? Math.max(4, (point.value / max) * 100) : 1}%` }}
                title={`${point.label}: ${format(point.value)}`}
              />
            </div>
            <span className="text-xs font-medium text-muted">{point.label}</span>
          </div>
        ))}
      </div>
      {!points.some((point) => point.value > 0) ? <p className="mt-4 text-sm text-muted">{empty}</p> : null}
    </article>
  );
}

export function DonutCard({
  title,
  caption,
  centerLabel,
  slices,
  empty,
}: {
  title: string;
  caption: string;
  centerLabel: string;
  slices: { label: string; count: number; color: string }[];
  empty: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcs = slices
    .filter((slice) => slice.count > 0)
    .map((slice, index, visible) => {
      const before = visible.slice(0, index).reduce((sum, previous) => sum + previous.count, 0);
      return {
        ...slice,
        dash: (slice.count / total) * circumference,
        offset: (before / total) * circumference,
      };
    });
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
      <CardHeader title={title} caption={caption} />
      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <svg
          className="h-44 w-44 shrink-0"
          viewBox="0 0 140 140"
          role="img"
          aria-label={`${title}: ${slices.map((slice) => `${slice.label} ${slice.count}`).join(", ")}`}
        >
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef4f7" strokeWidth="20" />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="20"
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              transform="rotate(-90 70 70)"
            >
              <title>{`${arc.label}: ${arc.count}`}</title>
            </circle>
          ))}
          <text x="70" y="66" textAnchor="middle" fill="#122832" fontSize="24" fontWeight="700">{total}</text>
          <text x="70" y="84" textAnchor="middle" fill="#4d6470" fontSize="10">{centerLabel}</text>
        </svg>
        <ul className="w-full space-y-2.5">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-navy">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.label}
              </span>
              <span className="tabular-nums text-muted">{slice.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {total === 0 ? <p className="mt-4 text-sm text-muted">{empty}</p> : null}
    </article>
  );
}

export function StatusBars({
  title,
  caption,
  items,
}: {
  title: string;
  caption?: string;
  items: { label: string; value: number; tone: keyof typeof tones }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <article className="rounded-xl border border-line bg-card p-5 shadow-soft">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      {caption ? <p className="mt-1 text-sm text-muted">{caption}</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-navy">{item.label}</span>
              <span className="tabular-nums text-muted">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full ${tones[item.tone]}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
