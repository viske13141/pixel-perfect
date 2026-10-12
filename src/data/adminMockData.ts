import {
  mockAddresses,
  mockCustomer,
  mockOrders,
  mockProducts,
  mockReviews,
  type CustomerAddress,
  type CustomerOrder,
  type CustomerProduct,
} from "@/data/customerMockData";

export type AdminOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT FOR DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN REQUESTED"
  | "REFUNDED";

export type AdminOrder = CustomerOrder & {
  customerId: string;
  status: AdminOrderStatus;
  deliveryStatus: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "PARTIALLY REFUNDED" | "REFUNDED";
};

export type InventoryItem = {
  productId: string;
  sku: string;
  physical: number;
  reserved: number;
  threshold: number;
  updated: string;
};

export type AdminCustomer = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  joined: string;
  status: "ACTIVE" | "INACTIVE";
  orderIds: string[];
  wishlistCount: number;
};

export type AdminReview = {
  id: string;
  customerId: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  verified: boolean;
};

export type SupportMessage = { author: "Customer" | "1st ROOT Support"; body: string; date: string };
export type SupportTicket = {
  id: string;
  customerId: string;
  orderId?: string;
  category: string;
  subject: string;
  message: string;
  created: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  status: "OPEN" | "IN PROGRESS" | "WAITING FOR CUSTOMER" | "RESOLVED" | "CLOSED";
  messages: SupportMessage[];
};

export type Shipment = {
  orderId: string;
  courier: string;
  awb: string;
  destination: string;
  expectedDelivery: string;
  status: string;
};

export type AdminReturn = {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  reason: string;
  requested: string;
  status: string;
  refundAmount: number;
  refundStatus: string;
};

export type AdminPayment = {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: AdminOrder["paymentStatus"];
  date: string;
  refundStatus: string;
};

export const mockAdmin = { name: "Mira S.", email: "admin@1stroot.demo" };

export const adminCustomerRecords: AdminCustomer[] = [
  {
    id: "customer-ananya",
    ...mockCustomer,
    joined: "12 May 2026",
    status: "ACTIVE",
    orderIds: ["1R1028", "1R1015", "1R1009", "1R0998", "1R0982"],
    wishlistCount: 2,
  },
  {
    id: "customer-kavya",
    fullName: "Kavya Menon",
    email: "kavya.menon@example.com",
    mobile: "+91 98XXX 42XXX",
    joined: "03 Jun 2026",
    status: "ACTIVE",
    orderIds: ["1R1048", "1R1045"],
    wishlistCount: 1,
  },
  {
    id: "customer-isha",
    fullName: "Isha Rao",
    email: "isha.rao@example.com",
    mobile: "+91 97XXX 31XXX",
    joined: "18 Aug 2026",
    status: "ACTIVE",
    orderIds: ["1R1046"],
    wishlistCount: 3,
  },
  {
    id: "customer-devika",
    fullName: "Devika Shah",
    email: "devika.shah@example.com",
    mobile: "+91 99XXX 18XXX",
    joined: "29 Sep 2026",
    status: "INACTIVE",
    orderIds: [],
    wishlistCount: 0,
  },
];

const customerOrderRecords: AdminOrder[] = mockOrders.map((order) => ({
  ...order,
  customerId: "customer-ananya",
  status: order.status,
  deliveryStatus:
    order.status === "SHIPPED"
      ? "IN TRANSIT"
      : order.status === "DELIVERED"
        ? "DELIVERED"
        : order.status === "CANCELLED"
          ? "CANCELLED"
          : "PROCESSING",
}));

export const mockAdminOrders: AdminOrder[] = [
  {
    ...mockOrders[0]!,
    id: "1R1048",
    customerId: "customer-kavya",
    status: "SHIPPED",
    deliveryStatus: "IN TRANSIT",
    date: "06 Oct 2026",
    trackingNumber: "AWB10480021",
    courier: "Demo Courier",
    expectedDelivery: "10 Oct 2026",
    transactionReference: "DEMO-1R1048",
  },
  {
    ...mockOrders[0]!,
    id: "1R1046",
    customerId: "customer-isha",
    status: "PROCESSING",
    deliveryStatus: "PROCESSING",
    date: "06 Oct 2026",
    transactionReference: "DEMO-1R1046",
  },
  {
    ...mockOrders[1]!,
    id: "1R1045",
    customerId: "customer-kavya",
    status: "DELIVERED",
    deliveryStatus: "DELIVERED",
    date: "05 Oct 2026",
    deliveredDate: "09 Oct 2026",
    transactionReference: "DEMO-1R1045",
  },
  ...customerOrderRecords,
];

export const mockInventory: InventoryItem[] = [
  { productId: mockProducts[0]!.id, sku: "ROOT-OIL-100", physical: 100, reserved: 5, threshold: 20, updated: "06 Oct 2026" },
  { productId: mockProducts[1]!.id, sku: "ROOT-COMBO-01", physical: 20, reserved: 5, threshold: 15, updated: "06 Oct 2026" },
  { productId: mockProducts[2]!.id, sku: "ROOT-RITUAL-03", physical: 0, reserved: 0, threshold: 10, updated: "05 Oct 2026" },
];

export const mockStockHistory = [
  { date: "06 Oct 2026", productId: mockProducts[0]!.id, sku: "ROOT-OIL-100", change: "+50", before: 50, after: 100, reason: "Stock Received", reference: "GRN-1048" },
  { date: "05 Oct 2026", productId: mockProducts[0]!.id, sku: "ROOT-OIL-100", change: "-1", before: 51, after: 50, reason: "Order allocation", reference: "Order #1R1046" },
  { date: "04 Oct 2026", productId: mockProducts[1]!.id, sku: "ROOT-COMBO-01", change: "-2", before: 22, after: 20, reason: "Order allocation", reference: "Order #1R1045" },
];

export const mockAdminReviews: AdminReview[] = [
  ...mockReviews.map((review, index) => ({
    ...review,
    id: `REV-${index + 1}`,
    customerId: "customer-ananya",
    status: "PUBLISHED" as const,
    verified: true,
  })),
  {
    id: "REV-1048",
    customerId: "customer-kavya",
    productId: mockProducts[0]!.id,
    orderId: "1R1045",
    rating: 4,
    title: "A thoughtful addition",
    body: "Easy to use and fits naturally into my weekly routine.",
    date: "06 Oct 2026",
    status: "PENDING",
    verified: true,
  },
  {
    id: "REV-1049",
    customerId: "customer-isha",
    productId: mockProducts[1]!.id,
    orderId: "1R1046",
    rating: 3,
    title: "Still trying it",
    body: "I am still getting to know this combination.",
    date: "05 Oct 2026",
    status: "PENDING",
    verified: true,
  },
  {
    id: "REV-0991",
    customerId: "customer-ananya",
    productId: mockProducts[1]!.id,
    orderId: "1R1015",
    rating: 5,
    title: "A lovely ritual",
    body: "The oil and shampoo make a calm, considered routine.",
    date: "24 Sep 2026",
    status: "REJECTED",
    verified: true,
  },
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "TKT-2048",
    customerId: "customer-ananya",
    orderId: "1R1028",
    category: "Track My Order",
    subject: "Could you check my delivery update?",
    message: "The tracking page has not changed since yesterday. Could you please check?",
    created: "06 Oct 2026",
    priority: "NORMAL",
    status: "OPEN",
    messages: [
      { author: "Customer", body: "The tracking page has not changed since yesterday. Could you please check?", date: "06 Oct · 10:20" },
    ],
  },
  {
    id: "TKT-2045",
    customerId: "customer-kavya",
    orderId: "1R1045",
    category: "Product Question",
    subject: "Question about the oil applicator",
    message: "Could you share the general directions provided with the product?",
    created: "05 Oct 2026",
    priority: "LOW",
    status: "IN PROGRESS",
    messages: [
      { author: "Customer", body: "Could you share the general directions provided with the product?", date: "05 Oct · 14:15" },
      { author: "1st ROOT Support", body: "Thank you for writing in. We are checking the product guidance and will follow up here.", date: "05 Oct · 15:02" },
    ],
  },
  {
    id: "TKT-2032",
    customerId: "customer-isha",
    category: "Payment Issue",
    subject: "Payment confirmation",
    message: "I would like help confirming my demo order payment.",
    created: "02 Oct 2026",
    priority: "HIGH",
    status: "WAITING FOR CUSTOMER",
    messages: [
      { author: "Customer", body: "I would like help confirming my demo order payment.", date: "02 Oct · 09:30" },
      { author: "1st ROOT Support", body: "Please share the reference shown on your order details page.", date: "02 Oct · 10:10" },
    ],
  },
  {
    id: "TKT-2014",
    customerId: "customer-ananya",
    orderId: "1R1015",
    category: "Order Issue",
    subject: "Resolved delivery question",
    message: "I had a question about a previous order.",
    created: "27 Sep 2026",
    priority: "NORMAL",
    status: "RESOLVED",
    messages: [{ author: "1st ROOT Support", body: "This sample ticket is marked resolved.", date: "28 Sep · 11:00" }],
  },
];

export const mockShipments: Shipment[] = mockAdminOrders.map((order) => ({
  orderId: order.id,
  courier: order.courier ?? "",
  awb: order.trackingNumber ?? "",
  destination: "Hyderabad, Telangana",
  expectedDelivery: order.expectedDelivery ?? "To be confirmed",
  status:
    order.status === "SHIPPED"
      ? "IN TRANSIT"
      : order.status === "DELIVERED"
        ? "DELIVERED"
        : order.status === "CANCELLED"
          ? "FAILED DELIVERY"
          : "READY TO SHIP",
}));

export const mockReturns: AdminReturn[] = [
  {
    id: "RET-0102",
    orderId: "1R0982",
    customerId: "customer-ananya",
    productId: mockProducts[2]!.id,
    reason: "Changed my mind",
    requested: "20 Jul 2026",
    status: "REVIEWING",
    refundAmount: 749,
    refundStatus: "PENDING",
  },
  {
    id: "RET-0098",
    orderId: "1R0998",
    customerId: "customer-ananya",
    productId: mockProducts[0]!.id,
    reason: "Package arrived damaged (demo)",
    requested: "09 Aug 2026",
    status: "REFUNDED",
    refundAmount: 599,
    refundStatus: "REFUNDED",
  },
];

export const mockPayments: AdminPayment[] = mockAdminOrders.map((order) => ({
  id: order.transactionReference,
  orderId: order.id,
  amount: order.total,
  method: order.paymentMethod,
  status: order.paymentStatus,
  date: order.date,
  refundStatus: order.paymentStatus === "REFUNDED" ? "REFUNDED" : "—",
}));

export const mockDiscounts = [
  { code: "ROOT10", description: "A little welcome to the ritual", discount: "10%", minimum: 499, usage: "18 / 100", start: "01 Oct 2026", end: "31 Oct 2026", status: "ACTIVE" },
  { code: "BOTANICAL50", description: "Seasonal botanical offer", discount: "₹50", minimum: 699, usage: "42 / 50", start: "01 Sep 2026", end: "30 Sep 2026", status: "EXPIRED" },
];

export const mockContentSections = [
  { id: "announcement", name: "Homepage Announcement", summary: "A slower, more thoughtful hair-care ritual.", body: "Discover a botanical ritual, prepared with patience." },
  { id: "story", name: "Our Story", summary: "Rooted in nature. Designed for modern rituals.", body: "1st ROOT begins where botanical tradition has always begun — with patience." },
  { id: "ingredients", name: "Ingredients", summary: "Botanicals, one ingredient at a time.", body: "Explore the botanicals that shape the 1st ROOT ritual." },
  { id: "ritual", name: "Ritual", summary: "Botanicals. Patience. Time.", body: "Make room for a small, considered moment in your routine." },
  { id: "journal", name: "Journal", summary: "Notes from the world of botanical care.", body: "Journal content preview for the 1st ROOT storefront." },
  { id: "faq", name: "FAQ", summary: "Helpful notes for customers.", body: "Answers to common product and order questions." },
  { id: "products", name: "Product Content", summary: "Descriptions and product details.", body: "Product content is managed independently from the cinematic frame sequence." },
];

export const mockSalesSeries = {
  "7 Days": [8200, 12400, 9800, 15800, 13200, 18450, 15100],
  "30 Days": [8800, 10400, 9100, 12100, 14800, 13800, 18450],
  "90 Days": [7400, 9800, 11200, 10500, 13200, 15800, 18450],
};

export function getAdminCustomer(customerId: string) {
  return adminCustomerRecords.find((customer) => customer.id === customerId) ?? adminCustomerRecords[0]!;
}

export function getAdminOrder(orderId: string) {
  return mockAdminOrders.find((order) => order.id === orderId) ?? mockAdminOrders[0]!;
}

export function getAdminProduct(productId: string): CustomerProduct {
  return mockProducts.find((product) => product.id === productId) ?? mockProducts[0]!;
}

export function getCustomerAddresses(_customerId: string): CustomerAddress[] {
  return mockAddresses;
}
