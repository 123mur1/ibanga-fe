"use client";

import Link from "next/link";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { driverEligibility, truckEligibility, type Eligibility } from "@/config/business-rules";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { OpsDocument } from "@/types/ops";

function EligibilityRow({ title, subtitle, eligibility, href }: { title: string; subtitle: string; eligibility: Eligibility; href?: string }) {
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-navy">{href ? <Link href={href} className="hover:text-brand">{title}</Link> : title}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <StatusBadge family="verification" status={eligibility.eligible ? "APPROVED" : "REJECTED"} label={eligibility.eligible ? "Can take work" : "Cannot take work"} />
      </div>
      {eligibility.reasons.length ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-bad">
          {eligibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}
    </li>
  );
}

/** Which of the owner's trucks and drivers are blocked from work, and why. */
export function EligibilityPanel({ documents }: { documents: OpsDocument[] }) {
  const { currentUser, trucks } = useIbanga();
  const { truckProfiles, drivers } = useOps();
  const myTrucks = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const myDrivers = drivers.filter((driver) => driver.ownerId === currentUser?.id);
  const blocked =
    myTrucks.filter((truck) => !truckEligibility(truckProfiles.find((profile) => profile.truckId === truck.id), documents).eligible).length +
    myDrivers.filter((driver) => !driverEligibility(driver, documents).eligible).length;

  return (
    <Section title="Eligibility to take work" description="A truck or driver with a missing, expired or unapproved required document is blocked from quoting and assignment." padded={false}>
      <div className="px-5 pt-5">
        <Notice tone={blocked ? "warning" : "success"} title={blocked ? `${blocked} of ${myTrucks.length + myDrivers.length} trucks and drivers cannot take work yet` : "Everything is eligible"}>
          The screens only show and prevent these restrictions. The backend must enforce them on every quotation and assignment.
        </Notice>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {myTrucks.map((truck) => (
          <EligibilityRow
            key={truck.id}
            title={`Truck ${truck.plateNumber}`}
            subtitle="Needs approved vehicle registration, inspection and insurance"
            eligibility={truckEligibility(truckProfiles.find((profile) => profile.truckId === truck.id), documents)}
            href={`/dashboard/owner/trucks/${truck.id}`}
          />
        ))}
        {myDrivers.map((driver) => (
          <EligibilityRow
            key={driver.id}
            title={`Driver ${driver.name}`}
            subtitle="Needs a valid, verified driving licence"
            eligibility={driverEligibility(driver, documents)}
            href={`/dashboard/owner/drivers/${driver.id}`}
          />
        ))}
        {myTrucks.length + myDrivers.length === 0 ? <li className="px-5 py-6 text-sm text-muted">Add a truck or driver to see their eligibility here.</li> : null}
      </ul>
    </Section>
  );
}
