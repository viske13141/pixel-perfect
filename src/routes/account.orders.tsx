import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { OrdersPage } from "@/components/customer/LiveCustomerOrders";

function AccountOrdersRoute() {
  const pathname = useLocation({ select: (location) => location.pathname });
  return pathname === "/account/orders" ? <OrdersPage /> : <Outlet />;
}

export const Route = createFileRoute("/account/orders")({
  component: AccountOrdersRoute,
});
