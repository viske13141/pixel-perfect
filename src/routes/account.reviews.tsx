import { createFileRoute } from "@tanstack/react-router";

import { ReviewsPage } from "@/components/customer/LiveCustomerAccount";

export const Route = createFileRoute("/account/reviews")({
  component: ReviewsPage,
});
