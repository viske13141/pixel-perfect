import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  AuthResult,
  Customer,
  Profile,
  Role,
  SignInInput,
  SignUpInput,
} from "@/services/authService";

export type AuthContextValue = {
  user: Customer | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: SignInInput) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  login: (input: SignInInput) => Promise<AuthResult>;
  register: (input: SignUpInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};
const unavailable = async (): Promise<AuthResult> => ({
  ok: false,
  field: "submit",
  message: "Authentication is unavailable right now.",
});
export const fallbackAuthContext: AuthContextValue = {
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: unavailable,
  signUp: unavailable,
  signOut: async () => {},
  login: unavailable,
  register: unavailable,
  logout: async () => {},
  refreshProfile: async () => {},
};
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
