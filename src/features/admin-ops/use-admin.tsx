"use client";

import Link from "next/link";
import { Notice } from "@/components/common/notices";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { DocumentSubjectKind, Id, Permission } from "@/types/ops";

const ADMIN = "/dashboard/admin";

/** Whether the signed-in administrator holds a permission. Presentation only; the backend must enforce it. */
export function useAdminPermission(permission: Permission): boolean {
  const { currentUser } = useIbanga();
  const { adminProfiles } = useOps();
  return Boolean(currentUser && adminProfiles.find((profile) => profile.userId === currentUser.id)?.permissions.includes(permission));
}

/** Shows the page only to administrators with the permission. */
export function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const allowed = useAdminPermission(permission);
  if (!allowed) {
    return (
      <div className="mt-6">
        <Notice tone="danger" title="Your administrator role does not include this area">
          Ask a super administrator to grant the &quot;{permission}&quot; permission. The backend must enforce this restriction as well.
        </Notice>
      </div>
    );
  }
  return <>{children}</>;
}

/** Name and link lookups shared by the admin operations pages. */
export function useAdminLookups() {
  const { users, trucks } = useIbanga();
  const { drivers } = useOps();
  const userName = (id: Id | undefined) => {
    const user = users.find((item) => item.id === id);
    return user ? user.company ?? user.name : "—";
  };
  const truckLabel = (id: Id | undefined) => {
    const truck = trucks.find((item) => item.id === id);
    return truck ? `${truck.plateNumber} · ${truck.truckType}` : "—";
  };
  const driverName = (id: Id | undefined) => drivers.find((item) => item.id === id)?.name ?? "—";
  const subject = (kind: DocumentSubjectKind, id: Id): { label: string; href: string } => {
    if (kind === "TRUCK") return { label: truckLabel(id), href: `${ADMIN}/trucks/${id}` };
    if (kind === "DRIVER") return { label: driverName(id), href: `${ADMIN}/drivers/${id}` };
    return { label: userName(id), href: `${ADMIN}/users` };
  };
  return { userName, truckLabel, driverName, subject };
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand hover:text-brand-dark">
      {children}
    </Link>
  );
}
