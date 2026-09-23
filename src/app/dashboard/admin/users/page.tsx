"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { PageHeader } from "@/components/ui";
import { Avatar } from "@/components/photos";
import { api } from "@/lib/api";
import type { Role, User } from "@/lib/types";

type ApiUser = Omit<User, "phone" | "location" | "active"> & {
  phone: string | null;
  location: string | null;
};

const roleChip: Record<Role, string> = {
  IMPORTER: "bg-brand-soft text-brand-dark",
  TRUCK_OWNER: "bg-accent-soft text-accent-dark",
  ADMIN: "bg-navy text-white",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ApiUser[]>("/users");
      setUsers(
        data.map((user) => ({
          ...user,
          phone: user.phone ?? "",
          location: user.location ?? "",
          active: true,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete ${user.name}'s account? This cannot be undone.`)) return;

    setDeletingId(user.id);
    setError(null);
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setDeletingId(null);
    }
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

        {error ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-muted">Loading users…</p>
          ) : users.map((user) => (
            <article
              key={user.id}
              className="flex flex-col rounded-2xl border border-line bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <Avatar src={user.photo} name={user.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{user.name}</p>
                  <p className="truncate text-sm text-muted">{user.company || user.email}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${roleChip[user.role]}`}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>

              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Email</dt>
                  <dd className="truncate font-medium text-navy">{user.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Phone</dt>
                  <dd className="font-medium text-navy">{user.phone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Location</dt>
                  <dd className="font-medium text-navy">{user.location || "—"}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-good">
                  <span className="h-1.5 w-1.5 rounded-full bg-good" />
                  Active
                </span>
                {user.role !== "ADMIN" ? (
                  <button
                    type="button"
                    disabled={deletingId === user.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-bad/20 px-2.5 py-1.5 text-xs font-semibold text-bad transition hover:bg-bad-soft disabled:opacity-60"
                    onClick={() => void deleteUser(user)}
                  >
                    {deletingId === user.id ? "Deleting…" : "Delete account"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}