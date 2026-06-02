"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAsset } from "./actions";

type UploadError = string | null;

function AssetUploadClient() {
  const router = useRouter();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      setError("Lütfen bir dosya seçin.");
      return;
    }

    try {
      setUploading(true);

      await uploadAsset(formData);

      form.reset();
      router.refresh();
    } catch (err: any) {
      console.error("asset upload error", err);
      setError(
        err?.message ??
          "Dosya yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar dene."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 16,
        marginBottom: 24,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        type="file"
        name="file"
        accept="image/*,audio/*,video/mp4,.mp4,.m4a,.mp3,.wav"
        required
      />

      <button
        type="submit"
        disabled={isUploading}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          cursor: isUploading ? "not-allowed" : "pointer",
          fontWeight: 700,
          background: isUploading ? "#f5f5f5" : "#fff",
          opacity: isUploading ? 0.7 : 1,
        }}
      >
        {isUploading ? "Yükleniyor..." : "Upload"}
      </button>

      {error && (
        <span style={{ fontSize: 12, color: "crimson", fontWeight: 700 }}>
          {error}
        </span>
      )}
    </form>
  );
}

export default AssetUploadClient;