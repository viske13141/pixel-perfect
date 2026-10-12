import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Download, Eye, Plus, Search, Send, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  getAdminCustomer,
  getAdminOrder,
  getAdminProduct,
  mockAdminOrders,
  mockAdminReviews,
  mockContentSections,
  mockDiscounts,
  mockPayments,
  mockReturns,
  mockShipments,
  mockSupportTickets,
  type AdminReview,
  type SupportTicket,
} from "@/data/adminMockData";
import {
  AdminButton,
  AdminMetric,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fieldClass =
  "h-10 rounded-none border-border bg-background text-foreground focus-visible:ring-primary/40";
const issueStatuses = [
  "OPEN",
  "IN PROGRESS",
  "WAITING FOR CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;
type TicketStatus = (typeof issueStatuses)[number];

function Cash({ value }: { value: number }) {
  return <>₹{value.toLocaleString("en-IN")}</>;
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-primary/25 bg-primary/[0.06] px-2 text-[0.5rem] uppercase tracking-[0.12em] text-primary">
      {children}
    </span>
  );
}

function ProductThumb({ src, name }: { src: string; name: string }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden bg-night">
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>(mockAdminReviews);
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [notice, setNotice] = useState("");
  const list = reviews.filter((review) => filter === "ALL" || review.status === filter);
  const updateReview = (id: string, status: AdminReview["status"]) => {
    setReviews((current) =>
      current.map((review) => (review.id === id ? { ...review, status } : review)),
    );
    setNotice(`Review ${id} marked ${status.toLowerCase()} in this demo.`);
    setSelected(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        subtitle="Moderate product feedback and verified customer reviews."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Total Reviews" value={reviews.length} />
        <AdminMetric
          label="Pending Review"
          value={reviews.filter((review) => review.status === "PENDING").length}
        />
        <AdminMetric
          label="Published"
          value={reviews.filter((review) => review.status === "PUBLISHED").length}
        />
        <AdminMetric
          label="Rejected"
          value={reviews.filter((review) => review.status === "REJECTED").length}
        />
      </div>
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <AdminSection title="Product Reviews">
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {["ALL", "PENDING", "PUBLISHED", "REJECTED"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`min-h-9 shrink-0 px-3 text-[0.52rem] uppercase tracking-[0.12em] ${filter === item ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {list.map((review) => {
            const product = getAdminProduct(review.productId);
            const customer = getAdminCustomer(review.customerId);
            return (
              <article
                key={review.id}
                className="grid gap-3 border border-border p-4 sm:grid-cols-[1.2fr_1fr_0.7fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={product.image} name={product.name} />
                  <div className="min-w-0">
                    <p className="truncate text-xs">{review.title}</p>
                    <p className="mt-1 line-clamp-2 text-[0.62rem] text-muted-foreground">
                      {review.body}
                    </p>
                    <p className="mt-1 text-[0.55rem] text-muted-foreground">{product.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs">
                    {customer.fullName}
                    {review.verified ? <span className="ml-2 text-primary">Verified</span> : null}
                  </p>
                  <p className="mt-1 text-[0.62rem] text-muted-foreground">
                    Order #{review.orderId} · {review.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-wider text-primary">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  <div className="mt-1">
                    <Tag>{review.status}</Tag>
                  </div>
                </div>
                <AdminButton variant="quiet" onClick={() => setSelected(review)}>
                  Moderate
                </AdminButton>
              </article>
            );
          })}
        </div>
      </AdminSection>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-none border-border bg-night text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">Review Details</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs tracking-wider text-primary">
                  {"★".repeat(selected.rating)}
                  {"☆".repeat(5 - selected.rating)}
                </p>
                <p className="mt-2 text-sm">{selected.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {selected.body}
                </p>
              </div>
              <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                By {getAdminCustomer(selected.customerId).fullName} ·{" "}
                {getAdminProduct(selected.productId).name}
                <br />
                Order #{selected.orderId} · {selected.date}
                {selected.verified ? " · Verified purchase" : ""}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <AdminButton
                  onClick={() => updateReview(selected.id, "PUBLISHED")}
                  className="flex-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Publish
                </AdminButton>
                <AdminButton
                  variant="quiet"
                  onClick={() => updateReview(selected.id, "REJECTED")}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </AdminButton>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TicketConversation({
  ticket,
  onBack,
  onUpdate,
}: {
  ticket: SupportTicket;
  onBack: () => void;
  onUpdate: (ticket: SupportTicket) => void;
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<SupportTicket["priority"]>(ticket.priority);
  const [reply, setReply] = useState("");
  const customer = getAdminCustomer(ticket.customerId);
  const order = ticket.orderId ? getAdminOrder(ticket.orderId) : null;
  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) return;
    onUpdate({
      ...ticket,
      status,
      priority,
      messages: [
        ...ticket.messages,
        { author: "1st ROOT Support", body: reply.trim(), date: "Today · just now" },
      ],
    });
    setReply("");
  };
  return (
    <>
      <AdminPageHeader
        title={ticket.id}
        subtitle={ticket.subject}
        action={
          <button
            type="button"
            onClick={onBack}
            className="text-[0.56rem] uppercase tracking-[0.14em] text-primary"
          >
            ← All Tickets
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <AdminSection title="Conversation">
          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {ticket.messages.map((message, index) => (
              <div
                key={`${index}-${message.date}`}
                className={`max-w-[92%] border p-3 ${message.author === "Customer" ? "border-border bg-background/40" : "ml-auto border-primary/20 bg-primary/[0.06]"}`}
              >
                <p className="flex justify-between gap-3 text-[0.55rem] uppercase tracking-[0.12em] text-primary">
                  {message.author}
                  <span className="text-muted-foreground">{message.date}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed">{message.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submitReply} className="mt-5 border-t border-border pt-4">
            <label className="text-[0.6rem] text-muted-foreground">
              Reply to customer
              <Textarea
                rows={4}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                required
                className="mt-2 rounded-none border-border bg-background text-foreground"
              />
            </label>
            <AdminButton type="submit" className="mt-3">
              <Send className="h-3 w-3" />
              Send Reply
            </AdminButton>
          </form>
        </AdminSection>
        <div className="space-y-6">
          <AdminSection title="Ticket Details">
            <p className="text-sm">{customer.fullName}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{customer.email}</p>
            <p className="mt-4 text-xs">
              {ticket.category}
              <span className="mt-1 block text-muted-foreground">Created {ticket.created}</span>
            </p>
            {order ? (
              <Link
                to="/admin/orders/$orderId"
                params={{ orderId: order.id }}
                className="mt-4 block border-t border-border pt-3 text-xs text-primary"
              >
                Related order #{order.id} · ₹{order.total.toLocaleString("en-IN")}
              </Link>
            ) : null}
          </AdminSection>
          <AdminSection title="Update Ticket">
            <label className="block text-xs text-muted-foreground">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TicketStatus)}
                className={`${fieldClass} mt-2 w-full border px-2`}
              >
                {issueStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs text-muted-foreground">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as SupportTicket["priority"])}
                className={`${fieldClass} mt-2 w-full border px-2`}
              >
                {["LOW", "NORMAL", "HIGH"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <AdminButton
              className="mt-4 w-full"
              onClick={() => onUpdate({ ...ticket, status, priority })}
            >
              Save Ticket
            </AdminButton>
          </AdminSection>
        </div>
      </div>
    </>
  );
}

export function AdminSupportPage({ ticketId }: { ticketId?: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockSupportTickets);
  const [search, setSearch] = useState("");
  const selected = tickets.find((ticket) => ticket.id === ticketId);
  const updateTicket = (ticket: SupportTicket) =>
    setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item)));
  if (selected)
    return (
      <TicketConversation
        ticket={selected}
        onBack={() => window.history.back()}
        onUpdate={updateTicket}
      />
    );
  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const filtered = tickets.filter((ticket) =>
    `${ticket.id} ${ticket.subject} ${ticket.category} ${getAdminCustomer(ticket.customerId).fullName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <AdminPageHeader
        title="Support"
        subtitle="Customer conversations and order-related requests."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Open Tickets" value={openCount} />
        <AdminMetric
          label="In Progress"
          value={tickets.filter((ticket) => ticket.status === "IN PROGRESS").length}
        />
        <AdminMetric
          label="Waiting on Customer"
          value={tickets.filter((ticket) => ticket.status === "WAITING FOR CUSTOMER").length}
        />
        <AdminMetric
          label="Resolved"
          value={tickets.filter((ticket) => ticket.status === "RESOLVED").length}
        />
      </div>
      <AdminSection title="Support Tickets">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            className={`${fieldClass} pl-10`}
          />
        </label>
        <div className="mt-5 space-y-3">
          {filtered.map((ticket) => (
            <Link
              key={ticket.id}
              to="/admin/support/$ticketId"
              params={{ ticketId: ticket.id }}
              className="grid gap-3 border border-border p-4 sm:grid-cols-[0.7fr_1.4fr_1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-xs text-primary">{ticket.id}</p>
                <p className="mt-1 text-[0.58rem] text-muted-foreground">{ticket.created}</p>
              </div>
              <div>
                <p className="text-xs">{ticket.subject}</p>
                <p className="mt-1 text-[0.6rem] text-muted-foreground">
                  {ticket.category} · {getAdminCustomer(ticket.customerId).fullName}
                </p>
              </div>
              <p className="line-clamp-2 text-[0.62rem] text-muted-foreground">{ticket.message}</p>
              <span className="flex flex-wrap items-center gap-2">
                <Tag>{ticket.priority}</Tag>
                <Tag>{ticket.status}</Tag>
              </span>
            </Link>
          ))}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminShippingPage() {
  const [shipments, setShipments] = useState(mockShipments);
  const [notice, setNotice] = useState("");
  const update = (orderId: string, key: "courier" | "awb" | "status", value: string) =>
    setShipments((current) =>
      current.map((shipment) =>
        shipment.orderId === orderId ? { ...shipment, [key]: value } : shipment,
      ),
    );
  return (
    <>
      <AdminPageHeader
        title="Shipping"
        subtitle="Prepare shipment details and review delivery progress."
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric
          label="Awaiting Dispatch"
          value={shipments.filter((s) => ["READY TO SHIP", "PACKED"].includes(s.status)).length}
        />
        <AdminMetric
          label="In Transit"
          value={shipments.filter((s) => s.status === "IN TRANSIT").length}
        />
        <AdminMetric
          label="Delivered"
          value={shipments.filter((s) => s.status === "DELIVERED").length}
        />
        <AdminMetric
          label="Delivery Issues"
          value={shipments.filter((s) => s.status.includes("FAILED")).length}
        />
      </div>
      <AdminSection title="Shipment Queue">
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <article
              key={shipment.orderId}
              className="grid gap-3 border border-border p-4 lg:grid-cols-[0.7fr_1.1fr_1fr_1.1fr_auto] lg:items-center"
            >
              <Link
                to="/admin/orders/$orderId"
                params={{ orderId: shipment.orderId }}
                className="text-xs text-primary"
              >
                #{shipment.orderId}
                <small className="mt-1 block text-muted-foreground">
                  {getAdminCustomer(getAdminOrder(shipment.orderId).customerId).fullName}
                </small>
              </Link>
              <label className="text-[0.55rem] text-muted-foreground">
                Courier
                <Input
                  value={shipment.courier}
                  onChange={(event) => update(shipment.orderId, "courier", event.target.value)}
                  className={`${fieldClass} mt-1`}
                  placeholder="Assign courier"
                />
              </label>
              <label className="text-[0.55rem] text-muted-foreground">
                Tracking / AWB
                <Input
                  value={shipment.awb}
                  onChange={(event) => update(shipment.orderId, "awb", event.target.value)}
                  className={`${fieldClass} mt-1`}
                  placeholder="Add tracking reference"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[0.55rem] text-muted-foreground">
                  Destination
                  <strong className="mt-1 block text-xs text-foreground">
                    {shipment.destination}
                  </strong>
                </span>
                <label className="text-[0.55rem] text-muted-foreground">
                  Delivery Status
                  <select
                    value={shipment.status}
                    onChange={(event) => update(shipment.orderId, "status", event.target.value)}
                    className={`${fieldClass} mt-1 w-full border px-2`}
                  >
                    {[
                      "READY TO SHIP",
                      "PACKED",
                      "IN TRANSIT",
                      "OUT FOR DELIVERY",
                      "DELIVERED",
                      "FAILED DELIVERY",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <AdminButton
                variant="quiet"
                onClick={() =>
                  setNotice(`Shipment details for ${shipment.orderId} saved in this demo.`)
                }
              >
                Save Shipment
              </AdminButton>
            </article>
          ))}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminReturnsPage() {
  const [returns, setReturns] = useState(mockReturns);
  const [notice, setNotice] = useState("");
  const update = (id: string, status: string, refundStatus: string) => {
    setReturns((current) =>
      current.map((item) => (item.id === id ? { ...item, status, refundStatus } : item)),
    );
    setNotice(`${id} updated in this demo.`);
  };
  return (
    <>
      <AdminPageHeader
        title="Returns & Refunds"
        subtitle="Review customer return requests and mock refund status."
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Return Requests" value={returns.length} />
        <AdminMetric
          label="Awaiting Review"
          value={returns.filter((item) => item.status === "REVIEWING").length}
        />
        <AdminMetric
          label="Approved"
          value={returns.filter((item) => item.status === "APPROVED").length}
        />
        <AdminMetric
          label="Refund Pending"
          value={returns.filter((item) => item.refundStatus === "PENDING").length}
        />
      </div>
      <AdminSection title="Return Requests">
        <div className="space-y-4">
          {returns.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 border border-border p-4 lg:grid-cols-[0.8fr_1.2fr_1fr_0.8fr_auto] lg:items-center"
            >
              <div>
                <p className="text-xs text-primary">{item.id}</p>
                <Link
                  to="/admin/orders/$orderId"
                  params={{ orderId: item.orderId }}
                  className="mt-1 block text-xs"
                >
                  Order #{item.orderId}
                </Link>
                <p className="mt-1 text-[0.58rem] text-muted-foreground">{item.requested}</p>
              </div>
              <div>
                <p className="text-xs">{getAdminProduct(item.productId).name}</p>
                <p className="mt-1 text-[0.62rem] text-muted-foreground">
                  {getAdminCustomer(item.customerId).fullName}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{item.reason}</p>
              </div>
              <div>
                <label className="text-[0.53rem] text-muted-foreground">
                  Request Status
                  <select
                    value={item.status}
                    onChange={(event) => update(item.id, event.target.value, item.refundStatus)}
                    className={`${fieldClass} mt-1 w-full border px-2`}
                  >
                    {["REVIEWING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-2 block text-[0.53rem] text-muted-foreground">
                  Refund Status
                  <select
                    value={item.refundStatus}
                    onChange={(event) => update(item.id, item.status, event.target.value)}
                    className={`${fieldClass} mt-1 w-full border px-2`}
                  >
                    {["PENDING", "PROCESSING", "REFUNDED", "FAILED"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Refund amount</span>
                <strong className="mt-1 block">
                  <Cash value={item.refundAmount} />
                </strong>
              </div>
              <AdminButton
                variant="quiet"
                onClick={() => setNotice(`${item.id} decision saved in this demo.`)}
              >
                Save Decision
              </AdminButton>
            </article>
          ))}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = payments.filter((payment) =>
    `${payment.id} ${payment.orderId} ${payment.method}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const refund = (id: string) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === id ? { ...payment, status: "REFUNDED", refundStatus: "REFUNDED" } : payment,
      ),
    );
    setNotice(`Demo refund recorded for ${id}. No payment was processed.`);
  };
  return (
    <>
      <AdminPageHeader
        title="Payments"
        subtitle="Mock payment records, reconciliation, and refund statuses."
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Total Payments" value={payments.length} />
        <AdminMetric
          label="Paid"
          value={payments.filter((item) => item.status === "PAID").length}
        />
        <AdminMetric
          label="Pending"
          value={payments.filter((item) => item.status === "PENDING").length}
        />
        <AdminMetric
          label="Refunded"
          value={payments.filter((item) => item.status === "REFUNDED").length}
        />
      </div>
      <AdminSection title="Payment Transactions">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search transaction or order..."
          className={`${fieldClass} w-full sm:max-w-sm`}
        />
        <div className="mt-5 space-y-3">
          {filtered.map((payment) => (
            <article
              key={`${payment.orderId}-${payment.id}`}
              className="grid gap-3 border border-border p-4 sm:grid-cols-[1fr_1fr_0.7fr_0.8fr_auto] sm:items-center"
            >
              <div>
                <Link
                  to="/admin/orders/$orderId"
                  params={{ orderId: payment.orderId }}
                  className="text-xs text-primary"
                >
                  Order #{payment.orderId}
                </Link>
                <p className="mt-1 break-all text-[0.56rem] text-muted-foreground">{payment.id}</p>
              </div>
              <div>
                <p className="text-xs">
                  <Cash value={payment.amount} />
                </p>
                <p className="mt-1 text-[0.58rem] text-muted-foreground">
                  {payment.method} · {payment.date}
                </p>
              </div>
              <Tag>{payment.status}</Tag>
              <p className="text-[0.6rem] text-muted-foreground">Refund: {payment.refundStatus}</p>
              {payment.status === "PAID" ? (
                <AdminButton variant="quiet" onClick={() => refund(payment.id)}>
                  Mark Refunded
                </AdminButton>
              ) : (
                <span />
              )}
            </article>
          ))}
        </div>
        <p className="mt-5 border-t border-border pt-4 text-[0.58rem] leading-relaxed text-muted-foreground">
          All records are sample data. Refund actions only change this local demo screen; no gateway
          or transaction is contacted.
        </p>
      </AdminSection>
    </>
  );
}

export function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState(mockDiscounts);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") || "").toUpperCase();
    setDiscounts((current) => [
      {
        code,
        description: String(form.get("description")),
        discount: `${form.get("discount")}%`,
        minimum: Number(form.get("minimum")),
        usage: "0 / 100",
        start: "06 Oct 2026",
        end: String(form.get("end")),
        status: "ACTIVE",
      },
      ...current,
    ]);
    setNotice(`${code} added to the demo list.`);
    setShowForm(false);
  };
  const update = (code: string, status: string) =>
    setDiscounts((current) =>
      current.map((discount) => (discount.code === code ? { ...discount, status } : discount)),
    );
  return (
    <>
      <AdminPageHeader
        title="Discounts"
        subtitle="Promotional codes and offer status."
        action={
          <AdminButton onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3" />
            Create Discount
          </AdminButton>
        }
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      {showForm ? (
        <AdminSection title="New Discount" className="mb-6">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Input name="code" required placeholder="Code e.g. ROOT15" className={fieldClass} />
            <Input name="description" required placeholder="Description" className={fieldClass} />
            <Input
              name="discount"
              required
              type="number"
              min="1"
              max="100"
              placeholder="Discount %"
              className={fieldClass}
            />
            <Input
              name="minimum"
              required
              type="number"
              min="0"
              placeholder="Minimum order"
              className={fieldClass}
            />
            <div className="flex gap-2">
              <Input name="end" required placeholder="End date" className={fieldClass} />
              <AdminButton type="submit">Save</AdminButton>
            </div>
          </form>
        </AdminSection>
      ) : null}
      <AdminSection title="Promotion Codes">
        <div className="space-y-3">
          {discounts.map((discount) => (
            <article
              key={discount.code}
              className="grid gap-3 border border-border p-4 sm:grid-cols-[0.8fr_1.3fr_0.65fr_0.9fr_0.9fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm tracking-[0.12em]">{discount.code}</p>
                <p className="mt-1 text-[0.56rem] text-muted-foreground">{discount.discount} off</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {discount.description}
                <small className="mt-1 block">Minimum order ₹{discount.minimum}</small>
              </p>
              <p className="text-xs">
                {discount.usage}
                <small className="mt-1 block text-muted-foreground">Redemptions</small>
              </p>
              <p className="text-[0.6rem] text-muted-foreground">
                {discount.start}
                <small className="mt-1 block">to {discount.end}</small>
              </p>
              <Tag>{discount.status}</Tag>
              <select
                aria-label={`Change ${discount.code} status`}
                value={discount.status}
                onChange={(event) => update(discount.code, event.target.value)}
                className={`${fieldClass} border px-2 text-xs`}
              >
                <option>ACTIVE</option>
                <option>PAUSED</option>
                <option>EXPIRED</option>
              </select>
            </article>
          ))}
        </div>
      </AdminSection>
    </>
  );
}

export function AdminContentPage() {
  const [sections, setSections] = useState(mockContentSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ summary: "", body: "" });
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const startEdit = (section: (typeof sections)[number]) => {
    setEditingId(section.id);
    setDraft({ summary: section.summary, body: section.body });
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    setSections((current) =>
      current.map((section) => (section.id === editingId ? { ...section, ...draft } : section)),
    );
    setNotice("Content changes saved in this demo view.");
    setEditingId(null);
  };
  return (
    <>
      <AdminPageHeader
        title="Content"
        subtitle="Edit storefront copy sections while preserving the existing storefront design."
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <AdminSection
            key={section.id}
            title={section.name}
            action={
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                Storefront content
              </span>
            }
          >
            {editingId === section.id ? (
              <form onSubmit={save} className="space-y-3">
                <label className="block text-xs text-muted-foreground">
                  Summary
                  <Input
                    value={draft.summary}
                    onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
                <label className="block text-xs text-muted-foreground">
                  Body
                  <Textarea
                    rows={4}
                    value={draft.body}
                    onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                    className="mt-1 rounded-none border-border bg-background text-foreground"
                  />
                </label>
                <div className="flex gap-2">
                  <AdminButton type="submit">Save Content</AdminButton>
                  <AdminButton type="button" variant="quiet" onClick={() => setEditingId(null)}>
                    Cancel
                  </AdminButton>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm">{section.summary}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
                <div className="mt-4 flex gap-2">
                  <AdminButton variant="quiet" onClick={() => startEdit(section)}>
                    Edit Section
                  </AdminButton>
                  <AdminButton variant="quiet" onClick={() => setPreview(section.id)}>
                    <Eye className="h-3 w-3" />
                    Preview
                  </AdminButton>
                </div>
              </>
            )}
          </AdminSection>
        ))}
      </div>
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="rounded-none border-border bg-night text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">
              Storefront Preview
            </DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="border border-border p-6">
              <p className="eyebrow">{sections.find((section) => section.id === preview)?.name}</p>
              <h3 className="mt-3 font-serif text-2xl">
                {sections.find((section) => section.id === preview)?.summary}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {sections.find((section) => section.id === preview)?.body}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminReportsPage() {
  const [period, setPeriod] = useState("Last 30 days");
  const [metric, setMetric] = useState("Revenue");
  const [notice, setNotice] = useState("");
  const bars = [35, 54, 42, 71, 58, 85, 66, 74, 49, 90, 62, 78];
  const exportCsv = () => {
    const content = [
      "Metric,Value",
      `Period,${period}`,
      `Revenue,${mockAdminOrders.reduce((sum, order) => sum + order.total, 0)}`,
      `Orders,${mockAdminOrders.length}`,
      `Customers,${new Set(mockAdminOrders.map((order) => order.customerId)).size}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "1st-root-demo-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("A sample CSV report was generated locally.");
  };
  return (
    <>
      <AdminPageHeader
        title="Reports"
        subtitle="Review demo sales and store trends."
        action={
          <AdminButton onClick={exportCsv}>
            <Download className="h-3 w-3" />
            Export CSV
          </AdminButton>
        }
      />
      {notice ? (
        <p role="status" className="mb-4 text-xs text-primary">
          {notice}
        </p>
      ) : null}
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">
          Date Range
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className={`${fieldClass} ml-2 border px-3 text-xs normal-case tracking-normal text-foreground`}
          >
            {["Last 7 days", "Last 30 days", "Last 90 days", "This year"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground">
          Report
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
            className={`${fieldClass} ml-2 border px-3 text-xs normal-case tracking-normal text-foreground`}
          >
            {["Revenue", "Orders", "Products", "Customers"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminMetric label="Gross Sales" value="₹1,24,850" note={period} />
        <AdminMetric label="Net Sales" value="₹1,12,460" note="After discounts and returns" />
        <AdminMetric label="Orders" value="186" note="Sample period total" />
        <AdminMetric label="Average Order Value" value="₹671" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <AdminSection title={`${metric} · ${period}`}>
          <div className="flex h-64 items-end gap-2 border-b border-border pb-7 pt-4">
            {bars.map((height, index) => (
              <div key={index} className="relative flex h-full flex-1 items-end">
                <div
                  className="w-full bg-primary/70 transition-all"
                  style={{ height: `${height}%` }}
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.48rem] text-muted-foreground">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[0.58rem] text-muted-foreground">
            Illustrative chart data for the admin interface; not a live analytics feed.
          </p>
        </AdminSection>
        <AdminSection title="Top Products">
          <div className="space-y-4">
            {[...new Set(mockAdminOrders.flatMap((order) => order.items.map((item) => item.name)))]
              .slice(0, 4)
              .map((name, index) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"
                >
                  <span className="text-xs">{name}</span>
                  <span className="text-xs text-primary">{42 - index * 7} sold</span>
                </div>
              ))}
          </div>
        </AdminSection>
        <AdminSection title="Sales by Product" className="xl:col-span-2">
          <div className="space-y-4">
            {[
              ["Herbal Hair Oil", 76],
              ["Oil Comb Applicator", 54],
              ["Oil + Shampoo Combo", 41],
              ["Complete Ritual Set", 28],
            ].map(([name, value]) => (
              <div
                key={name}
                className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3 text-xs"
              >
                <span className="truncate">{name}</span>
                <div className="h-2 bg-background">
                  <div className="h-full bg-primary/75" style={{ width: `${value}%` }} />
                </div>
                <span>{value}%</span>
              </div>
            ))}
          </div>
        </AdminSection>
      </div>
    </>
  );
}

export function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState({
    storeName: "1st ROOT",
    email: "hello@1stroot.example",
    phone: "+91 90000 00000",
    currency: "INR (₹)",
    timezone: "Asia/Kolkata",
    emailNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
  });
  const change = (key: keyof typeof preferences, value: string | boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };
  return (
    <>
      <AdminPageHeader
        title="Settings"
        subtitle="Demo store preferences and administrator account controls."
      />
      {saved ? (
        <p role="status" className="mb-4 text-xs text-primary">
          Settings saved in this demo view.
        </p>
      ) : null}
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Store Details">
          <div className="space-y-4">
            {[
              ["storeName", "Store Name"],
              ["email", "Contact Email"],
              ["phone", "Contact Phone"],
            ].map(([key, label]) => (
              <label key={key} className="block text-xs text-muted-foreground">
                {label}
                <Input
                  value={preferences[key as keyof typeof preferences] as string}
                  onChange={(event) => change(key as keyof typeof preferences, event.target.value)}
                  className={`${fieldClass} mt-2`}
                />
              </label>
            ))}
            <label className="block text-xs text-muted-foreground">
              Currency
              <select
                value={preferences.currency}
                onChange={(event) => change("currency", event.target.value)}
                className={`${fieldClass} mt-2 w-full border px-2`}
              >
                {["INR (₹)", "USD ($)", "EUR (€)"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Timezone
              <select
                value={preferences.timezone}
                onChange={(event) => change("timezone", event.target.value)}
                className={`${fieldClass} mt-2 w-full border px-2`}
              >
                {["Asia/Kolkata", "UTC", "Asia/Dubai"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
        </AdminSection>
        <AdminSection title="Notifications & Security">
          <div className="space-y-4">
            {[
              ["emailNotifications", "Email notifications"],
              ["lowStockAlerts", "Low stock alerts"],
              ["orderAlerts", "New order alerts"],
            ].map(([key, label]) => (
              <label key={key} className="flex min-h-10 items-center justify-between gap-4 text-xs">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={preferences[key as keyof typeof preferences] as boolean}
                  onChange={(event) =>
                    change(key as keyof typeof preferences, event.target.checked)
                  }
                  className="h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs">Admin Account</p>
            <p className="mt-1 text-xs text-muted-foreground">admin@1stroot.demo</p>
            <p className="mt-4 text-[0.58rem] leading-relaxed text-muted-foreground">
              This UI demo does not provide real access controls or persist security settings.
            </p>
          </div>
        </AdminSection>
        <div className="xl:col-span-2">
          <AdminButton type="submit">Save Settings</AdminButton>
        </div>
      </form>
    </>
  );
}
