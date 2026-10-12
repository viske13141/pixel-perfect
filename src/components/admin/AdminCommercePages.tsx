import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  adminCustomerRecords,
  getAdminCustomer,
  getAdminOrder,
  getAdminProduct,
  mockAdminOrders,
  mockInventory,
  mockStockHistory,
  type AdminOrder,
  type AdminOrderStatus,
  type InventoryItem,
} from "@/data/adminMockData";
import { mockAddresses, mockProducts, mockReviews } from "@/data/customerMockData";
import {
  AdminButton,
  AdminMetric,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchProducts,
  fetchProductById,
  fetchProductCounts,
  createProduct,
  updateProduct,
  setProductStatus,
  uploadProductImage,
  deleteProductImage,
  linesToString,
  type ProductWithImages,
  type ProductFormData,
  type ProductStatus,
} from "@/services/productService";

const inputClass =
  "h-11 rounded-none border-border bg-background text-foreground focus-visible:ring-primary/40";
const statusOptions: AdminOrderStatus[] = [
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
];

function Money({ amount }: { amount: number }) {
  return <>₹{amount.toLocaleString("en-IN")}</>;
}

function Status({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-primary/25 bg-primary/[0.06] px-2 text-[0.5rem] uppercase tracking-[0.12em] text-primary">
      {children}
    </span>
  );
}

function AdminImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden bg-night ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-10`}
      />
    </label>
  );
}

export function AdminDashboardPage() {
  const [range, setRange] = useState("7 Days");
  const revenue = [8200, 12400, 9800, 15800, 13200, 18450, 15100];
  const labels =
    range === "7 Days"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"];
  const max = Math.max(...revenue);
  const kpis: Array<[string, string, string]> = [
    ["Today's Sales", "₹18,450", "+12.4% from yesterday"],
    ["Orders", "32", "Across selected period"],
    ["Pending Orders", "8", "Need attention"],
    ["Customers", "248", "4 new this week"],
    [
      "Low Stock",
      String(
        mockInventory.filter((item) => item.physical - item.reserved <= item.threshold).length,
      ),
      "Review stock levels",
    ],
    ["Returns Pending", "2", "Awaiting review"],
  ];

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Store performance and operations at a glance." />
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value, note]) => (
          <AdminMetric key={label} label={label} value={value} note={note} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[1.5fr_1fr]">
        <AdminSection
          title="Sales Overview"
          action={
            <div className="flex gap-1">
              {["7 Days", "30 Days", "90 Days"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`min-h-9 px-2 text-[0.5rem] uppercase tracking-[0.1em] ${range === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-56 w-full">
            <svg
              viewBox="0 0 700 220"
              role="img"
              aria-label={`${range} mock revenue chart`}
              className="h-full w-full overflow-visible"
            >
              {[0, 1, 2, 3].map((line) => (
                <g key={line}>
                  <line
                    x1="42"
                    y1={20 + line * 55}
                    x2="690"
                    y2={20 + line * 55}
                    stroke="currentColor"
                    opacity=".12"
                  />
                  <text x="0" y={24 + line * 55} fill="currentColor" opacity=".55" fontSize="10">
                    ₹{Math.round((max * (3 - line)) / 3 / 1000)}k
                  </text>
                </g>
              ))}
              <polyline
                points={revenue
                  .map((value, index) => `${50 + index * 100},${190 - (value / max) * 155}`)
                  .join(" ")}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {revenue.map((value, index) => (
                <g key={labels[index]}>
                  <circle
                    cx={50 + index * 100}
                    cy={190 - (value / max) * 155}
                    r="4"
                    fill="var(--primary)"
                  />
                  <text
                    x={50 + index * 100}
                    y="214"
                    textAnchor="middle"
                    fill="currentColor"
                    opacity=".65"
                    fontSize="10"
                  >
                    {labels[index]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </AdminSection>
        <AdminSection title="Order Status">
          <div className="space-y-3">
            {[
              ["Pending", 8],
              ["Confirmed", 5],
              ["Processing", 4],
              ["Packed", 3],
              ["Shipped", 7],
              ["Delivered", 21],
              ["Cancelled", 2],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground">{label}</span>
                <div className="h-1.5 flex-1 bg-background">
                  <div
                    className="h-full bg-primary/75"
                    style={{ width: `${Number(value) * 4}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs">{value}</span>
              </div>
            ))}
          </div>
        </AdminSection>
      </div>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[1.55fr_1fr]">
        <AdminSection
          title="Recent Orders"
          action={
            <Link
              to="/admin/orders"
              className="text-[0.54rem] uppercase tracking-[0.14em] text-primary"
            >
              All Orders <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {mockAdminOrders.slice(0, 5).map((order) => {
              const customer = getAdminCustomer(order.customerId);
              return (
                <Link
                  key={order.id}
                  to="/admin/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0 sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <span className="text-xs">
                    #{order.id}
                    <span className="mt-1 block truncate text-[0.62rem] text-muted-foreground">
                      {customer.fullName}
                    </span>
                  </span>
                  <span className="hidden truncate text-[0.62rem] text-muted-foreground sm:block">
                    {order.items[0]?.name}
                  </span>
                  <span className="text-xs">
                    <Money amount={order.total} />
                  </span>
                  <Status>{order.status}</Status>
                </Link>
              );
            })}
          </div>
        </AdminSection>
        <div className="space-y-6">
          <AdminSection title="Low Stock Alerts">
            <div className="space-y-3">
              {mockInventory.map((item) => {
                const product = getAdminProduct(item.productId);
                const available = item.physical - item.reserved;
                if (available > item.threshold) return null;
                return (
                  <Link
                    key={item.sku}
                    to="/admin/inventory"
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 truncate text-xs">
                      {product.name}
                      <small className="mt-1 block text-muted-foreground">{item.sku}</small>
                    </span>
                    <span className="shrink-0 text-xs text-primary">{available} left</span>
                  </Link>
                );
              })}
            </div>
          </AdminSection>
          <AdminSection title="Top Selling Products">
            <div className="space-y-3">
              {mockProducts.slice(0, 3).map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="font-serif text-lg text-primary/70">0{index + 1}</span>
                  <AdminImage
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">{product.name}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                </div>
              ))}
            </div>
          </AdminSection>
        </div>
      </div>
      <AdminSection title="Recent Activity" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Order #1R1048 placed", "Today · 10:32"],
            ["Inventory adjusted for Hair Oil", "Today · 09:48"],
            ["Order #1R1045 shipped", "Yesterday · 16:20"],
            ["New review received", "Yesterday · 13:05"],
          ].map(([text, date], index) => (
            <div key={text} className="flex gap-3 border-l border-primary/50 pl-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="text-xs">
                {text}
                <small className="mt-1 block text-muted-foreground">{date}</small>
              </p>
            </div>
          ))}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminOrdersPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const filters = ["ALL", ...statusOptions];
  const rows = mockAdminOrders.filter((order) => {
    const customer = getAdminCustomer(order.customerId);
    const matchesFilter = filter === "ALL" || order.status === filter;
    const searchValue = `${order.id} ${customer.fullName} ${customer.email}`.toLowerCase();
    return matchesFilter && searchValue.includes(search.toLowerCase());
  });
  const counts = [
    ["All Orders", mockAdminOrders.length],
    ["Pending", mockAdminOrders.filter((o) => ["PENDING", "CONFIRMED"].includes(o.status)).length],
    [
      "Processing",
      mockAdminOrders.filter((o) => ["PROCESSING", "PACKED"].includes(o.status)).length,
    ],
    [
      "Shipped",
      mockAdminOrders.filter((o) => ["SHIPPED", "OUT FOR DELIVERY"].includes(o.status)).length,
    ],
    ["Delivered", mockAdminOrders.filter((o) => o.status === "DELIVERED").length],
    ["Cancelled", mockAdminOrders.filter((o) => o.status === "CANCELLED").length],
  ];

  return (
    <>
      <AdminPageHeader
        title="Orders"
        subtitle="Manage customer orders from placement to delivery."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {counts.map(([label, value]) => (
          <AdminMetric key={label} label={String(label)} value={value} />
        ))}
      </div>
      <AdminSection title="Order Management">
        <div className="flex flex-col gap-3">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by order number, customer, email..."
          />
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-1">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`min-h-9 px-2.5 text-[0.49rem] uppercase tracking-[0.08em] ${filter === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {rows.length ? (
            rows.map((order) => {
              const customer = getAdminCustomer(order.customerId);
              return (
                <article
                  key={order.id}
                  className="grid gap-4 border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="grid min-w-0 grid-cols-[1fr_auto] gap-3 sm:grid-cols-[0.8fr_1fr_0.8fr_auto] sm:items-center">
                    <div>
                      <p className="text-sm">Order #{order.id}</p>
                      <p className="mt-1 text-[0.62rem] text-muted-foreground">
                        {customer.fullName} · {order.date}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs">{order.items[0]?.name}</p>
                      <p className="mt-1 text-[0.6rem] text-muted-foreground">
                        {order.items.length} line item · <Money amount={order.total} />
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.1em]">
                      <span className="text-primary">{order.paymentStatus}</span>
                      <span className="text-muted-foreground">· {order.deliveryStatus}</span>
                    </div>
                    <Status>{order.status}</Status>
                  </div>
                  <Link
                    to="/admin/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 border border-border px-3 text-[0.52rem] uppercase tracking-[0.12em] hover:border-primary/50 hover:text-primary"
                  >
                    View Order <ArrowRight className="h-3 w-3" />
                  </Link>
                </article>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders match this filter.
            </p>
          )}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminOrderDetailsPage({ orderId }: { orderId: string }) {
  const order = getAdminOrder(orderId);
  const customer = getAdminCustomer(order.customerId);
  const address = mockAddresses[0]!;
  const [status, setStatus] = useState<AdminOrderStatus>(order.status);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <AdminPageHeader
        title={`Order #${order.id}`}
        subtitle={`Placed ${order.date} · Customer order record`}
        action={
          <Link
            to="/admin/orders"
            className="text-[0.56rem] uppercase tracking-[0.14em] text-primary"
          >
            ← All Orders
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Status>{status}</Status>
        <Status>{order.paymentStatus}</Status>
        <label className="ml-auto flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">
          Update Order Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminOrderStatus);
              setSaved(false);
            }}
            className="h-10 max-w-48 border border-border bg-background px-2 text-foreground"
          >
            {statusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <AdminButton onClick={() => setSaved(true)}>
          <Check className="h-3 w-3" />
          {saved ? "Status Saved" : "Save Status"}
        </AdminButton>
      </div>
      {saved ? (
        <p role="status" className="mb-4 text-xs text-primary">
          Order status updated for this demo view.
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <AdminSection title="Order Items">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <AdminImage
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      SKU: ROOT-{item.id.toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.variant} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm">
                    <Money amount={item.price * item.quantity} />
                  </p>
                </div>
              ))}
            </div>
          </AdminSection>
          <AdminSection title="Order Timeline">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                "Order Placed",
                "Confirmed",
                "Processing",
                "Packed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
              ].map((step, index) => {
                const done = ["SHIPPED", "OUT FOR DELIVERY", "DELIVERED"].includes(status)
                  ? index < 5
                  : status === "DELIVERED"
                    ? true
                    : index < 2;
                return (
                  <div key={step} className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                    >
                      {done ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                    <span className={done ? "text-foreground" : "text-muted-foreground"}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </AdminSection>
        </div>
        <div className="space-y-6">
          <AdminSection title="Order Summary">
            <dl className="space-y-3 text-xs">
              {[
                ["Subtotal", order.subtotal],
                ["Discount", -order.discount],
                ["Shipping", order.shipping],
                ["Tax", order.tax],
                ["Total Paid", order.total],
              ].map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>
                    <Money amount={Math.max(0, Number(amount))} />
                  </dd>
                </div>
              ))}
            </dl>
          </AdminSection>
          <AdminSection title="Customer">
            <p className="text-sm">{customer.fullName}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{customer.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{customer.mobile}</p>
            <Link
              to="/admin/customers/$customerId"
              params={{ customerId: customer.id }}
              className="mt-4 inline-block text-[0.52rem] uppercase tracking-[0.12em] text-primary"
            >
              View Customer
            </Link>
          </AdminSection>
          <AdminSection title="Shipping Address">
            <p className="text-sm">{address.fullName}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {address.line1}, {address.line2}
              <br />
              {address.city}, {address.state} {address.pinCode}
              <br />
              {address.country}
            </p>
          </AdminSection>
          <AdminSection title="Payment Information">
            <p className="text-xs">
              Status <span className="float-right text-primary">{order.paymentStatus}</span>
            </p>
            <p className="mt-3 text-xs">
              Method <span className="float-right">{order.paymentMethod}</span>
            </p>
            <p className="mt-3 break-all text-xs">
              Reference <span className="text-muted-foreground">{order.transactionReference}</span>
            </p>
          </AdminSection>
          <AdminSection title="Shipment">
            <p className="text-xs">
              Courier <span className="float-right">{order.courier || "Not assigned"}</span>
            </p>
            <p className="mt-3 text-xs">
              AWB <span className="float-right">{order.trackingNumber || "—"}</span>
            </p>
            <p className="mt-3 text-xs">
              Expected{" "}
              <span className="float-right">{order.expectedDelivery || "To be confirmed"}</span>
            </p>
            <Link
              to="/admin/shipping"
              className="mt-4 inline-flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.12em] text-primary"
            >
              Open Shipping <Truck className="h-3 w-3" />
            </Link>
          </AdminSection>
        </div>
      </div>
    </>
  );
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProductStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, draft: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, c] = await Promise.all([fetchProducts(filter, search), fetchProductCounts()]);
      setProducts(rows);
      setCounts(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleStatus = async (product: ProductWithImages) => {
    const next: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(product.id);
    try {
      await setProductStatus(product.id, next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const metrics = [
    ["Total Products", counts.total],
    ["Active", counts.active],
    ["Draft", counts.draft],
    ["Inactive", counts.inactive],
  ] as const;

  return (
    <>
      <AdminPageHeader
        title="Products"
        subtitle="Manage your 1st ROOT product catalogue."
        action={
          <AdminButton onClick={() => navigate({ to: "/admin/products/new" })}>
            <Plus className="h-3.5 w-3.5" /> Add Product
          </AdminButton>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <AdminMetric key={label} label={label} value={loading ? "—" : value} />
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-4 border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <AdminSection title="Product Catalogue">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["ALL", "ACTIVE", "DRAFT", "INACTIVE"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`min-h-9 px-3 text-[0.52rem] uppercase tracking-[0.12em] ${
                  filter === tab ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {tab === "ALL" ? "All Products" : tab}
              </button>
            ))}
          </div>
          <SearchField value={search} onChange={setSearch} placeholder="Search name, SKU, category..." />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              {search ? "No products match your search." : "No products yet. Add your first product."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => {
              const thumb = product.images.find((img) => img.position === 0)?.url ?? null;
              return (
                <article key={product.id} className="border border-border bg-background/50">
                  {thumb ? (
                    <AdminImage src={thumb} alt={product.name} className="aspect-[16/9] w-full" />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-night">
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{product.variant}</p>
                      </div>
                      <Status>{product.status}</Status>
                    </div>
                    <p className="mt-4 text-sm">
                      ₹{product.price.toLocaleString("en-IN")}
                      <span className="ml-3 text-xs text-muted-foreground">SKU {product.sku}</span>
                    </p>
                    <div className="mt-4 flex gap-2 border-t border-border pt-3">
                      <AdminButton
                        variant="quiet"
                        className="flex-1"
                        onClick={() =>
                          navigate({
                            to: "/admin/products/$productId",
                            params: { productId: product.id },
                          })
                        }
                      >
                        Edit
                      </AdminButton>
                      <AdminButton
                        variant="quiet"
                        className="flex-1"
                        disabled={togglingId === product.id}
                        onClick={() => void handleToggleStatus(product)}
                      >
                        {togglingId === product.id ? (
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                        ) : product.status === "ACTIVE" ? (
                          "Deactivate"
                        ) : (
                          "Activate"
                        )}
                      </AdminButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </AdminSection>
    </>
  );
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  slug: "",
  sku: "",
  variant: "",
  subtitle: "",
  category: "",
  short_description: "",
  description: "",
  ingredients: "",
  how_to_use: "",
  features: "",
  price: "",
  original_price: "",
  discount_pct: "",
  status: "DRAFT",
};

function toForm(p: ProductWithImages): ProductFormData {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    variant: p.variant,
    subtitle: p.subtitle,
    category: p.category,
    short_description: p.short_description,
    description: p.description,
    ingredients: linesToString(p.ingredients),
    how_to_use: linesToString(p.how_to_use),
    features: linesToString(p.features),
    price: String(p.price),
    original_price: p.original_price != null ? String(p.original_price) : "",
    discount_pct: p.discount_pct != null ? String(p.discount_pct) : "",
    status: p.status,
  };
}

export function AdminProductFormPage({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState<ProductWithImages["images"]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchProductById(productId)
      .then((p) => {
        setForm(toForm(p));
        setExistingImages(p.images.sort((a, b) => a.position - b.position));
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load product."),
      )
      .finally(() => setLoading(false));
  }, [productId]);

  const set = (key: keyof ProductFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setNewFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setNewPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExisting = async (img: ProductWithImages["images"][number]) => {
    setDeletingImageId(img.id);
    try {
      await deleteProductImage(img.id, img.storage_path);
      setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.sku.trim()) return "SKU is required.";
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
      return "A valid price is required.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      let savedId = productId;
      if (isEdit && productId) {
        await updateProduct(productId, form);
      } else {
        const created = await createProduct(form);
        savedId = created.id;
      }
      if (newFiles.length > 0 && savedId) {
        setUploadingImages(true);
        const startPos = existingImages.length;
        await Promise.all(
          newFiles.map((file, i) => uploadProductImage(savedId!, file, startPos + i)),
        );
        setNewFiles([]);
        setNewPreviews([]);
        setUploadingImages(false);
      }
      setSuccess(isEdit ? "Product updated successfully." : "Product created successfully.");
      if (!isEdit && savedId) {
        navigate({ to: "/admin/products/$productId", params: { productId: savedId } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass = "h-11 rounded-none border-border bg-background text-foreground focus-visible:ring-primary/40";

  return (
    <>
      <AdminPageHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        subtitle={isEdit ? `Editing: ${form.name || "product"}` : "Create a new product in the catalogue."}
        action={
          <Link
            to="/admin/products"
            className="text-[0.56rem] uppercase tracking-[0.14em] text-primary"
          >
            ← All Products
          </Link>
        }
      />

      {success ? (
        <p role="status" className="mb-4 border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
          {success}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <AdminSection title="Product Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[0.62rem] text-muted-foreground sm:col-span-2">
                Product Name *
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                SKU *
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} required className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Slug
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated if empty" className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Category
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Variant / Size
                <Input value={form.variant} onChange={(e) => set("variant", e.target.value)} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Subtitle
                <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Price (₹) *
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Original Price (₹)
                <Input type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => set("original_price", e.target.value)} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Discount %
                <Input type="number" min="0" max="100" value={form.discount_pct} onChange={(e) => set("discount_pct", e.target.value)} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground sm:col-span-2">
                Short Description
                <Textarea rows={2} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className="mt-2 rounded-none border-border bg-background text-foreground" />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground sm:col-span-2">
                Full Description
                <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-2 rounded-none border-border bg-background text-foreground" />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground sm:col-span-2">
                Ingredients
                <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">(one per line)</span>
                <Textarea rows={4} value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)} className="mt-2 rounded-none border-border bg-background text-foreground" />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                How to Use
                <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">(one per line)</span>
                <Textarea rows={4} value={form.how_to_use} onChange={(e) => set("how_to_use", e.target.value)} className="mt-2 rounded-none border-border bg-background text-foreground" />
              </label>
              <label className="block text-[0.62rem] text-muted-foreground">
                Features
                <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">(one per line)</span>
                <Textarea rows={4} value={form.features} onChange={(e) => set("features", e.target.value)} className="mt-2 rounded-none border-border bg-background text-foreground" />
              </label>
            </div>
          </AdminSection>

          <AdminSection title="Product Images">
            {existingImages.length > 0 ? (
              <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden border border-border">
                    <img src={img.url} alt="Product" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      disabled={deletingImageId === img.id}
                      onClick={() => void handleDeleteExisting(img)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete image"
                    >
                      {deletingImageId === img.id ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {newPreviews.length > 0 ? (
              <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {newPreviews.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden border border-primary/30">
                    <img src={src} alt="New" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <label className="block cursor-pointer border border-dashed border-border p-5 text-xs text-muted-foreground hover:border-primary/50">
              Click to choose image files (JPEG, PNG, WebP)
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="mt-3 block w-full text-xs"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            {uploadingImages ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-primary">
                <LoaderCircle className="h-3 w-3 animate-spin" /> Uploading images...
              </p>
            ) : null}
          </AdminSection>
        </div>

        <div className="space-y-6">
          <AdminSection title="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as ProductStatus)}
              className={`${inputClass} w-full border px-3`}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </AdminSection>

          <div className="flex flex-col gap-2">
            <AdminButton type="submit" disabled={saving} className="w-full">
              {saving ? (
                <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving...</>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Save Product"
              )}
            </AdminButton>
            <AdminButton
              type="button"
              variant="quiet"
              className="w-full"
              onClick={() => navigate({ to: "/admin/products" })}
            >
              Cancel
            </AdminButton>
          </div>
        </div>
      </form>
    </>
  );
}

export function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [history, setHistory] = useState(mockStockHistory);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("Add Stock");
  const [notice, setNotice] = useState("");
  const derived = items.map((item) => ({
    ...item,
    available: Math.max(0, item.physical - item.reserved),
  }));
  const statusFor = (available: number, threshold: number) =>
    available <= 0 ? "OUT OF STOCK" : available <= threshold ? "LOW STOCK" : "IN STOCK";
  const confirmAdjustment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjusting) return;
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const direction =
      adjustmentType === "Add Stock" || adjustmentType === "Returned" ? parsed : -parsed;
    const before = adjusting.physical;
    const after = Math.max(0, before + direction);
    setItems((current) =>
      current.map((item) =>
        item.sku === adjusting.sku ? { ...item, physical: after, updated: "06 Oct 2026" } : item,
      ),
    );
    setHistory((current) => [
      {
        date: "06 Oct 2026",
        productId: adjusting.productId,
        sku: adjusting.sku,
        change: `${after - before >= 0 ? "+" : ""}${after - before}`,
        before,
        after,
        reason: reason || adjustmentType,
        reference: "Manual adjustment",
      },
      ...current,
    ]);
    setNotice(`Stock for ${getAdminProduct(adjusting.productId).name} adjusted in this demo.`);
    setAdjusting(null);
    setQuantity("1");
    setReason("");
  };
  return (
    <>
      <AdminPageHeader
        title="Inventory"
        subtitle="Stock levels, reservations, and movement for your catalogue."
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <AdminMetric label="Total SKUs" value={items.length} />
        <AdminMetric
          label="Total Stock"
          value={items.reduce((sum, item) => sum + item.physical, 0)}
        />
        <AdminMetric
          label="Reserved Stock"
          value={items.reduce((sum, item) => sum + item.reserved, 0)}
        />
        <AdminMetric
          label="Available Stock"
          value={derived.reduce((sum, item) => sum + item.available, 0)}
        />
        <AdminMetric
          label="Low Stock"
          value={
            derived.filter((item) => statusFor(item.available, item.threshold) === "LOW STOCK")
              .length
          }
        />
        <AdminMetric
          label="Out of Stock"
          value={derived.filter((item) => item.available === 0).length}
        />
      </div>
      <AdminSection title="Stock Management">
        <div className="space-y-3">
          {derived.map((item) => {
            const product = getAdminProduct(item.productId);
            const status = statusFor(item.available, item.threshold);
            return (
              <article
                key={item.sku}
                className="grid gap-3 border border-border p-4 sm:grid-cols-[1.2fr_1.2fr_0.8fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AdminImage
                    src={product.image}
                    alt={product.name}
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs">{product.name}</p>
                    <p className="mt-1 text-[0.56rem] text-muted-foreground">{item.sku}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[0.56rem]">
                  <span>
                    Physical
                    <strong className="mt-1 block text-xs text-foreground">{item.physical}</strong>
                  </span>
                  <span>
                    Reserved
                    <strong className="mt-1 block text-xs text-foreground">{item.reserved}</strong>
                  </span>
                  <span>
                    Available
                    <strong className="mt-1 block text-xs text-foreground">{item.available}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[0.56rem] text-muted-foreground sm:block">
                  Threshold: {item.threshold}
                  <span className="mt-1 block">
                    <Status>{status}</Status>
                  </span>
                </div>
                <AdminButton variant="quiet" onClick={() => setAdjusting(item)}>
                  Adjust Stock
                </AdminButton>
              </article>
            );
          })}
        </div>
      </AdminSection>
      <AdminSection title="Stock History" className="mt-6">
        <div className="space-y-3">
          {history.map((entry, index) => (
            <article
              key={`${entry.sku}-${index}`}
              className="grid grid-cols-[1fr_auto] gap-2 border-b border-border pb-3 text-xs last:border-0 last:pb-0 sm:grid-cols-[0.8fr_1fr_0.7fr_0.8fr_1fr_1.3fr] sm:items-center"
            >
              <span className="text-muted-foreground">{entry.date}</span>
              <span>
                {getAdminProduct(entry.productId).name}
                <small className="mt-1 block text-muted-foreground">{entry.sku}</small>
              </span>
              <span className={entry.change.startsWith("+") ? "text-primary" : "text-foreground"}>
                {entry.change}
              </span>
              <span>
                {entry.before} → {entry.after}
              </span>
              <span className="text-muted-foreground">{entry.reason}</span>
              <span className="text-right text-muted-foreground sm:text-left">
                {entry.reference}
              </span>
            </article>
          ))}
        </div>
      </AdminSection>
      <Dialog open={Boolean(adjusting)} onOpenChange={(open) => !open && setAdjusting(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-none border-border bg-night text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjusting ? (
            <form onSubmit={confirmAdjustment} className="space-y-4">
              <p className="text-sm">
                {getAdminProduct(adjusting.productId).name}
                <span className="mt-1 block text-xs text-muted-foreground">
                  Current physical stock: {adjusting.physical}
                </span>
              </p>
              <label className="block text-xs text-muted-foreground">
                Adjustment Type
                <select
                  value={adjustmentType}
                  onChange={(event) => setAdjustmentType(event.target.value)}
                  className={`${inputClass} mt-2 w-full border px-3`}
                >
                  {["Add Stock", "Remove Stock", "Damaged", "Correction", "Returned", "Other"].map(
                    (option) => (
                      <option key={option}>{option}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Quantity
                <Input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Reason
                <Input
                  required
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </label>
              <AdminButton type="submit" className="w-full">
                Confirm Adjustment
              </AdminButton>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const ordersByCustomer = (customerId: string) =>
    mockAdminOrders.filter((order) => order.customerId === customerId);
  const customers = adminCustomerRecords.filter((customer) =>
    `${customer.fullName} ${customer.email} ${customer.mobile}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <AdminPageHeader
        title="Customers"
        subtitle="Customer accounts, order activity, and lifetime value."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Total Customers" value="248" />
        <AdminMetric label="New Customers" value="18" note="This month" />
        <AdminMetric label="Repeat Customers" value="72" />
        <AdminMetric
          label="With Orders"
          value={adminCustomerRecords.filter((c) => c.orderIds.length > 0).length}
        />
      </div>
      <AdminSection title="Customer Accounts">
        <SearchField value={search} onChange={setSearch} placeholder="Search customer..." />
        <div className="mt-5 space-y-3">
          {customers.map((customer) => {
            const orders = ordersByCustomer(customer.id);
            const total = orders.reduce((sum, order) => sum + order.total, 0);
            const lastOrder = orders[0]?.date ?? "—";
            return (
              <article
                key={customer.id}
                className="grid gap-3 border border-border p-4 sm:grid-cols-[1.2fr_1.4fr_0.5fr_0.8fr_0.8fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-xs">{customer.fullName}</p>
                  <p className="mt-1 text-[0.58rem] text-muted-foreground">{customer.email}</p>
                </div>
                <p className="text-[0.62rem] text-muted-foreground">{customer.mobile}</p>
                <p className="text-xs">{orders.length} orders</p>
                <p className="text-xs">
                  <Money amount={total} />
                  <small className="mt-1 block text-muted-foreground">Last: {lastOrder}</small>
                </p>
                <div className="text-[0.58rem] text-muted-foreground">
                  Joined {customer.joined}
                  <small className="mt-1 block">
                    <Status>{customer.status}</Status>
                  </small>
                </div>
                <Link
                  to="/admin/customers/$customerId"
                  params={{ customerId: customer.id }}
                  className="inline-flex min-h-10 items-center justify-center border border-border px-3 text-[0.5rem] uppercase tracking-[0.12em] hover:text-primary"
                >
                  View Customer
                </Link>
              </article>
            );
          })}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminCustomerDetailsPage({ customerId }: { customerId: string }) {
  const customer = getAdminCustomer(customerId);
  const orders = mockAdminOrders.filter((order) => order.customerId === customer.id);
  const reviews = mockReviews.filter(() => customer.id === "customer-ananya");
  const tickets: never[] = [];
  return (
    <>
      <AdminPageHeader
        title={customer.fullName}
        subtitle="Customer profile and activity."
        action={
          <Link
            to="/admin/customers"
            className="text-[0.56rem] uppercase tracking-[0.14em] text-primary"
          >
            ← Customers
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <AdminSection title="Customer Profile">
            <p className="font-serif text-2xl">{customer.fullName}</p>
            <p className="mt-3 break-all text-xs text-muted-foreground">{customer.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">{customer.mobile}</p>
            <p className="mt-3 text-xs text-muted-foreground">Joined {customer.joined}</p>
            <div className="mt-3">
              <Status>{customer.status}</Status>
            </div>
          </AdminSection>
          <div className="grid grid-cols-2 gap-3">
            <AdminMetric label="Total Orders" value={orders.length} />
            <AdminMetric
              label="Total Spent"
              value={<Money amount={orders.reduce((sum, order) => sum + order.total, 0)} />}
            />
            <AdminMetric label="Wishlist Items" value={customer.wishlistCount} />
            <AdminMetric label="Reviews" value={reviews.length} />
          </div>
          <AdminSection title="Saved Addresses">
            {mockAddresses.map((address) => (
              <div
                key={address.id}
                className="mb-3 border-b border-border pb-3 last:mb-0 last:border-0 last:pb-0"
              >
                <p className="text-[0.55rem] uppercase tracking-[0.14em] text-primary">
                  {address.type}
                  {address.isDefault ? " · Default" : ""}
                </p>
                <p className="mt-1 text-xs">{address.fullName}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {address.line1}, {address.city}, {address.state} {address.pinCode}
                </p>
              </div>
            ))}
          </AdminSection>
        </div>
        <div className="space-y-6">
          <AdminSection title="Order History">
            {orders.length ? (
              orders.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"
                >
                  <span className="text-xs">
                    #{order.id}
                    <small className="mt-1 block text-muted-foreground">
                      {order.items[0]?.name}
                    </small>
                  </span>
                  <span className="flex items-center gap-3">
                    <Status>{order.status}</Status>
                    <Money amount={order.total} />
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No orders in this demo.</p>
            )}
          </AdminSection>
          <AdminSection title="Reviews">
            {reviews.length ? (
              reviews.map((review) => (
                <p
                  key={review.orderId}
                  className="border-b border-border py-3 text-xs last:border-0"
                >
                  {"★".repeat(review.rating)}
                  <span className="ml-2 text-muted-foreground">{review.title}</span>
                  <small className="mt-1 block text-muted-foreground">{review.body}</small>
                </p>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No reviews shown.</p>
            )}
          </AdminSection>
          <AdminSection title="Support Requests">
            {tickets.length ? (
              tickets.map((ticket) => <p key={ticket} />)
            ) : (
              <p className="text-xs text-muted-foreground">
                No support requests are linked to this profile in the sample view.
              </p>
            )}
          </AdminSection>
        </div>
      </div>
    </>
  );
}
