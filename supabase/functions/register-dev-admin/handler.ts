type Registration = { email: string; password: string; fullName: string; mobile: string };
export type BootstrapDependencies = {
  enabled: boolean;
  secret: string;
  allowedOrigin: string;
  expiresAt: string;
  createUser: (input: Registration) => Promise<string>;
  grantAdmin: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};

async function sameSecret(provided: string, expected: string) {
  const encode = (value: string) => new TextEncoder().encode(value);
  const [a, b] = await Promise.all(
    [provided, expected].map((value) => crypto.subtle.digest("SHA-256", encode(value))),
  );
  const left = new Uint8Array(a!);
  const right = new Uint8Array(b!);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i]! ^ right[i]!;
  return difference === 0;
}

export function createDevAdminHandler(deps: BootstrapDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    let localOrigin = false;
    try {
      const url = new URL(deps.allowedOrigin);
      localOrigin =
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
        ["http:", "https:"].includes(url.protocol) &&
        url.origin === deps.allowedOrigin;
    } catch {
      /* Missing configuration denies all requests. */
    }
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      ...(localOrigin && origin === deps.allowedOrigin
        ? { "Access-Control-Allow-Origin": deps.allowedOrigin }
        : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    const reply = (status: number, body: object) =>
      new Response(JSON.stringify(body), { status, headers });
    // Origin is defense in depth, not authorization. The server secret is mandatory.
    const expires = Date.parse(deps.expiresAt);
    if (
      !deps.enabled ||
      deps.secret.length < 32 ||
      !Number.isFinite(expires) ||
      expires <= Date.now()
    )
      return reply(403, { error: "Development admin registration is disabled or expired." });
    if (!localOrigin || origin !== deps.allowedOrigin)
      return reply(403, {
        error: "Admin registration is restricted to the configured local development origin.",
      });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, { error: "Method not allowed." });
    if (Number(request.headers.get("content-length") ?? "0") > 8192)
      return reply(413, { error: "Request is too large." });
    let body: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (raw.length > 8192) return reply(413, { error: "Request is too large." });
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object" || Array.isArray(value))
        return reply(400, { error: "Invalid registration details." });
      body = value as Record<string, unknown>;
    } catch {
      return reply(400, { error: "Invalid registration details." });
    }
    if (
      typeof body["bootstrapSecret"] !== "string" ||
      !(await sameSecret(body["bootstrapSecret"], deps.secret))
    )
      return reply(403, { error: "The development bootstrap secret is invalid." });
    const fullName = typeof body["fullName"] === "string" ? body["fullName"].trim() : "";
    const email = typeof body["email"] === "string" ? body["email"].trim().toLowerCase() : "";
    const mobile = typeof body["mobile"] === "string" ? body["mobile"].trim() : "";
    const password = typeof body["password"] === "string" ? body["password"] : "";
    if (
      fullName.length < 2 ||
      fullName.length > 200 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\+?[0-9\s()-]{10,15}$/.test(mobile) ||
      password.length < 8 ||
      password.length > 128 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    )
      return reply(400, {
        error: "Enter a valid name, email, mobile number, and a strong password.",
      });
    let createdId: string | undefined;
    try {
      // createUser fails for an existing account: this endpoint never promotes an existing user.
      createdId = await deps.createUser({ fullName, email, mobile, password });
      await deps.grantAdmin(createdId);
      return reply(201, { ok: true });
    } catch (cause) {
      if (createdId) {
        try {
          await deps.deleteUser(createdId);
        } catch {
          return reply(500, {
            error:
              "Admin setup failed and account cleanup could not be completed. Contact the project owner before retrying.",
          });
        }
        return reply(500, {
          error: "Admin profile creation failed. Run the profiles migration before retrying.",
        });
      }
      const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
      if (["email_exists", "user_already_exists"].includes(code))
        return reply(409, { error: "An account with this email already exists. Please sign in." });
      return reply(500, {
        error:
          "Admin account creation failed. Check the Supabase connection and profiles migration.",
      });
    }
  };
}
