"use client";

import { useEffect, useMemo, useState } from "react";

type Asset = {
  id: string;
  bucket: string;
  path: string;
  bytes?: number | null;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  publicUrl?: string;
};

export default function CoverPicker({
  name,
  assets,
  defaultValue,
  placeholder,
}: {
  name: string;
  assets: Asset[];
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>(defaultValue ?? "");

  useEffect(() => {
    setSelectedId(defaultValue ?? "");
  }, [defaultValue]);

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId]
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return assets;
    return assets.filter((a) => a.path.toLowerCase().includes(t));
  }, [assets, q]);

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  };

  function pick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setOpen(false);
  }

  function close(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setOpen(false);
  }

  function clear(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setSelectedId("");
    setOpen(false);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name={name} value={selectedId} />

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" onClick={() => setOpen((s) => !s)} style={btn}>
          {selected ? "Kapak değiştir" : "Kapak seç"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {selected ? selected.path : placeholder ?? "Kapak ara (örn: covers/2025-12)"}
        </div>

        {open ? (
          <button type="button" onClick={close} style={btn}>
            Kapat
          </button>
        ) : null}
      </div>

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
            onClick={clear}
            style={{ ...btn, marginLeft: "auto", padding: "8px 10px" }}
          >
            Kaldır
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder ?? "Kapak ara (örn: covers/2025-12)"}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 600,
            }}
          />

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
            <button
              type="button"
              onClick={(e) => pick(e, "")}
              style={{
                border: selectedId === "" ? "2px solid #111" : "1px solid #eee",
                borderRadius: 12,
                background: "#fff",
                padding: 8,
                cursor: "pointer",
              }}
              title="Kapak yok"
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
                onClick={(e) => pick(e, a.id)}
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
            Not: Seçince otomatik kapanır.
          </div>
        </div>
      ) : null}
    </div>
  );
}
