// app/dashboard/weekly/[id]/edit/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { updateWeeklyItem } from "../../actions";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default async function WeeklyEditPage({
  params,
}: {
  params: { id: string };
}) {
  console.log("EDIT PARAMS:", params);

  await requireAdmin();

  const p: any = await Promise.resolve(params as any);
const id =
  typeof p?.id === "string" ? p.id : Array.isArray(p?.id) ? p.id[0] : undefined;

if (!id || !isUuid(id)) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Weekly Edit</h1>
        <p style={{ color: "crimson", fontWeight: 700 }}>
          Geçersiz ID. Bu sayfaya hatalı bir link ile gelinmiş.
        </p>
        <Link href="/dashboard/weekly">← Weekly</Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("weekly_items")
    .select("id, category, week_label, teaser, title, description, status")
    .eq("id", id)
    .single();

  if (error || !row) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Weekly Edit</h1>
        <p style={{ color: "crimson", fontWeight: 700 }}>
          Kayıt bulunamadı / hata: {error?.message ?? "unknown"}
        </p>
        <Link href="/dashboard/weekly">← Weekly</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Weekly Edit</h1>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>

      <form action={updateWeeklyItem} style={card}>
        {/* id mutlaka gitsin */}
        <input type="hidden" name="id" value={row.id} />

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
          <label style={label}>Kategori</label>
          <select name="category" defaultValue={row.category} required style={input}>
            <option value="movie">movie (Dizi/Film)</option>
            <option value="music">music (Müzik)</option>
            <option value="book">book (Kitap)</option>
          </select>

          <label style={label}>Hafta etiketi</label>
          <input name="week_label" defaultValue={row.week_label} required style={input} />

          <label style={label}>Teaser</label>
          <input name="teaser" defaultValue={row.teaser} required style={input} />

          <label style={label}>Başlık</label>
          <input name="title" defaultValue={row.title} required style={input} />

          <label style={label}>Açıklama</label>
          <textarea
            name="description"
            defaultValue={row.description}
            required
            rows={6}
            style={textarea}
          />

          <label style={label}>Durum</label>
          <select name="status" defaultValue={row.status ?? "draft"} required style={input}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button type="submit" style={btnPrimary}>
            Kaydet
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
  maxWidth: 900,
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
  background: "#fff",
};

const textarea: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  width: "100%",
  resize: "vertical",
  background: "#fff",
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
