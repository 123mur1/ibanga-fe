import { Notice } from "@/components/common/notices";
import type { Eligibility } from "@/config/business-rules";

/** Eligibility outcome with its reasons. `subject` reads "truck" or "driver". */
export function EligibilityPanel({ result, subject }: { result: Eligibility; subject: "truck" | "driver" }) {
  if (result.eligible) {
    return (
      <Notice tone="success" title={`This ${subject} can take new work`}>
        Verification and required documents are in order. The backend must enforce this check as well.
      </Notice>
    );
  }
  return (
    <Notice tone="danger" title={`This ${subject} cannot take new work`}>
      <ul className="list-disc pl-5">
        {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <p className="mt-1">Quotations and assignments are blocked until this is fixed.</p>
    </Notice>
  );
}
