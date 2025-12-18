// app/dashboard/weekly/[id]/edit/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "../../DeleteButton";
import { updateWeeklyItem } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { id?: string };
};

export default async function WeeklyEditPage({ params }: PageProps) {
  await requireAdmin();

  const id = params?.id;

  // ✅ "undefined" / boş id durumunda DB'ye gitme
  if (!id || id === "undefined") {
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

  const { data: row, error } = await supabase
    .from("weekly_items")
    .select("id, category, week_label, teaser, title, description, status, created_at")
    .eq("id", id)
    .single();

  if (error || !row) {
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
    <div style={{ padding: 24, display: "grid", gap: 14, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Weekly Edit</h1>

        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>

        <div style={{ marginLeft: "auto" }}>
          <DeleteButton id={row.id} />
        </div>
      </div>

      <form action={updateWeeklyItem} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="id" value={row.id} />

        <label style={label}>
          Category
          <select name="category" defaultValue={row.category ?? "movie"} style={input} required>
            <option value="movie">movie (Dizi/Film)</option>
            <option value="music">music (Müzik)</option>
            <option value="book">book (Kitap)</option>
          </select>
        </label>

        <label style={label}>
          Week Label
          <input name="week_label" defaultValue={row.week_label ?? ""} style={input} required />
        </label>

        <label style={label}>
          Teaser
          <input name="teaser" defaultValue={row.teaser ?? ""} style={input} required />
        </label>

        <label style={label}>
          Title
          <input name="title" defaultValue={row.title ?? ""} style={input} required />
        </label>

        <label style={label}>
          Description
          <textarea
            name="description"
            defaultValue={row.description ?? ""}
            style={{ ...input, minHeight: 140 }}
            required
          />
        </label>

        <label style={label}>
          Status
          <select name="status" defaultValue={row.status ?? "draft"} style={input} required>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <button type="submit" style={btnPrimary}>
          Kaydet
        </button>
      </form>
    </div>
  );
}

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontWeight: 700,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 500,
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
