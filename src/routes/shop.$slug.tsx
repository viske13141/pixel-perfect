import { createFileRoute } from "@tanstack/react-router";

import { ProductDetailsPage } from "@/components/shop/ShopUI";

export const Route = createFileRoute("/shop/$slug")({
  component: ProductDetailsPage,
  head: () => ({
    meta: [
      { title: "Product Details | 1st ROOT" },
      { name: "description", content: "Browse the 1st ROOT ritual product details." },
    ],
  }),
});
