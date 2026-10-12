import { getSupabase } from "@/lib/supabase";
import { loadProfile, type Profile } from "@/services/authService";
import { fetchCustomerOrder } from "@/services/customerOrderService";

export type SavedProduct = {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
};
const wishlistKey = "firstroot_wishlist";

async function account(customerId: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user || data.user.id !== customerId)
    throw new Error("Please sign in again to continue.");
  return data.user;
}

function readWishlist(value: unknown): SavedProduct[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SavedProduct =>
    Boolean(
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.variant === "string" &&
      typeof item.price === "number" &&
      typeof item.image === "string",
    ),
  );
}

// Store customer preferences in their authenticated account, not browser storage.
// Snapshots match the products the customer saved from the storefront.
export async function fetchWishlist(customerId: string) {
  const user = await account(customerId);
  return readWishlist(user.user_metadata[wishlistKey]);
}

export async function setWishlistProduct(
  customerId: string,
  product: SavedProduct,
  saved: boolean,
) {
  const user = await account(customerId);
  const items = readWishlist(user.user_metadata[wishlistKey]).filter(
    (item) => item.id !== product.id,
  );
  if (saved)
    items.push({
      id: product.id,
      name: product.name,
      variant: product.variant,
      price: product.price,
      image: product.image,
    });
  const { error } = await getSupabase().auth.updateUser({ data: { [wishlistKey]: items } });
  if (error) throw new Error("Unable to save your wishlist. Please try again.");
  return items;
}

export type Address = {
  id: string;
  customer_id: string;
  type: "Home" | "Work" | "Other";
  full_name: string;
  mobile: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: boolean;
};
export type AddressInput = Omit<Address, "id" | "customer_id">;

export async function fetchAddresses(customerId: string): Promise<Address[]> {
  const { data, error } = await getSupabase()
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load your addresses.");
  return data ?? [];
}

export async function saveAddress(
  customerId: string,
  input: AddressInput,
  id?: string,
): Promise<Address> {
  if (
    !input.full_name.trim() ||
    !input.line1.trim() ||
    !input.city.trim() ||
    !input.state.trim() ||
    !input.country.trim() ||
    !/^\d{6}$/.test(input.pin_code)
  )
    throw new Error("Complete the address and enter a six-digit PIN code.");
  const payload = {
    customer_id: customerId,
    type: input.type,
    full_name: input.full_name.trim(),
    mobile: input.mobile.trim(),
    line1: input.line1.trim(),
    line2: input.line2.trim(),
    landmark: input.landmark.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    pin_code: input.pin_code.trim(),
    country: input.country.trim(),
    is_default: input.is_default,
  };
  const query = id
    ? getSupabase()
        .from("customer_addresses")
        .update(payload)
        .eq("customer_id", customerId)
        .eq("id", id)
    : getSupabase().from("customer_addresses").insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw new Error("Unable to save this address. Please try again.");
  if (input.is_default) {
    const { error: resetError } = await getSupabase()
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .neq("id", data.id);
    if (resetError)
      throw new Error("Address saved, but the default could not be updated. Please try again.");
  }
  return data as Address;
}

export async function deleteAddress(customerId: string, id: string) {
  const { error } = await getSupabase()
    .from("customer_addresses")
    .delete()
    .eq("customer_id", customerId)
    .eq("id", id);
  if (error) throw new Error("Unable to remove this address.");
}

export async function updatePersonalDetails(
  customerId: string,
  fullName: string,
  mobile: string,
): Promise<Profile> {
  if (!fullName.trim() || !/^[+\d\s()-]{7,20}$/.test(mobile.trim()))
    throw new Error("Enter your name and a valid mobile number.");
  const { data, error } = await getSupabase()
    .from("profiles")
    .update({ full_name: fullName.trim(), mobile: mobile.trim() })
    .eq("id", customerId)
    .select()
    .single();
  if (error) throw new Error("Unable to save your profile.");
  return data as Profile;
}

export { loadProfile };

export async function changeEmail(customerId: string, email: string) {
  await account(customerId);
  const { error } = await getSupabase().auth.updateUser({ email: email.trim() });
  if (error) throw new Error(error.message);
}

export async function changePassword(customerId: string, current: string, next: string) {
  if (next.length < 8) throw new Error("Use at least eight characters for your new password.");
  const user = await account(customerId);
  if (!user.email) throw new Error("Email sign-in is required to change your password here.");
  const { error: verification } = await getSupabase().auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verification) throw new Error("Your current password is incorrect.");
  const { error } = await getSupabase().auth.updateUser({ password: next });
  if (error) throw new Error(error.message);
}

export type CustomerReview = {
  id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  title: string;
  body: string;
  status: string;
  verified: boolean;
  created_at: string;
  product: { name: string; images: Array<{ url: string; position: number }> } | null;
};

export async function fetchReviews(customerId: string): Promise<CustomerReview[]> {
  const { data, error } = await getSupabase()
    .from("reviews")
    .select("*, product:products(name,images:product_images(url,position))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load your reviews.");
  return (data ?? []) as unknown as CustomerReview[];
}

export async function submitReview(
  customerId: string,
  input: { orderId: string; productId: string; rating: number; title: string; body: string },
) {
  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5 ||
    !input.title.trim() ||
    !input.body.trim()
  )
    throw new Error("Choose a rating and complete your review.");
  const order = await fetchCustomerOrder(customerId, input.orderId);
  if (
    order?.status !== "DELIVERED" ||
    !order.items.some((item) => item.product_id === input.productId)
  )
    throw new Error("You can review products from your delivered orders.");
  const { error } = await getSupabase()
    .from("reviews")
    .insert({
      customer_id: customerId,
      product_id: input.productId,
      order_id: input.orderId,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      status: "PENDING",
      verified: false,
    });
  if (error?.code === "23505")
    throw new Error("You have already reviewed this product for this order.");
  if (error) throw new Error("Unable to submit your review. Please try again.");
}

export type Ticket = {
  id: string;
  order_id: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  messages: Array<{ id: string; author_role: string; body: string; created_at: string }>;
};

export async function fetchTickets(customerId: string): Promise<Ticket[]> {
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .select("*,messages:ticket_messages(id,author_role,body,created_at)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load your support requests.");
  return (data ?? []) as unknown as Ticket[];
}

export async function createTicket(
  customerId: string,
  input: { category: string; orderId: string; subject: string; message: string },
) {
  if (!input.category || !input.subject.trim() || !input.message.trim())
    throw new Error("Complete the subject and message.");
  if (input.orderId && !(await fetchCustomerOrder(customerId, input.orderId)))
    throw new Error("Choose an order from your account.");
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .insert({
      customer_id: customerId,
      order_id: input.orderId || null,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "OPEN",
      priority: "NORMAL",
    })
    .select("id")
    .single();
  if (error) throw new Error("Unable to send your support request. Please try again.");
  return data.id as string;
}

export async function replyToTicket(customerId: string, ticketId: string, body: string) {
  if (!body.trim()) throw new Error("Enter a message.");
  const { data: ticket, error: lookupError } = await getSupabase()
    .from("support_tickets")
    .select("id,status")
    .eq("customer_id", customerId)
    .eq("id", ticketId)
    .maybeSingle();
  if (lookupError || !ticket) throw new Error("Support request not found.");
  if (["RESOLVED", "CLOSED"].includes(ticket.status))
    throw new Error("This request is closed. Please open a new request.");
  const { error } = await getSupabase()
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, author_role: "CUSTOMER", body: body.trim() });
  if (error) throw new Error("Unable to send your reply.");
}
