import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireRole } from "@/components/auth/RequireRole";
import { AuthContext, fallbackAuthContext, type AuthContextValue } from "@/context/auth-context";
import type { Profile } from "@/services/authService";
import type { Session } from "@supabase/supabase-js";

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));
afterEach(cleanup);
const session = { user: { id: "user-id" } } as Session;
const customer = { id: "user-id", role: "CUSTOMER" } as Profile;
function renderGuard(state: Partial<AuthContextValue>, required: "ADMIN" | "CUSTOMER" = "ADMIN") {
  return render(
    <AuthContext.Provider value={{ ...fallbackAuthContext, loading: false, ...state }}>
      <RequireRole role={required}>
        <div>Protected dashboard</div>
      </RequireRole>
    </AuthContext.Provider>,
  );
}
describe("Role guards inherited by all dashboard descendants", () => {
  it("does not render protected content during restoration", () => {
    renderGuard({ loading: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Protected dashboard")).toBeNull();
  });
  it.each(["ADMIN", "CUSTOMER"] as const)(
    "redirects anonymous visitors from %s to login",
    (role) => {
      renderGuard({}, role);
      expect(screen.getByTestId("redirect")).toHaveTextContent("/login");
    },
  );
  it("denies customers access to admin pages", () => {
    renderGuard({ session, profile: customer });
    expect(screen.getByTestId("redirect")).toHaveTextContent("/account");
    expect(screen.queryByText("Protected dashboard")).toBeNull();
  });
  it("redirects admins away from customer-only pages", () => {
    renderGuard({ session, profile: { ...customer, role: "ADMIN" } }, "CUSTOMER");
    expect(screen.getByTestId("redirect")).toHaveTextContent("/admin");
  });
  it.each(["ADMIN", "CUSTOMER"] as const)("allows the matching %s role", (role) => {
    renderGuard({ session, profile: { ...customer, role } }, role);
    expect(screen.getByText("Protected dashboard")).toBeInTheDocument();
  });
  it("shows profile errors without redirect loops", () => {
    renderGuard({ session, error: "Profile missing" });
    expect(screen.getByRole("alert")).toHaveTextContent("Profile missing");
    expect(screen.queryByTestId("redirect")).toBeNull();
  });
});
