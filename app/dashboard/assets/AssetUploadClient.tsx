"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type UploadError = string | null;

// 🔑 Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil!"
  );
}

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Türkçe karakterleri ve boşlukları temizleyip güvenli bir dosya adı üretelim
function makeSafeFileName(original: string) {
  // 1) Uzantıyı ayır
  const lastDot = original.lastIndexOf(".");
  let base = lastDot > 0 ? original.slice(0, lastDot) : original;
  let ext = lastDot > 0 ? original.slice(lastDot) : "";

  // 2) Unicode → ASCII (aksan vs. temizleme)
  base = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // diakritik temizle

  // 3) Türkçe karakterleri ve özel karakterleri sadeleştir
  base = base
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");

  // 4) Harf/rakam/./dışındaki her şeyi tire yap
  base = base.replace(/[^a-zA-Z0-9\.]+/g, "-");

  // 5) Birden fazla tırayı sadeleştir, baş/sondaki tireleri al
  base = base.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  // 6) Küçük harfe çevir
  base = base.toLowerCase();

  // 7) Uzantıyı standartlaştır (mp3/jpg vs. küçük harf)
  if (!ext) {
    ext = "";
  } else {
    ext = ext.toLowerCase();
  }

  if (!base) {
    base = "file";
  }

  return `${base}${ext}`;
}

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

    if (!supabase) {
      setError(
        "Supabase yapılandırması eksik. Lütfen NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY env değişkenlerini kontrol edin."
      );
      return;
    }

    try {
      setUploading(true);

      // 🔐 Güvenli dosya adı üret
      const safeName = makeSafeFileName(file.name);
      const bucket = "media"; // media bucket'ını kullanıyoruz
      const filePath = `uploads/${Date.now()}-${safeName}`;

      // 1) Supabase Storage'a direkt upload
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
