import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { AuthContext, type AuthContextValue } from "@/context/auth-context";
import {
  authErrorMessage,
  customerFromProfile,
  loadProfile,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  type AuthResult,
  type Profile,
  type SignInInput,
  type SignUpInput,
} from "@/services/authService";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const operation = useRef(0);
  const pendingAction = useRef(false);
  const invalidatePendingRequests = useCallback(() => {
    ++generation.current;
    ++operation.current;
  }, []);
  const restoreSession = useCallback(async (next: Session | null) => {
    const request = ++generation.current;
    setSession(next);
    setProfile(null);
    setError(null);
    if (!next) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const nextProfile = await loadProfile(next.user.id);
      if (request === generation.current) setProfile(nextProfile);
    } catch (cause) {
      if (request === generation.current) setError(authErrorMessage(cause));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange((event, next) => {
        // Auth callbacks run inside a lock. Defer database calls until it is released.
        ++generation.current;
        if (event === "SIGNED_OUT") ++operation.current;
        setSession(next);
        setProfile(null);
        setError(null);
        setLoading(Boolean(next));
        clearTimeout(timer);
        if (pendingAction.current) return;
        timer = setTimeout(() => {
          if (active) void restoreSession(next);
        }, 0);
      });
      return () => {
        active = false;
        invalidatePendingRequests();
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    } catch (cause) {
      setError(authErrorMessage(cause));
      setLoading(false);
      return undefined;
    }
  }, [restoreSession, invalidatePendingRequests]);

  const run = useCallback(async (action: () => Promise<AuthResult>) => {
    const request = ++operation.current;
    pendingAction.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (request !== operation.current)
        return {
          ok: false as const,
          field: "submit" as const,
          message: "Your session changed. Please sign in again.",
        };
      if (result.ok) {
        ++generation.current;
        setSession(result.session);
        setProfile(result.profile);
        setLoading(false);
      } else {
        ++generation.current;
        setProfile(null);
        setLoading(false);
        setError(result.message);
      }
      return result;
    } finally {
      pendingAction.current = false;
      setBusy(false);
    }
  }, []);
  const signIn = useCallback((input: SignInInput) => run(() => loginCustomer(input)), [run]);
  const signUp = useCallback((input: SignUpInput) => run(() => registerCustomer(input)), [run]);
  const signOut = useCallback(async () => {
    ++operation.current;
    pendingAction.current = true;
    setBusy(true);
    setError(null);
    try {
      await logoutCustomer();
      ++generation.current;
      setSession(null);
      setProfile(null);
      setLoading(false);
    } catch (cause) {
      setError(authErrorMessage(cause));
      throw cause;
    } finally {
      pendingAction.current = false;
      setBusy(false);
    }
  }, []);
  const refreshProfile = useCallback(() => restoreSession(session), [restoreSession, session]);
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      user: profile ? customerFromProfile(profile) : null,
      role: profile?.role ?? null,
      loading: loading || busy,
      error,
      isAuthenticated: Boolean(session && profile),
      isLoading: loading || busy,
      signIn,
      signUp,
      signOut,
      login: signIn,
      register: signUp,
      logout: signOut,
      refreshProfile,
    }),
    [session, profile, loading, busy, error, signIn, signUp, signOut, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
