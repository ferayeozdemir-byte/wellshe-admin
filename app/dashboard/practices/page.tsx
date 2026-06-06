// app/dashboard/practices/page.tsx
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createPractice } from "./actions";
import DeleteButton from "./DeleteButton";

type PracticeRow = {
  id: string;
  status: string;
  kind: string;
  title: string;
  technique_title: string | null;
  created_at: string | null;
  updated_at: string | null;
  sort_order: number | null;
  is_featured: boolean;
};

export default async function PracticesPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("breathing_practices")
    .select(
      `
      id,
      status,
      kind,
      title,
      technique_title,
      created_at,
      updated_at,
      sort_order,
      is_featured
    `
    )
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const practices: PracticeRow[] = ((rows ?? []) as PracticeRow[]).sort(
    (a, b) => {
      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1;
      }

      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      const aTime = a.updated_at
        ? new Date(a.updated_at).getTime()
        : a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

      const bTime = b.updated_at
        ? new Date(b.updated_at).getTime()
        : b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

      return bTime - aTime;
    }
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Practices</h1>

        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          ← Dashboard
        </Link>

        <form action={createPractice} style={{ marginLeft: "auto" }}>
          <button type="submit" style={btnPrimary}>
            + New Practice
          </button>
        </form>
      </div>

      {error && <p style={{ color: "crimson" }}>DB Error: {error.message}</p>}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Başlık</th>
              <th style={th}>Tür</th>
              <th style={th}>Status</th>
              <th style={th}>Sıra</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {practices.map((p) => (
              <tr key={p.id}>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {p.technique_title || "-"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{p.id}</div>
                </td>

                <td style={td}>
                  <span style={kindBadge(p.kind)}>
                    {p.kind === "meditation" ? "meditation" : "breath"}
                  </span>
                </td>

                <td style={td}>
                  <span style={statusBadge(p.status)}>{p.status}</span>
                </td>

                <td style={td}>{p.sort_order ?? 0}</td>

                <td style={td}>
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString("tr-TR")
                    : "-"}
                </td>

                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/dashboard/practices/${p.id}/edit`} style={btn}>
                      Edit
                    </Link>
                    <DeleteButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}

            {practices.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  Henüz pratik yok.
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

function statusBadge(status: string): React.CSSProperties {
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

function kindBadge(kind: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #ddd",
  };

  if (kind === "meditation") {
    return { ...base, borderColor: "#8b5cf6", color: "#6d28d9" };
  }

  return { ...base, borderColor: "#7c9a6d", color: "#4d7c0f" };
}