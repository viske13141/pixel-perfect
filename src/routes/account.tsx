import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { AccountOverview } from "@/components/customer/LiveCustomerOrders";
import { RequireRole } from "@/components/auth/RequireRole";

function AccountRoute() {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <RequireRole role="CUSTOMER">
      {pathname === "/account" ? <AccountOverview /> : <Outlet />}
    </RequireRole>
  );
}

export const Route = createFileRoute("/account")({
  component: AccountRoute,
});
