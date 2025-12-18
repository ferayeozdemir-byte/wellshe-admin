import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { updateWeeklyItem } from "../../actions";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function WeeklyEditPage({
  params,
}: {
  params: { id?: string };
}) {
  await requireAdmin();
  const id = params?.id;

  if (!id || !isUuid(id)) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Weekly Edit</h1>
        <p style={{ color: "crimson", fontWeight: 700 }}>
          Geçersiz ID. Bu sayfaya hatalı bir link ile gelinmiş.
        </p>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("weekly_items")
    .select("id, category, week_label, teaser, title, description, status, created_at")
    .eq("id", id)
    .single();

  if (error || !item) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Weekly Edit</h1>
        <p style={{ color: "crimson", fontWeight: 700 }}>
          Kayıt bulunamadı / hata: {error?.message ?? "Bulunamadı"}
        </p>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Weekly Edit</h1>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>

      <form action={updateWeeklyItem} style={card}>
        <input type="hidden" name="id" value={item.id} />

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
          <label style={label}>Kategori</label>
          <select name="category" defaultValue={item.category} required style={input}>
            <option value="movie">movie (Dizi/Film)</option>
            <option value="music">music (Müzik)</option>
            <option value="book">book (Kitap)</option>
          </select>

          <label style={label}>Hafta etiketi</label>
          <input
            name="week_label"
            defaultValue={item.week_label ?? ""}
            required
            style={input}
          />

          <label style={label}>Teaser</label>
          <input name="teaser" defaultValue={item.teaser ?? ""} required style={input} />

          <label style={label}>Başlık</label>
          <input name="title" defaultValue={item.title ?? ""} required style={input} />

          <label style={label}>Açıklama</label>
          <textarea
            name="description"
            defaultValue={item.description ?? ""}
            required
            rows={6}
            style={textarea}
          />

          <label style={label}>Durum</label>
          <select name="status" defaultValue={item.status ?? "draft"} required style={input}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button type="submit" style={btnPrimary}>
            Save
          </button>
        </div>
      </form>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        ID: {item.id} • Created:{" "}
        {item.created_at ? new Date(item.created_at).toLocaleString("tr-TR") : "-"}
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

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};
