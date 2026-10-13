const tones = {
  brand: "bg-brand",
  accent: "bg-accent",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  muted: "bg-muted",
} as const;

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
