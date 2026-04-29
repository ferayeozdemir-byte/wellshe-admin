import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { updatePractice } from "../../actions";
import CoverPicker from "../../../articles/[id]/edit/CoverPicker";

type AssetMiniRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string | null;
  bytes: number | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
};

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function EditPracticePage(props: Props) {
  await requireAdmin();
  const supabase = await createClient();

  const resolvedParams = await Promise.resolve(props.params);
  const id = resolvedParams.id;

  const { data: practice, error } = await supabase
    .from("breathing_practices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !practice) notFound();

  const { data: assetsData, error: asErr } = await supabase
    .from("assets")
    .select("id,bucket,path,created_at,bytes,content_type,width,height")
    .order("created_at", { ascending: false })
    .limit(200);

  const assets: AssetMiniRow[] = (assetsData ?? []) as AssetMiniRow[];

  const audioAssets = assets.filter((a) =>
    String(a.content_type ?? "").startsWith("audio/")
  );

  const imageAssetsForPicker = assets
    .filter((a) => String(a.content_type ?? "").startsWith("image/"))
    .map((a) => ({
      id: a.id,
      bucket: a.bucket,
      path: a.path,
      content_type: a.content_type ?? null,
      bytes: a.bytes ?? null,
      publicUrl:
        supabase.storage.from(a.bucket).getPublicUrl(a.path).data.publicUrl,
    }));

  const currentCoverId = practice.cover_asset_id ?? null;
  const currentCover = assets.find((a) => a.id === currentCoverId);

  const coverPreviewUrl =
    currentCover?.bucket && currentCover?.path
      ? supabase.storage.from(currentCover.bucket).getPublicUrl(
          currentCover.path
        ).data.publicUrl
      : "";

  const currentAudioId = practice.audio_asset_id ?? null;
  const currentAudio = assets.find((a) => a.id === currentAudioId);

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>Edit Practice</h1>

        <Link href="/dashboard/practices" style={{ textDecoration: "none" }}>
          ← Practices
        </Link>

        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          ID: {practice.id}
        </div>
      </div>

      {asErr ? (
        <p style={{ color: "crimson" }}>Assets okunamadı: {asErr.message}</p>
      ) : null}

      <form action={updatePractice} style={{ display: "grid", gap: 18 }}>
        <input type="hidden" name="id" value={practice.id} />

        <div style={card}>
          <h3 style={sectionTitle}>Temel Bilgiler</h3>

          <div style={grid2}>
            <label style={label}>
              <span>Status</span>
              <select name="status" defaultValue={practice.status} style={input}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="scheduled">scheduled</option>
              </select>
            </label>

            <label style={label}>
              <span>Tür</span>
              <select name="kind" defaultValue={practice.kind} style={input}>
                <option value="breath">Nefes Egzersizi</option>
                <option value="meditation">Meditasyon</option>
              </select>
            </label>
          </div>

          <label style={label}>
            <span>Başlık</span>
            <input
              name="title"
              defaultValue={practice.title ?? ""}
              style={input}
              placeholder="Örn. Rahatlama"
            />
          </label>

          <label style={label}>
            <span>Teknik adı</span>
            <input
              name="technique_title"
              defaultValue={practice.technique_title ?? ""}
              style={input}
              placeholder="Örn. 4-4-6 Nefes Tekniği"
            />
          </label>

          <label style={label}>
            <span>Kısa açıklama</span>
            <textarea
              name="summary"
              defaultValue={practice.summary ?? ""}
              style={textarea}
              placeholder="Kart düzeninde görünecek kısa açıklama"
              rows={4}
            />
          </label>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>Kapak ve Ses</h3>

          <div style={label}>
            <span>Kapak görseli</span>
            <CoverPicker
              name="cover_asset_id"
              assets={imageAssetsForPicker}
              defaultValue={practice.cover_asset_id ?? ""}
              placeholder="Kapak ara"
            />
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Not: Kapak önizlemeli seçilir.
            </div>
          </div>

          {coverPreviewUrl ? (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                Mevcut kapak önizleme:
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreviewUrl}
                alt="cover preview"
                style={{
                  width: 220,
                  height: "auto",
                  borderRadius: 12,
                  border: "1px solid #eee",
                }}
              />
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                {currentCover?.path ?? ""}
              </div>
            </div>
          ) : null}

          <label style={label}>
            <span>Ses dosyası</span>
            <select
              name="audio_asset_id"
              defaultValue={practice.audio_asset_id ?? ""}
              style={input}
            >
              <option value="">- Ses ekleme -</option>
              {audioAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.path}
                  {typeof a.bytes === "number"
                    ? ` (${(a.bytes / (1024 * 1024)).toFixed(2)} MB)`
                    : ""}
                </option>
              ))}
            </select>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Not: Büyük ses dosyalarını önce Assets sayfasından yükleyip
              buradan seçin.
            </div>

            {currentAudio && (
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Şu an bağlı ses: <b>{currentAudio.path}</b>
              </div>
            )}
          </label>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>Sıralama ve Ayarlar</h3>

          <div style={grid2}>
            <label style={label}>
              <span>Varsayılan süre (sn)</span>
              <input
                type="number"
                name="default_duration_seconds"
                defaultValue={practice.default_duration_seconds ?? 180}
                style={input}
                min={1}
              />
            </label>

            <label style={label}>
              <span>Sıra</span>
              <input
                type="number"
                name="sort_order"
                defaultValue={practice.sort_order ?? 0}
                style={input}
                min={0}
              />
            </label>
          </div>

          <div style={grid2}>
            <label style={label}>
              <span>Accent color</span>
              <input
                name="accent_color"
                defaultValue={practice.accent_color ?? ""}
                style={input}
                placeholder="#CFA7F2"
              />
            </label>

            <label style={label}>
              <span>Slug</span>
              <input
                name="slug"
                defaultValue={practice.slug ?? ""}
                style={input}
                placeholder="rahatlama"
              />
            </label>
          </div>

          <label
            style={{
              ...label,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={!!practice.is_featured}
            />
            <span>Öne çıkan içerik</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={btnPrimary}>
            Save
          </button>

          <Link href="/dashboard/practices" style={btnSecondary}>
            Listeye dön
          </Link>
        </div>
      </form>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  resize: "vertical",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  color: "#111",
  display: "inline-block",
};