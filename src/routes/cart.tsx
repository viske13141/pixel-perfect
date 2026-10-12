import { createFileRoute } from "@tanstack/react-router";

import { CartPage } from "@/components/shop/ShopUI";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Your Bag | 1st ROOT" },
      { name: "description", content: "Review your 1st ROOT ritual bag and order summary." },
    ],
  }),
});
