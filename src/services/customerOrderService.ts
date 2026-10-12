import { getSupabase } from "@/lib/supabase";

export type LiveOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  variant: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: { images: Array<{ url: string; position: number }> } | null;
};

export type LiveOrder = {
  id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  transaction_reference: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  created_at: string;
  items: LiveOrderItem[];
  shipments: Array<{
    courier: string;
    tracking_number: string;
    status: string;
    expected_delivery: string;
    dispatched_at: string | null;
    delivered_at: string | null;
  }>;
  history: Array<{ id: string; status: string; note: string; created_at: string }>;
  address: {
    full_name: string;
    mobile: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pin_code: string;
    country: string;
  } | null;
};

const orderFields = `
  id, customer_id, status, payment_status, payment_method, transaction_reference,
  subtotal, discount_amount, shipping_amount, tax_amount, total, created_at,
  items:order_items(id, product_id, product_name, variant, quantity, unit_price, total_price,
    product:products(images:product_images(url, position))),
  shipments(courier, tracking_number, status, expected_delivery, dispatched_at, delivered_at),
  history:order_status_history(id, status, note, created_at),
  address:customer_addresses(full_name, mobile, line1, line2, landmark, city, state, pin_code, country)
`;

type OrderResponse = Omit<LiveOrder, "shipments"> & {
  shipments: LiveOrder["shipments"] | LiveOrder["shipments"][number] | null;
};

function normalizeOrder(order: OrderResponse): LiveOrder {
  return {
    ...order,
    items: order.items ?? [],
    history: order.history ?? [],
    // A unique order_id makes PostgREST return this relation as a single object.
    shipments: Array.isArray(order.shipments)
      ? order.shipments
      : order.shipments
        ? [order.shipments]
        : [],
  };
}

// The explicit customer filter complements the database's own-read RLS policies.
export async function fetchCustomerOrders(customerId: string): Promise<LiveOrder[]> {
  if (!customerId) throw new Error("Sign in to view your orders.");
  const { data, error } = await getSupabase()
    .from("orders")
    .select(orderFields)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load your orders. Please try again.");
  return ((data ?? []) as unknown as OrderResponse[]).map(normalizeOrder);
}

export async function fetchCustomerOrder(
  customerId: string,
  orderId: string,
): Promise<LiveOrder | null> {
  if (!customerId) throw new Error("Sign in to view your orders.");
  const { data, error } = await getSupabase()
    .from("orders")
    .select(orderFields)
    .eq("customer_id", customerId)
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error("Unable to load this order. Please try again.");
  return data ? normalizeOrder(data as unknown as OrderResponse) : null;
}

export const activeOrderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT FOR DELIVERY",
];

export function filterCustomerOrders(orders: LiveOrder[], filter: string) {
  if (filter === "All") return orders;
  if (filter === "Processing")
    return orders.filter((order) =>
      ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(order.status),
    );
  if (filter === "Shipped")
    return orders.filter((order) => ["SHIPPED", "OUT FOR DELIVERY"].includes(order.status));
  if (filter === "Returns")
    return orders.filter((order) => ["RETURN REQUESTED", "REFUNDED"].includes(order.status));
  return orders.filter((order) => order.status === filter.toUpperCase());
}
