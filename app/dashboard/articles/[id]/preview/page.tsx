import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export default async function ArticlePreviewPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);

  await requireAdmin();
  const supabase = await createClient();

  // ✅ categories join ile title_tr çekiyoruz
  const { data: article, error: aErr } = await supabase
    .from("articles")
    .select("id, status, category_id, categories(title_tr)")
    .eq("id", id)
    .single();

  if (aErr || !article) notFound();

  const { data: tr, error: tErr } = await supabase
    .from("article_translations")
    .select("title, summary, content_html")
    .eq("article_id", id)
    .eq("lang", "tr")
    .single();

  if (tErr || !tr) notFound();

  const categoryLabel =
    (article as any).categories?.title_tr ??
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
