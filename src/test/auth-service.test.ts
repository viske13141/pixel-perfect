import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dashboardForRole,
  loadProfile,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "@/services/authService";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  invoke: vi.fn(),
  single: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: mocks, functions: { invoke: mocks.invoke }, from: mocks.from }),
}));
const user = { id: "user-id", email: "customer@example.com", user_metadata: { role: "ADMIN" } };
const session = { user, access_token: "token" };
const profile = {
  id: user.id,
  full_name: "Test Customer",
  email: user.email,
  mobile: "9876543210",
  role: "CUSTOMER",
  created_at: "",
  updated_at: "",
};
const registration = {
  fullName: "Test Customer",
  email: user.email,
  mobile: process.env["TEST_MOBILE"] ?? "9876543210",
  password: process.env["TEST_PASSWORD"] ?? "ExamplePass123",
  confirmPassword: process.env["TEST_PASSWORD"] ?? "ExamplePass123",
  agreedToTerms: true,
};

describe("Supabase role authentication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ single: mocks.single });
    mocks.single.mockResolvedValue({ data: profile, error: null });
    mocks.signInWithPassword.mockResolvedValue({ data: { user, session }, error: null });
    mocks.signUp.mockResolvedValue({ data: { user, session }, error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("registers customers immediately without role metadata or confirmation redirect", async () => {
    expect(await registerCustomer(registration)).toMatchObject({
      ok: true,
      profile: { role: "CUSTOMER" },
      session,
    });
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: user.email,
      password: registration.password,
      options: { data: { full_name: registration.fullName, mobile: registration.mobile } },
    });
  });
  it("does not trust an ADMIN claim in user-editable metadata", async () => {
    expect(
      await loginCustomer({ email: " CUSTOMER@example.com ", password: registration.password }),
    ).toMatchObject({ ok: true, customer: { role: "CUSTOMER" } });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: user.email,
      password: registration.password,
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", user.id);
  });
  it("loads admin privileges from profiles", async () => {
    mocks.single.mockResolvedValue({ data: { ...profile, role: "ADMIN" }, error: null });
    const result = await loginCustomer(registration);
    expect(result).toMatchObject({ ok: true, profile: { role: "ADMIN" } });
    expect(dashboardForRole("ADMIN")).toBe("/admin");
    expect(dashboardForRole("CUSTOMER")).toBe("/account");
  });
  it("reports incorrect passwords", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials" },
    });
    expect(await loginCustomer(registration)).toMatchObject({
      ok: false,
      message: "The email or password is incorrect.",
    });
  });
  it("reports existing accounts", async () => {
    mocks.signUp.mockResolvedValue({ data: {}, error: { code: "user_already_exists" } });
    expect(await registerCustomer(registration)).toMatchObject({
      ok: false,
      message: expect.stringContaining("already exists"),
    });
  });
  it.each([
    [{ fullName: "" }, "fullName"],
    [{ email: "invalid" }, "email"],
    [{ mobile: "bad" }, "mobile"],
    [{ password: "weak" }, "password"],
    [{ confirmPassword: "other" }, "confirmPassword"],
    [{ agreedToTerms: false }, "terms"],
  ])("validates fields before registration (%s)", async (changes, field) => {
    expect(await registerCustomer({ ...registration, ...changes })).toMatchObject({
      ok: false,
      field,
    });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it("fails closed on missing profiles", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: "Not found" } });
    expect(await loginCustomer(registration)).toMatchObject({
      ok: false,
      message: expect.stringContaining("profiles migration"),
    });
  });
  it.each([null, "OWNER", undefined])("rejects invalid role %s", async (role) => {
    mocks.single.mockResolvedValue({ data: { ...profile, role }, error: null });
    await expect(loadProfile(user.id)).rejects.toThrow("no valid role");
  });
  it("requires an actual session, without a confirmation screen", async () => {
    mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    expect(await registerCustomer(registration)).toMatchObject({
      ok: false,
      message: expect.stringContaining("No authenticated session"),
    });
  });
  it("denies admin registration in production even when the UI switch is set", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_ENABLE_DEV_ADMIN_REGISTRATION", "true");
    expect(
      await registerCustomer({ ...registration, accountType: "ADMIN", bootstrapSecret: "secret" }),
    ).toMatchObject({ ok: false });
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("requires a secret for local admin registration", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_ENABLE_DEV_ADMIN_REGISTRATION", "true");
    expect(await registerCustomer({ ...registration, accountType: "ADMIN" })).toMatchObject({
      ok: false,
    });
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("uses the protected bootstrap then verifies the database admin role", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_ENABLE_DEV_ADMIN_REGISTRATION", "true");
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    mocks.single.mockResolvedValue({ data: { ...profile, role: "ADMIN" }, error: null });
    expect(
      await registerCustomer({
        ...registration,
        accountType: "ADMIN",
        bootstrapSecret: "test-secret",
      }),
    ).toMatchObject({ ok: true, profile: { role: "ADMIN" } });
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.invoke).toHaveBeenCalledWith(
      "register-dev-admin",
      expect.objectContaining({
        body: expect.objectContaining({ bootstrapSecret: "test-secret" }),
      }),
    );
  });
  it("does not accept a bootstrap response without the database role", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_ENABLE_DEV_ADMIN_REGISTRATION", "true");
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    expect(
      await registerCustomer({
        ...registration,
        accountType: "ADMIN",
        bootstrapSecret: "test-secret",
      }),
    ).toMatchObject({ ok: false, message: expect.stringContaining("not granted") });
  });
  it("reports network errors and propagates logout failures", async () => {
    mocks.signInWithPassword.mockRejectedValue(new Error("Failed to fetch"));
    expect(await loginCustomer(registration)).toMatchObject({
      ok: false,
      message: expect.stringContaining("connection"),
    });
    mocks.signOut.mockResolvedValue({ error: new Error("Sign-out failed") });
    await expect(logoutCustomer()).rejects.toThrow("Sign-out failed");
  });
  it("uses Supabase signOut", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await logoutCustomer();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
