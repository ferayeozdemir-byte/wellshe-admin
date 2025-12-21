"use client";

import { useMemo, useState } from "react";

type AssetMini = {
  id: string;
  bucket: string;
  path: string;
  content_type: string | null;
  bytes: number | null;
};

function publicUrl(bucket: string, path: string) {
  // Supabase bucket public ise bu çalışır.
  // Eğer public değilse signed url gerekir (istersen onu da ekleriz).
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export default function CoverPicker({
  name,
  assets,
  defaultValue,
}: {
  name: string; // "cover_asset_id"
  assets: AssetMini[]; // sadece image/*
  defaultValue?: string | null;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(defaultValue ?? "");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return assets;
    return assets.filter((a) => a.path.toLowerCase().includes(s));
  }, [q, assets]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* form submit için gerçek değer */}
      <input type="hidden" name={name} value={selected} />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Kapak ara (örn: covers/2025-12)"
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontWeight: 500,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {/* Kapak seçmeyin */}
        <button
          type="button"
          onClick={() => setSelected("")}
          style={{
            border: selected === "" ? "2px solid #111" : "1px solid #ddd",
            borderRadius: 12,
            padding: 10,
            background: "#fff",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Kapak seçmeyin</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Varsa kapak kaldırılır.</div>
        </button>

        {filtered.map((a) => {
          const url = publicUrl(a.bucket, a.path);
          const active = selected === a.id;

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a.id)}
              style={{
                border: active ? "2px solid #111" : "1px solid #ddd",
                borderRadius: 12,
                padding: 10,
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
              title={a.path}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/10",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#f6f6f6",
                  marginBottom: 8,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={a.path}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ fontSize: 12, opacity: 0.85, wordBreak: "break-all" }}>
                {a.path}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                {typeof a.bytes === "number"
                  ? `${(a.bytes / (1024 * 1024)).toFixed(2)} MB`
                  : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
