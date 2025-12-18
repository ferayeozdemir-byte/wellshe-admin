import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createWeeklyItem } from "./actions";
import DeleteButton from "./DeleteButton";

export default async function WeeklyPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("weekly_items")
    .select("id, category, week_label, teaser, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Weekly (Haftanın Önerileri)</h1>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          ← Dashboard
        </Link>
      </div>

      {error && <p style={{ color: "crimson" }}>DB Error: {error.message}</p>}

      <form action={createWeeklyItem} style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
          <label style={label}>Kategori</label>
          <select name="category" required style={input}>
            <option value="movie">movie (Dizi/Film)</option>
            <option value="music">music (Müzik)</option>
            <option value="book">book (Kitap)</option>
          </select>

          <label style={label}>Hafta etiketi</label>
          <input
            name="week_label"
            placeholder="örn: 24–30 Kasım 2025"
            required
            style={input}
          />

          <label style={label}>Teaser</label>
          <input
            name="teaser"
            placeholder="Ana sayfada gözükecek kısa cümle"
            required
            style={input}
          />

          <label style={label}>Başlık</label>
          <input name="title" placeholder="Kart başlığı" required style={input} />

          <label style={label}>Açıklama</label>
          <textarea
            name="description"
            placeholder="Detaylı açıklama"
            required
            rows={4}
            style={textarea}
          />

          <label style={label}>Durum</label>
          <select name="status" defaultValue="draft" required style={input}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button type="submit" style={btnPrimary}>
            + Add Weekly Item
          </button>
        </div>
      </form>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Teaser</th>
              <th style={th}>Category</th>
              <th style={th}>Week</th>
              <th style={th}>Status</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r: any) => (
              <tr key={r.id}>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{r.teaser}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{r.id}</div>
                </td>
                <td style={td}>{r.category}</td>
                <td style={td}>{r.week_label}</td>
                <td style={td}>
                  <span style={badge(r.status)}>{r.status}</span>
                </td>
                <td style={td}>
                  {r.created_at ? new Date(r.created_at).toLocaleString("tr-TR") : "-"}
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/dashboard/weekly/${r.id}/edit`} style={btn}>
                      Edit
                    </Link>
                    <DeleteButton id={r.id} />
                  </div>
                </td>
              </tr>
            ))}

            {(rows ?? []).length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  Henüz weekly öneri yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 14,
  background: "#fff",
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  paddingTop: 8,
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  width: "100%",
};

const textarea: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  width: "100%",
  resize: "vertical",
};

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
  if (status === "draft") return { ...base, borderColor: "#666" };
  return base;
}
