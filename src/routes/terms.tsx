import { Link, createFileRoute } from "@tanstack/react-router";

function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d120f] px-6 py-20 text-[#f2eadb]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-[#111a15]/80 p-5 sm:p-12">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#d8b16a]">Placeholder</p>
        <h1 className="mt-6 font-serif text-3xl sm:text-5xl text-[#f7f1e8]">Terms of Service</h1>
        <p className="mt-6 text-base leading-7 text-[#d8d0bf]/80">
          This page is reserved for the final customer terms and service policies. It will be
          replaced with the production legal content before launch.
        </p>
        <div className="mt-8">
          <Link
            to="/register"
            className="inline-flex items-center rounded-md bg-[#e7d9b7] px-4 py-3 text-xs sm:text-sm font-medium uppercase tracking-[0.16em] text-[#101910] transition-colors hover:bg-[#f0e3ca]"
          >
            Back to registration
          </Link>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});
