import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AudioUploadField from "./AudioUploadField";
import {
  updateArticleTR,
  uploadCoverForArticle,
} from "./actions";
import ContentEditor from "./ContentEditor";
import CoverPicker from "./CoverPicker";
import type { CSSProperties } from "react";

type CategoryRow = { id: string; title_tr: string | null };

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

type TrRow = {
  title: string | null;
  summary: string | null;
  content_html: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  audio_asset_id: string | null;
};

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();
  const supabase = await createClient();

  // ✅ params Promise olabileceği için güvenli çöz
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // ✅ query string ile action hatalarını sayfada göstermek için
  const coverErrorRaw = searchParams?.coverError;
  const coverError =
    typeof coverErrorRaw === "string" ? decodeURIComponent(coverErrorRaw) : null;

  const { data: article, error: aErr } = await supabase
    .from("articles")
    .select("id, status, created_at, category_id, cover_asset_id")
    .eq("id", id)
    .single();

  if (aErr || !article) notFound();

  const { data: tr, error: tErr } = await supabase
    .from("article_translations")
    .select(
      "title,summary,content_html,slug,seo_title,seo_description,audio_asset_id"
    )
    .eq("article_id", id)
    .eq("lang", "tr")
    .single<TrRow>();

  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("id, title_tr")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: assetsData, error: asErr } = await supabase
    .from("assets")
    .select("id,bucket,path,created_at,bytes,content_type,width,height")
    .order("created_at", { ascending: false })
    .limit(200);

  const assets: AssetMiniRow[] = (assetsData ?? []) as AssetMiniRow[];

  // ✅ sadece audio olanlar (mevcut bağlı sesi göstermek ve pick paramını yorumlamak için)
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
      publicUrl: supabase.storage
        .from(a.bucket)
        .getPublicUrl(a.path).data.publicUrl,
    }));

  const trData = {
    title: tr?.title ?? "",
    summary: tr?.summary ?? "",
    content_html: tr?.content_html ?? "",
    slug: tr?.slug ?? "",
    seo_title: tr?.seo_title ?? "",
    seo_description: tr?.seo_description ?? "",
    audio_asset_id: tr?.audio_asset_id ?? null,
  };

  // ✅ Assets sayfasından pick ile dönülürse override edelim
  const pickCoverRaw = searchParams?.pickCover;
  const pickedCoverId = typeof pickCoverRaw === "string" ? pickCoverRaw : null;

  const pickAudioRaw = searchParams?.pickAudio;
  const pickedAudioId = typeof pickAudioRaw === "string" ? pickAudioRaw : null;

  const coverDefaultValue = pickedCoverId ?? (article.cover_asset_id ?? "");
  const audioDefaultValue = pickedAudioId ?? (trData.audio_asset_id ?? "");

  // ✅ Mevcut kapak önizleme URL’i (defaultValue ile uyumlu)
  const currentCoverId = coverDefaultValue || null;
  const currentCover = assets.find((a) => a.id === currentCoverId);

  const coverPreviewUrl =
    currentCover?.bucket && currentCover?.path
      ? supabase.storage
          .from(currentCover.bucket)
          .getPublicUrl(currentCover.path).data.publicUrl
      : "";

  // ✅ Mevcut audio bilgisi (defaultValue ile uyumlu)
  const currentAudioId = audioDefaultValue || null;
  const currentAudio = audioAssets.find((a) => a.id === currentAudioId) ?? null;

  const returnTo = `/dashboard/articles/${article.id}/edit`;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Edit Article</h1>

        <Link href="/dashboard/articles" style={{ textDecoration: "none" }}>
          ← Articles
        </Link>

        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          ID: {article.id}
        </div>
      </div>

      {/* ✅ Action hata mesajları */}
      {coverError ? (
        <div style={alertErrorBox}>Kapak upload hatası: {coverError}</div>
      ) : null}

      {tErr ? (
        <p style={{ color: "crimson" }}>
          TR translation okunamadı: {tErr.message}
        </p>
      ) : null}

      {cErr ? (
        <p style={{ color: "crimson" }}>
          Kategoriler okunamadı: {cErr.message}
        </p>
      ) : null}

      {asErr ? (
        <p style={{ color: "crimson" }}>
          Assets okunamadı: {asErr.message}
        </p>
      ) : null}

      {/* ✅ Kapak upload + otomatik bağlama (aynı kaldı) */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 800 }}>Kapak Görseli</div>

        <form
          action={uploadCoverForArticle}
          encType="multipart/form-data"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input type="hidden" name="article_id" value={article.id} />
          <input type="file" name="file" accept="image/*" required />
          <button type="submit" style={btnSecondary}>
            Kapak Upload + Otomatik Bağla
          </button>

          <Link
            href={`/dashboard/assets?mode=pick&kind=cover&return_to=${encodeURIComponent(
              returnTo
            )}`}
            target="_blank"
            rel="noreferrer"
            style={btnSecondaryLink}
          >
            Assets’e Git
          </Link>
        </form>

        {/* ✅ Mevcut kapak önizleme */}
        {coverPreviewUrl ? (
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginBottom: 6,
              }}
            >
              Mevcut kapak önizleme:
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreviewUrl}
              alt="cover preview"
              style={{
                width: 260,
                height: "auto",
                borderRadius: 12,
                border: "1px solid #eee",
              }}
            />
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginTop: 6,
              }}
            >
              {currentCover?.path ?? ""}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            Bu makaleye bağlı bir kapak yok.
          </div>
        )}

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Not: Upload sonrası sistem yeni asset oluşturur ve otomatik olarak bu
          makaleye “cover” olarak bağlar.
        </div>
      </div>

      {/* ✅ Ana kayıt formu */}
      <form
        action={updateArticleTR}
        style={{ marginTop: 16, display: "grid", gap: 12 }}
      >
        <input type="hidden" name="id" value={article.id} />

        <label style={label}>
          <div>Status</div>
          <select
            name="status"
            defaultValue={article.status}
            style={input}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="scheduled">scheduled</option>
          </select>
        </label>

        <label style={label}>
          <div>Kategori</div>
          <select
            name="category_id"
            defaultValue={article.category_id ?? ""}
            style={input}
          >
            <option value="">- Seçiniz -</option>
            {(categories ?? []).map((c: CategoryRow) => (
              <option key={c.id} value={c.id}>
                {c.title_tr ?? c.id}
              </option>
            ))}
          </select>
        </label>

        {/* ✅ SES: Client tarafı upload + audio_asset_id hidden */}
        <label style={label}>
          <div>Ses Dosyası (Audio)</div>

          <AudioUploadField
            articleId={article.id}
            initialAssetId={audioDefaultValue || null}
            initialPath={currentAudio?.path ?? null}
          />

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Not: Her içerik için tek ses dosyası. İstersen aşağıdan yeni ses
            yükleyebilir, istersen Assets sayfasında daha önce yüklediğin bir
            dosyayı seçip bu sayfaya <code>?pickAudio=ID</code> ile
            döndürebilirsin.
          </div>

          <div style={{ marginTop: 6 }}>
            <Link
              href={`/dashboard/assets?mode=pick&kind=audio&return_to=${encodeURIComponent(
                returnTo
              )}`}
              target="_blank"
              rel="noreferrer"
              style={btnSecondaryLink}
            >
              Assets’te Ses Dosyası Seç
            </Link>
          </div>
        </label>

        {/* ✅ Cover seçimi (önizlemeli CoverPicker) */}
        <div style={label}>
          <div>Cover (assets)</div>

          <CoverPicker
            name="cover_asset_id"
            assets={imageAssetsForPicker}
            defaultValue={coverDefaultValue}
            placeholder="Kapak ara (örn: covers/2025-12)"
          />

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Not: Kapak artık önizlemeli seçilir. (Select kaldırıldı.)
          </div>
        </div>

        <label style={label}>
          <div>Başlık (TR)</div>
          <input name="title" defaultValue={trData.title} style={input} />
        </label>

        <label style={label}>
          <div>Özet (TR)</div>
          <textarea
            name="summary"
            defaultValue={trData.summary}
            rows={3}
            style={textarea}
          />
        </label>

        <label style={label}>
          <div>İçerik (TR) — Editör</div>
          <ContentEditor
            name="content_html"
            initialHTML={trData.content_html}
            assets={assets.map((a) => ({
              id: a.id,
              bucket: a.bucket,
              path: a.path,
              created_at: a.created_at ?? null,
              bytes: a.bytes ?? null,
              content_type: a.content_type ?? null,
              width: a.width ?? null,
              height: a.height ?? null,
            }))}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label style={label}>
            <div>Slug (TR)</div>
            <input name="slug" defaultValue={trData.slug} style={input} />
          </label>

          <label style={label}>
            <div>SEO Title</div>
            <input
              name="seo_title"
              defaultValue={trData.seo_title}
              style={input}
            />
          </label>
        </div>

        <label style={label}>
          <div>SEO Description</div>
          <textarea
            name="seo_description"
            defaultValue={trData.seo_description}
            rows={2}
            style={textarea}
          />
        </label>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" style={btnPrimary}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

const label: CSSProperties = { display: "grid", gap: 6, fontWeight: 700 };

const input: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 500,
};

const textarea: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontFamily: "inherit",
};

const btnPrimary: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const btnSecondaryLink: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  textDecoration: "none",
  fontWeight: 800,
  display: "inline-block",
};

const btnSecondary: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid "#ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 800,
};

const alertErrorBox: CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(220,20,60,0.35)",
  background: "rgba(220,20,60,0.08)",
  color: "crimson",
  fontWeight: 800,
};
