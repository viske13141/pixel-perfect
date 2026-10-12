import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { dashboardForRole } from "@/services/authService";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, isLoading, role, error } = useAuth();
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});

  useEffect(() => {
    if (isAuthenticated && role && !isLoading) {
      navigate({ to: dashboardForRole(role), replace: true });
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  const onChange = (field: keyof LoginFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      delete next.submit;
      return next;
    });
  };

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await signIn({ email: form.email, password: form.password });

    if (!result.ok) {
      setErrors({
        ...(result.field === "email" ? { email: result.message } : {}),
        ...(result.field === "password" ? { password: result.message } : {}),
        ...(result.field === "submit" || !result.field ? { submit: result.message } : {}),
      });
      return;
    }

    navigate({ to: dashboardForRole(result.profile.role), replace: true });
  };

  return (
    <AuthShell
      eyebrow="Return to the ritual"
      title="Welcome back"
      description="Sign in to continue your 1st ROOT ritual."
      sideLabel="Return to the ritual"
      sideTitle="Welcome back to 1st ROOT."
      sideDescription="Your ritual continues here — with the calm, botanicals, and quiet care that keep each hair day grounded."
      form={
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          onSubmitCapture={(event) => event.preventDefault()}
          className="space-y-6"
          noValidate
        >
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground/80"
            >
              Email Address
            </label>
            <Input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className={
                errors.email
                  ? "border-[#d9b77f]/80 focus:border-[#d9b77f] focus:ring-[#d9b77f]/30"
                  : ""
              }
            />
            {errors.email ? <p className="mt-2 text-xs text-[#e8c38d]">{errors.email}</p> : null}
          </div>

          <PasswordInput
            id="login-password"
            label="Password"
            name="password"
            value={form.password}
            onChange={(value) => onChange("password", value)}
            error={errors.password}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="text-xs uppercase tracking-[0.2em] text-[#d8b16a] transition-colors hover:text-[#f3d29a]"
            >
              Forgot password?
            </button>
          </div>

          {errors.submit || error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-[#d9b77f]/30 bg-[#d9b77f]/10 px-4 py-3 text-sm text-[#f0dca8]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f0dca8]" />
              <span>{errors.submit ?? error}</span>
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => void handleSubmit()}
            className="h-12 w-full bg-[#e7d9b7] text-[#101910] transition-transform hover:bg-[#f0e3ca] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-[#d8d0bf]/80">
            New to 1st ROOT?{" "}
            <Link
              to="/register"
              className="font-medium uppercase tracking-[0.18em] text-[#e8c38d] transition-colors hover:text-[#f4d69c]"
            >
              Create an account
            </Link>
          </p>
        </form>
      }
    />
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
