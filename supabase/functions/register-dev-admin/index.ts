import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { createDevAdminHandler } from "./handler.ts";

// These secrets exist ONLY in the Edge Function environment, never in VITE_*.
const getAdmin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

Deno.serve(
  createDevAdminHandler({
    enabled: Deno.env.get("DEV_ADMIN_REGISTRATION_ENABLED") === "true",
    secret: Deno.env.get("DEV_ADMIN_BOOTSTRAP_SECRET") ?? "",
    allowedOrigin: Deno.env.get("DEV_ADMIN_ALLOWED_ORIGIN") ?? "",
    expiresAt: Deno.env.get("DEV_ADMIN_EXPIRES_AT") ?? "",
    async createUser(input) {
      const { data, error } = await getAdmin().auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { full_name: input.fullName, mobile: input.mobile },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Missing user");
      return data.user.id;
    },
    async grantAdmin(id) {
      const { data, error } = await getAdmin()
        .from("profiles")
        .update({ role: "ADMIN" })
        .eq("id", id)
        .select("id,role")
        .single();
      if (error) throw error;
      if (!data || data.role !== "ADMIN") throw new Error("Missing admin profile");
    },
    async deleteUser(id) {
      const { error } = await getAdmin().auth.admin.deleteUser(id);
      if (error) throw error;
    },
  }),
);
