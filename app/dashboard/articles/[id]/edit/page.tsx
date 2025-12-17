import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateArticleTR } from "./actions";
import type { CSSProperties } from "react";

type CategoryRow = { id: string; title_tr: string | null };

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
    .select("id, status, created_at, category_id")
    .eq("id", id)
    .single();

  if (aErr || !article) notFound();

  const { data: tr, error: tErr } = await supabase
    .from("article_translations")
    .select("title, summary, content_html, slug, seo_title, seo_description")
    .eq("article_id", id)
    .eq("lang", "tr")
    .single();

  const { data: categories, error: cErr } = await supabase
    .from("categories")
    .select("id, title_tr")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const trData = tr ?? {
    title: "",
    summary: "",
    content_html: "",
    slug: "",
    seo_title: "",
    seo_description: "",
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
        <p style={{ color: "crimson" }}>
          Kategoriler okunamadı: {cErr.message}
        </p>
      )}

      <form
        action={updateArticleTR}
        style={{ marginTop: 16, display: "grid", gap: 12 }}
      >
        <input type="hidden" name="id" value={article.id} />

        <label style={label}>
          Status
          <select name="status" defaultValue={article.status} style={input}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="scheduled">scheduled</option>
          </select>
        </label>

        <label style={label}>
          Kategori
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

        <label style={label}>
          Başlık (TR)
          <input name="title" defaultValue={trData.title} style={input} />
        </label>

        <label style={label}>
          Özet (TR)
          <textarea
            name="summary"
            defaultValue={trData.summary}
            rows={3}
            style={textarea}
          />
        </label>

        <label style={label}>
          İçerik (TR) — HTML
          <textarea
            name="content_html"
            defaultValue={trData.content_html}
            rows={12}
            style={textarea}
          />
        </label>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label style={label}>
            Slug (TR)
            <input name="slug" defaultValue={trData.slug} style={input} />
          </label>

          <label style={label}>
            SEO Title
            <input
              name="seo_title"
              defaultValue={trData.seo_title}
              style={input}
            />
          </label>
        </div>

        <label style={label}>
          SEO Description
          <textarea
            name="seo_description"
            defaultValue={trData.seo_description}
            rows={2}
            style={textarea}
          />
        </label>

        {/* ✅ Alt aksiyonlar: Preview + Save */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href={`/dashboard/articles/${article.id}/preview`}
            style={btnSecondaryLink}
          >
            Preview (Mobile)
          </Link>

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
