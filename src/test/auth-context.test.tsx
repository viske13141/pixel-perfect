import { act, cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/useAuth";
import type { Profile } from "@/services/authService";

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  load: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { onAuthStateChange: mocks.subscribe } }),
}));
vi.mock("@/services/authService", async (original) => ({
  ...(await original<typeof import("@/services/authService")>()),
  loadProfile: mocks.load,
  logoutCustomer: mocks.logout,
}));
let listener: (event: AuthChangeEvent, session: Session | null) => void;
const session = { user: { id: "real-user" }, access_token: "token" } as Session;
const profile = {
  id: "real-user",
  full_name: "Test",
  email: "test@example.com",
  mobile: "",
  role: "ADMIN",
  created_at: "",
  updated_at: "",
} as Profile;
function Consumer() {
  const auth = useAuth();
  return (
    <>
      <span data-testid="state">{auth.loading ? "loading" : (auth.role ?? "signed out")}</span>
      <span>{auth.error}</span>
      <button onClick={() => void auth.signOut().catch(() => {})}>Logout</button>
    </>
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.load.mockResolvedValue(profile);
  mocks.logout.mockResolvedValue(undefined);
  mocks.subscribe.mockImplementation((callback) => {
    listener = callback;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
});
afterEach(cleanup);
describe("Session persistence and auth state", () => {
  it("restores the persisted session and database role on refresh", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    act(() => listener("INITIAL_SESSION", session));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ADMIN"));
    expect(mocks.load).toHaveBeenCalledWith("real-user");
  });
  it("clears identity on logout", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    act(() => listener("INITIAL_SESSION", session));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ADMIN"));
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("signed out"));
    expect(mocks.logout).toHaveBeenCalledOnce();
  });
  it("does not restore stale profile results after session expiration", async () => {
    let resolveProfile!: (value: Profile) => void;
    mocks.load.mockReturnValue(
      new Promise<Profile>((resolve) => {
        resolveProfile = resolve;
      }),
    );
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    act(() => listener("INITIAL_SESSION", session));
    await waitFor(() => expect(mocks.load).toHaveBeenCalled());
    act(() => listener("SIGNED_OUT", null));
    await act(async () => resolveProfile(profile));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("signed out"));
  });
  it("fails closed when the profile cannot be fetched", async () => {
    mocks.load.mockRejectedValue(new Error("Profile unavailable"));
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    act(() => listener("INITIAL_SESSION", session));
    await waitFor(() => expect(screen.getByText("Profile unavailable")).toBeInTheDocument());
    expect(screen.getByTestId("state")).not.toHaveTextContent("ADMIN");
  });
  it("rechecks the role on refreshed tokens and unsubscribes on unmount", async () => {
    const { unmount } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    act(() => listener("INITIAL_SESSION", session));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ADMIN"));
    mocks.load.mockResolvedValue({ ...profile, role: "CUSTOMER" });
    act(() => listener("TOKEN_REFRESHED", session));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("CUSTOMER"));
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });
});
