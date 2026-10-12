import { ArrowRight, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { BRAND_IMAGES } from "@/lib/brand-images";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  form: ReactNode;
  sideLabel: string;
  sideTitle: string;
  sideDescription: string;
  reverse?: boolean;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  form,
  sideLabel,
  sideTitle,
  sideDescription,
  reverse = false,
}: AuthShellProps) {
  return (
    <main className="auth-shell min-h-screen bg-[#0d1c15] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row lg:items-stretch">
        <section
          className={[
            "relative isolate flex flex-1 flex-col justify-center overflow-hidden border-b border-[#d8b16a]/15 lg:min-h-screen lg:border-b-0",
            reverse ? "lg:order-2" : "lg:order-1",
          ].join(" ")}
        >
          <img
            src="/img/forest-botanical-background.png"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[2px]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,24,12,0.35),rgba(6,24,12,0.8))]"
          />
          <img
            src={BRAND_IMAGES.logo}
            alt="1st ROOT"
            className="absolute left-7 top-6 z-20 h-20 w-20 object-contain lg:left-10 lg:top-8"
          />
          <div className="relative z-10 mx-auto flex w-full flex-col items-center gap-6 px-7 pb-10 pt-28 sm:flex-row sm:gap-5 sm:px-8 lg:gap-6 lg:px-10 lg:py-32">
          <div className="h-[38svh] min-h-56 max-h-[400px] w-full shrink-0 sm:h-[48svh] sm:w-[42%] sm:max-h-[520px]">
            <img
              src={BRAND_IMAGES.oil}
              alt="1st ROOT Herbal Hair Oil, 100 ml"
              className="h-full w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,19,11,0.45)_65%,rgba(5,19,11,0.96)_100%)]" />
          <div className="relative z-10 w-full min-w-0 flex-1 text-left text-foreground">
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.38em] text-[#e6d5a7]">
              {sideLabel}
            </p>
            <h1 className="font-serif text-3xl leading-[1.12] text-[#f7f1e8] [text-shadow:0_2px_20px_rgba(0,0,0,0.25)] sm:text-4xl">
              {sideTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#efe3ce]/95 md:text-base">
              {sideDescription}
            </p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/15 px-4 py-2 text-[0.62rem] uppercase tracking-[0.26em] text-[#f1e7d4] backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-[#d8b16a]" />
              Secure customer access
            </div>
          </div>
          </div>
        </section>

        <section
          className={[
            "flex flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(75,107,66,0.16),transparent_65%)] px-5 py-10 sm:px-8 lg:px-12",
            reverse ? "lg:order-1" : "lg:order-2",
          ].join(" ")}
        >
          <div className="w-full max-w-[440px]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-[#f7f1e8]">
              <div className="font-serif text-2xl tracking-[0.18em] uppercase">1st ROOT</div>
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-[#d8b16a]">
                {eyebrow}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-4xl leading-none text-[#f7f1e8] sm:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#d8d0bf]/80 sm:text-base">
                {description}
              </p>
            </div>

            {form}

            <div className="mt-8 flex items-center gap-3 text-sm text-[#d8d0bf]/85">
              <span className="h-px flex-1 bg-border" />
              <span className="uppercase tracking-[0.24em] text-[0.58rem] text-[#d8b16a]">
                Account access
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#f2ebda]">
              <ArrowRight className="h-4 w-4 text-[#d8b16a]" />
              <span>Premium botanical care, thoughtfully delivered.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
