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
    void loadUsers();
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
        <h1 className="font-display text-3xl text-navy">Users</h1>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Loading users…
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{user.name}</p>
                    <p className="text-muted">{user.company}</p>
                  </td>
                  <td className="px-4 py-3">{user.role.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    {user.email}
                    <br />
                    {user.phone}
                  </td>
                  <td className="px-4 py-3">
                    {user.active ? "Active" : "Suspended"}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== "ADMIN" ? (
                      <GhostButton
                        type="button"
                        disabled={deletingId === user.id}
                        className="border-red-200 text-red-700 hover:bg-red-50"
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
