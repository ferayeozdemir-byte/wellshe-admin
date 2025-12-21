"use client";

import React, { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export type AssetMiniRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string | null;
  bytes: number | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
};

function publicAssetUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function bytesToMB(bytes: number) {
  return bytes / (1024 * 1024);
}

export default function ContentEditor({
  name,
  initialHTML,
  assets,
  maxBytes = 2 * 1024 * 1024, // 2MB
  maxWidth = 2400, // ölçü uyarısı için eşik (istersen değiştir)
  maxHeight = 2400,
}: {
  name: string; // form input name (content_html)
  initialHTML: string;
  assets: AssetMiniRow[];
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [html, setHtml] = useState(initialHTML ?? "");

  const imageAssets = useMemo(() => {
    return (assets ?? []).filter((a) => (a.content_type ?? "").startsWith("image/"));
  }, [assets]);

  const bigIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of imageAssets) {
      if (typeof a.bytes === "number" && a.bytes > maxBytes) set.add(a.id);
    }
    return set;
  }, [imageAssets, maxBytes]);

  const hugeDimIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of imageAssets) {
      const w = a.width ?? 0;
      const h = a.height ?? 0;
      if (w >= maxWidth || h >= maxHeight) set.add(a.id);
    }
    return set;
  }, [imageAssets, maxWidth, maxHeight]);

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
    editorProps: {
      attributes: {
        class: "wellshe-editor", // CSS ile kontrol edeceğiz
      },
    },
  });

  function insertImageFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    const url = publicAssetUrl(asset.bucket, asset.path);
    if (!url) {
      alert("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. Vercel Env kontrol edin.");
      return;
    }

    // 2MB uyarısı
    const isBig = bigIds.has(asset.id);
    if (isBig) {
      const mb = typeof asset.bytes === "number" ? bytesToMB(asset.bytes).toFixed(2) : "?";
      const ok = confirm(`Bu görsel büyük görünüyor (${mb} MB). Yine de eklemek istiyor musunuz?`);
      if (!ok) return;
    }

    // ölçü uyarısı
    const isHugeDim = hugeDimIds.has(asset.id);
    if (isHugeDim) {
      const w = asset.width ?? "?";
      const h = asset.height ?? "?";
      const ok = confirm(`Bu görselin ölçüsü büyük (${w}×${h}). Yine de eklemek istiyor musunuz?`);
      if (!ok) return;
    }

    editor.chain().focus().setImage({ src: url }).run();
    setPickerOpen(false);
  }

  if (!editor) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Toolbar */}
      <div style={toolbar}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btn}>
          Bold
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btn}>
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

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn}>
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

      {/* Form submit için hidden */}
      <textarea name={name} value={html} readOnly style={{ display: "none" }} />

      {/* Picker Modal */}
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
              Not: Sadece <b>image/*</b> olanlar listelenir. 2MB+ veya yüksek çözünürlükte uyarı verir.
            </div>

            <div style={assetGrid}>
              {imageAssets.map((a) => {
                const url = publicAssetUrl(a.bucket, a.path);
                const isBig = bigIds.has(a.id);
                const isHuge = hugeDimIds.has(a.id);

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => insertImageFromAsset(a)}
                    style={assetCard}
                    title={a.path}
                  >
                    <div style={{ fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>{a.path}</div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {isBig && (
                        <span style={badge}>
                          2MB+
                          {typeof a.bytes === "number" ? ` (${bytesToMB(a.bytes).toFixed(2)} MB)` : ""}
                        </span>
                      )}

                      {isHuge && (
                        <span style={badgeDim}>
                          Büyük ölçü
                          {(a.width && a.height) ? ` (${a.width}×${a.height})` : ""}
                        </span>
                      )}

                      <span style={{ fontSize: 12, opacity: 0.65 }}>{a.bucket}</span>
                    </div>

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

      {/* TipTap CSS */}
      <style>{`
        .wellshe-editor.ProseMirror {
          outline: none;
          min-height: 260px;
          padding: 8px 6px;
          font-size: 15px;
          line-height: 24px;
          font-weight: 400;
          color: #111;
          caret-color: #111; /* ✅ imleç görünür */
        }

        .wellshe-editor.ProseMirror p {
          margin: 0 0 14px 0;
        }

        .wellshe-editor.ProseMirror h2 {
          margin: 18px 0 10px;
          font-size: 20px;
          line-height: 28px;
          font-weight: 750;
        }

        .wellshe-editor.ProseMirror h3 {
          margin: 16px 0 8px;
          font-size: 17px;
          line-height: 24px;
          font-weight: 650;
        }

        .wellshe-editor.ProseMirror strong {
          font-weight: 700;
        }

        .wellshe-editor.ProseMirror ul {
          margin: 0 0 14px 0;
          padding-left: 18px;
        }

        .wellshe-editor.ProseMirror li {
          margin: 0 0 8px 0;
        }

        /* ✅ Editörde görseller küçük görünsün */
        .wellshe-editor.ProseMirror img {
          display: block;
          max-width: min(420px, 100%);
          width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 10px auto;
          border: 1px solid #eee;
        }

        .wellshe-editor.ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #111;
        }
      `}</style>
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

const toolbar: React.CSSProperties = {
  position: "sticky",
  top: 12,
  zIndex: 50,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fff",
};

const editorBox: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  minHeight: 300,
  background: "#fff",
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

const badgeDim: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid #0b6",
  background: "#f0fff8",
};
