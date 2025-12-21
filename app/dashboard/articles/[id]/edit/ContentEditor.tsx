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
  bytes?: number | null;
  content_type?: string | null;
};

function publicAssetUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function bytesToMB(bytes: number) {
  return bytes / (1024 * 1024);
}

function isLikelyImage(a: AssetMiniRow) {
  const ct = (a.content_type || "").toLowerCase();
  if (ct.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(a.path);
}

function isLikelyAudio(a: AssetMiniRow) {
  const ct = (a.content_type || "").toLowerCase();
  if (ct.startsWith("audio/")) return true;
  return /\.(mp3|m4a|aac|wav|ogg)$/i.test(a.path);
}

const DEFAULT_AUDIO_TITLE = "Okumak istemiyorsan dinle <3";

function buildAudioBlockHtml(src: string, title = DEFAULT_AUDIO_TITLE) {
  const safeTitle = title.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `
<div class="ws-audio" data-ws-audio="1">
  <div class="ws-audio-title">${safeTitle}</div>
  <audio controls preload="none" src="${src}"></audio>
</div>
`;
}

function stripExistingAudioBlock(html: string) {
  // data-ws-audio="1" olan bloğu kaldır
  return (html || "").replace(
    /<div class="ws-audio"[^>]*data-ws-audio="1"[^>]*>[\s\S]*?<\/div>\s*/g,
    ""
  );
}

export default function ContentEditor({
  name,
  initialHTML,
  assets,
  maxImageBytes = 2 * 1024 * 1024,
  maxAudioBytes = 8 * 1024 * 1024,
  audioTitle = DEFAULT_AUDIO_TITLE,
}: {
  name: string;
  initialHTML: string;
  assets: AssetMiniRow[];
  maxImageBytes?: number;
  maxAudioBytes?: number;
  audioTitle?: string;
}) {
  const [isImagePickerOpen, setImagePickerOpen] = useState(false);
  const [isAudioPickerOpen, setAudioPickerOpen] = useState(false);
  const [html, setHtml] = useState(initialHTML ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: "lazy" },
      }),
    ],
    content: initialHTML ?? "",
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    },
  });

  const bigImageIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets ?? []) {
      if (!isLikelyImage(a)) continue;
      if (typeof a.bytes === "number" && a.bytes > maxImageBytes) set.add(a.id);
    }
    return set;
  }, [assets, maxImageBytes]);

  const bigAudioIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets ?? []) {
      if (!isLikelyAudio(a)) continue;
      if (typeof a.bytes === "number" && a.bytes > maxAudioBytes) set.add(a.id);
    }
    return set;
  }, [assets, maxAudioBytes]);

  function confirmBig(asset: AssetMiniRow, type: "image" | "audio") {
    const isBig =
      type === "image" ? bigImageIds.has(asset.id) : bigAudioIds.has(asset.id);

    if (!isBig) return true;

    const mb =
      typeof asset.bytes === "number" ? bytesToMB(asset.bytes).toFixed(2) : "";
    const limitMb =
      type === "image"
        ? bytesToMB(maxImageBytes).toFixed(0)
        : bytesToMB(maxAudioBytes).toFixed(0);

    return confirm(
      `${type === "image" ? "Görsel" : "Ses"} büyük görünüyor (${mb} MB). ` +
        `Limitiniz ${limitMb} MB. Yine de eklemek istiyor musunuz?`
    );
  }

  function insertImageFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    const url = publicAssetUrl(asset.bucket, asset.path);
    if (!url) {
      alert("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. Vercel env kontrol edin.");
      return;
    }

    if (!confirmBig(asset, "image")) return;

    editor.chain().focus().setImage({ src: url }).run();
    setImagePickerOpen(false);
  }

  function setAudioFromAsset(asset: AssetMiniRow) {
    if (!editor) return;

    const url = publicAssetUrl(asset.bucket, asset.path);
    if (!url) {
      alert("NEXT_PUBLIC_SUPABASE_URL tanımlı değil. Vercel env kontrol edin.");
      return;
    }

    if (!confirmBig(asset, "audio")) return;

    // İçerikte varsa eski audio bloğunu kaldırıp başa ekle
    const current = editor.getHTML();
    const cleaned = stripExistingAudioBlock(current);
    const audioHtml = buildAudioBlockHtml(url, audioTitle);

    editor.commands.setContent(audioHtml + cleaned, false);
    setAudioPickerOpen(false);
  }

  function removeAudioBlock() {
    if (!editor) return;
    const cleaned = stripExistingAudioBlock(editor.getHTML());
    editor.commands.setContent(cleaned, false);
  }

  if (!editor) return null;

  const imageAssets = (assets ?? []).filter(isLikelyImage);
  const audioAssets = (assets ?? []).filter(isLikelyAudio);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Toolbar */}
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
          🎧 Ses Ekle (Assets)
        </button>

        <button
          type="button"
          onClick={removeAudioBlock}
          style={{ ...btn, opacity: 0.85 }}
          title="İçerikteki ses bloğunu kaldır"
        >
          Ses Kaldır
        </button>
      </div>

      {/* Editor */}
      <div style={editorBox}>
        <EditorContent editor={editor} />

        {/* TipTap stilleri */}
        <style>{`
          .ProseMirror {
            outline: none;
            min-height: 260px;
            padding: 6px 4px;
            font-size: 15px;
            line-height: 24px;
            font-weight: 400;
            color: #111;
            caret-color: #111; /* imleç görünür */
          }

          .ProseMirror p { margin: 0 0 14px 0; }

          .ProseMirror h2 {
            margin: 18px 0 10px;
            font-size: 20px;
            line-height: 28px;
            font-weight: 700;
          }

          .ProseMirror h3 {
            margin: 16px 0 8px;
            font-size: 17px;
            line-height: 24px;
            font-weight: 650;
          }

          .ProseMirror strong { font-weight: 700; }

          .ProseMirror ul {
            margin: 0 0 14px 0;
            padding-left: 18px;
          }

          .ProseMirror li { margin: 0 0 8px 0; }

          /* Editörde görseller küçük görünsün */
          .ProseMirror img {
            display: block;
            max-width: min(420px, 100%);
            width: 100%;
            height: auto;
            border-radius: 12px;
            margin: 10px auto;
            border: 1px solid #eee;
          }

          .ProseMirror img.ProseMirror-selectednode {
            outline: 2px solid #111;
          }

          /* Editörde audio bloğu */
          .ProseMirror .ws-audio {
            border: 1px solid #eee;
            border-radius: 12px;
            padding: 12px;
            background: #fafafa;
            margin: 0 0 14px 0;
          }
          .ProseMirror .ws-audio-title {
            font-weight: 800;
            margin-bottom: 8px;
          }
          .ProseMirror .ws-audio audio {
            width: 100%;
          }
        `}</style>
      </div>

      {/* FormData için hidden */}
      <textarea name={name} value={html} readOnly style={{ display: "none" }} />

      {/* IMAGE PICKER */}
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
              2MB üzeri görseller “Büyük” diye işaretlenir.
            </div>

            <div style={assetGrid}>
              {imageAssets.map((a) => {
                const url = publicAssetUrl(a.bucket, a.path);
                const isBig = bigImageIds.has(a.id);

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

      {/* AUDIO PICKER */}
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
              {bytesToMB(maxAudioBytes).toFixed(0)}MB üzeri dosyalarda uyarı alırsınız.
              (mp3 / m4a / wav / ogg)
            </div>

            <div style={assetGrid}>
              {audioAssets.map((a) => {
                const isBig = bigAudioIds.has(a.id);

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudioFromAsset(a)}
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
                      <span style={{ fontSize: 12, opacity: 0.65 }}>{a.bucket}</span>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                      Seçince içerik başına “{audioTitle}” bloğu eklenir.
                    </div>
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

/* ---------------- styles ---------------- */

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
