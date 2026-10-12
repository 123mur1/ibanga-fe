"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { Avatar } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import type { Role, User } from "@/lib/types";

const roleChip: Record<Role, string> = {
  IMPORTER: "bg-brand-soft text-brand-dark",
  TRUCK_OWNER: "bg-accent-soft text-accent-dark",
  ADMIN: "bg-navy text-white",
};

export default function AdminUsersPage() {
  const { users, currentUser, deleteUser, setUserActive } = useIbanga();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function removeUser(user: User) {
    if (!window.confirm(`Delete ${user.name}'s account, unbooked trucks and wallet history? This cannot be undone.`)) return;

    setDeletingId(user.id);
    const error = deleteUser(user.id);
    setDeletingId(null);
    if (error) window.alert(error);
  }

  async function toggleUser(user: User) {
    const nextActive = !user.active;
    if (!window.confirm(`${nextActive ? "Activate" : "Deactivate"} ${user.name}'s account?`)) return;
    setUserActive(user.id, nextActive);
  }

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Community"
          title="Users"
          subtitle="Everyone on iBanga — importers, truck owners and admins."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3 20a6 6 0 0 1 12 0" />
              <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17 14.5a6 6 0 0 1 4 5.5" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total users" value={users.length} hint="All accounts" />
          <StatCard label="Importers" value={users.filter((user) => user.role === "IMPORTER").length} hint="Cargo customers" accent="accent" />
          <StatCard label="Truck owners" value={users.filter((user) => user.role === "TRUCK_OWNER").length} hint="Fleet partners" accent="good" />
        </div>
        <div className="mt-5">
          <DataTable
            columns={[
              { label: "User" },
              { label: "Role" },
              { label: "Contact" },
              { label: "Location" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="No accounts are available."
            filterLabel="All roles"
            rows={users.map((user) => ({
              id: user.id,
              searchText: `${user.name} ${user.email} ${user.company ?? ""} ${user.location ?? ""}`,
              filterValue: user.role,
              exportValues: [user.name, user.role, user.email, user.location || "", user.active ? "Active" : "Inactive", ""],
              cells: [
              <div key={`${user.id}-user`} className="flex min-w-52 items-center gap-3">
                <Avatar src={user.photo} name={user.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.company || user.email}</p>
                </div>
              </div>,
              <span key={`${user.id}-role`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleChip[user.role]}`}>
                {user.role.replace("_", " ")}
              </span>,
              <div key={`${user.id}-contact`} className="min-w-48">
                <p className="truncate">{user.email}</p>
                <p className="text-xs text-muted">{user.phone || "No phone listed"}</p>
              </div>,
              user.location || "—",
              <span key={`${user.id}-status`} className={`inline-flex items-center gap-2 text-xs font-semibold ${user.active ? "text-good" : "text-muted"}`}>
                <span className={`h-2 w-2 rounded-full ${user.active ? "bg-good" : "bg-muted"}`} />
                {user.active ? "Active" : "Inactive"}
              </span>,
              <div key={`${user.id}-actions`} className="flex justify-end">
                {user.role !== "ADMIN" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentUser?.id === user.id}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${user.active ? "border-warn/20 text-warn hover:bg-warn-soft" : "border-good/20 text-good hover:bg-good-soft"}`}
                      onClick={() => void toggleUser(user)}
                    >
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === user.id || currentUser?.id === user.id}
                      className="rounded-lg border border-bad/20 px-2.5 py-1.5 text-xs font-semibold text-bad transition hover:bg-bad-soft disabled:opacity-60"
                      onClick={() => void removeUser(user)}
                    >
                      {deletingId === user.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ) : <span className="text-xs text-muted">Protected</span>}
              </div>,
              ],
            }))}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}