import type { CargoCategory, HandlingFlag } from "@/types/ops";

export const CATEGORY_LABEL: Record<CargoCategory, string> = {
  GENERAL: "General cargo",
  BUILDING_MATERIALS: "Building materials",
  PERISHABLES: "Perishables",
  MACHINERY: "Machinery",
  FUEL_CHEMICALS: "Fuel and chemicals",
  AGRICULTURE: "Agriculture",
  RETAIL_GOODS: "Retail goods",
  OTHER: "Other",
};

export const FLAG_LABEL: Record<HandlingFlag, string> = {
  FRAGILE: "Fragile",
  HAZARDOUS: "Hazardous",
  PERISHABLE: "Perishable",
  SPECIAL_HANDLING: "Special handling",
};

export function FlagChips({ flags }: { flags: HandlingFlag[] }) {
  if (!flags.length) return <span className="text-sm text-muted">None</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <span key={flag} className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
          {FLAG_LABEL[flag]}
        </span>
      ))}
    </span>
  );
}
