import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAdminRecords, fetchAdminSummary } from "@/services/adminDataService";

const client = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => client }));
beforeEach(() => {
  vi.resetAllMocks();
  for (const method of [client.from, client.select, client.eq, client.order])
    method.mockReturnValue(client);
});
describe("Live admin data", () => {
  it("loads a filtered page and retains the server total", async () => {
    client.range.mockResolvedValue({ data: [{ id: "customer-real" }], count: 31, error: null });
    expect(await fetchAdminRecords({ table: "profiles", filter: ["role", "CUSTOMER"] }, 1)).toEqual(
      { rows: [{ id: "customer-real" }], count: 31 },
    );
    expect(client.eq).toHaveBeenCalledWith("role", "CUSTOMER");
    expect(client.range).toHaveBeenCalledWith(25, 49);
  });
  it("shows empty results without seeded records", async () => {
    client.range.mockResolvedValue({ data: [], count: 0, error: null });
    expect(await fetchAdminRecords({ table: "orders" })).toEqual({ rows: [], count: 0 });
  });
  it("surfaces database failures instead of showing zero totals", async () => {
    client.range.mockResolvedValue({ data: null, error: { message: "Permission denied" } });
    await expect(fetchAdminRecords({ table: "payments" })).rejects.toThrow("Permission denied");
  });
  it("loads performance for the chosen range from the database", async () => {
    client.rpc
      .mockResolvedValueOnce({ data: { total_orders: 2 }, error: null })
      .mockResolvedValueOnce({ data: [{ date: "10 Oct", revenue: 500, orders: 2 }], error: null });
    const summary = await fetchAdminSummary(30);
    expect(client.rpc).toHaveBeenCalledWith("get_sales_chart", { p_days: 30 });
    expect(summary.stats["total_orders"]).toBe(2);
    expect(summary.sales[0]?.revenue).toBe(500);
  });
  it("rejects incomplete performance data", async () => {
    client.rpc.mockResolvedValue({ data: null, error: null });
    await expect(fetchAdminSummary(7)).rejects.toThrow("incomplete");
  });
});
