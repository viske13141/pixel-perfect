import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv("development", process.cwd(), "VITE_");
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!env.VITE_SUPABASE_URL || !key) {
  throw new Error("Supabase URL and publishable key are required.");
}
const client = createClient(env.VITE_SUPABASE_URL, key, { auth: { persistSession: false } });
// Validate the live relation names without retrieving customer records.
const { status, error } = await client
  .from("orders")
  .select(
    `
  id, items:order_items(id, product:products(images:product_images(url, position))),
  shipments(tracking_number), history:order_status_history(id),
  address:customer_addresses(full_name)
`,
  )
  .limit(0);
console.log(
  JSON.stringify({ status, error: error ? { code: error.code, message: error.message } : null }),
);
if (error) process.exitCode = 1;

for (const [table, selection] of [
  ["profiles", "id,full_name,email,mobile"],
  [
    "customer_addresses",
    "id,customer_id,type,full_name,mobile,line1,line2,landmark,city,state,pin_code,country,is_default",
  ],
  [
    "reviews",
    "id,customer_id,product_id,order_id,rating,title,body,status,verified,created_at,product:products(name,images:product_images(url,position))",
  ],
  [
    "support_tickets",
    "id,customer_id,order_id,category,subject,message,status,created_at,messages:ticket_messages(id,author_role,body,created_at)",
  ],
]) {
  const result = await client.from(table).select(selection).limit(0);
  console.log(
    JSON.stringify({
      table,
      status: result.status,
      error: result.error ? { code: result.error.code, message: result.error.message } : null,
    }),
  );
  // Profiles deliberately deny anonymous table access; signed-in auth owns that check.
  if (result.error && !(table === "profiles" && result.error.code === "42501"))
    process.exitCode = 1;
}
