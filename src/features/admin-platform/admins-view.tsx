"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { CheckRow, controlClass } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { ADMIN_ROLE_PRESETS, ALL_PERMISSIONS, PERMISSION_LABELS } from "@/config/permissions";
import { flattenNav, NAVIGATION } from "@/config/navigation";
import { PageHeader } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { AdminProfile, AdminRoleName, Permission } from "@/types/ops";
import { useUserNames } from "./admin-page";

const ROLES = Object.keys(ADMIN_ROLE_PRESETS) as AdminRoleName[];
const DEMO_ACCOUNTS = [
  { email: "ops@ibanga.com", role: "Operations manager" },
  { email: "finance@ibanga.com", role: "Finance officer" },
  { email: "support@ibanga.com", role: "Customer support" },
];

export function AdminsView() {
  const actor = useActor();
  const query = useServiceQuery(() => services.admin.listAdmins(actor!), [actor?.id]);
  return (
    <>
      <PageHeader eyebrow="Access" title="Admin users & permissions" subtitle="Choose what each administrator can see and do. The sidebar only shows areas their permissions allow." />
      <div className="mt-6 space-y-6">
        <Notice tone="warning" title="Frontend guards are not security">
          Hiding menu items and pages only shapes this demonstration. Real enforcement of roles and permissions belongs to the backend, which must check them on every request.
        </Notice>
        <QueryBoundary query={query} isEmpty={(items) => items.length === 0} empty={{ title: "No administrators", text: "Administrator profiles appear here." }}>
          {(profiles) => (
            <div className="grid gap-6 xl:grid-cols-2">
              {profiles.map((profile) => (
                <AdminEditor key={profile.userId} profile={profile} isSelf={profile.userId === actor?.id} />
              ))}
            </div>
          )}
        </QueryBoundary>
        <Section title="Demonstration accounts" description="Sign in with these to see the permission-aware sidebar. Password for all: admin123.">
          <ul className="grid gap-3 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="rounded-xl border border-line px-4 py-3 text-sm">
                <p className="font-semibold text-navy">{account.email}</p>
                <p className="text-muted">{account.role}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Demonstration credentials only. Never use shared passwords like this in a real system.</p>
        </Section>
      </div>
    </>
  );
}

function AdminEditor({ profile, isSelf }: { profile: AdminProfile; isSelf: boolean }) {
  const actor = useActor()!;
  const name = useUserNames();
  const { users } = useIbanga();
  const { run, busy } = useAction();
  const [role, setRole] = useState<AdminRoleName>(profile.adminRole);
  const [permissions, setPermissions] = useState<Permission[]>(profile.permissions);

  const same = role === profile.adminRole && permissions.length === profile.permissions.length && permissions.every((item) => profile.permissions.includes(item));
  const lockedOut = isSelf && !permissions.includes("admins");
  const visibleLinks = flattenNav(NAVIGATION.ADMIN).filter((item) => !item.permission || permissions.includes(item.permission)).length;
  const totalLinks = flattenNav(NAVIGATION.ADMIN).length;

  function applyPreset(next: AdminRoleName) {
    setRole(next);
    setPermissions([...ADMIN_ROLE_PRESETS[next].permissions]);
  }

  const toggle = (permission: Permission, on: boolean) =>
    setPermissions((current) => (on ? ALL_PERMISSIONS.filter((item) => item === permission || current.includes(item)) : current.filter((item) => item !== permission)));

  return (
    <Section title={name(profile.userId)} description={`${users.find((user) => user.id === profile.userId)?.email ?? ""}${isSelf ? " · you" : ""}`}>
      <label className="block text-sm font-medium text-navy">
        Role preset
        <select className={`${controlClass} mt-1.5`} value={role} onChange={(event) => applyPreset(event.target.value as AdminRoleName)}>
          {ROLES.map((item) => <option key={item} value={item}>{ADMIN_ROLE_PRESETS[item].label}</option>)}
        </select>
      </label>
      <p className="mt-1.5 text-xs text-muted">{ADMIN_ROLE_PRESETS[role].description} Picking a preset replaces the toggles below; you can then adjust them.</p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-navy">Permissions</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ALL_PERMISSIONS.map((permission) => (
            <CheckRow key={permission} title={PERMISSION_LABELS[permission]} checked={permissions.includes(permission)} onChange={(on) => toggle(permission, on)} disabled={busy} />
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-muted">Sidebar preview: {visibleLinks} of {totalLinks} admin menu items would be visible.</p>
      {lockedOut ? <p role="alert" className="mt-2 text-sm font-medium text-bad">You cannot remove your own access to this page.</p> : null}
      {permissions.length === 0 ? <p role="alert" className="mt-2 text-sm font-medium text-bad">Choose at least one permission.</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <ConfirmButton
          label="Save permissions"
          title={`Update ${name(profile.userId)}?`}
          message="Their access changes immediately and the change is recorded in the audit log."
          summary={[`Role: ${ADMIN_ROLE_PRESETS[role].label}`, `${permissions.length} of ${ALL_PERMISSIONS.length} permissions`]}
          disabled={busy || same || lockedOut || permissions.length === 0}
          onConfirm={() => run(() => services.admin.updateAdmin(actor, profile.userId, { adminRole: role, permissions }), { success: "Permissions updated." })}
        />
        <button type="button" disabled={same || busy} onClick={() => { setRole(profile.adminRole); setPermissions(profile.permissions); }} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-navy transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
          Discard changes
        </button>
      </div>
    </Section>
  );
}
