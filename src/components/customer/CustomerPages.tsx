import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/context/useAuth";
import {
  mockAddresses,
  mockCustomer,
  mockOrders,
  mockProducts,
  mockReviews,
  mockWishlist,
  type CustomerAddress,
  type CustomerOrder,
  type OrderStatus,
} from "@/data/customerMockData";
import {
  CustomerButton,
  CustomerLayout,
  CustomerSection,
} from "@/components/customer/CustomerLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const inputClass =
  "h-12 rounded-none border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/40";

const timeline = [
  { title: "Order Placed", date: "06 Oct", level: 0 },
  { title: "Confirmed", date: "06 Oct", level: 1 },
  { title: "Packed", date: "07 Oct", level: 2 },
  { title: "Shipped", date: "08 Oct", level: 3 },
  { title: "Out for Delivery", date: "", level: 4 },
  { title: "Delivered", date: "", level: 5 },
] as const;

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PROCESSING: "border-primary/30 bg-primary/10 text-primary",
    SHIPPED: "border-primary/40 bg-primary/15 text-primary",
    DELIVERED: "border-foreground/20 bg-foreground/5 text-foreground/75",
    CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center border px-2.5 text-[0.56rem] uppercase tracking-[0.16em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ProductImage({
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
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function OrderProgress({
  compact = false,
  status = "SHIPPED",
}: {
  compact?: boolean;
  status?: OrderStatus;
}) {
  const currentLevel =
    status === "PROCESSING" ? 2 : status === "SHIPPED" ? 3 : status === "DELIVERED" ? 5 : 0;

  return (
    <ol
      aria-label="Order progress"
      className={`${
        compact
          ? "grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3"
          : "flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-1"
      }`}
    >
      {timeline.map((step, index) => {
        const state =
          step.level < currentLevel ? "done" : step.level === currentLevel ? "current" : "upcoming";

        return (
          <li
            key={step.title}
            className={`relative flex min-h-10 items-start gap-3 sm:flex-1 sm:flex-col sm:gap-2 ${
              compact ? "" : "sm:min-h-0"
            }`}
          >
            {!compact && index < timeline.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute left-[0.42rem] top-5 h-[calc(100%-0.5rem)] w-px sm:left-4 sm:top-4 sm:h-px sm:w-[calc(100%-1rem)] ${
                  step.level < currentLevel ? "bg-primary/70" : "bg-border"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                state === "done"
                  ? "border-primary bg-primary text-primary-foreground"
                  : state === "current"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {state === "done" ? <Check className="h-2.5 w-2.5" /> : null}
              {state === "current" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-xs ${
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.title}
              </span>
              {step.date ? (
                <span className="mt-1 block text-[0.62rem] text-muted-foreground">{step.date}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Money({ amount }: { amount: number }) {
  return <span>₹{amount.toLocaleString("en-IN")}</span>;
}

function OrderCard({ order, showActions = true }: { order: CustomerOrder; showActions?: boolean }) {
  const navigate = useNavigate();
  const product = order.items[0]!;

  return (
    <article className="border border-border bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-serif text-xl">Order #{order.id}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.date}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex gap-4 py-4">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed">{product.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{product.variant}</p>
          <p className="mt-2 text-xs text-muted-foreground">Qty: {product.quantity}</p>
        </div>
        <p className="shrink-0 text-sm">
          <Money amount={order.total} />
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border py-3 text-[0.58rem] uppercase tracking-[0.13em]">
        <span className="text-primary">{order.paymentStatus}</span>
        {order.status === "SHIPPED" && order.expectedDelivery ? (
          <span className="text-muted-foreground">Expected Delivery: {order.expectedDelivery}</span>
        ) : null}
        {order.status === "DELIVERED" && order.deliveredDate ? (
          <span className="text-muted-foreground">Delivered: {order.deliveredDate}</span>
        ) : null}
      </div>
      {showActions ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4 min-[440px]:flex-row min-[440px]:flex-wrap">
          {order.status === "SHIPPED" ? (
            <Link
              to="/account/orders/$orderId/track"
              params={{ orderId: order.id }}
              className="inline-flex min-h-11 items-center justify-center bg-primary px-4 text-[0.58rem] uppercase tracking-[0.16em] text-primary-foreground"
            >
              Track Order
            </Link>
          ) : null}
          {order.status === "DELIVERED" ? (
            <>
              <CustomerButton variant="quiet" onClick={() => navigate({ to: "/" })}>
                <RotateCcw className="h-3.5 w-3.5" /> Buy Again
              </CustomerButton>
              <Link
                to="/account/reviews"
                className="inline-flex min-h-11 items-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.16em] hover:text-primary"
              >
                Write Review
              </Link>
            </>
          ) : null}
          {order.status === "CANCELLED" ? (
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.16em] transition-colors hover:border-primary/50 hover:text-primary"
            >
              Shop Again
            </Link>
          ) : null}
          <Link
            to="/account/orders/$orderId"
            params={{ orderId: order.id }}
            className="inline-flex min-h-11 items-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.16em] transition-colors hover:border-primary/50 hover:text-primary"
          >
            View Details
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function AccountOverview() {
  const { user } = useAuth();
  const activeOrder = mockOrders[0]!;
  const summary = [
    { label: "Orders", value: String(mockOrders.length), icon: PackageCheck },
    { label: "In Transit", value: "1", icon: Truck },
    { label: "Saved Items", value: "2", icon: Heart },
  ];

  return (
    <CustomerLayout heading={`Welcome back, ${user?.fullName ?? "Customer"}`} eyebrow="Your account">
      <p className="-mt-4 mb-8 text-sm text-muted-foreground">Your ritual, all in one place.</p>
      <div className="mb-8 grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 border border-border bg-card/40 p-4 sm:p-5"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-2xl">{value}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <CustomerSection
        title="Current Order"
        action={
          <Link
            to="/account/orders"
            className="text-[0.58rem] uppercase tracking-[0.16em] text-primary hover:text-primary/75"
          >
            All orders <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        }
        className="mb-6"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl">Your ritual is on its way.</h2>
            <p className="mt-2 text-xs text-muted-foreground">Order #{activeOrder.id}</p>
          </div>
          <StatusBadge status={activeOrder.status} />
        </div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(300px,1.1fr)]">
          <div className="flex gap-4">
            <ProductImage
              src={activeOrder.items[0]!.image}
              alt={activeOrder.items[0]!.name}
              className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
            />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">{activeOrder.items[0]!.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">100 ml</p>
              <p className="mt-2 text-xs text-muted-foreground">Qty: 1</p>
              <p className="mt-2 text-sm">
                <Money amount={599} />
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            <p className="mb-4 text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
              Expected delivery <span className="ml-2 text-foreground">10 October</span>
            </p>
            <OrderProgress status={activeOrder.status} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          <Link
            to="/account/orders/$orderId/track"
            params={{ orderId: activeOrder.id }}
            className="inline-flex min-h-11 items-center bg-primary px-4 text-[0.58rem] uppercase tracking-[0.16em] text-primary-foreground"
          >
            Track Order
          </Link>
          <Link
            to="/account/orders/$orderId"
            params={{ orderId: activeOrder.id }}
            className="inline-flex min-h-11 items-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.16em] hover:border-primary/50 hover:text-primary"
          >
            View Order
          </Link>
        </div>
      </CustomerSection>

      <CustomerSection title="Buy Again">
        <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2">
          {mockProducts.slice(0, 2).map((product) => (
            <div key={product.id} className="flex gap-3 border border-border p-3">
              <ProductImage src={product.image} alt={product.name} className="h-20 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.size}</p>
                <p className="mt-2 text-sm">
                  <Money amount={product.price} />
                </p>
              </div>
              <button
                type="button"
                aria-label={`Buy ${product.name}`}
                className="self-end pb-1 text-primary"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </CustomerSection>
    </CustomerLayout>
  );
}

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
  const orders =
    activeTab === "All"
      ? mockOrders
      : mockOrders.filter((order) => order.status === activeTab.toUpperCase());

  return (
    <CustomerLayout heading="My Orders" eyebrow="Your ritual, in progress">
      <p className="-mt-4 mb-7 text-sm text-muted-foreground">
        Track your current orders and revisit previous purchases.
      </p>
      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Filter orders"
          className="flex min-w-max border-b border-border"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-12 border-b px-4 text-[0.62rem] uppercase tracking-[0.16em] transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {orders.length ? (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="border border-border bg-card/40 px-5 py-12 text-center">
            <PackageCheck className="mx-auto h-7 w-7 text-primary/70" />
            <p className="mt-4 font-serif text-2xl">No {activeTab.toLowerCase()} orders.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your next ritual is waiting when you are.
            </p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

function resolveOrder(orderId: string): CustomerOrder {
  return mockOrders.find((order) => order.id === orderId) ?? mockOrders[0]!;
}

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const order = resolveOrder(orderId);
  const address =
    mockAddresses.find((entry) => entry.id === order.shippingAddressId) ?? mockAddresses[0]!;

  return (
    <CustomerLayout heading="Order Details" eyebrow={`Order #${order.id}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
          <div className="mt-3">
            <StatusBadge status={order.status} />
          </div>
        </div>
        {order.status === "SHIPPED" ? (
          <Link
            to="/account/orders/$orderId/track"
            params={{ orderId: order.id }}
            className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 text-[0.58rem] uppercase tracking-[0.16em] text-primary-foreground"
          >
            <Truck className="h-4 w-4" /> Track Order
          </Link>
        ) : null}
      </div>

      <CustomerSection title="Order Timeline" className="mb-6">
        {order.status === "CANCELLED" ? (
          <p className="text-sm text-muted-foreground">
            This demo order was cancelled. Any refund shown below is mock information.
          </p>
        ) : (
          <OrderProgress compact status={order.status} />
        )}
      </CustomerSection>

      <CustomerSection title="Items in This Order" className="mb-6">
        <div className="space-y-4">
          {order.items.map((product) => (
            <div
              key={product.id}
              className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <ProductImage
                src={product.image}
                alt={product.name}
                className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm leading-relaxed">{product.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{product.variant}</p>
                <p className="mt-1 text-xs text-muted-foreground">Quantity: {product.quantity}</p>
              </div>
              <p className="shrink-0 text-sm">
                <Money amount={product.price} />
              </p>
            </div>
          ))}
        </div>
      </CustomerSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerSection title="Order Summary">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>
                <Money amount={order.subtotal} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>
                <Money amount={order.discount} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{order.shipping === 0 ? "Complimentary" : <Money amount={order.shipping} />}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>
                <Money amount={order.tax} />
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-medium">
              <dt>Total</dt>
              <dd>
                <Money amount={order.total} />
              </dd>
            </div>
          </dl>
        </CustomerSection>
        <div className="space-y-6">
          <CustomerSection title="Delivery Address">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm leading-relaxed text-muted-foreground">
                <p className="text-foreground">{address.fullName}</p>
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                {address.landmark ? <p>Landmark: {address.landmark}</p> : null}
                <p>
                  {address.city}, {address.state} {address.pinCode}
                </p>
                <p>{address.country}</p>
                <p>{address.mobile}</p>
              </div>
            </div>
          </CustomerSection>
          <CustomerSection title="Payment">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment Status</dt>
                <dd
                  className={
                    order.paymentStatus === "REFUNDED" ? "text-muted-foreground" : "text-primary"
                  }
                >
                  {order.paymentStatus}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment Method</dt>
                <dd>{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Transaction Reference</dt>
                <dd className="break-all text-right">{order.transactionReference}</dd>
              </div>
            </dl>
          </CustomerSection>
        </div>
      </div>
    </CustomerLayout>
  );
}

export function TrackOrderPage({ orderId }: { orderId: string }) {
  const order = resolveOrder(orderId);

  return (
    <CustomerLayout heading="Your ritual is on its way." eyebrow={`Track Order #${order.id}`}>
      <div className="mb-6 grid gap-5 border border-border bg-card/40 p-5 sm:grid-cols-2 sm:p-7">
        <div>
          <p className="eyebrow text-[0.58rem]">Expected Delivery</p>
          <p className="mt-2 font-serif text-3xl">
            {order.expectedDelivery ?? "Delivery date to be confirmed"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:content-center">
          <div>
            <p className="text-[0.56rem] uppercase tracking-[0.14em] text-muted-foreground">
              Courier
            </p>
            <p className="mt-2 text-sm">{order.courier ?? "Demo Courier"}</p>
          </div>
          <div>
            <p className="text-[0.56rem] uppercase tracking-[0.14em] text-muted-foreground">
              Tracking
            </p>
            <p className="mt-2 break-all text-sm">{order.trackingNumber ?? "AWB12345678"}</p>
          </div>
        </div>
      </div>
      <CustomerSection title="Order Timeline" className="mb-6">
        {order.status === "CANCELLED" ? (
          <p className="text-sm text-muted-foreground">This demo order has been cancelled.</p>
        ) : (
          <OrderProgress status={order.status} />
        )}
      </CustomerSection>
      <Link
        to="/account/orders/$orderId"
        params={{ orderId: order.id }}
        className="inline-flex min-h-11 items-center gap-2 border border-border px-4 text-[0.58rem] uppercase tracking-[0.16em] hover:border-primary/50 hover:text-primary"
      >
        View Order Details <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </CustomerLayout>
  );
}

export function WishlistPage() {
  const [saved, setSaved] = useState(mockWishlist);
  const [message, setMessage] = useState("");

  return (
    <CustomerLayout heading="Saved for your ritual." eyebrow="Wishlist">
      {message ? (
        <p
          role="status"
          className="mb-4 border border-primary/25 bg-primary/5 p-3 text-sm text-primary"
        >
          {message}
        </p>
      ) : null}
      {saved.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((product) => (
            <article key={product.id} className="border border-border bg-card/35">
              <ProductImage
                src={product.image}
                alt={product.name}
                className="aspect-[4/3] w-full"
              />
              <div className="p-4">
                <p className="text-sm leading-relaxed">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.size}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm">
                  <Money amount={product.price} />
                  {product.originalPrice ? (
                    <span className="text-xs text-muted-foreground line-through">
                      <Money amount={product.originalPrice} />
                    </span>
                  ) : null}
                </p>
                <p
                  className={`mt-2 text-[0.58rem] uppercase tracking-[0.14em] ${
                    product.stockStatus === "Low stock" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {product.stockStatus}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CustomerButton
                    onClick={() =>
                      setMessage(`${product.name} is ready for your bag in this demo.`)
                    }
                  >
                    Add to Bag
                  </CustomerButton>
                  <CustomerButton
                    variant="quiet"
                    onClick={() => {
                      setSaved((items) => items.filter((item) => item.id !== product.id));
                      setMessage("Item removed from your saved list.");
                    }}
                  >
                    Remove
                  </CustomerButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card/40 px-5 py-12 text-center">
          <Heart className="mx-auto h-7 w-7 text-primary/70" />
          <p className="mt-4 font-serif text-2xl">Nothing saved yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Save the rituals you want to return to.
          </p>
          <Link to="/" className="btn-quiet mt-5">
            Explore Products
          </Link>
        </div>
      )}
    </CustomerLayout>
  );
}

export function ReviewsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [newReviews, setNewReviews] = useState<
    Array<(typeof mockReviews)[number] & { productId: string }>
  >([]);
  const [successMessage, setSuccessMessage] = useState("");
  const reviewedItems = new Set(
    [...mockReviews, ...newReviews].map((item) => `${item.orderId}:${item.productId}`),
  );
  const awaitingReview = mockOrders.flatMap((order) =>
    order.status === "DELIVERED"
      ? order.items
          .filter((item) => !reviewedItems.has(`${order.id}:${item.id}`))
          .map((item) => ({ orderId: order.id, deliveredDate: order.deliveredDate, product: item }))
      : [],
  );

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = awaitingReview.find((item) => item.orderId === targetOrderId);
    if (!target) return;
    setNewReviews((items) => [
      {
        productId: target.product.id,
        orderId: target.orderId,
        date: "06 Oct 2026",
        rating,
        title: title.trim(),
        body: review.trim(),
      },
      ...items,
    ]);
    setSuccessMessage("Thank you — your review has been received.");
    setTitle("");
    setReview("");
    setIsOpen(false);
  };

  return (
    <CustomerLayout heading="My Reviews" eyebrow="Notes from your ritual">
      {successMessage ? (
        <p
          role="status"
          className="mb-5 border border-primary/30 bg-primary/5 p-4 text-sm text-primary"
        >
          {successMessage}
        </p>
      ) : null}
      <CustomerSection title="Awaiting Review" className="mb-6">
        {awaitingReview.length ? (
          <div className="space-y-4">
            {awaitingReview.map((item) => (
              <article
                key={`${item.orderId}:${item.product.id}`}
                className="flex flex-col gap-4 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <ProductImage
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-24 w-24 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{item.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered {item.deliveredDate ?? "recently"} · Order #{item.orderId}
                  </p>
                </div>
                <CustomerButton
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setTargetOrderId(item.orderId);
                    setIsOpen(true);
                  }}
                >
                  Write a Review
                </CustomerButton>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">You’re all caught up on reviews.</p>
        )}
      </CustomerSection>
      <CustomerSection title="Your Reviews">
        <div className="space-y-5">
          {[...newReviews, ...mockReviews].map((item) => {
            const product = mockProducts.find((entry) => entry.id === item.productId);
            if (!product) return null;
            return (
              <article
                key={`${item.orderId}:${item.productId}`}
                className="border-b border-border pb-5 last:border-0 last:pb-0"
              >
                <div className="flex gap-4">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Order #{item.orderId}</p>
                    <div
                      aria-label={`${item.rating} out of 5 stars`}
                      className="mt-2 flex gap-1 text-primary"
                    >
                      {Array.from({ length: item.rating }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            );
          })}
        </div>
      </CustomerSection>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl border-border bg-night pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">
              Rate your experience
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {
                mockProducts.find(
                  (product) =>
                    product.id ===
                    awaitingReview.find((item) => item.orderId === targetOrderId)?.product.id,
                )?.name
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReview} className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
                Rate your experience
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={rating === value}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      onClick={() => setRating(value)}
                      className={`inline-flex min-h-11 items-center justify-center gap-1 border text-xs ${
                        rating === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {value}{" "}
                      <Star className={`h-4 w-4 ${value <= rating ? "fill-current" : ""}`} />
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="block text-xs text-muted-foreground">
              Review Title
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Review / Experience
              <Textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                required
                rows={4}
                className="mt-2 rounded-none border-border bg-background text-foreground focus-visible:ring-primary/40"
              />
            </label>
            <CustomerButton type="submit" className="w-full">
              Submit Review
            </CustomerButton>
          </form>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}

const emptyAddress = (): Omit<CustomerAddress, "id"> => ({
  type: "Home",
  fullName: mockCustomer.fullName,
  mobile: mockCustomer.mobile,
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  isDefault: false,
});

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<CustomerAddress, "id">;
  onSave: (address: Omit<CustomerAddress, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const field = (key: keyof typeof form, label: string, required = false) => (
    <label className="block text-xs text-muted-foreground">
      {label}
      <Input
        value={typeof form[key] === "string" ? form[key] : ""}
        onChange={(event) => set(key, event.target.value)}
        required={required}
        className={`${inputClass} mt-2`}
      />
    </label>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("fullName", "Full Name", true)}
        {field("mobile", "Mobile", true)}
        {field("line1", "Address Line 1", true)}
        {field("line2", "Address Line 2")}
        {field("landmark", "Landmark")}
        {field("city", "City", true)}
        {field("state", "State", true)}
        {field("pinCode", "PIN Code", true)}
        {field("country", "Country", true)}
        <label className="block text-xs text-muted-foreground">
          Address Type
          <select
            value={form.type}
            onChange={(event) => set("type", event.target.value as CustomerAddress["type"])}
            className={`${inputClass} mt-2 w-full border px-3`}
          >
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => set("isDefault", event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Set as default address
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <CustomerButton type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </CustomerButton>
        <CustomerButton type="submit">Save Address</CustomerButton>
      </div>
    </form>
  );
}

export function ProfilePage() {
  const [personal, setPersonal] = useState({
    fullName: mockCustomer.fullName,
    email: mockCustomer.email,
    mobile: mockCustomer.mobile,
  });
  const [savedPersonal, setSavedPersonal] = useState(personal);
  const [editingProfile, setEditingProfile] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [addresses, setAddresses] = useState(mockAddresses);
  const [addressOpen, setAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const openNewAddress = () => {
    setEditingAddress(null);
    setAddressOpen(true);
  };
  const saveAddress = (address: Omit<CustomerAddress, "id">) => {
    setAddresses((current) => {
      const revised = address.isDefault
        ? current.map((entry) => ({ ...entry, isDefault: false }))
        : current;
      return editingAddress
        ? revised.map((entry) =>
            entry.id === editingAddress.id ? { ...address, id: entry.id } : entry,
          )
        : [...revised, { ...address, id: `address-${Date.now()}` }];
    });
    setAddressOpen(false);
    setMessage(editingAddress ? "Address updated for this demo." : "Address added for this demo.");
  };
  const setDefault = (id: string) => {
    setAddresses((current) => current.map((entry) => ({ ...entry, isDefault: entry.id === id })));
    setMessage("Default address updated for this demo.");
  };
  const initials = personal.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <CustomerLayout heading="Profile" eyebrow="Your details, your way">
      {message ? (
        <p
          role="status"
          className="mb-5 border border-primary/25 bg-primary/5 p-3 text-sm text-primary"
        >
          {message}
        </p>
      ) : null}
      <CustomerSection title="Personal Information" className="mb-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/10 font-serif text-xl text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl">{personal.fullName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{personal.email}</p>
          </div>
          {!editingProfile ? (
            <CustomerButton
              variant="quiet"
              onClick={() => {
                setSavedPersonal(personal);
                setPersonalSaved(false);
                setEditingProfile(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </CustomerButton>
          ) : null}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSavedPersonal(personal);
            setPersonalSaved(true);
            setEditingProfile(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="block text-xs text-muted-foreground">
            Full Name
            <Input
              value={personal.fullName}
              onChange={(event) => setPersonal({ ...personal, fullName: event.target.value })}
              disabled={!editingProfile}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Email
            <Input
              type="email"
              value={personal.email}
              onChange={(event) => setPersonal({ ...personal, email: event.target.value })}
              disabled={!editingProfile}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Mobile
            <Input
              value={personal.mobile}
              onChange={(event) => setPersonal({ ...personal, mobile: event.target.value })}
              disabled={!editingProfile}
              className={`${inputClass} mt-2`}
            />
          </label>
          {editingProfile ? (
            <div className="flex flex-col gap-2 min-[420px]:flex-row sm:col-span-2">
              <CustomerButton type="submit" className="w-full min-[420px]:w-auto">
                Save Changes
              </CustomerButton>
              <CustomerButton
                type="button"
                variant="quiet"
                className="w-full min-[420px]:w-auto"
                onClick={() => {
                  setPersonal(savedPersonal);
                  setEditingProfile(false);
                }}
              >
                Cancel
              </CustomerButton>
            </div>
          ) : personalSaved ? (
            <p role="status" className="text-sm text-primary sm:col-span-2">
              Your profile changes are saved for this demo.
            </p>
          ) : null}
        </form>
      </CustomerSection>

      <CustomerSection
        title="Saved Addresses"
        action={
          <CustomerButton variant="quiet" onClick={openNewAddress}>
            <Plus className="h-3.5 w-3.5" /> Add New Address
          </CustomerButton>
        }
        className="mb-6"
      >
        {addresses.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="eyebrow text-[0.55rem]">{address.type}</p>
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[0.54rem] uppercase tracking-[0.12em] text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Default Address
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  <p className="text-foreground">{address.fullName}</p>
                  <p>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  {address.landmark ? <p>Landmark: {address.landmark}</p> : null}
                  <p>
                    {address.city}, {address.state}
                  </p>
                  <p>{address.pinCode}</p>
                  <p>
                    {address.country} · {address.mobile}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  <CustomerButton
                    variant="quiet"
                    onClick={() => {
                      setEditingAddress(address);
                      setAddressOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </CustomerButton>
                  <CustomerButton
                    variant="quiet"
                    onClick={() => {
                      setAddresses((current) => {
                        const remaining = current.filter((entry) => entry.id !== address.id);
                        if (!remaining.some((entry) => entry.isDefault) && remaining[0]) {
                          remaining[0] = { ...remaining[0], isDefault: true };
                        }
                        return remaining;
                      });
                      setMessage("Address removed for this demo.");
                    }}
                  >
                    <X className="h-3 w-3" /> Remove
                  </CustomerButton>
                  {!address.isDefault ? (
                    <CustomerButton variant="quiet" onClick={() => setDefault(address.id)}>
                      Set as Default
                    </CustomerButton>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">
            No saved addresses yet. Add an address for your next ritual.
          </p>
        )}
      </CustomerSection>

      <CustomerSection title="Password & Security">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm">Password</p>
            <p
              aria-label="Password hidden"
              className="mt-1 tracking-[0.25em] text-muted-foreground"
            >
              ••••••••
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CustomerButton
              variant="quiet"
              onClick={() => {
                setPasswordSaved(false);
                setSecurityOpen(true);
              }}
            >
              Change Password
            </CustomerButton>
            <CustomerButton
              variant="quiet"
              onClick={async () => {
                await logout();
                await navigate({ to: "/login" });
              }}
            >
              Logout
            </CustomerButton>
          </div>
        </div>
      </CustomerSection>

      <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
        <DialogContent className="fixed inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl border-border bg-night pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            initial={editingAddress ?? emptyAddress()}
            onSave={saveAddress}
            onCancel={() => setAddressOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="fixed inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl border-border bg-night pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">Change Password</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Demo only — your password will not be changed.
            </DialogDescription>
          </DialogHeader>
          {passwordSaved ? (
            <p
              role="status"
              className="border border-primary/25 bg-primary/5 p-4 text-sm text-primary"
            >
              Password updated for this demo.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (passwords.next !== passwords.confirm) {
                  setPasswordError("The new passwords do not match.");
                  return;
                }
                setPasswordError("");
                setPasswordSaved(true);
              }}
              className="space-y-4"
            >
              <label className="block text-xs text-muted-foreground">
                Current Password
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                  required
                  className={`${inputClass} mt-2`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                New Password
                <Input
                  type="password"
                  value={passwords.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                  required
                  minLength={8}
                  className={`${inputClass} mt-2`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Confirm New Password
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                  required
                  minLength={8}
                  className={`${inputClass} mt-2`}
                />
              </label>
              {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
              <CustomerButton type="submit" className="w-full">
                Update Password
              </CustomerButton>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}

export function SupportPage() {
  const categories = [
    "Track My Order",
    "Order Issue",
    "Return / Replacement",
    "Payment Issue",
    "Product Question",
    "Delivery Issue",
    "Other",
  ];
  const orderRelated = new Set([
    "Track My Order",
    "Order Issue",
    "Return / Replacement",
    "Delivery Issue",
  ]);
  const [issueType, setIssueType] = useState(categories[0]!);
  const [relatedOrder, setRelatedOrder] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <CustomerLayout heading="How can we help?" eyebrow="Help & Support">
      {sent ? (
        <div
          role="status"
          className="border border-primary/30 bg-primary/5 p-6 text-center sm:p-10"
        >
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-serif text-3xl">Your message has been received.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for reaching out to the 1st ROOT team.
          </p>
          <CustomerButton variant="quiet" className="mt-5" onClick={() => setSent(false)}>
            Send Another Message
          </CustomerButton>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <CustomerSection title="Quick Help">
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setIssueType(category)}
                  aria-pressed={issueType === category}
                  className={`flex min-h-12 items-center justify-between border px-3 text-left text-[0.62rem] uppercase tracking-[0.12em] transition-colors ${
                    issueType === category
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border text-foreground/75 hover:border-primary/30"
                  }`}
                >
                  {category}
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          </CustomerSection>
          <CustomerSection title="Contact Support">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
              className="space-y-4"
            >
              <label className="block text-xs text-muted-foreground">
                Issue Type
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className={`${inputClass} mt-2 w-full border px-3`}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              {orderRelated.has(issueType) ? (
                <label className="block text-xs text-muted-foreground">
                  Related Order
                  <select
                    value={relatedOrder}
                    onChange={(event) => setRelatedOrder(event.target.value)}
                    className={`${inputClass} mt-2 w-full border px-3`}
                  >
                    <option value="">Select an order (optional)</option>
                    {mockOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id} · {order.status}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-xs text-muted-foreground">
                Subject
                <Input required className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-xs text-muted-foreground">
                Message
                <Textarea
                  required
                  rows={5}
                  className="mt-2 rounded-none border-border bg-background text-foreground focus-visible:ring-primary/40"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Attachment <span className="normal-case tracking-normal">(optional)</span>
                <input
                  type="file"
                  onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
                  className="mt-2 block min-h-12 w-full cursor-pointer border border-border bg-background text-xs text-muted-foreground file:mr-3 file:min-h-12 file:border-0 file:border-r file:border-border file:bg-secondary file:px-4 file:text-[0.58rem] file:uppercase file:tracking-[0.12em] file:text-foreground"
                />
                {attachmentName ? (
                  <span className="mt-2 block break-all text-primary">{attachmentName}</span>
                ) : null}
              </label>
              <CustomerButton type="submit" className="w-full sm:w-auto">
                Send Message
              </CustomerButton>
            </form>
          </CustomerSection>
        </div>
      )}

      <CustomerSection title="Frequently Asked Questions" className="mt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="order">
            <AccordionTrigger>Where is my order?</AccordionTrigger>
            <AccordionContent>
              Open My Orders to view the latest demo status and tracking timeline. Order statuses
              here are sample information only.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="delivery">
            <AccordionTrigger>How long does delivery take?</AccordionTrigger>
            <AccordionContent>
              Delivery timing depends on the destination and is not configured in this UI demo.
              Please contact support with your order number for help.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cancel">
            <AccordionTrigger>Can I cancel my order?</AccordionTrigger>
            <AccordionContent>
              Cancellation availability depends on the order stage. This demo does not process
              cancellations; contact support to discuss an actual order.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="return">
            <AccordionTrigger>How do I request a return or replacement?</AccordionTrigger>
            <AccordionContent>
              Return and replacement terms are not provided in this demo. Choose Return /
              Replacement above and include your order details so the team can assist.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="refund">
            <AccordionTrigger>When will I receive my refund?</AccordionTrigger>
            <AccordionContent>
              Refund timelines depend on the applicable policy and payment provider, neither of
              which is configured here. Contact support for order-specific guidance.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="use">
            <AccordionTrigger>How should I use 1st ROOT hair oil?</AccordionTrigger>
            <AccordionContent>
              Follow the usage directions on the product packaging. Specific application
              instructions are not included in this demo.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="store">
            <AccordionTrigger>How should I store the products?</AccordionTrigger>
            <AccordionContent>
              Follow the storage guidance printed on the product packaging. Product-specific storage
              directions are not included in this demo.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CustomerSection>
    </CustomerLayout>
  );
}
