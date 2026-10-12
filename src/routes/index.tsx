import { Link, createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { CinematicFilm } from "@/components/CinematicFilm";
import { useCart } from "@/context/CartContext";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { useAuth } from "@/context/useAuth";
import { StoreMobileMenu } from "@/components/StoreMobileMenu";

const TITLE = "1st ROOT — Vedam of Hair | Botanical Hair Oil Ritual";
const DESC =
  "From Himalayan roots to a single golden drop. Discover 1st ROOT, a slowly prepared botanical hair-oil ritual.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PRODUCTS = [
  {
    n: "01",
    name: "Oil Comb Applicator",
    meta: "Herbal Hair Oil · 100 ml",
    frame: BRAND_IMAGES.oil,
    pos: "50% 50%",
  },
  {
    n: "02",
    name: "Oil + Shampoo Combo",
    meta: "100 ml Oil + 200 ml Shampoo",
    frame: BRAND_IMAGES.combo,
    pos: "50% 40%",
  },
  {
    n: "03",
    name: "Oil + Shampoo + Conditioner",
    meta: "Complete three-step ritual",
    frame: BRAND_IMAGES.ritual,
    pos: "50% 45%",
  },
];

function Nav() {
  const [solid, setSolid] = useState(false);
  const { isAuthenticated } = useAuth();
  const { totalCount } = useCart();

  useEffect(() => {
    const on = () =>
      setSolid(
        (document.querySelector('[aria-label="1st ROOT film"]')?.getBoundingClientRect().bottom ??
          0) < window.innerHeight,
      );
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${solid ? "bg-night/85 backdrop-blur" : ""}`}
    >
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-10 lg:py-5">
        <Link to="/" className="font-serif text-xl tracking-wide text-foreground">
          <img
            src={BRAND_IMAGES.logo}
            alt="1st ROOT"
            className="h-14 w-14 rounded-md object-contain md:h-16 md:w-16"
          />
        </Link>

        <div className="hidden items-center gap-6 text-[0.62rem] uppercase tracking-[0.26em] text-foreground/80 lg:flex xl:gap-8">
          <Link to="/shop" className="transition-colors hover:text-primary">
            Shop
          </Link>
          <a href="#philosophy" className="transition-colors hover:text-primary">
            Our Story
          </a>
          <a href="#collection" className="transition-colors hover:text-primary">
            Ingredients
          </a>
          <a href="#ritual" className="transition-colors hover:text-primary">
            Ritual
          </a>
          <a href="#ritual" className="transition-colors hover:text-primary">
            Journal
          </a>
        </div>

        <div className="flex items-center gap-3 text-primary">
          <StoreMobileMenu />
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            aria-label="Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/3 transition-colors hover:border-primary/60 hover:text-primary"
          >
            <UserRound className="h-4 w-4" />
          </Link>

          <Link
            to="/cart"
            aria-label="Shopping bag"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/3 px-3 py-2 text-[0.58rem] uppercase tracking-[0.18em] transition-colors hover:border-primary/60 hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{totalCount > 0 ? `Bag (${totalCount})` : "Bag"}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Index() {
  return (
    <main className="bg-night">
      <Nav />
      <CinematicFilm />

      {/* Final frame dissolves into the page background */}
      <section id="philosophy" className="relative">
        <div
          className="absolute inset-x-0 -top-px h-[60vh] bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${BRAND_IMAGES.combo})` }}
        />
        <div className="absolute inset-x-0 -top-px h-[60vh] bg-gradient-to-b from-night/30 to-night" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-[20svh] md:px-16 md:pb-40 md:pt-[35vh]">
          <p className="eyebrow mb-8">
            The 1<span className="normal-case">st</span> ROOT Philosophy
          </p>
          <h2 className="display max-w-4xl">
            Rooted in nature.
            <br />
            <em className="text-primary/90">Designed for modern rituals.</em>
          </h2>
          <div className="mt-16 grid gap-10 text-muted-foreground md:grid-cols-2 md:text-lg">
            <p>1st ROOT begins where botanical tradition has always begun — with patience.</p>
            <p>
              Botanicals are slowly prepared into a ritual designed for the quiet minutes you keep
              for yourself.
            </p>
          </div>
        </div>
      </section>

      <section id="collection" className="nature-section border-t border-border text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-32 lg:px-16">
          <p className="eyebrow mb-6">The Collection</p>
          <h2 className="display mb-12 text-[clamp(2.2rem,5vw,4.5rem)] md:mb-24">
            Three ways into the ritual.
          </h2>
          <div className="space-y-16 md:space-y-32">
            {PRODUCTS.map((p, i) => (
              <article
                key={p.n}
                className={`grid items-center gap-10 md:grid-cols-12 ${i % 2 ? "md:[&>figure]:order-2" : ""}`}
              >
                <figure className="group overflow-hidden md:col-span-7">
                  <img
                    src={p.frame}
                    alt={`1st ROOT ${p.name}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-contain p-4 drop-shadow-[0_18px_22px_rgba(34,57,31,0.16)] transition-transform duration-[1.6s] group-hover:scale-105 md:p-8"
                    style={{ objectPosition: p.pos }}
                  />
                </figure>
                <div className="md:col-span-5 md:px-8">
                  <p className="font-serif text-6xl text-primary/80">{p.n}</p>
                  <h3 className="mt-4 text-[clamp(1.8rem,3.4vw,3rem)]">{p.name}</h3>
                  <p className="eyebrow mt-5 text-muted-foreground">{p.meta}</p>
                  <div className="mt-6 h-px w-16 bg-primary/50" />
                  <Link to="/shop" className="btn-quiet mt-10">
                    Explore
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="ritual"
        className="nature-section nature-ritual border-t border-border text-foreground"
      >
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:px-16 md:py-40">
          <p className="eyebrow mb-8">Vedam of Hair</p>
          <h2 className="display text-[clamp(2.4rem,6vw,5.5rem)]">Your hair deserves a ritual.</h2>
          <Link to="/shop" className="btn-gold mt-14">
            Shop the ritual
          </Link>
        </div>
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-10 text-xs uppercase tracking-[0.25em] text-muted-foreground md:flex-row md:px-16">
          <span className="font-serif text-base normal-case tracking-wide text-foreground">
            1st ROOT
          </span>
          <span>© {new Date().getFullYear()} 1st ROOT · Vedam of Hair</span>
        </footer>
      </section>
    </main>
  );
}
