import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function StoreMobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="store-mobile-navigation"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-night/70 text-primary"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <nav
          id="store-mobile-navigation"
          aria-label="Store navigation"
          className="absolute inset-x-0 top-full max-h-[calc(100svh-90px)] overflow-y-auto border-y border-border bg-night/95 px-6 py-4 shadow-xl backdrop-blur-xl"
          onClick={() => setOpen(false)}
        >
          <Link to="/shop" className="block py-3 text-foreground">
            Shop
          </Link>
          <a href="/#philosophy" className="block py-3 text-foreground">
            Our Story
          </a>
          <a href="/#collection" className="block py-3 text-foreground">
            Ingredients
          </a>
          <a href="/#ritual" className="block py-3 text-foreground">
            Ritual
          </a>
        </nav>
      )}
    </div>
  );
}
