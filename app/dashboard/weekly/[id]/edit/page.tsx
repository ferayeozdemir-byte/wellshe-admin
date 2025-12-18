// app/dashboard/weekly/[id]/edit/page.tsx
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
  params: { id: string };
}) {
  await requireAdmin();

  const id = params?.id;
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
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Weekly Edit</h1>
        <Link href="/dashboard/weekly" style={{ textDecoration: "none" }}>
          ← Weekly
        </Link>
      </div>

      <form action={updateWeeklyItem} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="id" value={row.id} />

        {/* ✅ updateWeeklyItem bunları da beklediği için formda MUTLAKA olmalı */}
        <label>Kategori</label>
        <select name="category" defaultValue={row.category} required>
          <option value="movie">movie (Dizi/Film)</option>
          <option value="music">music (Müzik)</option>
          <option value="book">book (Kitap)</option>
        </select>

        <label>Hafta etiketi</label>
        <input name="week_label" defaultValue={row.week_label ?? ""} required />

        <label>Teaser</label>
        <input name="teaser" defaultValue={row.teaser ?? ""} required />

        <label>Başlık</label>
        <input name="title" defaultValue={row.title ?? ""} required />

        <label>Açıklama</label>
        <textarea
          name="description"
          defaultValue={row.description ?? ""}
          rows={6}
          required
        />

        <label>Durum</label>
        <select name="status" defaultValue={row.status ?? "draft"} required>
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>

        <button type="submit">Kaydet</button>
      </form>
    </div>
  );
}
