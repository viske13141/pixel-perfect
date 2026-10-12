import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  CircleHelp,
  Heart,
  Menu,
  MessageSquareText,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { useAuth } from "@/context/useAuth";

const accountLinks = [
  { label: "Overview", to: "/account", icon: UserRound },
  { label: "My Orders", to: "/account/orders", icon: Package },
  { label: "Wishlist", to: "/account/wishlist", icon: Heart },
  { label: "My Reviews", to: "/account/reviews", icon: MessageSquareText },
  { label: "Profile", to: "/account/profile", icon: UserRound },
  { label: "Help & Support", to: "/account/support", icon: CircleHelp },
] as const;

function CustomerNav({ onNavigate }: { onNavigate?: () => void }) {
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
    <nav aria-label="Customer account">
      {logoutError ? (
        <p role="alert" className="px-3 text-sm text-primary">
          {logoutError}
        </p>
      ) : null}
      <p className="eyebrow mb-4 px-3 text-[0.58rem]">My Account</p>
      <div className="space-y-1">
        {accountLinks.map(({ label, to, icon: Icon }) => {
          const active = pathname === to || (to !== "/account" && pathname.startsWith(`${to}/`));

          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active ? <ChevronRight className="ml-auto h-3.5 w-3.5" /> : null}
            </Link>
          );
        })}
      </div>
      <div className="my-6 border-t border-border" />
      <Link
        to="/"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm text-foreground/70 transition-colors hover:bg-white/[0.04] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm text-foreground/70 transition-colors hover:bg-white/[0.04] hover:text-primary"
      >
        <X className="h-4 w-4" />
        Logout
      </button>
    </nav>
  );
}

export function CustomerLayout({
  children,
  heading,
  eyebrow,
}: {
  children: ReactNode;
  heading: string;
  eyebrow: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-night/95 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center text-foreground"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="font-serif text-xl tracking-wide">
          1st ROOT
        </Link>
        <Link
          to="/"
          aria-label="Shopping bag"
          className="inline-flex h-11 w-11 items-center justify-center text-primary"
        >
          <ShoppingBag className="h-5 w-5" />
        </Link>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 md:hidden"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[min(84vw,340px)] overflow-y-auto border-r border-border bg-night px-5 pb-8 pt-6 transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" onClick={() => setMenuOpen(false)} className="font-serif text-2xl">
            1st ROOT
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <CustomerNav onNavigate={() => setMenuOpen(false)} />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] md:min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-night px-6 py-9 md:block lg:w-72 lg:px-8">
          <Link to="/" className="font-serif text-2xl tracking-wide">
            1st ROOT
          </Link>
          <div className="mb-9 mt-10 border-t border-border" />
          <CustomerNav />
          <div className="absolute bottom-8 left-8 right-8 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Rooted in ritual
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-6 md:px-8 md:py-12 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-8 border-b border-border pb-7 md:mb-10 md:pb-9">
              <p className="eyebrow mb-3">{eyebrow}</p>
              <h1 className="display text-[clamp(2.4rem,6vw,4.5rem)]">{heading}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function CustomerSection({
  children,
  title,
  action,
  className = "",
}: {
  children: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border bg-card/45 p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow text-[0.62rem]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CustomerButton({
  children,
  variant = "gold",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "quiet";
}) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 py-3 text-[0.62rem] font-medium uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "gold"
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : "border border-border text-foreground hover:border-primary/60 hover:text-primary"
      } ${className}`}
    >
      {children}
    </button>
  );
}
