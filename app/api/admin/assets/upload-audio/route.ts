import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const r2Endpoint = process.env.R2_ENDPOINT!;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID!;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const r2Bucket = process.env.R2_BUCKET || "wellshe-media";
const r2PublicBaseUrl =
  process.env.R2_PUBLIC_BASE_URL || "https://media.wellshe.app";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const r2 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

function getFileExtension(filename: string) {
  if (!filename.includes(".")) return "";
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext ? `.${ext}` : "";
}

function safeArticleId(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !r2Endpoint ||
      !r2AccessKeyId ||
      !r2SecretAccessKey ||
      !r2Bucket ||
      !r2PublicBaseUrl
    ) {
      return NextResponse.json(
        { error: "Server env eksik. R2 veya Supabase env değerlerini kontrol edin." },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");
    const articleId = safeArticleId(formData.get("articleId"));

    if (!articleId) {
      return NextResponse.json(
        { error: "articleId zorunlu." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Ses dosyası bulunamadı." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Lütfen sadece ses dosyası yükleyin." },
        { status: 400 }
      );
    }

    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "En fazla 20 MB boyutunda ses dosyası yükleyebilirsin." },
        { status: 400 }
      );
    }

    const ext = getFileExtension(file.name);
    const storageKey = `audios/${articleId}/${Date.now()}${ext}`;
    const contentType = file.type || "audio/mpeg";
    const bytes = file.size;

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    await r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicUrl = `${r2PublicBaseUrl.replace(/\/$/, "")}/${storageKey}`;

    const { data, error } = await supabase
      .from("assets")
      .insert({
        bucket: "media",
        path: storageKey,
        bytes,
        content_type: contentType,
        storage_provider: "r2",
        storage_key: storageKey,
        public_url: publicUrl,
      })
      .select("id,bucket,path,bytes,content_type,storage_provider,storage_key,public_url")
      .single();

    if (error) {
      console.error("R2 upload sonrası DB insert error:", error);
      return NextResponse.json(
        {
          error:
            "Ses R2’ye yüklendi ama assets tablosuna kayıt açılamadı. Manuel kontrol gerekebilir.",
          details: error.message,
          path: storageKey,
          publicUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      assetId: data.id,
      bucket: data.bucket,
      path: data.path,
      publicUrl: data.public_url,
      contentType: data.content_type,
      bytes: data.bytes,
      storageProvider: data.storage_provider,
    });
  } catch (err: unknown) {
    console.error("R2 audio upload error:", err);
    return NextResponse.json(
      {
        error: "Ses dosyası yüklenirken beklenmeyen bir hata oluştu.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}