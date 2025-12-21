"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export type AssetRow = {
  id: string;
  bucket: string;
  path: string;
  content_type: string | null;
  bytes: number | null;
  created_at: string | null;
  publicUrl: string | null;
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

function makePath(file: File) {
  const bucket = "media";

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const ext = extFromFilename(file.name) || "";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // tipine göre klasör
  const ct = String(file.type || "");
  const folder = ct.startsWith("image/")
    ? "covers"
    : ct.startsWith("audio/")
      ? "audios"
      : "files";

  const path = `${folder}/${yyyy}-${mm}/${id}${ext}`;
  return { bucket, path };
}

export async function listAssets(): Promise<AssetRow[]> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("assets")
    .select("id,bucket,path,content_type,bytes,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<AssetRow, "publicUrl">[];
  return rows.map((r) => ({
    ...r,
    publicUrl: getPublicUrl(r.bucket, r.path),
  }));
}

// ✅ upload
export async function uploadAsset(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Dosya seçilmedi.");

  const { bucket, path } = makePath(file);

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await supabase.from("assets").insert({
    bucket,
    path,
    content_type: file.type || null,
    bytes: file.size,
  });
  if (insErr) throw new Error(insErr.message);

  revalidatePath("/dashboard/assets");
}

// ✅ delete (hem storage hem DB)
export async function deleteAsset(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const id = String(formData.get("id") || "");
  const bucket = String(formData.get("bucket") || "");
  const path = String(formData.get("path") || "");

  if (!id || !bucket || !path) throw new Error("Silme için id/bucket/path eksik.");

  // 1) Storage sil
  const { error: stErr } = await supabase.storage.from(bucket).remove([path]);
  if (stErr) throw new Error(stErr.message);

  // 2) DB sil
  const { error: dbErr } = await supabase.from("assets").delete().eq("id", id);
  if (dbErr) throw new Error(dbErr.message);

  revalidatePath("/dashboard/assets");
}
