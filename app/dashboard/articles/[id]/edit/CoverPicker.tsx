"use client";

import { useMemo, useState } from "react";

type Asset = {
  id: string;
  bucket: string;
  path: string;
  bytes?: number | null;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  publicUrl?: string; // page.tsx’ten hesaplanıp gelecek
};

export default function CoverPicker({
  name,
  assets,
  defaultValue,
  placeholder,
}: {
  name: string; // "cover_asset_id"
  assets: Asset[]; // sadece image/* olanlar gelmeli
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>(defaultValue ?? "");

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId]
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return assets;
    return assets.filter((a) => a.path.toLowerCase().includes(t));
  }, [assets, q]);

  function pick(id: string) {
    setSelectedId(id);
    setOpen(false);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* hidden input: form submit buradan gidecek */}
      <input type="hidden" name={name} value={selectedId} />

      {/* Kapalı görünüm */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {selected ? "Kapak değiştir" : "Kapak seç"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {selected ? selected.path : placeholder ?? "Kapak ara (örn: covers/2025-12)"}
        </div>
      </div>

      {/* Seçili önizleme (küçük) */}
      {selected?.publicUrl ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.publicUrl}
            alt="selected cover"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #eee",
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>Seçili kapak</div>
            {selected.path}
          </div>

          <button
            type="button"
            onClick={() => setSelectedId("")}
            style={{
              marginLeft: "auto",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Kaldır
          </button>
        </div>
      ) : null}

      {/* Açılır panel */}
      {open ? (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder ?? "Kapak ara (örn: covers/2025-12)"}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                fontWeight: 600,
              }}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Kapat
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 10,
              maxHeight: 320,
              overflow: "auto",
              paddingRight: 4,
            }}
          >
            {/* Kapak seçmeyin kutusu */}
            <button
              type="button"
              onClick={() => pick("")}
              style={{
                border: selectedId === "" ? "2px solid #111" : "1px solid #eee",
                borderRadius: 12,
                background: "#fff",
                padding: 8,
                cursor: "pointer",
              }}
              title="Kapak seçmeyin"
            >
              <div
                style={{
                  width: "100%",
                  height: 64,
                  borderRadius: 10,
                  border: "1px dashed #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  opacity: 0.7,
                }}
              >
                Kapak yok
              </div>
            </button>

            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pick(a.id)}
                style={{
                  border: a.id === selectedId ? "2px solid #111" : "1px solid #eee",
                  borderRadius: 12,
                  background: "#fff",
                  padding: 8,
                  cursor: "pointer",
                }}
                title={a.path}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.publicUrl || ""}
                  alt={a.path}
                  style={{
                    width: "100%",
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid #eee",
                    background: "#fafafa",
                  }}
                />
              </button>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Not: Seçince otomatik kapanır. Çok büyük görünmez; sadece thumbnail.
          </div>
        </div>
      ) : null}
    </div>
  );
}
