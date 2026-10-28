"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NotificationsBell } from "./notifications-bell";
import { BrandLink, LogoMark } from "./brand";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";
import { Avatar } from "./photos";
import { flattenNav, NAVIGATION, profilePathFor, type NavGroup, type NavItem } from "@/config/navigation";
import { hasPermission } from "@/config/permissions";
import { useOps } from "@/hooks/use-ops";
import { useUnreadCount } from "@/hooks/use-unread";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";
import type { Permission } from "@/types/ops";

const iconPaths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  collapse: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  expand: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M13 9l3 3-3 3" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 3v4m8-4v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 1 2.5 6" />
      <path d="M3.5 15.5V11H8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18m-5 5h2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17 14.5a6 6 0 0 1 4 5.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9.5V14" />
      <path d="M12 17.5h.01" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6.5 15h4" />
    </>
  ),
  refund: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l2.5 1.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5" />
    </>
  ),
  package: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" />
    </>
  ),
  steering: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M3.3 11h6.5M14.2 11h6.5M12 14.2V21" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10M5 8h14" />
      <path d="m5 8-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4h3l8 4V6L6 10z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V4" />
      <path d="M9 4H7a2 2 0 0 0-2 2v2h4M12 9h3M12 13h3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2" />
    </>
  ),
  umbrella: (
    <>
      <path d="M3 12a9 9 0 0 1 18 0z" />
      <path d="M12 12v6a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 16v4M17 18h4" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  lifebuoy: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3 8 7.5 9 4.5-1 7.5-4.5 7.5-9V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
};

function NavIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function isActive(pathname: string, href: string, items: NavItem[]) {
  if (href.includes("#")) return false;
  if (pathname === href) return true;
  if (href === items[0]?.href) return false;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Prefer the most specific matching item so "/x/trucks" does not light up "/x".
  return !items.some((other) => other.href !== href && !other.href.includes("#") && other.href.length > href.length && (pathname === other.href || pathname.startsWith(`${other.href}/`)));
}

function NavList({
  groups,
  pathname,
  collapsed = false,
  unread,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  collapsed?: boolean;
  unread: number;
  onNavigate?: () => void;
}) {
  const flat = flattenNav(groups);
  return (
    <>
      {groups.map((group, index) => (
        <div key={group.label ?? `group-${index}`} className={index === 0 ? "" : "mt-3"}>
          {group.label && !collapsed ? (
            <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">{group.label}</p>
          ) : group.label && collapsed ? (
            <span className="mx-3 mb-1.5 block h-px bg-white/20" aria-hidden="true" />
          ) : null}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, flat);
              const count = item.badge === "unreadNotifications" ? unread : 0;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center rounded-lg py-2 text-[14.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    collapsed ? "justify-center px-2" : "gap-3 px-3"
                  } ${active ? "bg-white/15 font-semibold text-white" : "font-medium text-white/85 hover:bg-white/10 hover:text-white"}`}
                >
                  <NavIcon name={item.icon} className={active ? "text-white" : "text-white/75 group-hover:text-white"} />
                  {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                  {count > 0 ? (
                    <span
                      className={`${collapsed ? "absolute right-1 top-1" : ""} flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-brand-dark`}
                      aria-label={`${count} unread`}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                  {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function visibleGroups(role: Role, permissions: Permission[] | undefined): NavGroup[] {
  return NAVIGATION[role]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => role !== "ADMIN" || (!item.permission && !item.permissionAny) || (item.permission ? hasPermission(permissions, item.permission) : item.permissionAny!.some((permission) => hasPermission(permissions, permission)))),
    }))
    .filter((group) => group.items.length > 0);
}

function roleLabel(role: Role) {
  if (role === "TRUCK_OWNER") return "Truck owner";
  if (role === "DRIVER") return "Driver";
  if (role === "ADMIN") return "Admin";
  return "Importer";
}

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useIbanga();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const ops = useOps();
  const permissions = ops.adminProfiles.find((profile) => profile.userId === currentUser?.id)?.permissions;
  const groups = useMemo(() => visibleGroups(role, permissions), [role, permissions]);
  const unread = useUnreadCount();
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";
  const profilePath = profilePathFor(role);

  function handleLogout() {
    setLogoutConfirmationOpen(true);
  }

  function confirmLogout() {
    setLogoutConfirmationOpen(false);
    setOpen(false);
    setProfileOpen(false);
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className={`sticky top-0 hidden h-screen min-h-0 shrink-0 self-start flex-col overflow-y-auto border-r border-brand-dark bg-brand transition-[width] duration-200 lg:flex ${collapsed ? "w-[76px]" : "w-[240px]"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} pb-5 pt-6`}>
            {collapsed ? <Link href="/" aria-label="iBanga home"><LogoMark className="h-9 w-9 rounded-[9px] ring-1 ring-white/50" /></Link> : <BrandLink href="/" light />}
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <NavIcon name="collapse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="absolute left-[54px] top-6 z-10 rounded-lg border border-line bg-white p-1.5 text-muted shadow-soft transition hover:text-brand"
              >
                <NavIcon name="expand" />
              </button>
            )}
          </div>
          <nav aria-label="Main" className={`flex-1 pb-6 ${collapsed ? "px-2" : "px-3"}`}>
            <NavList groups={groups} pathname={pathname} collapsed={collapsed} unread={unread} />
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-soft"
                onClick={() => setOpen((v) => !v)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </button>
              <BrandLink />
            </div>

            <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-medium text-navy">Good {morning()}, {firstName}.</span>
            </div>

            <div className="relative flex items-center gap-2">
              <NotificationsBell />
              <button
                type="button"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-xl border border-line bg-white px-2.5 py-2 text-left shadow-soft transition hover:border-brand/30"
              >
                <Avatar src={currentUser?.photo} name={currentUser?.name ?? "User"} size="sm" />
                <span className="block min-w-0 max-w-[112px] sm:max-w-40">
                  <span className="block max-w-40 truncate text-sm font-semibold leading-5 text-navy">{currentUser?.name}</span>
                  <span className="block text-xs text-muted">{roleLabel(role)}</span>
                </span>
                <NavIcon name="chevron" className={`h-4 w-4 transition ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-line bg-white p-1.5 shadow-card">
                  <Link href={profilePath} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-brand-soft">
                    Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-brand-soft">
                    Settings
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bad hover:bg-bad-soft">
                    <NavIcon name="logout" />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {open ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand shadow-card">
                <div className="flex items-center justify-between px-5 py-5">
                  <BrandLink light />
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white"
                    onClick={() => setOpen(false)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6">
                  <NavList groups={groups} pathname={pathname} unread={unread} onNavigate={() => setOpen(false)} />
                </nav>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
      {logoutConfirmationOpen ? (
        <LogoutConfirmationDialog
          userName={currentUser?.name}
          onCancel={() => setLogoutConfirmationOpen(false)}
          onConfirm={confirmLogout}
        />
      ) : null}
    </div>
  );
}

function morning() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
