import { getSupabase } from "@/lib/supabase";

export type AdminRecord = Record<string, unknown>;
export type AdminResource = {
  table: string;
  select?: string;
  sort?: string;
  filter?: [string, string];
};

// Use the signed-in browser session; database RLS enforces admin access.
export async function fetchAdminRecords(resource: AdminResource, page = 0) {
  let query = getSupabase()
    .from(resource.table)
    .select(resource.select ?? "*", { count: "exact" });
  if (resource.filter) query = query.eq(...resource.filter);
  const { data, error, count } = await query
    .order(resource.sort ?? "created_at", { ascending: false })
    .range(page * 25, page * 25 + 24);
  if (error)
    throw new Error(`Unable to load ${resource.table.replaceAll("_", " ")}: ${error.message}`);
  return { rows: (data ?? []) as unknown as AdminRecord[], count: count ?? 0 };
}

export async function fetchAdminSummary(days: number) {
  const results = await Promise.all([
    getSupabase().rpc("get_dashboard_stats"),
    getSupabase().rpc("get_sales_chart", { p_days: days }),
  ]);
  for (const result of results) {
    if (result.error) throw new Error(`Unable to load store performance: ${result.error.message}`);
  }
  if (!results[0].data || !Array.isArray(results[1].data))
    throw new Error("The store performance response was incomplete.");
  return {
    stats: results[0].data as Record<string, number>,
    sales: results[1].data as Array<{ date: string; revenue: number; orders: number }>,
  };
}
