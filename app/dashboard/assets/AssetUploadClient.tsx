"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UploadError = string | null;

function AssetUploadClient() {
  const router = useRouter();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0] ?? null;

    if (!file) {
      setError("Lütfen bir dosya seçin.");
      return;
    }

    try {
      setUploading(true);

      // 1) Supabase Storage'a direkt upload
      const bucket = "media"; // media bucket'ını kullanıyoruz
      const filePath = `uploads/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2) DB'de assets kaydı oluştur
      const res = await fetch("/api/admin/assets/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket,
          path: filePath,
          bytes: file.size,
          contentType: file.type || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DB kayıt hatası: ${text}`);
      }

      // Başarılı → formu sıfırla + sayfayı yenile
      form.reset();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Beklenmeyen bir hata oluştu.");
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
      }}
    >
      <input type="file" name="file" accept="image/*,audio/*" required />

      <button
        type="submit"
        disabled={isUploading}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          cursor: "pointer",
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
