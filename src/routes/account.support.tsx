import { createFileRoute } from "@tanstack/react-router";

import { SupportPage } from "@/components/customer/LiveCustomerAccount";

export const Route = createFileRoute("/account/support")({
  component: SupportPage,
});
