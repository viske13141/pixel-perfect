import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useWishlist } from "@/hooks/use-wishlist";
import { StoreMobileMenu } from "@/components/StoreMobileMenu";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { mockProducts, type CustomerProduct } from "@/data/customerMockData";
import { BRAND_IMAGES } from "@/lib/brand-images";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const categories = ["All Products", "Hair Oil", "Shampoo", "Conditioner", "Combos"] as const;

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "top-rated", label: "Top Rated" },
] as const;

const reviewSortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
  { value: "5", label: "5 Star" },
  { value: "4", label: "4 Star" },
  { value: "3", label: "3 Star" },
] as const;

function getReviewDistribution(reviews: CustomerProduct["reviews"]) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach((review) => {
    const rounded = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[rounded] += 1;
  });

  const total = Math.max(reviews.length, 1);

  return Object.entries(distribution).map(([key, value]) => ({
    stars: Number(key),
    count: value,
    percent: Math.round((value / total) * 100),
  }));
}

function getCategory(product: CustomerProduct) {
  const lowerName = product.name.toLowerCase();

  if (lowerName.includes("combo") || lowerName.includes("ritual")) return "Combos";
  if (lowerName.includes("conditioner")) return "Conditioner";
  if (lowerName.includes("shampoo")) return "Shampoo";
  return "Hair Oil";
}

function getProductInfo(product: CustomerProduct) {
  const galleryMap: Record<string, string[]> = {
    "oil-comb-applicator": [
      BRAND_IMAGES.oil,
      BRAND_IMAGES.oil,
      BRAND_IMAGES.ritual,
      BRAND_IMAGES.combo,
    ],
    "oil-shampoo-combo": [
      BRAND_IMAGES.combo,
      BRAND_IMAGES.oil,
      BRAND_IMAGES.ritual,
      BRAND_IMAGES.combo,
    ],
    "complete-ritual": [
      BRAND_IMAGES.ritual,
      BRAND_IMAGES.combo,
      BRAND_IMAGES.oil,
      BRAND_IMAGES.ritual,
    ],
  };

  const featureMap: Record<string, string[]> = {
    "oil-comb-applicator": [
      "Botanical-first formula",
      "Easy scalp application",
      "Comb applicator",
      "100 ml bottle",
      "Designed for scalp massage",
      "Premium everyday ritual",
    ],
    "oil-shampoo-combo": [
      "Botanical ritual pairing",
      "Cleanses without stripping",
      "Balances scalp & hair care",
      "Two-step routine",
      "Daily-use friendly",
      "Premium ritual simplicity",
    ],
    "complete-ritual": [
      "Complete 3-step ritual",
      "Oil, shampoo & conditioner",
      "Botanical hair-care flow",
      "Softens, nourishes, smooths",
      "Luxury everyday care",
      "Thoughtful ritual set",
    ],
  };

  const descriptionMap: Record<string, string> = {
    "oil-comb-applicator":
      "A botanical herbal hair oil designed with an easy-to-use comb applicator for controlled scalp application and massage. The ritual is simple: apply, massage, and let the botanicals settle into a comforting daily practice.",
    "oil-shampoo-combo":
      "A complementary pairing that brings together a botanical oil ritual and a gentle cleansing step. It makes everyday scalp care feel intentional without overcomplicating the routine.",
    "complete-ritual":
      "A complete three-step ritual built around the sensory rhythm of oil, cleanse, and condition. It is created to make a simple, luxurious, daily hair-care practice feel beautifully complete.",
  };

  const ingredients = [
    "Amla",
    "Fenugreek",
    "Vetiver",
    "Jatamansi",
    "Hibiscus",
    "Henna",
    "Coconut Oil",
    "Sesame Oil",
  ];

  return {
    category: getCategory(product),
    rating:
      product.id === "oil-comb-applicator" ? 4.8 : product.id === "oil-shampoo-combo" ? 4.7 : 4.9,
    reviewCount: product.id === "oil-comb-applicator" ? 124 : 89,
    subtitle: product.variant,
    intro: descriptionMap[product.id] ?? product.description,
    benefits: featureMap[product.id] ?? ["Botanical-first formula", "Thoughtful hair ritual"],
    ingredients,
    gallery: galleryMap[product.id] ?? [product.image, product.image, product.image, product.image],
  };
}

function StoreNav() {
  const { totalCount } = useCart();

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-10 lg:py-5">
        <div className="flex items-center gap-5">
          <Link to="/" className="font-serif text-2xl tracking-wide text-foreground">
            <img
              src={BRAND_IMAGES.logo}
              alt="1st ROOT"
              className="h-14 w-14 rounded-md object-contain md:h-16 md:w-16"
            />
          </Link>
          <Link
            to="/shop"
            className="hidden text-[0.62rem] uppercase tracking-[0.26em] text-foreground/80 transition-colors hover:text-primary xl:inline-flex"
          >
            Shop
          </Link>
        </div>

        <div className="hidden items-center gap-6 text-[0.62rem] uppercase tracking-[0.26em] text-foreground/80 lg:flex">
          <Link to="/shop" className="transition-colors hover:text-primary">
            Shop
          </Link>
          <a href="/#philosophy" className="transition-colors hover:text-primary">
            Our Story
          </a>
          <a href="/#collection" className="transition-colors hover:text-primary">
            Ingredients
          </a>
          <a href="/#ritual" className="transition-colors hover:text-primary">
            Ritual
          </a>
        </div>

        <div className="flex items-center gap-3 text-primary">
          <StoreMobileMenu />
          <Link
            to="/account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/3 transition-colors hover:border-primary/60 hover:text-primary"
            aria-label="Account"
          >
            <UserRound className="h-4 w-4" />
          </Link>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/3 px-3 py-2 text-[0.58rem] uppercase tracking-[0.18em] transition-colors hover:border-primary/60 hover:text-primary"
            aria-label="View shopping bag"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{totalCount > 0 ? `Bag (${totalCount})` : "Bag"}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function ProductCard({ product }: { product: CustomerProduct }) {
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const isSaved = wishlist.items.some((item) => item.id === product.id);
  const productInfo = getProductInfo(product);

  return (
    <article className="group relative overflow-hidden border border-border bg-card/40 transition-all duration-500 hover:-translate-y-1 hover:border-primary/30">
      <div className="relative overflow-hidden">
        <Link to="/shop/$slug" params={{ slug: product.id }} className="block">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[4/5] w-full object-contain transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          aria-label={isSaved ? "Remove from wishlist" : "Save for later"}
          disabled={
            Boolean(wishlist.user) &&
            (wishlist.query.isPending || wishlist.query.isError || wishlist.mutation.isPending)
          }
          onClick={() =>
            wishlist.user
              ? wishlist.mutation.mutate({ product, saved: !isSaved })
              : void navigate({ to: "/login" })
          }
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center border border-border bg-background/80 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {(wishlist.query.error || wishlist.mutation.error) && (
          <p role="alert" className="text-sm text-red-400">
            Unable to update wishlist. Please try again.
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.58rem] uppercase tracking-[0.22em] text-primary/90">
              {getCategory(product)}
            </p>
            <Link
              to="/shop/$slug"
              params={{ slug: product.id }}
              className="mt-2 block text-xl text-foreground hover:text-primary"
            >
              {product.name}
            </Link>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{product.variant}</p>

        <div className="flex items-center gap-2 text-sm text-foreground/85">
          <div className="flex items-center gap-1 text-primary">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{productInfo.rating}</span>
          </div>
          <span className="text-muted-foreground">({productInfo.reviewCount} Reviews)</span>
        </div>

        <div className="flex items-end gap-3">
          <p className="text-2xl font-medium text-foreground">{formatCurrency(product.price)}</p>
          {product.originalPrice ? (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.12em] text-primary">
                {Math.round(
                  ((product.originalPrice - product.price) / product.originalPrice) * 100,
                )}
                % OFF
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>{product.stockStatus}</span>
          <span>{product.size}</span>
        </div>

        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="inline-flex min-h-12 items-center justify-center bg-primary px-4 text-[0.58rem] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Add to Bag
          </button>
          <Link
            to="/shop/$slug"
            params={{ slug: product.id }}
            className="inline-flex min-h-12 items-center justify-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.18em] transition-colors hover:border-primary/50 hover:text-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ShopPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All Products");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("featured");

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items = mockProducts.filter((product) => {
      const matchesQuery =
        normalized.length === 0 ||
        product.name.toLowerCase().includes(normalized) ||
        product.variant.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized);

      const matchesCategory = category === "All Products" || getCategory(product) === category;
      return matchesQuery && matchesCategory;
    });

    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return (
            mockProducts.findIndex((product) => product.id === b.id) -
            mockProducts.findIndex((product) => product.id === a.id)
          );
        case "best-selling":
          return (b.originalPrice ?? b.price) - (a.originalPrice ?? a.price);
        case "top-rated":
          return getProductInfo(b).rating - getProductInfo(a).rating;
        default:
          return 0;
      }
    });
  }, [category, query, sortBy]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StoreNav />

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-12 md:px-10">
        <div className="mb-8 flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Shop</span>
        </div>

        <div className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-4">Shop</p>
            <h1 className="display text-[clamp(2.5rem,5vw,5rem)]">Find your ritual.</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Explore the complete 1st ROOT botanical hair-care collection.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Products"
              className="h-12 border-border bg-card/40 pl-11 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-auto">
            <label className="flex items-center gap-3 rounded-none border border-border bg-card/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
              >
                {categories.map((option) => (
                  <option key={option} value={option} className="bg-background text-foreground">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-none border border-border bg-card/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Sort By</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as (typeof sortOptions)[number]["value"])
                }
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
              >
                {sortOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-background text-foreground"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-10 border border-dashed border-border bg-card/20 p-8 text-center text-muted-foreground">
            No products match your current search.
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function ProductDetailsPage() {
  const { slug } = useParams({ from: "/shop/$slug" });
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const wishlist = useWishlist();
  const [pinCode, setPinCode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [isViewerOpen, setViewerOpen] = useState(false);

  const product = mockProducts.find((item) => item.id === slug) ?? mockProducts[0]!;
  const isSaved = wishlist.items.some((item) => item.id === product.id);
  const productInfo = getProductInfo(product);
  const gallery = productInfo.gallery;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleDeliveryCheck = () => {
    const normalized = pinCode.replace(/\D/g, "");
    if (normalized.length >= 6) {
      setDeliveryStatus("Delivery available\nEstimated delivery: 3–5 business days");
      return;
    }
    setDeliveryStatus("Please enter a valid PIN code.");
  };

  const handleAddToBag = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate({ to: "/cart" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StoreNav />

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mb-6 flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="transition-colors hover:text-primary">
            Shop
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden border border-border bg-card/40">
              <button type="button" onClick={() => setViewerOpen(true)} className="block w-full">
                <img
                  src={gallery[selectedImage] ?? product.image}
                  alt={product.name}
                  className="aspect-[4/5] w-full cursor-zoom-in object-contain transition-transform duration-300 hover:scale-[1.02]"
                />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-background/90 to-transparent px-4 pb-4 pt-10 text-[0.58rem] uppercase tracking-[0.2em] text-foreground">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((current) =>
                        current === 0 ? gallery.length - 1 : current - 1,
                      )
                    }
                    className="border border-border bg-background/80 px-3 py-2 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImage((current) => (current + 1) % gallery.length)}
                    className="border border-border bg-background/80 px-3 py-2 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    Next
                  </button>
                </div>
                <span>
                  {selectedImage + 1}/{gallery.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden border ${selectedImage === index ? "border-primary" : "border-border"}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="aspect-[1/1] w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.26em] text-primary">
                {productInfo.category}
              </p>
              <h1 className="mt-4 text-4xl md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{productInfo.subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${index < Math.round(productInfo.rating) ? "fill-primary text-primary" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-foreground">{productInfo.rating}</span>
              <span className="text-sm text-muted-foreground">
                {productInfo.reviewCount} Reviews
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-3xl font-medium text-foreground">
                {formatCurrency(product.price)}
              </p>
              {product.originalPrice ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.12em] text-primary">
                    {discount}% OFF
                  </span>
                </>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">Inclusive of applicable taxes</p>

            <div className="rounded-none border border-primary/20 bg-primary/5 p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-primary">
                Why you&apos;ll love it
              </p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                {productInfo.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border bg-card/40">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="inline-flex h-12 w-12 items-center justify-center text-foreground hover:text-primary"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center text-lg text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    className="inline-flex h-12 w-12 items-center justify-center text-foreground hover:text-primary"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToBag}
                className="inline-flex min-h-12 items-center justify-center bg-primary px-5 text-[0.6rem] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Add to Bag
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex min-h-12 items-center justify-center border border-border px-5 text-[0.6rem] uppercase tracking-[0.2em] transition-colors hover:border-primary/50 hover:text-primary"
              >
                Buy Now
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={
                  Boolean(wishlist.user) &&
                  (wishlist.query.isPending ||
                    wishlist.query.isError ||
                    wishlist.mutation.isPending)
                }
                onClick={() =>
                  wishlist.user
                    ? wishlist.mutation.mutate({ product, saved: !isSaved })
                    : void navigate({ to: "/login" })
                }
                className="inline-flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </button>
              {(wishlist.query.error || wishlist.mutation.error) && (
                <p role="alert" className="text-sm text-red-400">
                  Unable to update wishlist. Please try again.
                </p>
              )}
            </div>

            <div className="rounded-none border border-border bg-card/40 p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-primary">Delivery</p>
              <div className="mt-4 flex gap-2">
                <Input
                  value={pinCode}
                  onChange={(event) => setPinCode(event.target.value)}
                  placeholder="Enter PIN Code"
                  className="h-11 border-border bg-background text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={handleDeliveryCheck}
                  className="inline-flex min-h-11 items-center justify-center border border-border px-4 text-[0.58rem] uppercase tracking-[0.18em] transition-colors hover:border-primary/50 hover:text-primary"
                >
                  Check
                </button>
              </div>
              {deliveryStatus ? (
                <p className="mt-3 whitespace-pre-line text-sm text-foreground/85">
                  {deliveryStatus}
                </p>
              ) : null}
            </div>

            <div className="rounded-none border border-border bg-card/40 p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-primary">
                Available Offers
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-none border border-primary/15 bg-primary/5 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">
                    First Root Offer
                  </p>
                  <p className="mt-1 text-sm text-foreground/85">10% off on your first order.</p>
                </div>
                <div className="rounded-none border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground">
                    Bundle Ritual
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a second ritual item and save more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { title: "Description", content: productInfo.intro },
              { title: "Ingredients", content: productInfo.ingredients.join(", ") },
              { title: "Benefits / Features", content: productInfo.benefits.join(" · ") },
              {
                title: "How to Use",
                content:
                  "Apply a few drops to the scalp and massage gently. Use as a ritual before wash day or as a calming scalp treatment after a long day.",
              },
              {
                title: "Product Details",
                content: `${product.name} · ${product.size} · ${product.variant}.`,
              },
              {
                title: "Delivery & Returns",
                content:
                  "Delivery across India in 3–5 business days. Returns available for unused, sealed products within 7 days of delivery.",
              },
              {
                title: "FAQ",
                content:
                  "This product is safe for day-to-day scalp ritual use. Keep away from direct sunlight and store in a cool, dry place.",
              },
            ].map((item) => (
              <AccordionItem
                key={item.title}
                value={item.title}
                className="border border-border bg-card/30 px-4"
              >
                <AccordionTrigger className="text-left text-[0.66rem] uppercase tracking-[0.2em] text-foreground hover:text-primary">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="pb-5 pt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {isViewerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl border border-border bg-card p-3">
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground hover:text-primary"
              aria-label="Close image viewer"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={gallery[selectedImage] ?? product.image}
              alt={product.name}
              className="max-h-[75vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const shipping = subtotal > 0 ? 49 : 0;
  const discount = subtotal > 0 ? 129 : 0;
  const total = subtotal + shipping - discount;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StoreNav />

      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Bag</p>
            <h1 className="display text-[clamp(2.3rem,4vw,4rem)]">Your ritual bag</h1>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center border border-border px-4 py-3 text-[0.58rem] uppercase tracking-[0.2em] transition-colors hover:border-primary/50 hover:text-primary"
          >
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-border bg-card/20 p-12 text-center">
            <p className="text-xl text-foreground">Your bag is empty.</p>
            <p className="mt-3 text-muted-foreground">
              Start with your botanical hair-care essentials.
            </p>
            <Link to="/shop" className="btn-gold mt-6">
              Shop the ritual
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 border border-border bg-card/35 p-4 sm:flex-row sm:items-center"
                >
                  <img src={item.image} alt={item.name} className="h-28 w-28 object-contain" />
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.18em] text-primary">
                      {getCategory(item)}
                    </p>
                    <Link
                      to="/shop/$slug"
                      params={{ slug: item.id }}
                      className="mt-2 block text-xl text-foreground hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{item.size}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="inline-flex h-10 w-10 items-center justify-center text-foreground hover:text-primary"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="inline-flex h-10 w-10 items-center justify-center text-foreground hover:text-primary"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="min-w-[90px] text-right text-lg">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </article>
              ))}
            </div>

            <aside className="h-fit border border-border bg-card/40 p-5">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-primary">Summary</p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="text-foreground">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="text-foreground">-{formatCurrency(discount)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-lg text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <button type="button" className="btn-gold mt-6 w-full justify-center">
                Checkout (Demo)
              </button>

              <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure checkout
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  3–5 business days
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
