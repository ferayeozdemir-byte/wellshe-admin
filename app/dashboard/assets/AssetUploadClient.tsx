"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAsset } from "./actions";

type UploadError = string | null;

function isR2PlayableMedia(file: File) {
  const ct = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();

  return (
    ct.startsWith("audio/") ||
    ct === "video/mp4" ||
    name.endsWith(".mp3") ||
    name.endsWith(".m4a") ||
    name.endsWith(".wav") ||
    name.endsWith(".mp4")
  );
}

function AssetUploadClient() {
  const router = useRouter();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError>(null);

  async function uploadPlayableMediaToR2(file: File) {
    const signRes = await fetch("/api/admin/assets/r2-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        bytes: file.size,
      }),
    });

    const signJson = await signRes.json();

    if (!signRes.ok) {
      throw new Error(
        signJson?.error ||
        signJson?.details ||
        "R2 upload URL oluşturulamadı."
      );
    }

    const uploadRes = await fetch(signJson.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": signJson.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`R2 upload hatası: ${uploadRes.status} ${text}`);
    }

    const registerRes = await fetch("/api/admin/assets/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucket: signJson.bucket,
        path: signJson.path,
        bytes: file.size,
        contentType: signJson.contentType,
        storageProvider: "r2",
        storageKey: signJson.storageKey,
        publicUrl: signJson.publicUrl,
      }),
    });

    const registerJson = await registerRes.json();

    if (!registerRes.ok) {
      throw new Error(
        registerJson?.error ||
        registerJson?.details ||
        "R2 dosyası yüklendi ama assets kaydı oluşturulamadı."
      );
    }
  }

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

      if (isR2PlayableMedia(file)) {
        await uploadPlayableMediaToR2(file);
      } else {
        await uploadAsset(formData);
      }

      form.reset();
      router.refresh();
    } catch (err: unknown) {
      console.error("asset upload error", err);

      const message =
        err instanceof Error
          ? err.message
          : "Dosya yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar dene.";

      setError(message);
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