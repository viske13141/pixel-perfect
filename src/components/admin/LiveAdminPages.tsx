import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AdminMetric, AdminPageHeader, AdminSection } from "./AdminLayout";
import { getSupabase } from "@/lib/supabase";
import {
  fetchAdminRecords,
  fetchAdminSummary,
  type AdminRecord,
  type AdminResource,
} from "@/services/adminDataService";

type Column = [string, string];
const buttonClass = "min-h-10 border border-border px-4 text-xs text-primary disabled:opacity-40";
const moneyFields = new Set([
  "total",
  "subtotal",
  "amount",
  "refund_amount",
  "unit_price",
  "total_price",
  "discount_amount",
  "shipping_amount",
  "tax_amount",
  "minimum_order",
]);

function field(row: AdminRecord, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as AdminRecord)[key] : undefined,
      row,
    );
}

function display(value: unknown, key: string): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (moneyFields.has(key))
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      Number(value),
    );
  if (key.endsWith("_at") && typeof value === "string")
    return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Records({
  title,
  resource,
  columns,
  detail,
}: {
  title: string;
  resource: AdminResource;
  columns: Column[];
  detail?: "orders" | "customers" | "support" | undefined;
}) {
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ rows: AdminRecord[]; count: number } | null>(null);
  const [error, setError] = useState("");
  const resourceKey = JSON.stringify(resource);
  useEffect(() => {
    let active = true;
    setState(null);
    setError("");
    fetchAdminRecords(JSON.parse(resourceKey), page).then(
      (result) => {
        if (active) setState(result);
      },
      (reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load records.");
      },
    );
    return () => {
      active = false;
    };
  }, [resourceKey, page, version]);
  return (
    <AdminSection
      title={title}
      action={
        <button className={buttonClass} onClick={() => setVersion((v) => v + 1)}>
          Refresh
        </button>
      }
    >
      {error ? (
        <p role="alert" className="py-6 text-sm text-red-300">
          {error}
        </p>
      ) : !state ? (
        <p role="status" className="py-6 text-sm text-muted-foreground">
          Loading records…
        </p>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">{state.count} records</p>
          {!state.rows.length ? (
            <p className="py-8 text-sm text-muted-foreground">No records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {columns.map(([key, label]) => (
                      <th
                        key={key}
                        className="border-b border-border px-3 py-3 text-xs font-normal text-muted-foreground"
                      >
                        {label}
                      </th>
                    ))}
                    {detail && <th className="px-3">Details</th>}
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((row, i) => (
                    <tr key={String(row["id"] ?? i)}>
                      {columns.map(([key]) => (
                        <td
                          key={key}
                          className="max-w-sm border-b border-border px-3 py-4 break-words"
                        >
                          {display(field(row, key), key)}
                        </td>
                      ))}
                      {detail && (
                        <td className="border-b border-border px-3 py-4">
                          {detail === "orders" ? (
                            <Link
                              className="text-primary"
                              to="/admin/orders/$orderId"
                              params={{ orderId: String(row["id"]) }}
                            >
                              View
                            </Link>
                          ) : detail === "customers" ? (
                            <Link
                              className="text-primary"
                              to="/admin/customers/$customerId"
                              params={{ customerId: String(row["id"]) }}
                            >
                              View
                            </Link>
                          ) : (
                            <Link
                              className="text-primary"
                              to="/admin/support/$ticketId"
                              params={{ ticketId: String(row["id"]) }}
                            >
                              View
                            </Link>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              className={buttonClass}
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {Math.max(1, Math.ceil(state.count / 25))}
            </span>
            <button
              className={buttonClass}
              disabled={(page + 1) * 25 >= state.count}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </AdminSection>
  );
}

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <AdminPageHeader title={title} subtitle="Current store records" />
      <div className="space-y-6">{children}</div>
    </>
  );
}

const orderColumns: Column[] = [
  ["id", "Order"],
  ["customer.full_name", "Customer"],
  ["status", "Status"],
  ["payment_status", "Payment"],
  ["total", "Total"],
  ["created_at", "Placed"],
];
const orders: AdminResource = {
  table: "orders",
  select: "*, customer:profiles!orders_customer_id_fkey(full_name,email)",
};
const inventory: AdminResource = {
  table: "inventory_items",
  select: "*, product:products(name)",
  sort: "updated_at",
};
const inventoryColumns: Column[] = [
  ["product.name", "Product"],
  ["sku", "SKU"],
  ["physical_stock", "Physical stock"],
  ["reserved_stock", "Reserved"],
  ["low_stock_threshold", "Low stock threshold"],
  ["updated_at", "Updated"],
];

function PerformancePage({ title }: { title: string }) {
  const [days, setDays] = useState(7);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminSummary>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    fetchAdminSummary(days).then(
      (result) => {
        if (active) setData(result);
      },
      (reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "Unable to load performance.");
      },
    );
    return () => {
      active = false;
    };
  }, [days, version]);
  const metrics: Array<[string, string]> = [
    ["today_revenue", "Today's sales"],
    ["total_orders", "Total orders"],
    ["pending_orders", "Pending orders"],
    ["total_customers", "Customers"],
    ["low_stock_count", "Low stock"],
    ["pending_returns", "Pending refunds"],
  ];
  return (
    <Page title={title}>
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((value) => (
          <button
            key={value}
            className={buttonClass}
            aria-pressed={days === value}
            onClick={() => setDays(value)}
          >
            {value} days
          </button>
        ))}
        <button className={buttonClass} onClick={() => setVersion((v) => v + 1)}>
          Refresh performance
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : !data ? (
        <p role="status">Loading performance…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(([key, label]) => (
              <AdminMetric
                key={key}
                label={label}
                value={
                  key === "today_revenue"
                    ? display(data.stats[key], "total")
                    : (data.stats[key] ?? "—")
                }
              />
            ))}
          </div>
          <AdminSection title="Sales overview">
            <div
              className="flex h-48 items-end gap-1"
              role="img"
              aria-label={`Daily sales over ${days} days`}
            >
              {data.sales.map((point) => (
                <div
                  key={point.date}
                  className="flex h-full min-w-0 flex-1 items-end"
                  title={`${point.date}: ${display(point.revenue, "total")}, ${point.orders} orders`}
                >
                  <div
                    className="w-full bg-primary/75"
                    style={{
                      height: `${Math.max(1, (Number(point.revenue) / Math.max(1, ...data.sales.map((p) => Number(p.revenue)))) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{data.sales[0]?.date}</span>
              <span>{data.sales.at(-1)?.date}</span>
            </div>
            <p className="mt-4 text-sm">
              Period sales:{" "}
              {display(
                data.sales.reduce((sum, point) => sum + Number(point.revenue), 0),
                "total",
              )}
            </p>
          </AdminSection>
        </>
      )}
      <Records title="Recent orders" resource={orders} columns={orderColumns} detail="orders" />
      <Records title="Stock levels" resource={inventory} columns={inventoryColumns} />
    </Page>
  );
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED", "RETURN REQUESTED", "REFUNDED"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  "OUT FOR DELIVERY": "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  "RETURN REQUESTED": "Return Requested",
  REFUNDED: "Refunded",
};
const DELIVERY_TABS: Array<{ label: string; statuses: OrderStatus[] }> = [
  { label: "To Dispatch", statuses: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] },
  { label: "Shipped", statuses: ["SHIPPED"] },
  { label: "Out for Delivery", statuses: ["OUT FOR DELIVERY"] },
  { label: "Delivered", statuses: ["DELIVERED"] },
  { label: "Returns", statuses: ["RETURN REQUESTED", "REFUNDED"] },
  { label: "Cancelled", statuses: ["CANCELLED"] },
  { label: "All Orders", statuses: ORDER_STATUSES as unknown as OrderStatus[] },
];

type DeliveryOrder = AdminRecord & {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  customer: { full_name: string; email: string } | null;
  address: { full_name: string; line1: string; line2: string; city: string; state: string; pin_code: string; mobile: string } | null;
};

async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await getSupabase().from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(`Unable to update order: ${error.message}`);
}

function DeliveryBadge({ status }: { status: OrderStatus }) {
  const colours: Record<OrderStatus, string> = {
    PENDING: "text-amber-300 border-amber-300/30 bg-amber-300/10",
    CONFIRMED: "text-blue-300 border-blue-300/30 bg-blue-300/10",
    PROCESSING: "text-blue-300 border-blue-300/30 bg-blue-300/10",
    PACKED: "text-blue-300 border-blue-300/30 bg-blue-300/10",
    SHIPPED: "text-primary border-primary/30 bg-primary/10",
    "OUT FOR DELIVERY": "text-orange-300 border-orange-300/30 bg-orange-300/10",
    DELIVERED: "text-green-400 border-green-400/30 bg-green-400/10",
    CANCELLED: "text-red-400 border-red-400/30 bg-red-400/10",
    "RETURN REQUESTED": "text-red-300 border-red-300/30 bg-red-300/10",
    REFUNDED: "text-muted-foreground border-border bg-card/35",
  };
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[0.5rem] uppercase tracking-[0.12em] ${colours[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function OrderDeliveryCard({ order, onStatusChange }: { order: DeliveryOrder; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const [updating, setUpdating] = useState(false);
  const addr = order.address;
  const addrLine = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.pin_code].filter(Boolean).join(", ")
    : null;
  const update = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, status);
      onStatusChange(order.id, status);
    } finally {
      setUpdating(false);
    }
  };
  return (
    <article className="grid gap-3 border border-border p-4 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-start">
      <div>
        <Link to="/admin/orders/$orderId" params={{ orderId: order.id }} className="text-xs text-primary underline">
          #{String(order.id).slice(0, 8)}…
        </Link>
        <p className="mt-1 text-[0.58rem] text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="mt-2 text-xs">
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(order.total))}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium">{order.customer?.full_name ?? "—"}</p>
        <p className="mt-0.5 text-[0.58rem] text-muted-foreground">{order.customer?.email ?? ""}</p>
        {addr && (
          <>
            <p className="mt-2 text-[0.6rem] text-muted-foreground">{addr.full_name ?? order.customer?.full_name}</p>
            <p className="text-[0.6rem] text-muted-foreground">{addrLine}</p>
            {addr.mobile && <p className="text-[0.6rem] text-muted-foreground">{addr.mobile}</p>}
          </>
        )}
        {!addr && <p className="mt-2 text-[0.6rem] text-muted-foreground">No delivery address</p>}
      </div>
      <div className="flex flex-col gap-2">
        <DeliveryBadge status={order.status} />
        <label className="text-[0.55rem] text-muted-foreground">
          Update status
          <select
            disabled={updating}
            value={order.status}
            onChange={(e) => update(e.target.value as OrderStatus)}
            className="mt-1 block w-full border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
      </div>
      <Link to="/admin/orders/$orderId" params={{ orderId: order.id }} className={buttonClass}>
        Details
      </Link>
    </article>
  );
}

export function AdminOrdersPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DeliveryOrder[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const tabStatuses = DELIVERY_TABS[tab].statuses;
    const isAll = tabStatuses.length === ORDER_STATUSES.length;
    let query = getSupabase()
      .from("orders")
      .select("id,status,total,created_at,customer:profiles!orders_customer_id_fkey(full_name,email),address:customer_addresses!orders_shipping_address_id_fkey(full_name,line1,line2,city,state,pin_code,mobile)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * 25, page * 25 + 24);
    if (!isAll) query = query.in("status", tabStatuses);
    query.then(
      ({ data, error: err, count: c }) => {
        if (!active) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setRows((data ?? []) as unknown as DeliveryOrder[]);
        setCount(c ?? 0);
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [tab, page, version]);

  const filtered = search.trim()
    ? rows.filter((r) =>
        [r.customer?.full_name, r.customer?.email, String(r.id),
         r.address?.city, r.address?.state]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const tabCounts = DELIVERY_TABS.map((t) => {
    if (t.statuses.length === ORDER_STATUSES.length) return null;
    return rows.filter((r) => (t.statuses as string[]).includes(r.status)).length;
  });

  return (
    <>
      <AdminPageHeader
        title="Orders"
        subtitle="Track deliveries, update order status, and view customer addresses."
        action={
          <button className={buttonClass} onClick={() => setVersion((v) => v + 1)}>Refresh</button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border pb-4">
        {DELIVERY_TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => { setTab(i); setPage(0); }}
            className={`min-h-9 px-3 text-[0.52rem] uppercase tracking-[0.12em] transition-colors ${
              tab === i ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {tabCounts[i] != null && tabCounts[i]! > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[0.48rem] text-primary">
                {tabCounts[i]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <input
          aria-label="Search orders"
          placeholder="Search customer name, email, city…"
          className="w-full border border-border bg-background px-3 py-2 text-sm sm:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
      {loading ? (
        <p role="status" className="py-8 text-sm text-muted-foreground">Loading orders…</p>
      ) : !filtered.length ? (
        <p className="py-8 text-sm text-muted-foreground">No orders in this category.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderDeliveryCard
              key={order.id}
              order={order}
              onStatusChange={(id, status) =>
                setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
              }
            />
          ))}
        </div>
      )}
      {!loading && !error && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button className={buttonClass} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {Math.max(1, Math.ceil(count / 25))}</span>
          <button className={buttonClass} disabled={(page + 1) * 25 >= count} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
export function AdminCustomersPage() {
  return (
    <Page title="Customers">
      <Records
        title="Customers"
        resource={{ table: "profiles", filter: ["role", "CUSTOMER"] }}
        columns={[
          ["full_name", "Name"],
          ["email", "Email"],
          ["mobile", "Phone"],
          ["created_at", "Joined"],
        ]}
        detail="customers"
      />
    </Page>
  );
}
export function AdminInventoryPage() {
  return (
    <Page title="Inventory">
      <Records title="Stock levels" resource={inventory} columns={inventoryColumns} />
      <Records
        title="Stock movements"
        resource={{ table: "inventory_movements", select: "*, item:inventory_items(sku)" }}
        columns={[
          ["item.sku", "SKU"],
          ["adjustment_type", "Type"],
          ["quantity_change", "Change"],
          ["stock_before", "Before"],
          ["stock_after", "After"],
          ["reason", "Reason"],
          ["created_at", "Date"],
        ]}
      />
    </Page>
  );
}
export function AdminReviewsPage() {
  return (
    <Page title="Reviews">
      <Records
        title="Customer reviews"
        resource={{
          table: "reviews",
          select: "*, customer:profiles(full_name), product:products(name)",
        }}
        columns={[
          ["customer.full_name", "Customer"],
          ["product.name", "Product"],
          ["rating", "Rating"],
          ["title", "Title"],
          ["body", "Review"],
          ["status", "Status"],
          ["verified", "Verified"],
        ]}
      />
    </Page>
  );
}
export function AdminShippingPage() {
  return (
    <Page title="Shipping">
      <Records
        title="Shipments"
        resource={{ table: "shipments", sort: "updated_at" }}
        columns={[
          ["order_id", "Order"],
          ["courier", "Courier"],
          ["tracking_number", "Tracking"],
          ["destination", "Destination"],
          ["status", "Status"],
          ["expected_delivery", "Expected delivery"],
        ]}
      />
    </Page>
  );
}
export function AdminReturnsPage() {
  return (
    <Page title="Returns & refunds">
      <Records
        title="Returns"
        resource={{
          table: "returns",
          select: "*, customer:profiles(full_name), product:products(name)",
        }}
        columns={[
          ["order_id", "Order"],
          ["customer.full_name", "Customer"],
          ["product.name", "Product"],
          ["reason", "Reason"],
          ["status", "Status"],
          ["refund_amount", "Refund amount"],
          ["refund_status", "Refund status"],
        ]}
      />
    </Page>
  );
}
export function AdminPaymentsPage() {
  return (
    <Page title="Payments">
      <Records
        title="Payment records"
        resource={{ table: "payments", sort: "updated_at" }}
        columns={[
          ["order_id", "Order"],
          ["amount", "Amount"],
          ["method", "Method"],
          ["status", "Status"],
          ["transaction_ref", "Transaction"],
          ["refund_status", "Refund status"],
          ["paid_at", "Paid"],
        ]}
      />
    </Page>
  );
}
export function AdminDiscountsPage() {
  return (
    <Page title="Discounts">
      <Records
        title="Discount codes"
        resource={{ table: "discount_codes" }}
        columns={[
          ["code", "Code"],
          ["description", "Description"],
          ["discount_type", "Type"],
          ["discount_value", "Value"],
          ["minimum_order", "Minimum order"],
          ["usage_count", "Uses"],
          ["usage_limit", "Limit"],
          ["status", "Status"],
          ["expires_at", "Expires"],
        ]}
      />
    </Page>
  );
}
export function AdminContentPage() {
  return (
    <Page title="Content">
      <Records
        title="Store content"
        resource={{ table: "content_sections", sort: "updated_at" }}
        columns={[
          ["name", "Section"],
          ["summary", "Summary"],
          ["body", "Content"],
          ["updated_at", "Updated"],
        ]}
      />
    </Page>
  );
}
export function AdminSettingsPage() {
  return (
    <Page title="Settings">
      <Records
        title="Store settings"
        resource={{ table: "store_settings", sort: "updated_at" }}
        columns={[
          ["store_name", "Store"],
          ["contact_email", "Email"],
          ["contact_phone", "Phone"],
          ["currency", "Currency"],
          ["timezone", "Timezone"],
          ["email_notifications", "Email notifications"],
          ["low_stock_alerts", "Stock alerts"],
          ["order_alerts", "Order alerts"],
        ]}
      />
    </Page>
  );
}
export function AdminDashboardPage() {
  return <PerformancePage title="Dashboard" />;
}
export function AdminReportsPage() {
  return <PerformancePage title="Reports" />;
}

export function AdminOrderDetailsPage({ orderId }: { orderId: string }) {
  return (
    <Page title={`Order ${orderId}`}>
      <Records
        title="Order"
        resource={{ ...orders, filter: ["id", orderId] }}
        columns={orderColumns}
      />
      <Records
        title="Items"
        resource={{ table: "order_items", filter: ["order_id", orderId] }}
        columns={[
          ["product_name", "Product"],
          ["variant", "Variant"],
          ["quantity", "Quantity"],
          ["unit_price", "Unit price"],
          ["total_price", "Total"],
        ]}
      />
      <Records
        title="Status history"
        resource={{ table: "order_status_history", filter: ["order_id", orderId] }}
        columns={[
          ["status", "Status"],
          ["note", "Note"],
          ["created_at", "Date"],
        ]}
      />
    </Page>
  );
}
export function AdminCustomerDetailsPage({ customerId }: { customerId: string }) {
  return (
    <Page title="Customer details">
      <Records
        title="Customer"
        resource={{ table: "profiles", filter: ["id", customerId] }}
        columns={[
          ["full_name", "Name"],
          ["email", "Email"],
          ["mobile", "Phone"],
          ["created_at", "Joined"],
        ]}
      />
      <Records
        title="Orders"
        resource={{ ...orders, filter: ["customer_id", customerId] }}
        columns={orderColumns}
        detail="orders"
      />
      <Records
        title="Addresses"
        resource={{ table: "customer_addresses", filter: ["customer_id", customerId] }}
        columns={[
          ["full_name", "Name"],
          ["line1", "Address"],
          ["line2", "Address continued"],
          ["city", "City"],
          ["state", "State"],
          ["pin_code", "PIN"],
          ["mobile", "Mobile"],
        ]}
      />
    </Page>
  );
}
export function AdminSupportPage({ ticketId }: { ticketId?: string }) {
  return (
    <Page title="Support">
      <Records
        title="Support tickets"
        resource={{
          table: "support_tickets",
          select: "*, customer:profiles(full_name,email)",
          ...(ticketId ? { filter: ["id", ticketId] as [string, string] } : {}),
        }}
        columns={[
          ["customer.full_name", "Customer"],
          ["order_id", "Order"],
          ["subject", "Subject"],
          ["message", "Message"],
          ["priority", "Priority"],
          ["status", "Status"],
          ["created_at", "Opened"],
        ]}
        detail={ticketId ? undefined : "support"}
      />
      {ticketId && (
        <Records
          title="Conversation"
          resource={{ table: "ticket_messages", filter: ["ticket_id", ticketId] }}
          columns={[
            ["author_role", "Author"],
            ["body", "Message"],
            ["created_at", "Date"],
          ]}
        />
      )}
    </Page>
  );
}
