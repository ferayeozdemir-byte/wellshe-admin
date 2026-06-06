import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

type CategoryJoinRow = {
  title_tr: string | null;
};

type ArticlePreviewRow = {
  id: string;
  status: string;
  category_id: string | null;
  categories: CategoryJoinRow | CategoryJoinRow[] | null;
};

type ArticleTranslationPreviewRow = {
  title: string | null;
  summary: string | null;
  content_html: string | null;
};

function pickCategoryTitle(
  categories: CategoryJoinRow | CategoryJoinRow[] | null
) {
  if (!categories) return null;
  const category = Array.isArray(categories) ? categories[0] : categories;
  return category?.title_tr ?? null;
}

export default async function ArticlePreviewPage({ params }: Props) {
  const { id } = await Promise.resolve(params);

  await requireAdmin();
  const supabase = await createClient();

  const { data: articleData, error: aErr } = await supabase
    .from("articles")
    .select("id, status, category_id, categories(title_tr)")
    .eq("id", id)
    .single();

  if (aErr || !articleData) notFound();

  const { data: trData, error: tErr } = await supabase
    .from("article_translations")
    .select("title, summary, content_html")
    .eq("article_id", id)
    .eq("lang", "tr")
    .single();

  if (tErr || !trData) notFound();

  const article = articleData as ArticlePreviewRow;
  const tr = trData as ArticleTranslationPreviewRow;

  const categoryLabel =
    pickCategoryTitle(article.categories) ??
    (article.category_id ? String(article.category_id) : "-");

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Preview (Mobile)</h1>

        <Link href={`/dashboard/articles/${id}/edit`} style={{ textDecoration: "none" }}>
          ← Back to Edit
        </Link>

        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          Status: {article.status}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 390,
            maxWidth: "100%",
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ padding: 16, paddingBottom: 32 }}>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>
              {categoryLabel}
            </div>

            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              {tr.title || "Başlıksız"}
            </div>

            <div
              style={{ fontSize: 15, lineHeight: "22px", color: "#111" }}
              dangerouslySetInnerHTML={{
                __html: tr.content_html || "<p><em>İçerik boş.</em></p>",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        p { margin: 0 0 16px 0; }
        h2 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
        h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
        ul { margin: 0 0 16px 0; padding-left: 18px; }
        li { margin: 0 0 8px 0; }
        img { width: 100%; height: auto; border-radius: 12px; margin: 8px 0; display: block; }
        blockquote { margin: 16px 0; padding: 12px; border-left: 3px solid #ddd; background: #fafafa; border-radius: 12px; }
      `}</style>
    </div>
  );
}