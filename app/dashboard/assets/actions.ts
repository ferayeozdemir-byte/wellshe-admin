"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type AssetRow = {
  id: string;
  bucket: string;
  path: string;
  content_type: string | null;
  bytes: number | null;
  created_at: string | null;
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL eksik (Vercel env).");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY eksik (Vercel env).");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function getPublicUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function extFromFilename(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  const ext = name.slice(idx).toLowerCase();
  // basit güvenlik: çok uzun uzantıları engelle
  if (ext.length > 10) return "";
  return ext;
}

export async function uploadAsset(formData: FormData) {
  const supabase = getAdminSupabase();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Dosya seçilmedi.");

  // ✅ Bucket: media
  const bucket = "media";

  // klasör yapısı: articles/2025-12/uuid.jpg
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const ext = extFromFilename(file.name) || "";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const path = `articles/${yyyy}-${mm}/${id}${ext}`;

  const bytes = file.size ?? null;
  const contentType = file.type || null;

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1) Storage upload
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: contentType ?? undefined,
    upsert: false,
  });

  if (upErr) {
    throw new Error(`Storage upload hatası: ${upErr.message}`);
  }

  // 2) DB insert (assets tablosu)
  const { data: row, error: dbErr } = await supabase
    .from("assets")
    .insert({
      bucket,
      path,
      content_type: contentType,
      bytes,
      // width/height/alt_* gibi alanlar varsa şimdilik NULL kalsın
    })
    .select("id,bucket,path,content_type,bytes,created_at")
    .single<AssetRow>();

  if (dbErr) {
    // DB insert patlarsa, Storage’da kalan dosyayı temizleyelim
    await supabase.storage.from(bucket).remove([path]).catch(() => null);
    throw new Error(`DB insert hatası: ${dbErr.message}`);
  }

  revalidatePath("/dashboard/assets");

  return {
    ok: true,
    asset: row,
    publicUrl: getPublicUrl(bucket, path),
  };
}

export async function listAssets() {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("assets")
    .select("id,bucket,path,content_type,bytes,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Assets list error: ${error.message}`);

  const items = (data ?? []).map((a: any) => ({
    ...a,
    publicUrl: getPublicUrl(a.bucket, a.path),
  }));

  return items as Array<AssetRow & { publicUrl: string | null }>;
}
