// app/dashboard/articles/[id]/edit/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

function slugifyTR(input: string) {
  const s = (input ?? "").trim().toLowerCase();

  // Türkçe karakterleri sadeleştir
  const mapped = s
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");

  // Harf/rakam dışını tire yap
  const slug = mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return slug || "article";
}

async function ensureUniqueSlugTR(
  supabase: Awaited<ReturnType<typeof createClient>>,
  articleId: string,
  baseSlug: string
) {
  let candidate = baseSlug;
  // makul bir limit
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("article_translations")
      .select("article_id")
      .eq("lang", "tr")
      .eq("slug", candidate)
      .neq("article_id", articleId)
      .limit(1);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return candidate;

    candidate = `${baseSlug}-${i + 2}`; // -2, -3...
  }

  // 50 denemede bile doluysa artık çok sıra dışı bir durum
  return `${baseSlug}-${Date.now()}`;
}

export async function updateArticleTR(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("ID eksik");

  const status = String(formData.get("status") || "draft").trim();

  const category_id_raw = formData.get("category_id");
  const category_id =
    category_id_raw && String(category_id_raw).trim() !== ""
      ? String(category_id_raw).trim()
      : null;

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const content_html = String(formData.get("content_html") || "").trim();

  let slug = String(formData.get("slug") || "").trim();
  let seo_title = String(formData.get("seo_title") || "").trim();
  let seo_description = String(formData.get("seo_description") || "").trim();

  // ✅ Otomasyonlar (boşsa doldur)
  if (!slug && title) slug = slugifyTR(title);
  if (!seo_title && title) seo_title = title;
  if (!seo_description && summary) seo_description = summary;

  // slug çakışmasını engelle (TR için)
  if (slug) {
    const base = slugifyTR(slug); // kullanıcı yazsa bile normalize et
    slug = await ensureUniqueSlugTR(supabase, id, base);
  }

  // ✅ Published validasyonu (category opsiyonel kalsın)
  if (status === "published") {
    const missing: string[] = [];
    if (!title) missing.push("Başlık (TR)");
    if (!summary) missing.push("Özet (TR)");
    if (!content_html) missing.push("İçerik (TR)");
    if (!slug) missing.push("Slug (TR)");

    if (missing.length) {
      throw new Error(
        `Published için zorunlu alanlar boş: ${missing.join(", ")}`
      );
    }
  }

  // 1) articles güncelle (status + category)
  const { error: aErr } = await supabase
    .from("articles")
    .update({ status, category_id })
    .eq("id", id);

  if (aErr) throw new Error(aErr.message);

  // 2) TR translation upsert
  const { error: tErr } = await supabase.from("article_translations").upsert(
    {
      article_id: id,
      lang: "tr",
      title,
      summary,
      content_html,
      slug,
      seo_title,
      seo_description,
    },
    { onConflict: "article_id,lang" }
  );

  if (tErr) throw new Error(tErr.message);

  revalidatePath("/dashboard/articles");
  redirect("/dashboard/articles");
}
