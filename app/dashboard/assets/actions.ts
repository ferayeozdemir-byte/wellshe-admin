"use server";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
  storage_provider: string | null;
  storage_key: string | null;
  public_url: string | null;
  publicUrl: string | null;
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL eksik.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY eksik.");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint) throw new Error("R2_ENDPOINT eksik.");
  if (!accessKeyId) throw new Error("R2_ACCESS_KEY_ID eksik.");
  if (!secretAccessKey) throw new Error("R2_SECRET_ACCESS_KEY eksik.");

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getR2Bucket() {
  return process.env.R2_BUCKET || "wellshe-media";
}

function getR2PublicBaseUrl() {
  return (process.env.R2_PUBLIC_BASE_URL || "https://media.wellshe.app").replace(
    /\/$/,
    ""
  );
}

function getSupabasePublicUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function resolvePublicUrl(row: {
  bucket: string;
  path: string;
  public_url?: string | null;
}) {
  if (row.public_url) return row.public_url;
  return getSupabasePublicUrl(row.bucket, row.path);
}

function extFromFilename(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  const ext = name.slice(idx).toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (ext.length > 10) return "";
  return ext;
}

function makePath(file: File) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const ext = extFromFilename(file.name) || "";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const ct = String(file.type || "").toLowerCase();

  const folder = ct.startsWith("image/")
    ? "covers"
    : ct.startsWith("audio/") || ct === "video/mp4" || file.name.toLowerCase().endsWith(".mp4")
      ? "audios"
      : "files";

  const path = `${folder}/${yyyy}-${mm}/${id}${ext}`;
  return { bucket: "media", path };
}

export async function listAssets(): Promise<AssetRow[]> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("assets")
    .select(
      "id,bucket,path,content_type,bytes,created_at,storage_provider,storage_key,public_url"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<AssetRow, "publicUrl">[];

  return rows.map((r) => ({
    ...r,
    publicUrl: resolvePublicUrl(r),
  }));
}

export async function uploadAsset(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Dosya seçilmedi.");

  const { bucket, path } = makePath(file);
  const contentType = file.type || "application/octet-stream";
  const bytes = file.size;

  const r2 = getR2Client();
  const r2Bucket = getR2Bucket();

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await r2.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicUrl = `${getR2PublicBaseUrl()}/${path}`;

  const { error: insErr } = await supabase.from("assets").insert({
    bucket,
    path,
    content_type: contentType,
    bytes,
    storage_provider: "r2",
    storage_key: path,
    public_url: publicUrl,
  });

  if (insErr) throw new Error(insErr.message);

  revalidatePath("/dashboard/assets");
}

export async function deleteAsset(formData: FormData): Promise<void> {
  await requireAdmin();

  const supabase = getAdminSupabase();

  const id = String(formData.get("id") || "");
  const bucket = String(formData.get("bucket") || "");
  const path = String(formData.get("path") || "");
  const storageProvider = String(formData.get("storage_provider") || "");

  if (!id || !bucket || !path) {
    throw new Error("Silme için id/bucket/path eksik.");
  }

  if (storageProvider === "r2") {
    const r2 = getR2Client();

    await r2.send(
      new DeleteObjectCommand({
        Bucket: getR2Bucket(),
        Key: path,
      })
    );
  } else {
    const { error: stErr } = await supabase.storage.from(bucket).remove([path]);
    if (stErr) throw new Error(stErr.message);
  }

  const { error: dbErr } = await supabase.from("assets").delete().eq("id", id);
  if (dbErr) throw new Error(dbErr.message);

  revalidatePath("/dashboard/assets");
}