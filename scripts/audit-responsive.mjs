import { mkdir, writeFile, readdir, access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { loadEnv } from "vite";
const env = loadEnv("development", process.cwd(), "VITE_");
const cache = join(process.env.LOCALAPPDATA, "npm-cache", "_npx");
let playwright;
for (const dir of await readdir(cache)) {
  const candidate = join(cache, dir, "node_modules", "playwright", "index.mjs");
  try {
    await access(candidate);
    playwright = candidate;
    break;
  } catch {}
}
if (!playwright)
  throw new Error("Run npm exec --yes --package=playwright -- playwright --version first.");
const { chromium } = await import(pathToFileURL(playwright).href);
const out = process.env.AUDIT_OUTPUT || "artifacts/responsive";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const sizes = [
  [320, 568],
  [390, 844],
  [667, 375],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
].filter(
  ([width]) =>
    !process.env.AUDIT_WIDTHS || process.env.AUDIT_WIDTHS.split(",").includes(String(width)),
);
const routes = [
  "/",
  "/shop",
  "/shop/oil-comb-applicator",
  "/cart",
  "/login",
  "/register",
  "/terms",
  "/privacy",
];
const results = [];
const order = {
  id: "AUDIT-ORDER",
  customer_id: "audit-customer",
  status: "DELIVERED",
  payment_status: "PAID",
  payment_method: "UPI",
  transaction_reference: "AUDIT-PAYMENT",
  subtotal: 750,
  discount_amount: 0,
  shipping_amount: 0,
  tax_amount: 0,
  total: 750,
  created_at: "2026-10-10T07:00:00Z",
  items: [
    {
      id: "item",
      product_id: "audit-product",
      product_name: "Botanical oil complete hair care ritual",
      variant: "100 ml",
      quantity: 1,
      unit_price: 750,
      total_price: 750,
      product: { images: [{ url: "/img/9.png", position: 0 }] },
    },
  ],
  shipments: [],
  history: [],
  address: null,
};
const protectedRoutes = {
  CUSTOMER: [
    "/account",
    "/account/orders",
    "/account/orders/AUDIT-ORDER",
    "/account/orders/AUDIT-ORDER/track",
    "/account/wishlist",
    "/account/reviews",
    "/account/profile",
    "/account/support",
  ],
  ADMIN: [
    "/admin",
    "/admin/orders",
    "/admin/orders/1R1028",
    "/admin/products",
    "/admin/products/new",
    "/admin/products/audit-product",
    "/admin/inventory",
    "/admin/customers",
    "/admin/customers/customer-ananya",
    "/admin/reviews",
    "/admin/support",
    "/admin/support/TKT-2048",
    "/admin/shipping",
    "/admin/returns",
    "/admin/payments",
    "/admin/discounts",
    "/admin/content",
    "/admin/reports",
    "/admin/settings",
  ],
};
for (const [width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem(
      "first-root-cart",
      JSON.stringify([{ productId: "oil-comb-applicator", quantity: 2 }]),
    ),
  );
  for (const route of routes.filter(route => !process.env.AUDIT_ROUTES || process.env.AUDIT_ROUTES.split(",").includes(route))) {
    await page.goto(`http://localhost:8081${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      return document.fonts.ready;
    });
    if (route === "/")
      await page
        .waitForFunction(
          () =>
            document.querySelector('[aria-label="1st ROOT film"]')?.textContent.includes("100%"),
          null,
          { timeout: 30000 },
        )
        .catch(() => {});
    if (["/", "/shop"].includes(route) && width < 1024) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      if (!(await page.locator("#store-mobile-navigation").isVisible()))
        throw new Error("Mobile navigation did not open.");
      await page.getByRole("button", { name: "Close navigation" }).click();
    }
    const positions =
      route === "/" ? [0, 0.22, 0.5, 0.96, "philosophy", "collection", "ritual"] : [0];
    for (const position of positions) {
      await page.evaluate((position) => {
        if (typeof position === "string") document.getElementById(position)?.scrollIntoView();
        else
          window.scrollTo(
            0,
            position *
              ((document.querySelector('[aria-label="1st ROOT film"]')?.offsetHeight ?? 0) -
                innerHeight),
          );
      }, position);
      await page.waitForTimeout(600);
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        offenders: [...document.querySelectorAll("main *,header *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
              r.width > 0 &&
              r.right > innerWidth + 2 &&
              r.left >= 0 &&
              s.position !== "absolute" &&
              s.position !== "fixed" &&
              s.visibility !== "hidden"
            );
          })
          .slice(0, 6)
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.slice(0, 60),
            class: el.className,
          })),
      }));
      results.push({ width, height, route, position, ...layout });
      if (
        (width === 320 || width === 667 || width === 390 || width === 768 || width === 1440) &&
        (route === "/" || route === "/login" || route === "/shop" || route === "/cart")
      )
        await page.screenshot({
          path: `${out}/${width}-${route.replaceAll("/", "") || "home"}-${position}.png`,
        });
    }
  }
  await page.close();
  for (const [role, paths] of Object.entries(process.env.AUDIT_PUBLIC_ONLY ? {} : protectedRoutes)) {
    // Isolated browser fixtures: never sign into or write to a real customer account.
    const context = await browser.newContext({ viewport: { width, height } });
    const user = {
      id: "audit-customer",
      email: "audit@example.com",
      aud: "authenticated",
      role: "authenticated",
      user_metadata: {
        firstroot_wishlist: [
          {
            id: "oil-comb-applicator",
            name: "Saved herbal oil",
            variant: "100 ml",
            price: 750,
            image: "/img/9.png",
          },
        ],
      },
    };
    const profile = {
      id: user.id,
      full_name: "Responsive Audit Customer",
      email: user.email,
      mobile: "9876543210",
      role,
      created_at: "2026-10-10T07:00:00Z",
      updated_at: "2026-10-10T07:00:00Z",
    };
    const session = {
      access_token: "audit-token",
      refresh_token: "audit-refresh",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    };
    const storageKey = `sb-${new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    await context.addInitScript(
      ({ storageKey, session }) => localStorage.setItem(storageKey, JSON.stringify(session)),
      { storageKey, session },
    );
    await context.route(`${env.VITE_SUPABASE_URL}/**`, async (route) => {
      const url = new URL(route.request().url());
      const table = url.pathname.split("/").at(-1);
      const single = /object/.test(route.request().headers().accept ?? "");
      let data = [];
      if (url.pathname.includes("/auth/")) data = user;
      else if (table === "profiles") data = single ? profile : [profile];
      else if (table === "orders") data = single ? order : [order];
      else if (table === "products") {
        const product = {
          id: "audit-product",
          name: "Herbal Hair Oil",
          slug: "herbal-hair-oil",
          sku: "AUDIT-OIL-100",
          variant: "100 ml",
          subtitle: "Botanical care",
          category: "Hair Oil",
          short_description: "Botanical oil",
          description: "A botanical ritual for hair care.",
          ingredients: ["Amla"],
          how_to_use: ["Massage gently"],
          features: ["Botanical care"],
          specifications: [],
          price: 750,
          original_price: 900,
          discount_pct: 15,
          status: "ACTIVE",
          rating: 5,
          review_count: 1,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          images: [
            {
              id: "image",
              product_id: "audit-product",
              storage_path: "audit",
              url: "/img/9.png",
              position: 0,
              created_at: profile.created_at,
            },
          ],
        };
        data = single ? product : [product];
      } else if (table === "customer_addresses")
        data = [
          {
            id: "audit-address",
            customer_id: user.id,
            type: "Home",
            full_name: profile.full_name,
            mobile: profile.mobile,
            line1: "A long street address for responsive layout testing",
            line2: "Building 123, Apartment 456",
            landmark: "Near the botanical garden",
            city: "Bengaluru",
            state: "Karnataka",
            pin_code: "560001",
            country: "India",
            is_default: true,
          },
        ];
      else if (table === "reviews")
        data = [
          {
            id: "audit-review",
            product_id: "audit-other",
            order_id: null,
            rating: 5,
            title: "My botanical ritual",
            body: "A long customer review to check wrapping on smaller screens.",
            status: "PENDING",
            verified: false,
            created_at: profile.created_at,
            product: { name: "Herbal Hair Oil", images: [] },
          },
        ];
      else if (table === "support_tickets")
        data = [
          {
            id: "audit-ticket",
            category: "Shipping",
            subject: "Question about my botanical ritual delivery",
            message: "Please help me with the delivery details for my order.",
            status: "OPEN",
            order_id: order.id,
            created_at: profile.created_at,
            messages: [
              {
                id: "reply",
                author_role: "SUPPORT",
                body: "We are checking your shipment details.",
                created_at: profile.created_at,
              },
            ],
          },
        ];
      else if (single) data = null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/0" },
        body: JSON.stringify(data),
      });
    });
    const protectedPage = await context.newPage();
    for (const route of paths) {
      await protectedPage.goto(`http://localhost:8081${route}`, { waitUntil: "networkidle" });
      await protectedPage.waitForTimeout(250);
      const layout = await protectedPage.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        heading: document.querySelector("h1")?.textContent,
        error: document.body.textContent.includes("Something went wrong"),
        offenders: [...document.querySelectorAll("main *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > innerWidth + 2 && r.left >= 0 && r.width > 0;
          })
          .slice(0, 4)
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.slice(0, 50),
            class: el.className,
          })),
      }));
      results.push({ width, height, route, role, ...layout });
      await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
      if (
        (width === 390 || width === 768 || width === 1440) &&
        ["/account/profile", "/account/orders", "/admin/orders", "/admin/settings"].includes(route)
      )
        await protectedPage.screenshot({
          path: `${out}/${width}-${route.replaceAll("/", "-")}.png`,
        });
    }
    await context.close();
  }
  console.log(
    JSON.stringify({
      completed: `${width}x${height}`,
      checks: results.length,
      failures: results.filter((row) => row.overflow > 2 || row.error).length,
    }),
  );
}
await browser.close();
await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    { checks: results.length, failures: results.filter((row) => row.overflow > 2 || row.error) },
    null,
    2,
  ),
);
