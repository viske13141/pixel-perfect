import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PasswordInputProps = {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
};

export function PasswordInput({
  id,
  label,
  name,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  required,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground/80"
      >
        {label}
        {required ? "" : ""}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-12 w-full border border-border bg-[#121913] px-4 pr-12 text-base text-foreground placeholder:text-foreground/45 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/35",
            error && "border-[#d9b77f]/80 focus:border-[#d9b77f] focus:ring-[#d9b77f]/30",
          )}
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-foreground/70 transition-colors hover:text-primary"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-[#e8c38d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
