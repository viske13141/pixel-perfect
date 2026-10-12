import { createFileRoute } from "@tanstack/react-router";

import { WishlistPage } from "@/components/customer/LiveCustomerAccount";

export const Route = createFileRoute("/account/wishlist")({
  component: WishlistPage,
});
