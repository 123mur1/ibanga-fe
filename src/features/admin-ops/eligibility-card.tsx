import { Notice } from "@/components/common/notices";
import type { Eligibility } from "@/config/business-rules";

/** Eligibility result with the reasons. The backend must enforce the same restriction. */
export function EligibilityNotice({ subject, result, action }: { subject: string; result: Eligibility; action?: { href: string; label: string } }) {
  return result.eligible ? (
    <Notice tone="success" title={`${subject} is eligible for work`} action={action}>
      All required checks pass.
    </Notice>
  ) : (
    <Notice tone="warning" title={`${subject} is not eligible for work`} action={action}>
      <ul className="list-disc space-y-0.5 pl-5">
        {result.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </Notice>
  );
}
