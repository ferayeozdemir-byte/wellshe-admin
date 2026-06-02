import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const r2Endpoint = process.env.R2_ENDPOINT!;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID!;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const r2Bucket = process.env.R2_BUCKET || "wellshe-media";
const r2PublicBaseUrl =
  process.env.R2_PUBLIC_BASE_URL || "https://media.wellshe.app";

const r2 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

function extFromFilename(filename: string) {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  const ext = filename.slice(idx).toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (ext.length > 10) return "";
  return ext;
}

function isAllowedMedia(filename: string, contentType: string) {
  const name = filename.toLowerCase();
  const ct = contentType.toLowerCase();

  return (
    ct.startsWith("audio/") ||
    ct === "video/mp4" ||
    name.endsWith(".mp3") ||
    name.endsWith(".m4a") ||
    name.endsWith(".wav") ||
    name.endsWith(".mp4")
  );
}

export async function POST(req: NextRequest) {
  try {
    if (
      !r2Endpoint ||
      !r2AccessKeyId ||
      !r2SecretAccessKey ||
      !r2Bucket ||
      !r2PublicBaseUrl
    ) {
      return NextResponse.json(
        { error: "R2 env değerleri eksik." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const filename = String(body?.filename || "").trim();
    const contentType = String(body?.contentType || "application/octet-stream");
    const bytes = Number(body?.bytes || 0);

    if (!filename) {
      return NextResponse.json(
        { error: "filename zorunlu." },
        { status: 400 }
      );
    }

    if (!bytes || bytes <= 0) {
      return NextResponse.json(
        { error: "Dosya boyutu geçersiz." },
        { status: 400 }
      );
    }

    const maxBytes = 20 * 1024 * 1024;
    if (bytes > maxBytes) {
      return NextResponse.json(
        { error: "En fazla 20 MB boyutunda medya yükleyebilirsin." },
        { status: 400 }
      );
    }

    if (!isAllowedMedia(filename, contentType)) {
      return NextResponse.json(
        { error: "Sadece ses dosyası veya mp4 yüklenebilir." },
        { status: 400 }
      );
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const ext = extFromFilename(filename);
    const id = crypto.randomUUID();

    const storageKey = `audios/${yyyy}-${mm}/${id}${ext}`;
    const publicUrl = `${r2PublicBaseUrl.replace(/\/$/, "")}/${storageKey}`;

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: storageKey,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 5,
    });

    return NextResponse.json({
      ok: true,
      uploadUrl,
      bucket: "media",
      path: storageKey,
      storageKey,
      publicUrl,
      contentType,
      bytes,
    });
  } catch (err: any) {
    console.error("R2 signed upload URL error:", err);

    return NextResponse.json(
      {
        error: "R2 upload URL oluşturulamadı.",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}