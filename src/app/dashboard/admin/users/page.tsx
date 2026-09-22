"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { GhostButton } from "@/components/ui";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type ApiUser = Omit<User, "phone" | "location" | "active"> & {
  phone: string | null;
  location: string | null;
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">Users</h1>
            <p className="mt-1.5 text-sm text-muted">
              Everyone on iBanga — importers, truck owners and admins.
            </p>
          </div>
        </div>
        {error ? (
          <p className="mt-4 inline-flex rounded-xl bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        ) : null}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-line bg-background/60">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-muted">Name</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Role</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Contact</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Status</th>
                <th className="px-5 py-3.5 font-semibold text-muted" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Loading users…
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-line bg-white transition-colors last:border-0 hover:bg-background/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{user.name}</p>
                    <p className="text-muted">{user.company}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.email}
                    <br />
                    <span className="text-muted">{user.phone}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        user.active ? "text-good" : "text-bad"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.active ? "bg-good" : "bg-bad"
                        }`}
                      />
                      {user.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.role !== "ADMIN" ? (
                      <GhostButton
                        type="button"
                        disabled={deletingId === user.id}
                        className="border-bad/20 text-bad hover:bg-bad-soft"
                        onClick={() => void deleteUser(user)}
                      >
                        {deletingId === user.id ? "Deleting…" : "Delete"}
                      </GhostButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
