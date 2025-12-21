import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateArticleTR, uploadCoverForArticle } from "./actions";
import ContentEditor from "./ContentEditor";
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

export default async function EditArticlePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);

  await requireAdmin();
  const supabase = await createClient();

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
    .single();

  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("id, title_tr")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: assets, error: asErr } = await supabase
    .from("assets")
    .select("id,bucket,path,created_at,bytes,content_type,width,height")
    .order("created_at", { ascending: false })
    .limit(200);

  const trData = tr ?? {
    title: "",
    summary: "",
    content_html: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    audio_asset_id: null as string | null,
  };

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

      {tErr && (
        <p style={{ color: "crimson" }}>
          TR translation okunamadı: {tErr.message}
        </p>
      )}

      {cErr && (
        <p style={{ color: "crimson" }}>Kategoriler okunamadı: {cErr.message}</p>
      )}

      {asErr && (
        <p style={{ color: "crimson" }}>Assets okunamadı: {asErr.message}</p>
      )}

      {/* ✅ Kapak upload + otomatik bağlama (AYRI FORM) */}
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

          <Link href="/dashboard/assets" style={btnSecondaryLink}>
            Assets’e Git
          </Link>
        </form>

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
          <select name="status" defaultValue={article.status} style={input}>
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

        {/* ✅ Audio seçimi (assets) */}
        <label style={label}>
          <div>Ses Dosyası (Audio)</div>
          <select
            name="audio_asset_id"
            defaultValue={trData.audio_asset_id ?? ""}
            style={input}
          >
            <option value="">- Ses ekleme -</option>

            {(assets ?? [])
              .filter((a: AssetMiniRow) =>
                String(a.content_type ?? "").startsWith("audio/")
              )
              .map((a: AssetMiniRow) => (
                <option key={a.id} value={a.id}>
                  {a.path}
                  {typeof a.bytes === "number"
                    ? ` (${(a.bytes / (1024 * 1024)).toFixed(2)} MB)`
                    : ""}
                </option>
              ))}
          </select>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Not: Her içerik için tek ses dosyası. 2 MB üzeri uyarısını bir
            sonraki adımda Save sırasında ekleyeceğiz.
          </div>
        </label>

        {/* ✅ Cover seçimi (mevcut assetlerden) */}
        <label style={label}>
          <div>Cover (assets)</div>
          <select
            name="cover_asset_id"
            defaultValue={article.cover_asset_id ?? ""}
            style={input}
          >
            <option value="">- Kapak seçmeyin -</option>
            {(assets ?? []).map((a: AssetMiniRow) => (
              <option key={a.id} value={a.id}>
                {a.path}
              </option>
            ))}
          </select>
        </label>

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
            assets={(assets ?? []).map((a: AssetMiniRow) => ({
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 800,
};
