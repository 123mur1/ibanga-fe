import { formatRwf } from "@/lib/format";
import { DemoTag } from "./notices";

export type FinancialLine = {
  label: string;
  amountRwf: number;
  /** "deduct" shows a minus sign, "add" a plus, "total" a bold closing line. */
  kind?: "plain" | "deduct" | "add" | "total";
  hint?: string;
};

/**
 * Reusable breakdown of an amount (booking payment, settlement, refund). Amounts always display in
 * RWF. Mark `demo` for anything that is simulated so it is never mistaken for a real transaction.
 */
export function FinancialSummary({
  title,
  lines,
  footnote,
  demo = true,
}: {
  title?: string;
  lines: FinancialLine[];
  footnote?: string;
  demo?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {title || demo ? (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-background/60 px-4 py-3">
          <p className="text-sm font-semibold text-navy">{title}</p>
          {demo ? <DemoTag /> : null}
        </div>
      ) : null}
      <dl className="divide-y divide-line">
        {lines.map((line) => {
          const total = line.kind === "total";
          const sign = line.kind === "deduct" ? "−" : line.kind === "add" ? "+" : "";
          return (
            <div key={line.label} className={`flex items-start justify-between gap-4 px-4 py-3 ${total ? "bg-brand-soft/50" : ""}`}>
              <dt className={total ? "font-semibold text-navy" : "text-sm text-muted"}>
                {line.label}
                {line.hint ? <span className="block text-xs font-normal text-muted">{line.hint}</span> : null}
              </dt>
              <dd className={`tabular-nums ${total ? "text-lg font-semibold text-brand" : line.kind === "deduct" ? "font-semibold text-bad" : "font-semibold text-navy"}`}>
                {sign}
                {formatRwf(Math.abs(line.amountRwf))}
              </dd>
            </div>
          );
        })}
      </dl>
      {footnote ? <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">{footnote}</p> : null}
    </div>
  );
}
