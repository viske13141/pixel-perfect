// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDevAdminHandler,
  type BootstrapDependencies,
} from "../../supabase/functions/register-dev-admin/handler";

const secret = process.env["TEST_BOOTSTRAP_SECRET"] ?? "a-very-long-test-only-secret-of-32-plus-characters";
const body = {
  fullName: "Dev Admin",
  email: process.env["TEST_ADMIN_EMAIL"] ?? "admin@example.com",
  mobile: process.env["TEST_ADMIN_MOBILE"] ?? "9876543210",
  password: process.env["TEST_ADMIN_PASSWORD"] ?? "Password123",
  bootstrapSecret: secret,
};
let deps: BootstrapDependencies;
const request = (changes = {}, origin = "http://localhost:5173") =>
  new Request("https://example.com/register-dev-admin", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ ...body, ...changes }),
  });
beforeEach(() => {
  deps = {
    enabled: true,
    secret,
    allowedOrigin: "http://localhost:5173",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    createUser: vi.fn().mockResolvedValue("new-id"),
    grantAdmin: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  };
});
describe("Development admin authorization", () => {
  it.each(["disabled", "expired", "unconfigured", "remote-origin"])(
    "fails closed when %s",
    async (mode) => {
      if (mode === "disabled") deps.enabled = false;
      if (mode === "expired") deps.expiresAt = "2020-01-01";
      if (mode === "unconfigured") deps.secret = "";
      const response = await createDevAdminHandler(deps)(
        request({}, mode === "remote-origin" ? "https://store.example.com" : undefined),
      );
      expect(response.status).toBe(403);
      expect(deps.createUser).not.toHaveBeenCalled();
    },
  );
  it("does not treat spoofed localhost origin as authorization", async () => {
    expect((await createDevAdminHandler(deps)(request({ bootstrapSecret: "wrong" }))).status).toBe(
      403,
    );
    expect(deps.createUser).not.toHaveBeenCalled();
  });
  it("does not permit a production origin even if configured", async () => {
    deps.allowedOrigin = "https://store.example.com";
    expect((await createDevAdminHandler(deps)(request({}, deps.allowedOrigin))).status).toBe(403);
  });
  it("creates and grants only after authorization", async () => {
    const response = await createDevAdminHandler(deps)(request());
    expect(response.status).toBe(201);
    expect(deps.createUser).toHaveBeenCalledWith({
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      password: body.password,
    });
    expect(deps.grantAdmin).toHaveBeenCalledWith("new-id");
  });
  it("validates the request server-side", async () => {
    expect((await createDevAdminHandler(deps)(request({ password: "weak" }))).status).toBe(400);
    expect(deps.createUser).not.toHaveBeenCalled();
  });
  it("does not promote existing accounts", async () => {
    vi.mocked(deps.createUser).mockRejectedValue({ code: "email_exists" });
    expect((await createDevAdminHandler(deps)(request())).status).toBe(409);
    expect(deps.grantAdmin).not.toHaveBeenCalled();
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });
  it("removes the newly created account if role assignment fails", async () => {
    vi.mocked(deps.grantAdmin).mockRejectedValue(new Error("No profile"));
    expect((await createDevAdminHandler(deps)(request())).status).toBe(500);
    expect(deps.deleteUser).toHaveBeenCalledWith("new-id");
  });
  it("reports a failed cleanup without claiming registration succeeded", async () => {
    vi.mocked(deps.grantAdmin).mockRejectedValue(new Error("No profile"));
    vi.mocked(deps.deleteUser).mockRejectedValue(new Error("Offline"));
    const response = await createDevAdminHandler(deps)(request());
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("cleanup") });
  });
});
