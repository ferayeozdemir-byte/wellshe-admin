"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AudioUploadFieldProps = {
  articleId: string;
  initialAssetId?: string | null;
  initialPath?: string | null;
};

export default function AudioUploadField({
  articleId,
  initialAssetId = null,
  initialPath = null,
}: AudioUploadFieldProps) {
  const [audioAssetId, setAudioAssetId] = useState<string | null>(initialAssetId);
  const [audioPath, setAudioPath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 🔹 Sadece audio kabul et
    if (!file.type.startsWith("audio/")) {
      setError("Lütfen sadece ses dosyası yükleyin (mp3, m4a, wav vb.).");
      return;
    }

    // 🔹 Maksimum 20MB
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("En fazla 20 MB boyutunda ses dosyası yükleyebilirsin.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();

      // 🔹 Uzantı
      const ext = file.name.includes(".")
        ? `.${file.name.split(".").pop()!.toLowerCase()}`
        : "";

      // 🔹 media bucket kullanıyoruz (covers için de aynı bucket’ı kullanıyorsun)
      const bucket = "media";
      const path = `audios/${articleId}/${Date.now()}${ext}`;

      // 1) Dosyayı Supabase Storage’a yükle (tarayıcı → Supabase)
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("supabase upload error", uploadError);
        throw uploadError;
      }

      const finalPath = data.path; // Supabase’in döndürdüğü path
      setAudioPath(finalPath);

      // 2) assets tablosundan ilgili kaydın id’sini çek
      const { data: assetRow, error: assetErr } = await supabase
        .from("assets")
        .select("id, path, bucket")
        .eq("bucket", bucket)
        .eq("path", finalPath)
        .single();

      if (assetErr) {
        console.error("assets row error", assetErr);
        throw new Error("Ses dosyası yüklendi ama assets kaydı bulunamadı.");
      }

      setAudioAssetId(assetRow.id);
    } catch (err: any) {
      console.error("audio upload error", err);
      setError(
        err?.message ??
          "Ses dosyası yüklenirken bir hata oluştu. Lütfen tekrar dene."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && (
        <div style={{ fontSize: 12, color: "#555" }}>Yükleniyor...</div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "crimson" }}>{error}</div>
      )}

      {audioPath && !uploading && (
        <div style={{ fontSize: 12, color: "#111" }}>
          Bağlı ses dosyası: <b>{audioPath}</b>
        </div>
      )}

      {/* Server action’a gidecek asıl alan */}
      <input
        type="hidden"
        name="audio_asset_id"
        value={audioAssetId ?? ""}
      />
    </div>
  );
}
