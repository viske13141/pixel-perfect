import { getSupabase } from "@/lib/supabase";

export type ProductStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  variant: string;
  subtitle: string;
  category: string;
  short_description: string;
  description: string;
  ingredients: string[];
  how_to_use: string[];
  features: string[];
  specifications: Array<[string, string]>;
  price: number;
  original_price: number | null;
  discount_pct: number | null;
  status: ProductStatus;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
};

export type DbProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  position: number;
  created_at: string;
};

export type ProductWithImages = DbProduct & { images: DbProductImage[] };

export type ProductFormData = {
  name: string;
  slug: string;
  sku: string;
  variant: string;
  subtitle: string;
  category: string;
  short_description: string;
  description: string;
  ingredients: string;
  how_to_use: string;
  features: string;
  price: string;
  original_price: string;
  discount_pct: string;
  status: ProductStatus;
};

export type ProductCounts = {
  total: number;
  active: number;
  draft: number;
  inactive: number;
};

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesToString(arr: string[]): string {
  return arr.join("\n");
}

export { linesToString };

export async function fetchProducts(
  status?: ProductStatus | "ALL",
  search?: string,
): Promise<ProductWithImages[]> {
  const sb = getSupabase();
  let query = sb
    .from("products")
    .select("*, images:product_images(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }
  if (search?.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductWithImages[];
}

export async function fetchProductById(id: string): Promise<ProductWithImages> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("*, images:product_images(*)")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Product not found");
  return data as ProductWithImages;
}

export async function fetchProductCounts(): Promise<ProductCounts> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("status");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "ACTIVE").length,
    draft: rows.filter((r) => r.status === "DRAFT").length,
    inactive: rows.filter((r) => r.status === "INACTIVE").length,
  };
}

export async function createProduct(
  form: ProductFormData,
): Promise<DbProduct> {
  const payload = buildPayload(form);
  const { data, error } = await getSupabase()
    .from("products")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbProduct;
}

export async function updateProduct(
  id: string,
  form: ProductFormData,
): Promise<DbProduct> {
  const payload = buildPayload(form);
  const { data, error } = await getSupabase()
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbProduct;
}

export async function setProductStatus(
  id: string,
  status: ProductStatus,
): Promise<void> {
  const { error } = await getSupabase()
    .from("products")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

function buildPayload(form: ProductFormData) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    sku: form.sku.trim(),
    variant: form.variant.trim(),
    subtitle: form.subtitle.trim(),
    category: form.category.trim(),
    short_description: form.short_description.trim(),
    description: form.description.trim(),
    ingredients: parseLines(form.ingredients),
    how_to_use: parseLines(form.how_to_use),
    features: parseLines(form.features),
    price: parseFloat(form.price) || 0,
    original_price: form.original_price ? parseFloat(form.original_price) : null,
    discount_pct: form.discount_pct ? parseInt(form.discount_pct, 10) : null,
    status: form.status,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Image operations ──────────────────────────────────────────

const BUCKET = "product-images";

export async function uploadProductImage(
  productId: string,
  file: File,
  position: number,
): Promise<DbProductImage> {
  const sb = getSupabase();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${productId}/${Date.now()}-${position}.${ext}`;

  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { data, error } = await sb
    .from("product_images")
    .insert({ product_id: productId, storage_path: path, url, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbProductImage;
}

export async function deleteProductImage(
  imageId: string,
  storagePath: string,
): Promise<void> {
  const sb = getSupabase();
  await sb.storage.from(BUCKET).remove([storagePath]);
  const { error } = await sb.from("product_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
}
