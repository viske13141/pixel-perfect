import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountOverview,
  OrderDetailsPage,
  OrdersPage,
} from "@/components/customer/LiveCustomerOrders";
import type { LiveOrder } from "@/services/customerOrderService";

const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn() }));
vi.mock("@/context/useAuth", () => ({
  useAuth: () => ({ user: { id: "alice", fullName: "Alice" } }),
}));
vi.mock("@/services/customerOrderService", async (original) => ({
  ...(await original<typeof import("@/services/customerOrderService")>()),
  fetchCustomerOrders: mocks.list,
  fetchCustomerOrder: mocks.detail,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("@/components/customer/CustomerLayout", () => ({
  CustomerLayout: ({ children, heading }: { children: ReactNode; heading: string }) => (
    <main>
      <h1>{heading}</h1>
      {children}
    </main>
  ),
  CustomerSection: ({ children, title }: { children: ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  CustomerButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const clients: QueryClient[] = [];
function mount(component: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
}

function order(status = "SHIPPED"): LiveOrder {
  return {
    id: "REAL-42",
    customer_id: "alice",
    status,
    payment_status: "PAID",
    payment_method: "UPI",
    transaction_reference: "PAY-42",
    subtotal: 750,
    discount_amount: 0,
    shipping_amount: 0,
    tax_amount: 0,
    total: 750,
    created_at: "2026-10-10T07:00:00Z",
    items: [
      {
        id: "item-42",
        product_id: "product-42",
        product_name: "My actual hair oil",
        variant: "150 ml",
        quantity: 2,
        unit_price: 375,
        total_price: 750,
        product: null,
      },
    ],
    shipments: [
      {
        courier: "Actual Courier",
        tracking_number: "AWB-42",
        status: "IN TRANSIT",
        expected_delivery: "12 Oct 2026",
        dispatched_at: null,
        delivered_at: null,
      },
    ],
    history: [
      { id: "event-42", status, note: "Dispatched by store", created_at: "2026-10-10T07:00:00Z" },
    ],
    address: null,
  };
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe("Live customer account pages", () => {
  it("shows an empty signed-in account without demo purchases", async () => {
    mocks.list.mockResolvedValue([]);
    mount(<AccountOverview />);
    expect(screen.getByRole("heading", { name: "Welcome back, Alice" })).toBeInTheDocument();
    expect(await screen.findByText("No orders yet.")).toBeInTheDocument();
    expect(screen.queryByText(/1R1028|Ananya|10 October/)).not.toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith("alice");
  });

  it("shows loading while customer data is pending", () => {
    mocks.list.mockReturnValue(new Promise(() => {}));
    mount(<OrdersPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your orders");
    expect(screen.queryByText("No orders yet.")).not.toBeInTheDocument();
  });

  it("displays real order fields and refreshes after a status change", async () => {
    mocks.list.mockResolvedValueOnce([order()]).mockResolvedValue([order("DELIVERED")]);
    mount(<OrdersPage />);
    expect(await screen.findByText("My actual hair oil")).toBeInTheDocument();
    expect(screen.getByText("Order #REAL-42")).toBeInTheDocument();
    expect(screen.getByText("SHIPPED")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.getByText("DELIVERED")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "Shipped" }));
    expect(screen.getByText("No shipped orders.")).toBeInTheDocument();
  });

  it("shows errors distinctly from an empty order history and supports retry", async () => {
    mocks.list
      .mockRejectedValueOnce(new Error("Unable to load your orders."))
      .mockResolvedValue([]);
    mount(<OrdersPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load your orders.");
    expect(screen.queryByText("No orders yet.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No orders yet.")).toBeInTheDocument();
  });

  it("does not display another order when an ID is missing from this account", async () => {
    mocks.detail.mockResolvedValue(null);
    mount(<OrderDetailsPage orderId="not-mine" />);
    expect(
      await screen.findByText("This order was not found in your account."),
    ).toBeInTheDocument();
    expect(mocks.detail).toHaveBeenCalledWith("alice", "not-mine");
  });

  it("shows database tracking and history instead of fabricated dates", async () => {
    mocks.detail.mockResolvedValue(order());
    mount(<OrderDetailsPage orderId="REAL-42" tracking />);
    expect(await screen.findByText("AWB-42")).toBeInTheDocument();
    expect(screen.getByText("Actual Courier")).toBeInTheDocument();
    expect(screen.getByText("Dispatched by store")).toBeInTheDocument();
    expect(screen.getByText("Delivery address is unavailable.")).toBeInTheDocument();
  });
});
