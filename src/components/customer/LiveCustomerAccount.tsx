import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import { useWishlist } from "@/hooks/use-wishlist";
import * as api from "@/services/customerAccountService";
import { fetchCustomerOrders } from "@/services/customerOrderService";
import { CustomerLayout, CustomerSection, CustomerButton } from "./CustomerLayout";

const fieldClass = "w-full border border-border bg-background p-3 text-sm text-foreground";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Feedback({ error, success }: { error?: Error | null; success?: string | undefined }) {
  return (
    <>
      {error && (
        <p role="alert" className="my-3 text-sm text-red-400">
          {error.message}
        </p>
      )}
      {success && (
        <p role="status" className="my-3 text-sm text-primary">
          {success}
        </p>
      )}
    </>
  );
}
function QueryState({
  pending,
  error,
  retry,
}: {
  pending: boolean;
  error: Error | null;
  retry: () => unknown;
}) {
  if (pending) return <p role="status">Loading your account data…</p>;
  if (error)
    return (
      <div>
        <Feedback error={error} />
        <CustomerButton onClick={() => retry()}>Try again</CustomerButton>
      </div>
    );
  return null;
}
function useAccountOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: () => fetchCustomerOrders(user!.id),
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
  });
}

export function WishlistPage() {
  const { query, mutation, items } = useWishlist();
  return (
    <CustomerLayout heading="Your wishlist" eyebrow="Saved for your ritual">
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch} />
      <Feedback error={mutation.error} />
      {query.isSuccess &&
        (!items.length ? (
          <CustomerSection title="Nothing saved yet">
            <p className="mb-5">Save products using the heart in our shop.</p>
            <Link to="/shop" className="text-primary underline">
              Explore the collection
            </Link>
          </CustomerSection>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <CustomerSection key={product.id} title={product.name}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-60 w-full object-contain"
                />
                <p className="my-4 text-sm">{product.variant}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/shop/$slug"
                    params={{ slug: product.id }}
                    className="text-primary underline"
                  >
                    View product
                  </Link>
                  <CustomerButton
                    variant="quiet"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ product, saved: false })}
                  >
                    Remove
                  </CustomerButton>
                </div>
              </CustomerSection>
            ))}
          </div>
        ))}
    </CustomerLayout>
  );
}

export function ReviewsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const orders = useAccountOrders();
  const key = ["customer-reviews", user?.id];
  const reviews = useQuery({
    queryKey: key,
    queryFn: () => api.fetchReviews(user!.id),
    enabled: Boolean(user),
    refetchInterval: 20000,
  });
  const [selection, setSelection] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const eligible = (orders.data ?? [])
    .filter((order) => order.status === "DELIVERED")
    .flatMap((order) =>
      order.items
        .filter(
          (item, index, items) =>
            items.findIndex((other) => other.product_id === item.product_id) === index &&
            !(reviews.data ?? []).some(
              (review) =>
                review.product_id === item.product_id &&
                (review.order_id === order.id || review.order_id === null),
            ),
        )
        .map((item) => ({
          orderId: order.id,
          productId: item.product_id,
          name: item.product_name,
          value: `${order.id}:${item.product_id}`,
        })),
    );
  const submit = useMutation({
    mutationFn: async () => {
      const item = eligible.find((item) => item.value === selection);
      if (!item) throw new Error("Choose a delivered product.");
      await api.submitReview(user!.id, { ...item, rating, title, body });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: key });
      setSelection("");
      setTitle("");
      setBody("");
    },
  });
  return (
    <CustomerLayout heading="Your reviews" eyebrow="Share your ritual">
      <QueryState pending={reviews.isPending} error={reviews.error} retry={reviews.refetch} />
      {reviews.isSuccess && (
        <div className="space-y-6">
          <CustomerSection title="Write a review">
            <QueryState pending={orders.isPending} error={orders.error} retry={orders.refetch} />
            {orders.isSuccess &&
              (eligible.length ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit.mutate();
                  }}
                >
                  <Field label="Delivered product">
                    <select
                      required
                      className={fieldClass}
                      value={selection}
                      onChange={(e) => setSelection(e.target.value)}
                    >
                      <option value="">Choose a product</option>
                      {eligible.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.name} · {item.orderId}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Rating">
                    <select
                      className={fieldClass}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} stars
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Review title">
                    <input
                      required
                      maxLength={200}
                      className={fieldClass}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Your review">
                    <textarea
                      required
                      maxLength={5000}
                      className={fieldClass}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </Field>
                  <CustomerButton disabled={submit.isPending}>
                    {submit.isPending ? "Submitting…" : "Submit review"}
                  </CustomerButton>
                </form>
              ) : (
                <p>No delivered products are awaiting your review.</p>
              ))}
            <Feedback
              error={submit.error}
              success={submit.isSuccess ? "Review submitted for moderation." : undefined}
            />
          </CustomerSection>
          {!reviews.data.length && <p>You haven't submitted any reviews yet.</p>}
          {reviews.data.map((review) => (
            <CustomerSection
              key={review.id}
              title={review.product?.name ?? "Your purchased product"}
            >
              <p className="text-primary">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)} · {review.status}
              </p>
              <h3 className="my-3 font-serif text-xl">{review.title}</h3>
              <p className="whitespace-pre-wrap">{review.body}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
                {review.verified ? " · Verified purchase" : ""}
              </p>
            </CustomerSection>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}

function PersonalForm({ profile }: { profile: Awaited<ReturnType<typeof api.loadProfile>> }) {
  const { refreshProfile } = useAuth();
  const client = useQueryClient();
  const [name, setName] = useState(profile.full_name);
  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const mutation = useMutation({
    mutationFn: () => api.updatePersonalDetails(profile.id, name, mobile),
    onSuccess: async (data) => {
      client.setQueryData(["customer-profile", profile.id], data);
      await refreshProfile();
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Field label="Full name">
        <input
          required
          autoComplete="name"
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Mobile number">
        <input
          required
          type="tel"
          autoComplete="tel"
          className={fieldClass}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </Field>
      <CustomerButton disabled={mutation.isPending}>Save personal details</CustomerButton>
      <Feedback
        error={mutation.error}
        success={mutation.isSuccess ? "Personal details saved." : undefined}
      />
    </form>
  );
}
const emptyAddress: api.AddressInput = {
  type: "Home",
  full_name: "",
  mobile: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pin_code: "",
  country: "India",
  is_default: false,
};
function AddressForm({
  customerId,
  address,
  close,
}: {
  customerId: string;
  address?: api.Address | undefined;
  close: () => void;
}) {
  const client = useQueryClient();
  const [input, setInput] = useState<api.AddressInput>(address ?? emptyAddress);
  const save = useMutation({
    mutationFn: () => api.saveAddress(customerId, input, address?.id),
    onSuccess: close,
    onSettled: () => client.invalidateQueries({ queryKey: ["customer-addresses", customerId] }),
  });
  const fields = [
    ["full_name", "Full name"],
    ["mobile", "Mobile number"],
    ["line1", "Address line 1"],
    ["line2", "Address line 2"],
    ["landmark", "Landmark"],
    ["city", "City"],
    ["state", "State"],
    ["pin_code", "PIN code"],
    ["country", "Country"],
  ] as const;
  return (
    <form
      className="space-y-4 border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              className={fieldClass}
              required={!["line2", "landmark"].includes(key)}
              value={input[key]}
              onChange={(e) => setInput({ ...input, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <Field label="Address type">
        <select
          className={fieldClass}
          value={input.type}
          onChange={(e) => setInput({ ...input, type: e.target.value as api.AddressInput["type"] })}
        >
          {["Home", "Work", "Other"].map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </Field>
      <label className="flex gap-3">
        <input
          type="checkbox"
          checked={input.is_default}
          onChange={(e) => setInput({ ...input, is_default: e.target.checked })}
        />
        Default address
      </label>
      <div className="flex gap-3">
        <CustomerButton disabled={save.isPending}>Save address</CustomerButton>
        <CustomerButton type="button" variant="quiet" disabled={save.isPending} onClick={close}>
          Cancel
        </CustomerButton>
      </div>
      <Feedback error={save.error} />
    </form>
  );
}
function SecurityForms({ customerId, email }: { customerId: string; email: string }) {
  const [nextEmail, setEmail] = useState(email);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const emailChange = useMutation({ mutationFn: () => api.changeEmail(customerId, nextEmail) });
  const password = useMutation({
    mutationFn: async () => {
      if (next !== confirm) throw new Error("New passwords do not match.");
      await api.changePassword(customerId, current, next);
    },
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
    },
  });
  return (
    <>
      <CustomerSection title="Email address">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            emailChange.mutate();
          }}
        >
          <Field label="Email">
            <input
              required
              type="email"
              autoComplete="email"
              className={fieldClass}
              value={nextEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <CustomerButton disabled={emailChange.isPending}>Update email</CustomerButton>
          <Feedback
            error={emailChange.error}
            success={
              emailChange.isSuccess
                ? "Email change requested. Check your inbox for any required confirmation."
                : undefined
            }
          />
        </form>
      </CustomerSection>
      <CustomerSection title="Change password">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            password.mutate();
          }}
        >
          {[
            ["Current password", current, setCurrent],
            ["New password", next, setNext],
            ["Confirm new password", confirm, setConfirm],
          ].map(([label, value, setter], i) => (
            <Field key={i} label={label as string}>
              <input
                required
                type="password"
                minLength={i ? 8 : undefined}
                autoComplete={i ? "new-password" : "current-password"}
                className={fieldClass}
                value={value as string}
                onChange={(e) => (setter as (value: string) => void)(e.target.value)}
              />
            </Field>
          ))}
          <CustomerButton disabled={password.isPending}>Change password</CustomerButton>
          <Feedback
            error={password.error}
            success={password.isSuccess ? "Password updated." : undefined}
          />
        </form>
      </CustomerSection>
    </>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [editing, setEditing] = useState<api.Address | "new" | null>(null);
  const profile = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: () => api.loadProfile(user!.id),
    enabled: Boolean(user),
  });
  const key = ["customer-addresses", user?.id];
  const addresses = useQuery({
    queryKey: key,
    queryFn: () => api.fetchAddresses(user!.id),
    enabled: Boolean(user),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteAddress(user!.id, id),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const makeDefault = useMutation({
    mutationFn: (address: api.Address) =>
      api.saveAddress(user!.id, { ...address, is_default: true }, address.id),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
  return (
    <CustomerLayout heading="Your profile" eyebrow="Account settings">
      <div className="space-y-6">
        <QueryState pending={profile.isPending} error={profile.error} retry={profile.refetch} />
        {profile.data && (
          <CustomerSection title="Personal details">
            <PersonalForm key={profile.data.id} profile={profile.data} />
          </CustomerSection>
        )}
        <CustomerSection title="Saved addresses">
          <QueryState
            pending={addresses.isPending}
            error={addresses.error}
            retry={addresses.refetch}
          />
          {addresses.isSuccess && (
            <>
              <div className="space-y-4">
                {!addresses.data.length && <p>No saved addresses yet.</p>}
                {addresses.data.map((address) => (
                  <div key={address.id} className="border border-border p-4">
                    <h3>
                      {address.full_name} · {address.type}
                      {address.is_default ? " · Default" : ""}
                    </h3>
                    <p className="my-2 text-sm">
                      {[
                        address.line1,
                        address.line2,
                        address.landmark,
                        address.city,
                        address.state,
                        address.pin_code,
                        address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-sm">{address.mobile}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <CustomerButton variant="quiet" onClick={() => setEditing(address)}>
                        Edit
                      </CustomerButton>
                      <CustomerButton
                        variant="quiet"
                        disabled={remove.isPending || makeDefault.isPending}
                        onClick={() => remove.mutate(address.id)}
                      >
                        Remove
                      </CustomerButton>
                      {!address.is_default && (
                        <CustomerButton
                          variant="quiet"
                          disabled={remove.isPending || makeDefault.isPending}
                          onClick={() => makeDefault.mutate(address)}
                        >
                          Make default
                        </CustomerButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Feedback error={remove.error ?? makeDefault.error} />
              <div className="mt-5">
                {editing ? (
                  <AddressForm
                    key={editing === "new" ? "new" : editing.id}
                    customerId={user!.id}
                    address={editing === "new" ? undefined : editing}
                    close={() => setEditing(null)}
                  />
                ) : (
                  <CustomerButton onClick={() => setEditing("new")}>Add address</CustomerButton>
                )}
              </div>
            </>
          )}
        </CustomerSection>
        {profile.data && <SecurityForms customerId={profile.data.id} email={profile.data.email} />}
      </div>
    </CustomerLayout>
  );
}

function TicketThread({ ticket, customerId }: { ticket: api.Ticket; customerId: string }) {
  const client = useQueryClient();
  const [body, setBody] = useState("");
  const reply = useMutation({
    mutationFn: () => api.replyToTicket(customerId, ticket.id, body),
    onSuccess: () => {
      setBody("");
      void client.invalidateQueries({ queryKey: ["customer-tickets", customerId] });
    },
  });
  return (
    <CustomerSection title={ticket.subject}>
      <p className="mb-3 text-sm text-primary">
        {ticket.status} · {ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}
      </p>
      <p className="mb-4 text-xs break-all text-muted-foreground">
        Request {ticket.id}
        {ticket.order_id ? ` · Order ${ticket.order_id}` : ""}
      </p>
      <p className="whitespace-pre-wrap border-l-2 border-primary pl-4">{ticket.message}</p>
      <div className="my-4 space-y-4">
        {[...ticket.messages]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((message) => (
            <div key={message.id} className="border border-border p-4">
              <p className="mb-2 text-xs text-primary">
                {message.author_role === "SUPPORT" ? "Support team" : "You"} ·{" "}
                {new Date(message.created_at).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap">{message.body}</p>
            </div>
          ))}
      </div>
      {!["RESOLVED", "CLOSED"].includes(ticket.status) && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            reply.mutate();
          }}
        >
          <Field label="Reply">
            <textarea
              required
              maxLength={5000}
              className={fieldClass}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <CustomerButton disabled={reply.isPending}>Send reply</CustomerButton>
        </form>
      )}
      <Feedback error={reply.error} success={reply.isSuccess ? "Reply sent." : undefined} />
    </CustomerSection>
  );
}
export function SupportPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const orders = useAccountOrders();
  const key = ["customer-tickets", user?.id];
  const tickets = useQuery({
    queryKey: key,
    queryFn: () => api.fetchTickets(user!.id),
    enabled: Boolean(user),
    refetchInterval: 20000,
  });
  const [category, setCategory] = useState("General");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const send = useMutation({
    mutationFn: () => api.createTicket(user!.id, { category, orderId, subject, message }),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setOrderId("");
      void client.invalidateQueries({ queryKey: key });
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    send.mutate();
  }
  return (
    <CustomerLayout heading="Help & support" eyebrow="We're here to help">
      <div className="space-y-6">
        <CustomerSection title="New support request">
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Category">
              <select
                className={fieldClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {["General", "Order", "Shipping", "Returns", "Product", "Payment"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="Related order (optional)">
              <select
                className={fieldClass}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">No related order</option>
                {orders.data?.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id} · {order.status}
                  </option>
                ))}
              </select>
            </Field>
            <QueryState pending={orders.isPending} error={orders.error} retry={orders.refetch} />
            <Field label="Subject">
              <input
                required
                maxLength={200}
                className={fieldClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field label="Message">
              <textarea
                required
                maxLength={5000}
                rows={5}
                className={fieldClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            <CustomerButton disabled={send.isPending}>
              {send.isPending ? "Sending…" : "Send request"}
            </CustomerButton>
            <Feedback
              error={send.error}
              success={send.isSuccess ? `Request sent. Reference: ${send.data}` : undefined}
            />
          </form>
        </CustomerSection>
        <QueryState pending={tickets.isPending} error={tickets.error} retry={tickets.refetch} />
        {tickets.isSuccess &&
          (!tickets.data.length ? (
            <p>You have no support requests yet.</p>
          ) : (
            tickets.data.map((ticket) => (
              <TicketThread key={ticket.id} ticket={ticket} customerId={user!.id} />
            ))
          ))}
      </div>
    </CustomerLayout>
  );
}
