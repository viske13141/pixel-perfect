import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PackageCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { CustomerButton, CustomerLayout, CustomerSection } from "./CustomerLayout";
import {
  activeOrderStatuses,
  fetchCustomerOrder,
  fetchCustomerOrders,
  filterCustomerOrders,
  type LiveOrder,
  type LiveOrderItem,
} from "@/services/customerOrderService";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
const date = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(
    new Date(value),
  );

function useOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: () => fetchCustomerOrders(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

function QueryState({
  pending,
  error,
  retry,
}: {
  pending: boolean;
  error: Error | null;
  retry: () => void;
}) {
  if (pending)
    return (
      <p role="status" className="border border-border p-6 text-muted-foreground">
        Loading your orders…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="space-y-4 border border-border p-6">
        <p>{error.message}</p>
        <CustomerButton onClick={retry}>Try again</CustomerButton>
      </div>
    );
  return null;
}

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex border px-3 py-1 text-[0.6rem] uppercase tracking-wider ${status === "CANCELLED" || status === "FAILED" ? "border-destructive/40 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}
    >
      {status}
    </span>
  );
}

function Item({ item }: { item: LiveOrderItem }) {
  const image = [...(item.product?.images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <div className="flex items-center gap-4 py-4">
      {image ? (
        <img
          src={image}
          alt={item.product_name}
          className="h-24 w-24 shrink-0 object-contain"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 items-center justify-center bg-night"
        >
          <PackageCheck className="h-6 w-6 text-primary/50" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm">{item.product_name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.variant}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Qty: {item.quantity} · {money(item.unit_price)} each
        </p>
      </div>
      <p className="text-sm">{money(item.total_price)}</p>
    </div>
  );
}

function OrderCard({ order }: { order: LiveOrder }) {
  const shipment = order.shipments[0];
  return (
    <article className="border border-border bg-card/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl">Order #{order.id}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{date(order.created_at)}</p>
        </div>
        <Badge status={order.status} />
      </div>
      {order.items.length ? (
        order.items.map((item) => <Item key={item.id} item={item} />)
      ) : (
        <p className="py-4 text-sm text-muted-foreground">
          No item details are available for this order.
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-3 border-t border-border py-4">
        <Badge status={order.payment_status} />
        <p>Total: {money(order.total)}</p>
      </div>
      {shipment?.expected_delivery && activeOrderStatuses.includes(order.status) ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Expected delivery: {shipment.expected_delivery}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link to="/account/orders/$orderId" params={{ orderId: order.id }} className="btn-quiet">
          View Order
        </Link>
        {["SHIPPED", "OUT FOR DELIVERY"].includes(order.status) ? (
          <Link
            to="/account/orders/$orderId/track"
            params={{ orderId: order.id }}
            className="btn-gold"
          >
            Track Order
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function EmptyOrders() {
  return (
    <div className="border border-border bg-card/40 px-5 py-12 text-center">
      <PackageCheck className="mx-auto h-7 w-7 text-primary" />
      <h2 className="mt-4 text-2xl">No orders yet.</h2>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Your purchases will appear here after you place an order.
      </p>
      <Link to="/shop" className="btn-gold">
        Explore the collection
      </Link>
    </div>
  );
}

export function AccountOverview() {
  const { user } = useAuth();
  const query = useOrders();
  const orders = query.data ?? [];
  const activeOrder = orders.find((order) => activeOrderStatuses.includes(order.status));
  const purchasedItems = [
    ...new Map(
      orders
        .filter((order) => order.status === "DELIVERED")
        .flatMap((order) => order.items)
        .map((item) => [item.product_id, item]),
    ).values(),
  ];
  const summary = [
    { label: "Orders", count: orders.length },
    {
      label: "In Transit",
      count: orders.filter((order) => ["SHIPPED", "OUT FOR DELIVERY"].includes(order.status))
        .length,
    },
    { label: "Delivered", count: orders.filter((order) => order.status === "DELIVERED").length },
  ];
  return (
    <CustomerLayout
      heading={`Welcome back, ${user?.fullName ?? "Customer"}`}
      eyebrow="Your account"
    >
      <p className="-mt-4 mb-8 text-sm text-muted-foreground">Your ritual, all in one place.</p>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data && !query.error ? (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {summary.map(({ label, count }) => (
              <div key={label} className="border border-border bg-card/40 p-5">
                <p className="font-serif text-3xl">{count}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <CustomerSection
            title="Current Order"
            className="mb-6"
            action={
              <Link to="/account/orders" className="text-xs text-primary">
                All orders →
              </Link>
            }
          >
            {activeOrder ? (
              <OrderCard order={activeOrder} />
            ) : orders.length ? (
              <p className="text-sm text-muted-foreground">You have no active orders.</p>
            ) : (
              <EmptyOrders />
            )}
          </CustomerSection>
          {orders.length > 0 ? (
            <CustomerSection title="Recent Orders" className="mb-6">
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </CustomerSection>
          ) : null}
          {purchasedItems.length > 0 ? (
            <CustomerSection title="Previously Purchased">
              <div className="divide-y divide-border">
                {purchasedItems.slice(0, 4).map((item) => (
                  <Item key={item.product_id} item={item} />
                ))}
              </div>
              <Link to="/shop" className="btn-quiet mt-4">
                Shop the collection
              </Link>
            </CustomerSection>
          ) : null}
        </>
      ) : null}
    </CustomerLayout>
  );
}

export function OrdersPage() {
  const query = useOrders();
  const [tab, setTab] = useState("All");
  const orders = filterCustomerOrders(query.data ?? [], tab);
  return (
    <CustomerLayout heading="My Orders" eyebrow="Your ritual, in progress">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Track your current orders and revisit previous purchases.
        </p>
        <CustomerButton
          variant="quiet"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </CustomerButton>
      </div>
      <div
        role="tablist"
        aria-label="Filter orders"
        className="mb-6 flex overflow-x-auto border-b border-border"
      >
        {["All", "Processing", "Shipped", "Delivered", "Cancelled", "Returns"].map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={tab === filter}
            onClick={() => setTab(filter)}
            className={`min-h-12 shrink-0 border-b px-4 text-xs uppercase tracking-wider ${tab === filter ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {filter}
          </button>
        ))}
      </div>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data && !query.error ? (
        <div className="space-y-4">
          {orders.length ? (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : tab === "All" ? (
            <EmptyOrders />
          ) : (
            <p className="border border-border p-8 text-center text-muted-foreground">
              No {tab.toLowerCase()} orders.
            </p>
          )}
        </div>
      ) : null}
    </CustomerLayout>
  );
}

export function OrderDetailsPage({
  orderId,
  tracking = false,
}: {
  orderId: string;
  tracking?: boolean;
}) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["customer-order", user?.id, orderId],
    queryFn: () => fetchCustomerOrder(user!.id, orderId),
    enabled: Boolean(user?.id),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const order = query.data;
  const shipment = order?.shipments[0];
  return (
    <CustomerLayout
      heading={tracking ? "Track Order" : "Order Details"}
      eyebrow={`Order #${orderId}`}
    >
      <Link to="/account/orders" className="mb-6 inline-block text-sm text-primary">
        ← All orders
      </Link>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {!query.isPending && !query.error && !order ? (
        <p role="status" className="border border-border p-8">
          This order was not found in your account.
        </p>
      ) : null}
      {order && !query.error ? (
        <div className="space-y-6">
          <OrderCard order={order} />
          <CustomerSection title="Shipment">
            {shipment ? (
              <dl className="space-y-3 text-sm">
                {[
                  ["Status", shipment.status],
                  ["Courier", shipment.courier],
                  ["Tracking number", shipment.tracking_number],
                  ["Expected delivery", shipment.expected_delivery],
                  ["Dispatched", shipment.dispatched_at ? date(shipment.dispatched_at) : ""],
                  ["Delivered", shipment.delivered_at ? date(shipment.delivered_at) : ""],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="flex flex-wrap justify-between gap-3">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Shipment details are not available yet.
              </p>
            )}
          </CustomerSection>
          <CustomerSection title="Order Timeline">
            {order.history.length ? (
              <ol className="space-y-4">
                {[...order.history]
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .map((event) => (
                    <li key={event.id} className="border-l border-primary/40 pl-4">
                      <p className="text-sm">{event.status}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{date(event.created_at)}</p>
                      {event.note ? (
                        <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>
                      ) : null}
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No status updates recorded yet.</p>
            )}
          </CustomerSection>
          <div className="grid gap-6 lg:grid-cols-2">
            <CustomerSection title="Order Summary">
              <dl className="space-y-3 text-sm">
                {[
                  ["Subtotal", order.subtotal],
                  ["Discount", -Number(order.discount_amount)],
                  ["Shipping", order.shipping_amount],
                  ["Tax", order.tax_amount],
                  ["Total", order.total],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>{money(Number(value))}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                <p>Payment: {order.payment_status}</p>
                {order.payment_method ? <p>Method: {order.payment_method}</p> : null}
                {order.transaction_reference ? (
                  <p className="break-all">Reference: {order.transaction_reference}</p>
                ) : null}
              </div>
            </CustomerSection>
            <CustomerSection title="Delivery Address">
              {order.address ? (
                <address className="space-y-1 text-sm not-italic text-muted-foreground">
                  <p className="text-foreground">{order.address.full_name}</p>
                  <p>{order.address.line1}</p>
                  {order.address.line2 ? <p>{order.address.line2}</p> : null}
                  {order.address.landmark ? <p>{order.address.landmark}</p> : null}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.pin_code}
                  </p>
                  <p>{order.address.country}</p>
                  <p>{order.address.mobile}</p>
                </address>
              ) : (
                <p className="text-sm text-muted-foreground">Delivery address is unavailable.</p>
              )}
            </CustomerSection>
          </div>
        </div>
      ) : null}
    </CustomerLayout>
  );
}

export function TrackOrderPage({ orderId }: { orderId: string }) {
  return <OrderDetailsPage orderId={orderId} tracking />;
}
