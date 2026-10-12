import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type Role = "ADMIN" | "CUSTOMER";
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  role: Role;
  created_at: string;
  updated_at: string;
};
// Existing UI shape, now sourced only from protected profiles.
export type Customer = { id: string; fullName: string; email: string; mobile: string; role: Role };
export type SignInInput = { email: string; password: string };
export type SignUpInput = SignInInput & {
  fullName: string;
  mobile: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  accountType?: Role;
  bootstrapSecret?: string;
};
export type AuthField =
  "fullName" | "email" | "mobile" | "password" | "confirmPassword" | "terms" | "submit";
export type AuthResult =
  | { ok: true; customer: Customer; profile: Profile; session: Session }
  | { ok: false; field?: AuthField; message: string };

export function dashboardForRole(role: Role) {
  return role === "ADMIN" ? ("/admin" as const) : ("/account" as const);
}
export function isDevAdminRegistrationEnabled() {
  return import.meta.env.DEV && import.meta.env["VITE_ENABLE_DEV_ADMIN_REGISTRATION"] === "true";
}
export function customerFromProfile(profile: Profile): Customer {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    mobile: profile.mobile,
    role: profile.role,
  };
}
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "user_already_exists" || code === "email_exists")
    return "An account with this email already exists. Please sign in.";
  if (code === "invalid_credentials") return "The email or password is incorrect.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit")
    return "Too many attempts. Please wait and try again.";
  if (code === "unexpected_failure")
    return "Your account could not be created. Check that the profiles migration has been applied.";
  const message = error instanceof Error ? error.message : "Unable to connect. Please try again.";
  if (/fetch|network|failed to send/i.test(message))
    return "Unable to connect. Check your connection and try again.";
  return message;
}
function failure(error: unknown): AuthResult {
  return { ok: false, field: "submit", message: authErrorMessage(error) };
}
export async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id,full_name,email,mobile,role,created_at,updated_at")
    .eq("id", userId)
    .single();
  if (error || !data) {
    if (error && /fetch|network/i.test(error.message))
      throw new Error("Unable to connect. Check your connection and try again.");
    throw new Error(
      "Your profile could not be loaded. Ask the project owner to run the profiles migration, then try again.",
    );
  }
  if (data.id !== userId || (data.role !== "ADMIN" && data.role !== "CUSTOMER"))
    throw new Error("Your account has no valid role. Contact the project owner.");
  return data as Profile;
}
async function authenticatedResult(session: Session | null): Promise<AuthResult> {
  if (!session)
    throw new Error(
      "No authenticated session was created. Check that email confirmation is disabled in Supabase, then sign in.",
    );
  const profile = await loadProfile(session.user.id);
  return { ok: true, session, profile, customer: customerFromProfile(profile) };
}
export async function loginCustomer(input: SignInInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, field: "email", message: "Please enter a valid email address." };
  if (!input.password) return { ok: false, field: "password", message: "Password is required." };
  try {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error) throw error;
    return await authenticatedResult(data.session);
  } catch (error) {
    return failure(error);
  }
}
export async function registerCustomer(input: SignUpInput): Promise<AuthResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const mobile = input.mobile.trim();
  if (fullName.length < 2)
    return { ok: false, field: "fullName", message: "Please enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, field: "email", message: "Please enter a valid email address." };
  if (!/^\+?[0-9\s()-]{10,15}$/.test(mobile))
    return { ok: false, field: "mobile", message: "Please enter a valid mobile number." };
  if (
    input.password.length < 8 ||
    !/[A-Z]/.test(input.password) ||
    !/[a-z]/.test(input.password) ||
    !/[0-9]/.test(input.password)
  )
    return {
      ok: false,
      field: "password",
      message: "Use at least 8 characters with uppercase, lowercase, and a number.",
    };
  if (input.password !== input.confirmPassword)
    return { ok: false, field: "confirmPassword", message: "Passwords do not match." };
  if (!input.agreedToTerms)
    return {
      ok: false,
      field: "terms",
      message: "Please accept the Terms of Service and Privacy Policy.",
    };
  if (input.accountType && input.accountType !== "ADMIN" && input.accountType !== "CUSTOMER")
    return failure(new Error("Invalid account type."));
  try {
    if (input.accountType === "ADMIN") {
      if (!isDevAdminRegistrationEnabled())
        throw new Error(
          "Admin registration is available only in an authorized local development setup. Contact the project owner.",
        );
      if (!input.bootstrapSecret)
        throw new Error("Enter the development bootstrap secret supplied by the project owner.");
      const { data, error } = await getSupabase().functions.invoke("register-dev-admin", {
        body: {
          fullName,
          email,
          mobile,
          password: input.password,
          bootstrapSecret: input.bootstrapSecret,
        },
      });
      if (error) {
        let message =
          "Admin registration was not authorized or the development function is unavailable.";
        if ("context" in error && error.context instanceof Response) {
          const body: unknown = await error.context.json().catch(() => null);
          if (body && typeof body === "object" && "error" in body && typeof body.error === "string")
            message = body.error;
        }
        throw new Error(message);
      }
      if (!data?.ok) throw new Error("Admin registration could not be completed.");
      const result = await loginCustomer({ email, password: input.password });
      if (!result.ok) return result;
      if (result.profile.role !== "ADMIN")
        throw new Error("Admin access was not granted. Contact the project owner.");
      return result;
    }
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password: input.password,
      options: { data: { full_name: fullName, mobile } },
    });
    if (error) throw error;
    return await authenticatedResult(data.session);
  } catch (error) {
    return failure(error);
  }
}
export async function logoutCustomer() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}
