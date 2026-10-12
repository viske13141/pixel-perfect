import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/components/customer/LiveCustomerAccount";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});
