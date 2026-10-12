import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/context/useAuth";
import { dashboardForRole, type Role } from "@/services/authService";

export function RequireRole({ role: requiredRole, children }: { role: Role; children: ReactNode }) {
  const { loading, session, profile, error, refreshProfile, signOut } = useAuth();
  if (loading)
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center bg-background text-foreground"
      >
        Loading your account...
      </div>
    );
  if (!session) return <Navigate to="/login" replace />;
  if (!profile)
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground"
      >
        <p>{error ?? "Your account profile is unavailable. Please try again."}</p>
        <button type="button" className="text-primary" onClick={() => void refreshProfile()}>
          Try again
        </button>
        <button
          type="button"
          className="text-primary"
          onClick={() => {
            void signOut().catch(() => {});
          }}
        >
          Sign out
        </button>
      </div>
    );
  if (profile.role !== requiredRole)
    return <Navigate to={dashboardForRole(profile.role)} replace />;
  return (
    <>
      {error ? (
        <p role="alert" className="bg-background px-6 py-3 text-primary">
          {error}
        </p>
      ) : null}
      {children}
    </>
  );
}
