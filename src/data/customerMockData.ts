import { BRAND_IMAGES } from "@/lib/brand-images";

export type OrderStatus = "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ProductReview = {
  id: string;
  name: string;
  title: string;
  text: string;
  rating: number;
  date: string;
  verified: boolean;
  product: string;
};

export type CustomerProduct = {
  id: string;
  slug: string;
  name: string;
  size: string;
  variant: string;
  subtitle: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stockStatus: "In stock" | "Low stock" | "Out of stock";
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  sku: string;
  features: string[];
  ingredients: string[];
  howToUse: string[];
  specifications: Array<[string, string]>;
  reviews: ProductReview[];
};

export type CustomerOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  expectedDelivery?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  courier?: string;
  paymentStatus: "PAID" | "REFUNDED" | "PENDING";
  paymentMethod: string;
  transactionReference: string;
  shippingAddressId: string;
  items: Array<CustomerProduct & { quantity: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

export type CustomerAddress = {
  id: string;
  type: "Home" | "Work" | "Other";
  fullName: string;
  mobile: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
};

export const mockCustomer = {
  fullName: "Ananya R.",
  email: "ananya@example.com",
  mobile: "+91 XXXXX XXXXX",
};

export const mockProducts: CustomerProduct[] = [
  {
    id: "oil-comb-applicator",
    slug: "oil-comb-applicator",
    name: "1st ROOT Oil Comb Applicator",
    size: "100 ml",
    variant: "Herbal Hair Oil · 100 ml",
    subtitle: "Herbal Hair Oil · 100 ml",
    category: "Hair Oil",
    shortDescription:
      "A botanical herbal hair oil designed with an easy-to-use comb applicator for controlled scalp application and massage.",
    description:
      "A botanical herbal hair oil designed with an easy-to-use comb applicator for controlled scalp application and massage. The ritual is simple: apply, massage, and let the botanicals settle into a comforting daily practice.",
    price: 599,
    originalPrice: 699,
    discount: 14,
    stockStatus: "In stock",
    image: BRAND_IMAGES.oil,
    images: [BRAND_IMAGES.oil, BRAND_IMAGES.oil, BRAND_IMAGES.ritual, BRAND_IMAGES.combo],
    rating: 4.8,
    reviewCount: 124,
    sku: "1R-HO-100-COMB",
    features: [
      "Botanical-first formula",
      "Easy scalp application",
      "Comb applicator",
      "100 ml bottle",
      "Designed for scalp massage",
      "Premium everyday ritual",
    ],
    ingredients: [
      "Amla",
      "Fenugreek",
      "Vetiver",
      "Jatamansi",
      "Hibiscus",
      "Henna",
      "Coconut Oil",
      "Sesame Oil",
    ],
    howToUse: [
      "Apply a few drops directly to the scalp.",
      "Massage with the comb applicator to distribute evenly.",
      "Leave it in for a calming ritual before your wash routine.",
      "Wash off as desired with your usual hair care routine.",
    ],
    specifications: [
      ["Brand", "1st ROOT"],
      ["Product Type", "Herbal Hair Oil"],
      ["Net Quantity", "100 ml"],
      ["Applicator", "Comb Applicator"],
      ["Package Contents", "1 Hair Oil Bottle"],
    ],
    reviews: [
      {
        id: "review-oil-1",
        name: "Ananya R.",
        title: "Easy to make part of my routine.",
        text: "The comb applicator makes it simple to distribute the oil across my scalp.",
        rating: 5,
        date: "10 Aug 2026",
        verified: true,
        product: "1st ROOT Oil Comb Applicator",
      },
      {
        id: "review-oil-2",
        name: "Rhea M.",
        title: "Feels luxurious without being heavy.",
        text: "I enjoy the ritual of applying it and the bottle is easy to use on my scalp.",
        rating: 5,
        date: "03 Sep 2026",
        verified: true,
        product: "1st ROOT Oil Comb Applicator",
      },
      {
        id: "review-oil-3",
        name: "Sonal P.",
        title: "Beautiful for weekly scalp care.",
        text: "The formula feels botanical and grounding, and the applicator prevents messy application.",
        rating: 4,
        date: "15 Sep 2026",
        verified: true,
        product: "1st ROOT Oil Comb Applicator",
      },
    ],
  },
  {
    id: "oil-shampoo-combo",
    slug: "oil-shampoo-combo",
    name: "Oil + Shampoo Combo",
    size: "100 ml + 200 ml",
    variant: "Oil 100 ml + Shampoo 200 ml",
    subtitle: "Oil 100 ml + Shampoo 200 ml",
    category: "Combos",
    shortDescription:
      "A complementary pairing that brings together a botanical oil ritual and a gentle cleansing step.",
    description:
      "A complementary pairing that brings together a botanical oil ritual and a gentle cleansing step. It makes everyday scalp care feel intentional without overcomplicating the routine.",
    price: 699,
    originalPrice: 749,
    discount: 7,
    stockStatus: "Low stock",
    image: BRAND_IMAGES.combo,
    images: [BRAND_IMAGES.combo, BRAND_IMAGES.oil, BRAND_IMAGES.ritual, BRAND_IMAGES.combo],
    rating: 4.7,
    reviewCount: 89,
    sku: "1R-CB-OIL-SHAMPOO",
    features: [
      "Botanical ritual pairing",
      "Cleanses without stripping",
      "Balances scalp & hair care",
      "Two-step routine",
      "Daily-use friendly",
      "Premium ritual simplicity",
    ],
    ingredients: [
      "Amla",
      "Fenugreek",
      "Vetiver",
      "Jatamansi",
      "Hibiscus",
      "Henna",
      "Coconut Oil",
      "Sesame Oil",
    ],
    howToUse: [
      "Apply the oil to the scalp and massage gently.",
      "Follow with shampoo to refresh and cleanse the scalp.",
      "Use this pairing as a calming reset for your hair ritual.",
      "Repeat as needed for a fuller weekly routine.",
    ],
    specifications: [
      ["Brand", "1st ROOT"],
      ["Product Type", "Hair Care Combo"],
      ["Net Quantity", "300 ml"],
      ["Applicator", "Bottle + Wash Routine"],
      ["Package Contents", "Hair Oil + Shampoo"],
    ],
    reviews: [
      {
        id: "review-combo-1",
        name: "Meher K.",
        title: "A beautiful daily ritual pairing.",
        text: "The combo keeps my hair routine simple and makes my scalp feel cared for without a heavy product feel.",
        rating: 5,
        date: "14 Sep 2026",
        verified: true,
        product: "Oil + Shampoo Combo",
      },
      {
        id: "review-combo-2",
        name: "Pooja S.",
        title: "Good daily balance.",
        text: "I like that the oil and shampoo complement each other and still feel premium.",
        rating: 4,
        date: "05 Oct 2026",
        verified: true,
        product: "Oil + Shampoo Combo",
      },
    ],
  },
  {
    id: "complete-ritual",
    slug: "complete-ritual",
    name: "Oil + Shampoo + Conditioner",
    size: "Complete three-step ritual",
    variant: "Oil 100 ml · Shampoo 200 ml · Conditioner 200 ml",
    subtitle: "Oil 100 ml · Shampoo 200 ml · Conditioner 200 ml",
    category: "Combos",
    shortDescription:
      "A complete three-step ritual built around the sensory rhythm of oil, cleanse, and condition.",
    description:
      "A complete three-step ritual built around the sensory rhythm of oil, cleanse, and condition. It is created to make a simple, luxurious, daily hair-care practice feel beautifully complete.",
    price: 799,
    stockStatus: "In stock",
    image: BRAND_IMAGES.ritual,
    images: [BRAND_IMAGES.ritual, BRAND_IMAGES.combo, BRAND_IMAGES.oil, BRAND_IMAGES.ritual],
    rating: 4.9,
    reviewCount: 136,
    sku: "1R-RITUAL-3STEP",
    features: [
      "Complete 3-step ritual",
      "Oil, shampoo & conditioner",
      "Botanical hair-care flow",
      "Softens, nourishes, smooths",
      "Luxury everyday care",
      "Thoughtful ritual set",
    ],
    ingredients: [
      "Amla",
      "Fenugreek",
      "Vetiver",
      "Jatamansi",
      "Hibiscus",
      "Henna",
      "Coconut Oil",
      "Sesame Oil",
    ],
    howToUse: [
      "Start with the oil and massage into the scalp.",
      "Use shampoo to cleanse and reset the hair and scalp.",
      "Finish with conditioner to soften and smooth.",
      "Keep this as a complete ritual for a richer weekly care routine.",
    ],
    specifications: [
      ["Brand", "1st ROOT"],
      ["Product Type", "Complete Ritual Set"],
      ["Net Quantity", "500 ml"],
      ["Applicator", "Combo ritual kit"],
      ["Package Contents", "Hair Oil + Shampoo + Conditioner"],
    ],
    reviews: [
      {
        id: "review-ritual-1",
        name: "Ira N.",
        title: "A premium ritual set that feels complete.",
        text: "Everything works together beautifully and makes the routine feel considered and balanced.",
        rating: 5,
        date: "28 Sep 2026",
        verified: true,
        product: "Oil + Shampoo + Conditioner",
      },
      {
        id: "review-ritual-2",
        name: "Aditi B.",
        title: "Thoughtful and easy to follow.",
        text: "I love the overall experience — it feels luxury but still practical for a simple weekly routine.",
        rating: 5,
        date: "19 Oct 2026",
        verified: true,
        product: "Oil + Shampoo + Conditioner",
      },
    ],
  },
];

export const mockOrders: CustomerOrder[] = [
  {
    id: "1R1028",
    date: "06 Oct 2026",
    status: "SHIPPED",
    expectedDelivery: "10 October",
    trackingNumber: "AWB12345678",
    courier: "Demo Courier",
    paymentStatus: "PAID",
    paymentMethod: "UPI · Demo",
    transactionReference: "DEMO-1R1028",
    shippingAddressId: "home-address",
    items: [{ ...mockProducts[0]!, quantity: 1 }],
    subtotal: 599,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 599,
  },
  {
    id: "1R1015",
    date: "22 Sep 2026",
    status: "DELIVERED",
    deliveredDate: "27 Sep 2026",
    paymentStatus: "PAID",
    paymentMethod: "Card · Demo",
    transactionReference: "DEMO-1R1015",
    shippingAddressId: "home-address",
    items: [{ ...mockProducts[1]!, quantity: 1 }],
    subtotal: 699,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 699,
  },
  {
    id: "1R1009",
    date: "14 Sep 2026",
    status: "PROCESSING",
    expectedDelivery: "Delivery date to be confirmed",
    paymentStatus: "PAID",
    paymentMethod: "UPI · Demo",
    transactionReference: "DEMO-1R1009",
    shippingAddressId: "home-address",
    items: [{ ...mockProducts[2]!, quantity: 1 }],
    subtotal: 799,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 799,
  },
  {
    id: "1R0998",
    date: "02 Aug 2026",
    status: "DELIVERED",
    deliveredDate: "07 Aug 2026",
    paymentStatus: "PAID",
    paymentMethod: "Card · Demo",
    transactionReference: "DEMO-1R0998",
    shippingAddressId: "home-address",
    items: [{ ...mockProducts[0]!, quantity: 1 }],
    subtotal: 599,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 599,
  },
  {
    id: "1R0982",
    date: "18 Jul 2026",
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "UPI · Demo",
    transactionReference: "DEMO-1R0982",
    shippingAddressId: "home-address",
    items: [{ ...mockProducts[2]!, quantity: 1 }],
    subtotal: 799,
    discount: 50,
    shipping: 0,
    tax: 0,
    total: 749,
  },
];

export const mockWishlist = [mockProducts[1]!, mockProducts[0]!];

export const mockReviews = [
  {
    productId: "oil-comb-applicator",
    orderId: "1R0998",
    date: "10 Aug 2026",
    rating: 5,
    title: "Easy to make part of my routine.",
    body: "The comb applicator makes it simple to distribute the oil across my scalp.",
  },
];

export const mockAddresses: CustomerAddress[] = [
  {
    id: "home-address",
    type: "Home",
    fullName: "Ananya R.",
    mobile: "+91 XXXXX XXXXX",
    line1: "Demo Address",
    line2: "Flat 4B, Greenview Residency",
    landmark: "Near Botanical Garden",
    city: "Hyderabad",
    state: "Telangana",
    pinCode: "500081",
    country: "India",
    isDefault: true,
  },
  {
    id: "work-address",
    type: "Work",
    fullName: "Ananya R.",
    mobile: "+91 XXXXX XXXXX",
    line1: "Demo Office, Financial District",
    line2: "Tower 2, Floor 4",
    landmark: "Near Knowledge City",
    city: "Hyderabad",
    state: "Telangana",
    pinCode: "500032",
    country: "India",
    isDefault: false,
  },
];
