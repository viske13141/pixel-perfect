import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { OrderDetailsPage } from "@/components/customer/LiveCustomerOrders";

function OrderDetailsRoute() {
  const { orderId } = Route.useParams();
  const pathname = useLocation({ select: (location) => location.pathname });
  if (pathname.endsWith("/track")) return <Outlet />;
  return <OrderDetailsPage orderId={orderId} />;
}

export const Route = createFileRoute("/account/orders/$orderId")({
  component: OrderDetailsRoute,
});
