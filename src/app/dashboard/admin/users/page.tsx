"use client";

import { useState } from "react";
import { AdminPage } from "@/features/admin-platform/admin-page";
import { RoleBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { DataTable, Field, GhostButton, inputClass, Modal, PageHeader, PrimaryButton, RowActions, StatCard } from "@/components/ui";
import { Avatar } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import { LOCATIONS, type Role, type User } from "@/lib/types";

const roleOptions: { value: Role; label: string; hint: string }[] = [
  { value: "IMPORTER", label: "Importer", hint: "Books trucks and pays for cargo" },
  { value: "TRUCK_OWNER", label: "Truck owner", hint: "Lists trucks and runs trips" },
  { value: "ADMIN", label: "Admin", hint: "Full marketplace access" },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "IMPORTER" as Role,
  location: "",
  company: "",
  password: "",
};

export default function AdminUsersPage() {
  const { users, currentUser, deleteUser, setUserActive, addUser } = useIbanga();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateField(patch: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function closeAdd() {
    if (saving) return;
    setAddOpen(false);
    setFormError(null);
    setForm(emptyForm);
  }

  async function submitNewUser() {
    setSaving(true);
    setFormError(null);
    const error = await addUser(form);
    setSaving(false);
    if (error) {
      setFormError(error);
      return;
    }
    toast(`${form.name.trim()} was added to the marketplace.`, "good");
    setAddOpen(false);
    setForm(emptyForm);
  }

  async function removeUser(user: User) {
    const error = await deleteUser(user.id);
    if (error) toast(error, "bad");
    else toast(`${user.name}'s account was removed.`, "good");
  }

  async function toggleUser(user: User) {
    const nextActive = !user.active;
    const error = await setUserActive(user.id, nextActive);
    if (error) toast(error, "bad");
    else toast(`${user.name} was ${nextActive ? "activated" : "deactivated"}.`, "good");
  }

  return (
    <AdminPage permission="users">
      <>
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
          actions={
            <PrimaryButton type="button" onClick={() => setAddOpen(true)} className="rounded-xl shadow-soft hover:-translate-y-0.5 hover:shadow-card">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add user
            </PrimaryButton>
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
              <span key={`${user.id}-role`}><RoleBadge role={user.role} /></span>,
              <div key={`${user.id}-contact`} className="min-w-48">
                <p className="truncate">{user.email}</p>
                <p className="text-xs text-muted">{user.phone || "No phone listed"}</p>
              </div>,
              user.location || "—",
              <span key={`${user.id}-status`} className={`inline-flex items-center gap-2 text-xs font-semibold ${user.active ? "text-brand" : "text-muted"}`}>
                <span className={`h-2 w-2 rounded-full ${user.active ? "bg-brand" : "bg-muted"}`} />
                {user.active ? "Active" : "Inactive"}
              </span>,
              <div key={`${user.id}-actions`} className="flex justify-end">
                {user.role !== "ADMIN" ? (
                  <RowActions
                    actions={[
                      {
                        label: user.active ? "Deactivate" : "Activate",
                        disabled: currentUser?.id === user.id,
                        confirm: {
                          title: user.active ? "Deactivate account" : "Activate account",
                          message: user.active
                            ? `Deactivate ${user.name}'s account? They will not be able to sign in until reactivated.`
                            : `Activate ${user.name}'s account? They will regain access to the marketplace.`,
                          confirmLabel: user.active ? "Deactivate" : "Activate",
                          tone: "brand",
                        },
                        onSelect: () => toggleUser(user),
                      },
                      {
                        label: "Remove",
                        tone: "danger",
                        disabled: currentUser?.id === user.id,
                        confirm: {
                          title: "Remove account",
                          message: `Delete ${user.name}'s account and wallet history? Accounts with booking or dispute history cannot be deleted and should be deactivated instead.`,
                          confirmLabel: "Remove account",
                          tone: "danger",
                        },
                        onSelect: () => removeUser(user),
                      },
                    ]}
                  />
                ) : <span className="text-xs text-muted">Protected</span>}
              </div>,
              ],
            }))}
          />
        </div>

        {addOpen ? (
          <Modal
            title="Add a new user"
            description="Create an account on behalf of an importer, truck owner or admin."
            onClose={closeAdd}
            wide
            footer={
              <>
                <GhostButton type="button" onClick={closeAdd} disabled={saving}>Cancel</GhostButton>
                <PrimaryButton type="submit" form="add-user-form" disabled={saving}>
                  {saving ? "Creating account…" : "Create account"}
                </PrimaryButton>
              </>
            }
          >
            <form
              id="add-user-form"
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void submitNewUser();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    className={inputClass}
                    required
                    value={form.name}
                    onChange={(event) => updateField({ name: event.target.value })}
                    placeholder="Uwase Jeanine"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Email address">
                  <input
                    className={inputClass}
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => updateField({ email: event.target.value })}
                    placeholder="name@company.rw"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    className={inputClass}
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) => updateField({ phone: event.target.value })}
                    placeholder="078 000 0000"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Location">
                  <input
                    className={inputClass}
                    required
                    list="ibanga-locations"
                    value={form.location}
                    onChange={(event) => updateField({ location: event.target.value })}
                    placeholder="Kigali"
                    autoComplete="off"
                  />
                  <datalist id="ibanga-locations">
                    {LOCATIONS.map((location) => <option key={location} value={location} />)}
                  </datalist>
                </Field>
                <Field label="Company (optional)">
                  <input
                    className={inputClass}
                    value={form.company}
                    onChange={(event) => updateField({ company: event.target.value })}
                    placeholder="Kivu Traders Ltd"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Temporary password">
                  <input
                    className={inputClass}
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(event) => updateField({ password: event.target.value })}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-navy">Role</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {roleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-xl border px-3.5 py-3 transition ${
                        form.role === option.value
                          ? "border-brand bg-brand-soft/70 ring-1 ring-brand/25"
                          : "border-line bg-white hover:border-brand/40"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="new-user-role"
                        value={option.value}
                        checked={form.role === option.value}
                        onChange={() => updateField({ role: option.value })}
                      />
                      <span className="block text-sm font-semibold text-navy">{option.label}</span>
                      <span className="mt-0.5 block text-xs leading-4 text-muted">{option.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {formError ? (
                <p role="alert" className="rounded-lg border border-brand/25 bg-white px-4 py-3 text-sm font-medium text-brand-dark">
                  {formError}
                </p>
              ) : null}

              <p className="text-xs leading-5 text-muted">
                The account is created active. Share the temporary password with the user so they can sign in and change it.
              </p>
            </form>
          </Modal>
        ) : null}
      </>
    </AdminPage>
  );
}
