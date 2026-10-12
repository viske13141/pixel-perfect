import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/services/customerAccountService";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  auth: { getUser: vi.fn(), updateUser: vi.fn(), signInWithPassword: vi.fn() },
  fetchOrder: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mocks }));
vi.mock("@/services/customerOrderService", () => ({ fetchCustomerOrder: mocks.fetchOrder }));
const product = { id: "oil", name: "Oil", variant: "100ml", price: 500, image: "/img/9.png" };
beforeEach(() => {
  vi.resetAllMocks();
  for (const key of ["from", "select", "eq", "insert", "update"] as const)
    mocks[key].mockReturnValue(mocks);
  mocks.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: "alice",
        email: "alice@example.com",
        user_metadata: { firstroot_wishlist: [product] },
      },
    },
    error: null,
  });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
});
describe("Live account actions", () => {
  it("reads saved products from the authenticated account and rejects mismatched customers", async () => {
    expect(await api.fetchWishlist("alice")).toEqual([product]);
    await expect(api.fetchWishlist("bob")).rejects.toThrow("sign in");
  });
  it("persists removal remotely and propagates failed writes", async () => {
    expect(await api.setWishlistProduct("alice", product, false)).toEqual([]);
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({ data: { firstroot_wishlist: [] } });
    mocks.auth.updateUser.mockResolvedValue({ error: {} });
    await expect(api.setWishlistProduct("alice", product, true)).rejects.toThrow("Unable to save");
  });
  it("preserves other saved products without duplicates", async () => {
    const another = { ...product, id: "combo" };
    expect(await api.setWishlistProduct("alice", another, true)).toEqual([product, another]);
    expect(await api.setWishlistProduct("alice", product, true)).toEqual([product]);
  });
  it("scopes every list to its customer and surfaces database errors", async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });
    for (const fetch of [api.fetchReviews, api.fetchTickets, api.fetchAddresses])
      expect(await fetch("alice")).toEqual([]);
    expect(mocks.eq.mock.calls).toEqual(Array(3).fill(["customer_id", "alice"]));
    mocks.order.mockResolvedValue({ data: null, error: {} });
    await expect(api.fetchTickets("alice")).rejects.toThrow("Unable to load");
  });
  it("updates only editable profile fields", async () => {
    mocks.single.mockResolvedValue({ data: { id: "alice" }, error: null });
    await api.updatePersonalDetails("alice", " Alice ", "9876543210");
    expect(mocks.update).toHaveBeenCalledWith({ full_name: "Alice", mobile: "9876543210" });
    expect(mocks.eq).toHaveBeenCalledWith("id", "alice");
  });
  it("requires a delivered purchase before writing a review", async () => {
    mocks.fetchOrder.mockResolvedValue({ status: "SHIPPED", items: [{ product_id: "oil" }] });
    await expect(
      api.submitReview("alice", {
        orderId: "order1",
        productId: "oil",
        rating: 5,
        title: "Title",
        body: "Review",
      }),
    ).rejects.toThrow("delivered orders");
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.fetchOrder).toHaveBeenCalledWith("alice", "order1");
  });
  it("blocks support requests linked to another customer's order", async () => {
    mocks.fetchOrder.mockResolvedValue(null);
    await expect(
      api.createTicket("alice", {
        orderId: "other",
        category: "Order",
        subject: "Help",
        message: "Help",
      }),
    ).rejects.toThrow("your account");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not reply to a missing or closed ticket", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(api.replyToTicket("alice", "other", "Help")).rejects.toThrow("not found");
    expect(mocks.eq).toHaveBeenCalledWith("customer_id", "alice");
    mocks.maybeSingle.mockResolvedValue({ data: { id: "ticket", status: "CLOSED" }, error: null });
    await expect(api.replyToTicket("alice", "ticket", "Help")).rejects.toThrow("closed");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not change a password when current credentials fail", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ error: {} });
    await expect(api.changePassword("alice", "wrong", "newpassword")).rejects.toThrow("incorrect");
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });
});
