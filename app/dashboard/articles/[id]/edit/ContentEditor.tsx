"use client";

import React, { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Node } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";

export type AssetMiniRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string | null;
  bytes: number | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  storage_provider?: string | null;
  storage_key?: string | null;
  public_url?: string | null;
};

function publicAssetUrl(asset: AssetMiniRow) {
  if (asset.public_url) return asset.public_url;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";

  return `${base}/storage/v1/object/public/${asset.bucket}/${asset.path}`;
}

const AudioBlock = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      assetId: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-asset-id") ||
          element.getAttribute("data-wellshe-audio"),
        renderHTML: (attributes) => ({
          "data-asset-id": attributes.assetId,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'wellshe-audio[data-asset-id]' },
      { tag: 'div[data-wellshe-audio]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["wellshe-audio", HTMLAttributes];
  },
});

function bytesToMB(bytes: number) {
  return bytes / (1024 * 1024);
}

export default function ContentEditor({
  name,
  initialHTML,
  assets,
  maxBytes = 2 * 1024 * 1024,
  maxWidth = 2400,
  maxHeight = 2400,
}: {
  name: string;
  initialHTML: string;
  assets: AssetMiniRow[];
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const [isImagePickerOpen, setImagePickerOpen] = useState(false);
  const [isAudioPickerOpen, setAudioPickerOpen] = useState(false);
  const [html, setHtml] = useState(initialHTML ?? "");

  const [imageInputValue, setImageInputValue] = useState("");
  const [imageQuery, setImageQuery] = useState("");

  const [audioInputValue, setAudioInputValue] = useState("");
  const [audioQuery, setAudioQuery] = useState("");

  const imageAssets = useMemo(() => {
    return (assets ?? []).filter((a) =>
      String(a.content_type ?? "").startsWith("image/")
    );
  }, [assets]);

  const audioAssets = useMemo(() => {
    return (assets ?? []).filter((a) => {
      const ct = String(a.content_type ?? "").toLowerCase();
      return ct.startsWith("audio/") || ct === "video/mp4";
    });
  }, [assets]);

  const filteredImageAssets = useMemo(() => {
    const q = imageQuery.trim().toLowerCase();
    if (!q) return imageAssets;

    return imageAssets.filter((a) => {
      const path = String(a.path ?? "").toLowerCase();
      const bucket = String(a.bucket ?? "").toLowerCase();
      return path.includes(q) || bucket.includes(q);
    });
  }, [imageAssets, imageQuery]);

  const filteredAudioAssets = useMemo(() => {
    const q = audioQuery.trim().toLowerCase();
    if (!q) return audioAssets;

    return audioAssets.filter((a) => {
      const path = String(a.path ?? "").toLowerCase();
      const bucket = String(a.bucket ?? "").toLowerCase();
      return path.includes(q) || bucket.includes(q);
    });
  }, [audioAssets, audioQuery]);

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
      StarterKit.configure({}),
      AudioBlock,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          loading: "lazy",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: initialHTML ?? "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "wellshe-editor",
      },
    },
  });

  function insertImageFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    const url = publicAssetUrl(asset);
    if (!url) {
      alert("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. Vercel Env kontrol edin.");
      return;
    }

    const isBig = bigIds.has(asset.id);
    if (isBig) {
      const mb =
        typeof asset.bytes === "number" ? bytesToMB(asset.bytes).toFixed(2) : "?";
      const ok = confirm(
        `Bu görsel büyük görünüyor (${mb} MB). Yine de eklemek istiyor musunuz?`
      );
      if (!ok) return;
    }

    const isHugeDim = hugeDimIds.has(asset.id);
    if (isHugeDim) {
      const w = asset.width ?? "?";
      const h = asset.height ?? "?";
      const ok = confirm(
        `Bu görselin ölçüsü büyük (${w}×${h}). Yine de eklemek istiyor musunuz?`
      );
      if (!ok) return;
    }

    editor.chain().focus().setImage({ src: url }).run();
    setImagePickerOpen(false);
  }

  function insertAudioFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "audioBlock",
          attrs: { assetId: asset.id },
        },
        {
          type: "paragraph",
        },
      ])
      .run();

    setAudioPickerOpen(false);
  }

  function addLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;

    const url = window.prompt(
      "Bağlantı adresi (https://...):",
      previousUrl && typeof previousUrl === "string" ? previousUrl : "https://"
    );

    if (!url) return;

    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      alert("Lütfen http:// veya https:// ile başlayan geçerli bir URL girin.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }

  if (!editor) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={toolbar}>
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
          onClick={addLink}
          style={{ ...btn, fontWeight: 900 }}
        >
          🔗 Link Ekle
        </button>

        <button type="button" onClick={removeLink} style={btn}>
          Linki Kaldır
        </button>

        <button
          type="button"
          onClick={() => setImagePickerOpen(true)}
          style={{ ...btn, fontWeight: 900 }}
        >
          📷 Görsel Ekle (Assets)
        </button>

        <button
          type="button"
          onClick={() => setAudioPickerOpen(true)}
          style={{ ...btn, fontWeight: 900 }}
        >
          🎵 Ses Ekle (Assets)
        </button>
      </div>

      <div style={editorBox}>
        <EditorContent editor={editor} />
      </div>

      <textarea name={name} value={html} readOnly style={{ display: "none" }} />

      {isImagePickerOpen && (
        <div style={modalOverlay} onClick={() => setImagePickerOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Assets’ten Görsel Seç</div>
              <button
                type="button"
                onClick={() => setImagePickerOpen(false)}
                style={{ marginLeft: "auto", ...btn }}
              >
                Kapat
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Not: Sadece <b>image/*</b> olanlar listelenir. 2MB+ veya yüksek
              çözünürlükte uyarı verir.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 10,
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <input
                value={imageInputValue}
                onChange={(e) => setImageInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setImageQuery(imageInputValue);
                  }
                }}
                placeholder="Görsel ara (örn: astroloji, uploads/...)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontWeight: 600,
                }}
              />

              <button
                type="button"
                onClick={() => setImageQuery(imageInputValue)}
                style={btn}
              >
                Ara
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageInputValue("");
                  setImageQuery("");
                }}
                style={btn}
              >
                Temizle
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              {filteredImageAssets.length} sonuç bulundu
            </div>

            <div style={assetGrid}>
              {filteredImageAssets.map((a) => {
                const url = publicAssetUrl(a);
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
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        wordBreak: "break-all",
                      }}
                    >
                      {a.path}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {isBig && (
                        <span style={badge}>
                          2MB+
                          {typeof a.bytes === "number"
                            ? ` (${bytesToMB(a.bytes).toFixed(2)} MB)`
                            : ""}
                        </span>
                      )}

                      {isHuge && (
                        <span style={badgeDim}>
                          Büyük ölçü
                          {a.width && a.height ? ` (${a.width}×${a.height})` : ""}
                        </span>
                      )}

                      <span style={{ fontSize: 12, opacity: 0.65 }}>{a.bucket}</span>
                    </div>

                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

      {isAudioPickerOpen && (
        <div style={modalOverlay} onClick={() => setAudioPickerOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Assets’ten Ses Dosyası Seç</div>
              <button
                type="button"
                onClick={() => setAudioPickerOpen(false)}
                style={{ marginLeft: "auto", ...btn }}
              >
                Kapat
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Not: Sadece <b>audio/*</b> olan dosyalar listelenir. Seçilen ses,
              imlecin bulunduğu yere içerik bloğu olarak eklenir.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 10,
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <input
                value={audioInputValue}
                onChange={(e) => setAudioInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setAudioQuery(audioInputValue);
                  }
                }}
                placeholder="Ses ara (örn: meditation, nefes, uploads/...)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontWeight: 600,
                }}
              />

              <button
                type="button"
                onClick={() => setAudioQuery(audioInputValue)}
                style={btn}
              >
                Ara
              </button>

              <button
                type="button"
                onClick={() => {
                  setAudioInputValue("");
                  setAudioQuery("");
                }}
                style={btn}
              >
                Temizle
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              {filteredAudioAssets.length} sonuç bulundu
            </div>

            <div style={assetGrid}>
              {filteredAudioAssets.map((a) => {
                const sizeLabel =
                  typeof a.bytes === "number"
                    ? `${bytesToMB(a.bytes).toFixed(2)} MB`
                    : "Boyut bilinmiyor";

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => insertAudioFromAsset(a)}
                    style={assetCard}
                    title={a.path}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        wordBreak: "break-all",
                      }}
                    >
                      {a.path}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={badgeAudio}>Ses</span>
                      <span style={{ fontSize: 12, opacity: 0.65 }}>{sizeLabel}</span>
                      <span style={{ fontSize: 12, opacity: 0.65 }}>{a.bucket}</span>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid #eee",
                        background: "#faf7f7",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      🎵 Bu sesi içeriğe ekle
                    </div>
                  </button>
                );
              })}

              {filteredAudioAssets.length === 0 && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #eee",
                    background: "#fff",
                    fontSize: 14,
                    color: "#555",
                  }}
                >
                  Henüz yüklenmiş ses dosyası yok.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .wellshe-editor.ProseMirror {
          outline: none;
          min-height: 260px;
          padding: 8px 6px;
          font-size: 15px;
          line-height: 24px;
          font-weight: 400;
          color: #111;
          caret-color: #111;
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

        .wellshe-editor.ProseMirror em {
          font-style: italic;
        }

        .wellshe-editor.ProseMirror a {
          color: #B0756F;
          text-decoration: underline;
          font-weight: 600;
        }

        .wellshe-editor.ProseMirror ul {
          margin: 0 0 14px 0;
          padding-left: 18px;
        }

        .wellshe-editor.ProseMirror li {
          margin: 0 0 8px 0;
        }

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

        .wellshe-editor.ProseMirror wellshe-audio {
          display: block;
          margin: 12px 0;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px dashed #d7a7af;
          background: #fdf1f3;
        }

        .wellshe-editor.ProseMirror wellshe-audio::before {
          content: "🎵 Ses bloğu eklendi";
          font-weight: 700;
          color: #7a4850;
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

const badgeAudio: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid #7a4850",
  background: "#fdf1f3",
};