"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/* ----------------- helpers ----------------- */

function slugifyTR(input: string) {
  const s = (input ?? "").trim().toLowerCase();

  const mapped = s
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");

  const slug = mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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

    candidate = `${baseSlug}-${i + 2}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

function getAdminSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

  // sizde env isimleri farklı olabildiği için birkaç olasılığı kabul ediyoruz
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  if (!url) throw new Error("SUPABASE URL env eksik (Vercel).");
  if (!serviceKey) throw new Error("SERVICE ROLE KEY env eksik (Vercel).");

  return createAdminClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function extFromFilename(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  const ext = name.slice(idx).toLowerCase();
  if (ext.length > 10) return "";
  return ext;
}

/* ----------------- actions ----------------- */

export async function updateArticleTRNoRedirect(formData: FormData) {
  await requireAdmin();

  const audio_asset_id_raw = formData.get("audio_asset_id");
  const audio_asset_id =
    audio_asset_id_raw && String(audio_asset_id_raw).trim() !== ""
      ? String(audio_asset_id_raw).trim()
      : null;

  const supabase = await createClient();

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("ID eksik");

  const status = String(formData.get("status") || "draft").trim();

  const category_id_raw = formData.get("category_id");
  const category_id =
    category_id_raw && String(category_id_raw).trim() !== ""
      ? String(category_id_raw).trim()
      : null;

  const cover_asset_id_raw = formData.get("cover_asset_id");
  const cover_asset_id =
    cover_asset_id_raw && String(cover_asset_id_raw).trim() !== ""
      ? String(cover_asset_id_raw).trim()
      : null;

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const content_html = String(formData.get("content_html") || "").trim();

  let slug = String(formData.get("slug") || "").trim();
  let seo_title = String(formData.get("seo_title") || "").trim();
  let seo_description = String(formData.get("seo_description") || "").trim();

  if (!slug && title) slug = slugifyTR(title);
  if (!seo_title && title) seo_title = title;
  if (!seo_description && summary) seo_description = summary;

  if (slug) {
    const base = slugifyTR(slug);
    slug = await ensureUniqueSlugTR(supabase, id, base);
  }

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

  // 1) articles update
  const { error: aErr } = await supabase
    .from("articles")
    .update({ status, category_id, cover_asset_id })
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
      audio_asset_id, // ✅ yeni alan
    },
    { onConflict: "article_id,lang" }
  );

  if (tErr) throw new Error(tErr.message);

  revalidatePath(`/dashboard/articles/${id}/preview`);
  revalidatePath(`/dashboard/articles/${id}/edit`);
  revalidatePath("/dashboard/articles");
}

export async function updateArticleTR(formData: FormData) {
  await updateArticleTRNoRedirect(formData);
  redirect("/dashboard/articles");
}

export async function saveAndPreviewTR(formData: FormData) {
  await updateArticleTRNoRedirect(formData);

  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("ID eksik");

  redirect(`/dashboard/articles/${id}/preview`);
}

export async function uploadCoverForArticle(formData: FormData): Promise<void> {
  await requireAdmin();

  const article_id = String(formData.get("article_id") || "").trim();
  if (!article_id) throw new Error("article_id eksik");

  try {
    const admin = getAdminSupabase();

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("Dosya seçilmedi.");

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      throw new Error("Kapak görseli 2 MB’tan büyük. Lütfen görseli sıkıştırın.");
    }

    const bucket = "media";

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const ext = extFromFilename(file.name) || "";
    const fileId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const path = `covers/${yyyy}-${mm}/${fileId}${ext}`;

    const { error: upErr } = await admin.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: inserted, error: insErr } = await admin
      .from("assets")
      .insert({
        bucket,
        path,
        content_type: file.type || null,
        bytes: file.size,
      })
      .select("id")
      .single();

    if (insErr) throw new Error(insErr.message);
    if (!inserted?.id) throw new Error("Asset ID alınamadı.");

    const { error: artErr } = await admin
      .from("articles")
      .update({ cover_asset_id: inserted.id })
      .eq("id", article_id);

    if (artErr) throw new Error(artErr.message);

    revalidatePath(`/dashboard/articles/${article_id}/edit`);
    revalidatePath(`/dashboard/articles/${article_id}/preview`);
    revalidatePath("/dashboard/articles");

    redirect(`/dashboard/articles/${article_id}/edit`);
  } catch (e: any) {
    const msg = String(e?.message ?? "Kapak upload sırasında hata oluştu.");
    redirect(
      `/dashboard/articles/${article_id}/edit?coverError=${encodeURIComponent(
        msg
      )}`
    );
  }
}

/* ✅ NEW: Audio upload + otomatik TR bağlama */
export async function uploadAudioForArticle(formData: FormData): Promise<void> {
  await requireAdmin();
  const admin = getAdminSupabase();

  const article_id = String(formData.get("article_id") || "").trim();
  if (!article_id) throw new Error("article_id eksik");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Dosya seçilmedi.");

  // Audio dosyaları 2MB üstü olabilir → makul limit
  const maxBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxBytes) {
    throw new Error("Ses dosyası 20 MB’tan büyük. Lütfen dosyayı küçültün.");
  }

  // ✅ Önce TR translation var mı kontrol et
  // Yoksa audio update edemeyiz (upsert title null hatası veriyor)
  const { data: trRow, error: trReadErr } = await admin
    .from("article_translations")
    .select("article_id")
    .eq("article_id", article_id)
    .eq("lang", "tr")
    .maybeSingle();

  if (trReadErr) throw new Error(trReadErr.message);
  if (!trRow) {
    throw new Error(
      "Bu makalenin TR çevirisi yok. Önce makaleyi Edit sayfasında 'Save' ile kaydedin, sonra ses yükleyin."
    );
  }

  const ext = extFromFilename(file.name) || "";
  const rawType = (file.type || "").toLowerCase();

  // ✅ .mpeg bazen video/mpeg veya octet-stream gelebiliyor → audio/mpeg’e zorla
  let finalContentType = rawType;

  const isAudioByType = rawType.startsWith("audio/");
  const isMpegByType = rawType === "video/mpeg" || rawType === "audio/mpeg";
  const isOctet = rawType === "" || rawType === "application/octet-stream";

  const isMp3Ext = ext === ".mp3";
  const isMpegExt = ext === ".mpeg" || ext === ".mpg" || ext === ".mpga";

  if (isAudioByType) {
    finalContentType = rawType;
  } else if (isMpegByType || isOctet) {
    if (isMp3Ext || isMpegExt) {
      finalContentType = "audio/mpeg";
    }
  }

  if (!finalContentType.startsWith("audio/")) {
    throw new Error(
      `Bu dosya audio olarak algılanamadı. (type: ${rawType || "boş"}, ext: ${ext || "yok"})`
    );
  }

  const bucket = "media";

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const fileId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const path = `audios/${yyyy}-${mm}/${fileId}${ext}`;

  // 1) storage upload
  const { error: upErr } = await admin.storage.from(bucket).upload(path, file, {
    contentType: finalContentType,
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  // 2) assets insert
  const { data: inserted, error: insErr } = await admin
    .from("assets")
    .insert({
      bucket,
      path,
      content_type: finalContentType,
      bytes: file.size,
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  if (!inserted?.id) throw new Error("Asset ID alınamadı.");

  // ✅ 3) SADECE update: upsert yok!
  const { error: updErr } = await admin
    .from("article_translations")
    .update({ audio_asset_id: inserted.id })
    .eq("article_id", article_id)
    .eq("lang", "tr");

  if (updErr) throw new Error(updErr.message);

  revalidatePath(`/dashboard/articles/${article_id}/edit`);
  revalidatePath(`/dashboard/articles/${article_id}/preview`);
  revalidatePath("/dashboard/articles");

  redirect(`/dashboard/articles/${article_id}/edit`);
}
