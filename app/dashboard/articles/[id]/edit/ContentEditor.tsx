"use client";

import React, { useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export type AssetMiniRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string | null;
  bytes?: number | null; // assets tablosunda bytes varsa (sende var)
};

function publicAssetUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return ""; // env yoksa boş döner, modal zaten eklemez
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function bytesToMB(bytes: number) {
  return bytes / (1024 * 1024);
}

export default function ContentEditor({
  name,
  initialHTML,
  assets,
  maxBytes = 2 * 1024 * 1024,
}: {
  name: string; // form input adı (content_html)
  initialHTML: string;
  assets: AssetMiniRow[];
  maxBytes?: number;
}) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [html, setHtml] = useState(initialHTML ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          loading: "lazy",
        },
      }),
    ],
    content: initialHTML ?? "",
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    },
  });

  const bigAssetIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets ?? []) {
      if (typeof a.bytes === "number" && a.bytes > maxBytes) set.add(a.id);
    }
    return set;
  }, [assets, maxBytes]);

  function insertImageFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    const url = publicAssetUrl(asset.bucket, asset.path);
    if (!url) {
      alert("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. Vercel env kontrol edin.");
      return;
    }

    // 2MB uyarısı
    const isBig = bigAssetIds.has(asset.id);
    if (isBig) {
      const mb =
        typeof asset.bytes === "number" ? bytesToMB(asset.bytes).toFixed(2) : "";
      const ok = confirm(
        `Bu görsel büyük görünüyor (${mb} MB). Yine de eklemek istiyor musunuz?`
      );
      if (!ok) return;
    }

    editor.chain().focus().setImage({ src: url }).run();
    setPickerOpen(false);
  }

  if (!editor) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={btn}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={btn}
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={btn}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={btn}
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={btn}
        >
          • Liste
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{ ...btn, fontWeight: 900 }}
        >
          📷 Görsel Ekle (Assets)
        </button>
      </div>

      {/* Editor */}
      <div style={editorBox}>
        <EditorContent editor={editor} />
      </div>

      {/* FormData’ya gidecek hidden field */}
      <textarea
        name={name}
        value={html}
        readOnly
        style={{ display: "none" }}
      />

      {/* Asset Picker Modal */}
      {isPickerOpen && (
        <div style={modalOverlay} onClick={() => setPickerOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Assets’ten Görsel Seç</div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                style={{ marginLeft: "auto", ...btn }}
              >
                Kapat
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Not: Buradaki görseller public bucket’ta olmalı. (media/public)
              2MB üzeri görseller “Büyük” diye işaretlenir.
            </div>

            <div style={assetGrid}>
              {(assets ?? []).map((a) => {
                const url = publicAssetUrl(a.bucket, a.path);
                const isBig = bigAssetIds.has(a.id);

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => insertImageFromAsset(a)}
                    style={assetCard}
                    title={a.path}
                  >
                    <div style={{ fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>
                      {a.path}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      {isBig && (
                        <span style={badge}>
                          Büyük
                          {typeof a.bytes === "number"
                            ? ` (${bytesToMB(a.bytes).toFixed(2)} MB)`
                            : ""}
                        </span>
                      )}
                      <span style={{ fontSize: 12, opacity: 0.65 }}>
                        {a.bucket}
                      </span>
                    </div>

                    {/* thumbnail */}
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        style={{
                          marginTop: 10,
                          width: "100%",
                          height: 140,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #eee",
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const editorBox: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  minHeight: 260,
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
  padding: 20,
};

const modal: React.CSSProperties = {
  width: "min(980px, 100%)",
  maxHeight: "85vh",
  overflow: "auto",
  background: "#fff",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #eee",
};

const assetGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 12,
};

const assetCard: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderRadius: 14,
  border: "1px solid #eee",
  background: "#fff",
  cursor: "pointer",
};

const badge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid #f0b",
  background: "#fff0f6",
};
