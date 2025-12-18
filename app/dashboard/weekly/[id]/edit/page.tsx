import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { updateWeeklyItem } from "../../actions";

export default async function WeeklyEditPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("weekly_items")
    .select("id, category, week_label, teaser, title, description, status, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Weekly Edit</h2>
        <p style={{ color: "crimson" }}>
          Kayıt bulunamadı / hata: {error?.message ?? "unknown"}
        </p>
        <Link href="/dashboard/weekly">← Weekly</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Edit Weekly Item</h1>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>

      <form action={updateWeeklyItem} style={card}>
        <input type="hidden" name="id" value={data.id} />

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
          <label style={label}>Kategori</label>
          <select name="category" defaultValue={data.category} required style={input}>
            <option value="movie">movie (Dizi/Film)</option>
            <option value="music">music (Müzik)</option>
            <option value="book">book (Kitap)</option>
          </select>

          <label style={label}>Hafta etiketi</label>
          <input name="week_label" defaultValue={data.week_label} required style={input} />

          <label style={label}>Teaser</label>
          <input name="teaser" defaultValue={data.teaser} required style={input} />

          <label style={label}>Başlık</label>
          <input name="title" defaultValue={data.title} required style={input} />

          <label style={label}>Açıklama</label>
          <textarea
            name="description"
            defaultValue={data.description}
            required
            rows={6}
            style={textarea}
          />

          <label style={label}>Durum</label>
          <select name="status" defaultValue={data.status} required style={input}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            created_at:{" "}
            {data.created_at ? new Date(data.created_at).toLocaleString("tr-TR") : "-"}
          </div>

          <button type="submit" style={btnPrimary}>
            Save
          </button>
        </div>
      </form>
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

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};
