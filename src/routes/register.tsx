import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { dashboardForRole } from "@/services/authService";

type RegisterFormState = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
};

const initialState: RegisterFormState = {
  fullName: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isAuthenticated, isLoading, role, error } = useAuth();
  const [form, setForm] = useState<RegisterFormState>(initialState);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    submit?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated && role && !isLoading) {
      navigate({ to: dashboardForRole(role), replace: true });
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  const onChange = (field: keyof RegisterFormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field === "agreedToTerms" ? "terms" : field];
      delete next.submit;
      return next;
    });
  };

  const validate = () => {
    const nextErrors: {
      fullName?: string;
      email?: string;
      mobile?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!/^\+?[0-9\s()-]{10,15}$/.test(form.mobile) || /[A-Za-z]/.test(form.mobile)) {
      nextErrors.mobile = "Please enter a valid mobile number.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters long.";
    } else if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      nextErrors.password = "Use uppercase, lowercase, and a number in your password.";
    }

    if (!form.confirmPassword || form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!form.agreedToTerms) {
      nextErrors.terms = "Please accept the Terms of Service and Privacy Policy.";
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

    const result = await signUp({
      accountType: "CUSTOMER",
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      password: form.password,
      confirmPassword: form.confirmPassword,
      agreedToTerms: form.agreedToTerms,
    });

    if (!result.ok) {
      setErrors({
        ...(result.field === "fullName" ? { fullName: result.message } : {}),
        ...(result.field === "email" ? { email: result.message } : {}),
        ...(result.field === "mobile" ? { mobile: result.message } : {}),
        ...(result.field === "password" ? { password: result.message } : {}),
        ...(result.field === "confirmPassword" ? { confirmPassword: result.message } : {}),
        ...(result.field === "terms" ? { terms: result.message } : {}),
        ...(result.field === "submit" || !result.field ? { submit: result.message } : {}),
      });
      return;
    }

    navigate({ to: dashboardForRole(result.profile.role), replace: true });
  };

  return (
    <AuthShell
      eyebrow="Join the ritual"
      title="Create your 1st ROOT account"
      description="A quieter way to care for your roots begins here."
      sideLabel="Join the ritual"
      sideTitle="Begin your ritual."
      sideDescription="Welcome to the 1st ROOT customer circle — where botanical care begins with intention, patience, and a little ritual."
      reverse
      form={
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          onSubmitCapture={(event) => event.preventDefault()}
          className="space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="register-name"
              className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground/80"
            >
              Full Name
            </label>
            <Input
              id="register-name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              autoComplete="name"
              placeholder="Your full name"
              aria-invalid={Boolean(errors.fullName)}
              className={
                errors.fullName
                  ? "border-[#d9b77f]/80 focus:border-[#d9b77f] focus:ring-[#d9b77f]/30"
                  : ""
              }
            />
            {errors.fullName ? (
              <p className="mt-2 text-xs text-[#e8c38d]">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground/80"
            >
              Email Address
            </label>
            <Input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className={
                errors.email
                  ? "border-[#d9b77f]/80 focus:border-[#d9b77f] focus:ring-[#d9b77f]/30"
                  : ""
              }
            />
            {errors.email ? <p className="mt-2 text-xs text-[#e8c38d]">{errors.email}</p> : null}
          </div>

          <div>
            <label
              htmlFor="register-mobile"
              className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground/80"
            >
              Mobile Number
            </label>
            <div className="flex items-center overflow-hidden border border-border bg-[#121913] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/35">
              <span className="flex h-12 items-center border-r border-border px-4 text-foreground/80">
                +91
              </span>
              <Input
                id="register-mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                value={form.mobile}
                onChange={(event) => onChange("mobile", event.target.value)}
                autoComplete="tel"
                placeholder="98765 43210"
                aria-invalid={Boolean(errors.mobile)}
                className="h-12 border-0 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/45 focus-visible:ring-0"
              />
            </div>
            {errors.mobile ? <p className="mt-2 text-xs text-[#e8c38d]">{errors.mobile}</p> : null}
          </div>

          <PasswordInput
            id="register-password"
            label="Password"
            name="password"
            value={form.password}
            onChange={(value) => onChange("password", value)}
            error={errors.password}
            autoComplete="new-password"
            placeholder="Create a secure password"
          />

          <PasswordInput
            id="register-confirm-password"
            label="Confirm Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={(value) => onChange("confirmPassword", value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            placeholder="Confirm your password"
          />

          <div className="rounded-md border border-border bg-[#121913]/80 p-3">
            <p className="text-[0.63rem] uppercase tracking-[0.2em] text-[#d8b16a]">
              Password requirements
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#d8d0bf]/80">
              <li>Minimum 8 characters</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-[#121913]/70 p-3 text-sm text-[#d8d0bf]">
            <input
              type="checkbox"
              checked={form.agreedToTerms}
              onChange={(event) => onChange("agreedToTerms", event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#d8b16a]"
            />
            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                className="text-[#e8c38d] underline decoration-[#e8c38d]/60 underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-[#e8c38d] underline decoration-[#e8c38d]/60 underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms ? <p className="text-xs text-[#e8c38d]">{errors.terms}</p> : null}

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
                Creating account
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-[#d8d0bf]/80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium uppercase tracking-[0.18em] text-[#e8c38d] transition-colors hover:text-[#f4d69c]"
            >
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[#b9bdaf]/80">
            <CheckCircle2 className="h-4 w-4 text-[#d8b16a]" />
            Secure customer registration
          </div>
        </form>
      }
    />
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
