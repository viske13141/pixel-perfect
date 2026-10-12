import type { ReactNode, ButtonHTMLAttributes } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  WishlistPage,
  ReviewsPage,
  ProfilePage,
  SupportPage,
} from "@/components/customer/LiveCustomerAccount";
const mocks = vi.hoisted(() => ({
  fetchWishlist: vi.fn(),
  setWishlistProduct: vi.fn(),
  fetchReviews: vi.fn(),
  fetchTickets: vi.fn(),
  fetchAddresses: vi.fn(),
  loadProfile: vi.fn(),
  createTicket: vi.fn(),
  orders: vi.fn(),
  updatePersonalDetails: vi.fn(),
}));
vi.mock("@/context/useAuth", () => ({
  useAuth: () => ({ user: { id: "alice" }, refreshProfile: vi.fn() }),
}));
vi.mock("@/services/customerAccountService", async (original) => ({
  ...(await original<typeof import("@/services/customerAccountService")>()),
  ...mocks,
}));
vi.mock("@/services/customerOrderService", () => ({ fetchCustomerOrders: mocks.orders }));
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
    variant: _variant,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => <button {...props} />,
}));
const clients: QueryClient[] = [];
function mount(component: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  for (const fn of [
    mocks.fetchWishlist,
    mocks.fetchReviews,
    mocks.fetchTickets,
    mocks.fetchAddresses,
    mocks.orders,
  ])
    fn.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
it("shows a real empty wishlist without sample products", async () => {
  mount(<WishlistPage />);
  expect(await screen.findByText("Nothing saved yet")).toBeTruthy();
  expect(mocks.fetchWishlist).toHaveBeenCalledWith("alice");
});
it("keeps a saved item visible when its removal fails", async () => {
  const product = {
    id: "oil",
    name: "Saved oil",
    variant: "100 ml",
    price: 500,
    image: "/img/9.png",
  };
  mocks.fetchWishlist.mockResolvedValue([product]);
  mocks.setWishlistProduct.mockRejectedValue(new Error("Save failed"));
  mount(<WishlistPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
  expect(screen.getByText("Saved oil")).toBeTruthy();
});
it("shows a review load error rather than a fabricated empty state", async () => {
  mocks.fetchReviews.mockRejectedValue(new Error("Reviews unavailable"));
  mount(<ReviewsPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Reviews unavailable");
  expect(screen.queryByText("You haven't submitted any reviews yet.")).toBeNull();
});
it("loads and saves the customer's actual profile", async () => {
  mocks.loadProfile.mockResolvedValue({
    id: "alice",
    full_name: "Actual Customer",
    mobile: "9876543210",
    email: "actual@example.com",
  });
  mocks.updatePersonalDetails.mockResolvedValue({ id: "alice" });
  mount(<ProfilePage />);
  const input = await screen.findByLabelText("Full name");
  expect(input).toHaveValue("Actual Customer");
  fireEvent.change(input, { target: { value: "Updated Customer" } });
  fireEvent.click(screen.getByRole("button", { name: "Save personal details" }));
  await waitFor(() =>
    expect(mocks.updatePersonalDetails).toHaveBeenCalledWith(
      "alice",
      "Updated Customer",
      "9876543210",
    ),
  );
  expect(await screen.findByText("Personal details saved.")).toBeTruthy();
});
it("shows support success only after the database confirms the request", async () => {
  let resolve!: (id: string) => void;
  mocks.createTicket.mockReturnValue(
    new Promise<string>((done) => {
      resolve = done;
    }),
  );
  mount(<SupportPage />);
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "My shipment" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Please help" } });
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() =>
    expect(mocks.createTicket).toHaveBeenCalledWith("alice", {
      category: "General",
      orderId: "",
      subject: "My shipment",
      message: "Please help",
    }),
  );
  expect(screen.queryByText(/Request sent/)).toBeNull();
  resolve("REAL-TICKET");
  expect(await screen.findByText("Request sent. Reference: REAL-TICKET")).toBeTruthy();
});
