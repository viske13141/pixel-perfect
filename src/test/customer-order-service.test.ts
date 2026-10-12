import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchCustomerOrder,
  fetchCustomerOrders,
  filterCustomerOrders,
  type LiveOrder,
} from "@/services/customerOrderService";

const query = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => query }));

beforeEach(() => {
  vi.resetAllMocks();
  query.from.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
});

describe("Customer order data", () => {
  it("scopes orders to the signed-in customer and handles the unique shipment relation", async () => {
    query.order.mockResolvedValue({
      data: [
        {
          id: "1R-real",
          customer_id: "alice",
          shipments: { tracking_number: "TRACK-REAL" },
          items: [],
          history: [],
        },
      ],
      error: null,
    });
    const orders = await fetchCustomerOrders("alice");
    expect(query.eq).toHaveBeenCalledWith("customer_id", "alice");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(orders[0]?.shipments[0]?.tracking_number).toBe("TRACK-REAL");
  });

  it("returns an empty account instead of demo orders", async () => {
    query.order.mockResolvedValue({ data: [], error: null });
    expect(await fetchCustomerOrders("alice")).toEqual([]);
  });

  it("requires authentication before querying", async () => {
    await expect(fetchCustomerOrders("")).rejects.toThrow("Sign in");
    expect(query.from).not.toHaveBeenCalled();
  });

  it("surfaces failures instead of replacing them with empty or mock data", async () => {
    query.order.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    await expect(fetchCustomerOrders("alice")).rejects.toThrow("Unable to load your orders");
  });

  it("checks ownership when loading details and never falls back to a different order", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await fetchCustomerOrder("alice", "another-order")).toBeNull();
    expect(query.eq.mock.calls).toEqual([
      ["customer_id", "alice"],
      ["id", "another-order"],
    ]);
  });

  it("handles a not-yet-shipped order", async () => {
    query.maybeSingle.mockResolvedValue({
      data: { id: "new", shipments: null, items: [], history: [] },
      error: null,
    });
    expect((await fetchCustomerOrder("alice", "new"))?.shipments).toEqual([]);
  });

  it("includes all database processing, transit, and return statuses in the filters", () => {
    const orders = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT FOR DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURN REQUESTED",
      "REFUNDED",
    ].map((status) => ({ status }) as LiveOrder);
    expect(filterCustomerOrders(orders, "Processing")).toHaveLength(4);
    expect(filterCustomerOrders(orders, "Shipped")).toHaveLength(2);
    expect(filterCustomerOrders(orders, "Returns")).toHaveLength(2);
    expect(filterCustomerOrders(orders, "Delivered")).toHaveLength(1);
    expect(filterCustomerOrders(orders, "All")).toHaveLength(10);
  });
});
