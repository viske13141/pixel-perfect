import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Headset,
  LayoutDashboard,
  Menu,
  Package,
  PanelTop,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAuth } from "@/context/useAuth";

const navGroups = [
  {
    title: "Overview",
    links: [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Commerce",
    links: [
      { label: "Orders", to: "/admin/orders", icon: Package },
      { label: "Products", to: "/admin/products", icon: Boxes },
      { label: "Inventory", to: "/admin/inventory", icon: PanelTop },
    ],
  },
  {
    title: "Customers",
    links: [
      { label: "CRM", to: "/admin/crm", icon: UserRound },
      { label: "Customers", to: "/admin/customers", icon: Users },
      { label: "Reviews", to: "/admin/reviews", icon: Star },
      { label: "Support", to: "/admin/support", icon: Headset },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Shipping", to: "/admin/shipping", icon: Truck },
      { label: "Returns & Refunds", to: "/admin/returns", icon: RotateCcw },
      { label: "Payments", to: "/admin/payments", icon: CircleDollarSign },
    ],
  },
  {
    title: "Marketing",
    links: [
      { label: "Discounts", to: "/admin/discounts", icon: BadgePercent },
      { label: "Content", to: "/admin/content", icon: FileText },
    ],
  },
  { title: "Insights", links: [{ label: "Reports", to: "/admin/reports", icon: BarChart3 }] },
  { title: "System", links: [{ label: "Settings", to: "/admin/settings", icon: Settings }] },
];

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  const signOut = async () => {
    try {
      await logout();
      onNavigate?.();
      await navigate({ to: "/login" });
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    }
  };

  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {logoutError ? (
        <p role="alert" className="px-3 text-sm text-primary">
          {logoutError}
        </p>
      ) : null}
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="eyebrow mb-2 px-3 text-[0.52rem]">{group.title}</p>
          <div className="space-y-0.5">
            {group.links.map(({ label, to, icon: Icon }) => {
              const active = pathname === to || (to !== "/admin" && pathname.startsWith(`${to}/`));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={`flex min-h-10 items-center gap-3 px-3 text-xs transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">{label}</span>
                  {active ? <ChevronRight className="h-3 w-3" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="border-t border-border pt-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex min-h-10 items-center gap-3 px-3 text-xs text-foreground/70 transition-colors hover:text-primary"
        >
          <ShoppingBag className="h-4 w-4" /> View Store
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-xs text-foreground/70 transition-colors hover:text-primary"
        >
          <X className="h-4 w-4" /> Logout
        </button>
      </div>
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-night/95 px-3 backdrop-blur sm:px-5 lg:hidden">
        <button
          type="button"
          aria-label={drawerOpen ? "Close admin menu" : "Open admin menu"}
          onClick={() => setDrawerOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center"
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="font-serif text-lg tracking-wide">
          1st ROOT{" "}
          <span className="ml-1 font-sans text-[0.5rem] uppercase tracking-[0.16em] text-primary">
            Admin
          </span>
        </div>
        <Link
          to="/admin/settings"
          aria-label="Admin profile and settings"
          className="inline-flex h-11 w-11 items-center justify-center text-primary"
        >
          <UserRound className="h-4 w-4" />
        </Link>
      </header>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close admin menu overlay"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
        />
      ) : null}
      <aside
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] overflow-y-auto border-r border-border bg-night px-4 py-5 transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
          <div>
            <p className="font-serif text-xl">1st ROOT</p>
            <p className="mt-1 text-[0.52rem] uppercase tracking-[0.2em] text-primary">Admin</p>
          </div>
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AdminNavigation onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1800px] lg:min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-border bg-night px-3 py-6 xl:w-64 xl:px-4 lg:block">
          <div className="mb-7 border-b border-border px-3 pb-5">
            <Link to="/" className="font-serif text-2xl tracking-wide">
              1st ROOT
            </Link>
            <p className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-primary">Admin</p>
          </div>
          <AdminNavigation />
        </aside>
        <main className="min-w-0 flex-1 px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:py-10 xl:px-10">
          <div className="mx-auto w-full max-w-[1380px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 sm:mb-8 sm:pb-7">
      <div className="min-w-0">
        <p className="eyebrow mb-2 text-[0.58rem]">1st ROOT · Admin</p>
        <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">{title}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

export function AdminSection({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border bg-card/35 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <h2 className="eyebrow text-[0.58rem]">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function AdminButton({
  children,
  variant = "gold",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "quiet" }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 px-3.5 py-2.5 text-[0.56rem] font-medium uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "gold"
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : "border border-border text-foreground hover:border-primary/50 hover:text-primary"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <article className="min-w-0 border border-border bg-card/45 p-4 sm:p-5">
      <p className="text-[0.53rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-3 break-words font-serif text-2xl sm:text-3xl">{value}</p>
      {note ? <p className="mt-2 text-[0.62rem] text-muted-foreground">{note}</p> : null}
    </article>
  );
}
