"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export type AssetRow = {
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
  if (ext.length > 10) return "";
  return ext;
}

export async function listAssets() {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("assets")
    .select("id,bucket,path,content_type,bytes,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AssetRow[];
  return rows.map((r) => ({
    ...r,
    publicUrl: getPublicUrl(r.bucket, r.path),
  }));
}

// ✅ IMPORTANT: Form action için dönüş tipi void olmalı
export async function uploadAsset(formData: FormData): Promise<void> {
  const supabase = getAdminSupabase();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Dosya seçilmedi.");

  // Bucket: media
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

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 1) Storage upload
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  // 2) DB insert (assets tablosu)
  const { error: insErr } = await supabase.from("assets").insert({
    bucket,
    path,
    content_type: file.type || null,
    bytes: bytes.byteLength,
  });
  if (insErr) throw new Error(insErr.message);

  // 3) UI refresh
  revalidatePath("/dashboard/assets");

  // ✅ return nothing
  return;
}
