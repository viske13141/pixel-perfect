import { useContext } from "react";

import { AuthContext, fallbackAuthContext } from "@/context/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);

  return context ?? fallbackAuthContext;
}
