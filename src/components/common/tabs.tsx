"use client";

/** Simple accessible tab bar. The caller renders the matching panel. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label = "Sections",
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              active ? "border-brand text-brand" : "border-transparent text-muted hover:text-navy"
            }`}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-brand-soft text-brand-dark" : "bg-line text-muted"}`}>{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
