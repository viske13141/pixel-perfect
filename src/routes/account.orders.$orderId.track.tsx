import { createFileRoute } from "@tanstack/react-router";

import { TrackOrderPage } from "@/components/customer/LiveCustomerOrders";

function TrackOrderRoute() {
  const { orderId } = Route.useParams();
  return <TrackOrderPage orderId={orderId} />;
}

export const Route = createFileRoute("/account/orders/$orderId/track")({
  component: TrackOrderRoute,
});
