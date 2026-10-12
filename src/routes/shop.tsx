import { createFileRoute } from "@tanstack/react-router";

import { ShopPage } from "@/components/shop/ShopUI";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop | 1st ROOT" },
      { name: "description", content: "Shop the 1st ROOT botanical hair-care collection." },
    ],
  }),
});
