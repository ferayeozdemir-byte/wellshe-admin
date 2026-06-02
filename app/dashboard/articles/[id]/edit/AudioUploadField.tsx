"use client";

import React, { useState } from "react";

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

  if (!file.type.startsWith("audio/")) {
    setError("Lütfen sadece ses dosyası yükleyin (mp3, m4a, wav vb.).");
    return;
  }

  const maxBytes = 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    setError("En fazla 20 MB boyutunda ses dosyası yükleyebilirsin.");
    return;
  }

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("articleId", articleId);

    const res = await fetch("/api/admin/assets/upload-audio", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(
        json?.error ||
          json?.details ||
          "Ses dosyası yüklenirken bir hata oluştu."
      );
    }

    setAudioPath(json.path);
    setAudioAssetId(json.assetId);
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
