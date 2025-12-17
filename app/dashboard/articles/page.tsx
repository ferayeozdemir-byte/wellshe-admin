// app/dashboard/articles/page.tsx
import DeleteButton from "./DeleteButton";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createArticle } from "./actions";

export default async function ArticlesPage() {
  await requireAdmin();

  const supabase = await createClient();

  // TR başlığı da gelsin diye translations join
  const { data: rows, error } = await supabase
    .from("articles")
    .select(
      `
      id,
      status,
      created_at,
      category_id,
      categories:categories ( id, title_tr ),
      article_translations ( lang, title )
    `
    )
    .order("created_at", { ascending: false });

  // TR title seç
  const articles =
    (rows ?? []).map((r: any) => {
      const tr = (r.article_translations ?? []).find((t: any) => t.lang === "tr");
      return {
        id: r.id as string,
        status: r.status as string,
        created_at: r.created_at as string | null,
        category_id: r.category_id as string | null,
        category_title_tr: r.categories?.title_tr ?? null,
        title_tr: tr?.title ?? "(başlık yok)",
      };
    }) ?? [];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Articles</h1>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          ← Dashboard
        </Link>

        <form action={createArticle} style={{ marginLeft: "auto" }}>
          <button type="submit" style={btnPrimary}>
            + New Article
          </button>
        </form>
      </div>

      {error && <p style={{ color: "crimson" }}>DB Error: {error.message}</p>}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Title (TR)</th>
              <th style={th}>Status</th>
              <th style={th}>Category</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{a.title_tr}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{a.id}</div>
                </td>

                <td style={td}>
                  <span style={badge(a.status)}>{a.status}</span>
                </td>

                <td style={td}>{a.category_title_tr ?? a.category_id ?? "-"}</td>

                <td style={td}>
                  {a.created_at ? new Date(a.created_at).toLocaleString("tr-TR") : "-"}
                </td>

                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/dashboard/articles/${a.id}/edit`} style={btn}>
                      Edit
                    </Link>

                    <DeleteButton id={a.id} />
                  </div>
                </td>
              </tr>
            ))}

            {articles.length === 0 && (
              <tr>
                <td style={td} colSpan={5}>
                  Henüz içerik yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "10px 8px",
  fontWeight: 700,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 14,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const btn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  display: "inline-block",
  color: "#111",
};

const btnDanger: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e33",
  background: "#fff",
  color: "#e33",
  cursor: "pointer",
  fontWeight: 700,
};

function badge(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #ddd",
  };

  if (status === "published") return { ...base, borderColor: "#1a7f37" };
  if (status === "scheduled") return { ...base, borderColor: "#b8860b" };
  if (status === "draft") return { ...base, borderColor: "#666" };
  return base;
}
