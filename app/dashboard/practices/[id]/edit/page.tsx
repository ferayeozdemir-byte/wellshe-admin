import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { updatePractice } from "../../actions";

export default async function EditPracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const supabase = await createClient();

  const { data: practice, error } = await supabase
    .from("breathing_practices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !practice) {
    notFound();
  }

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Edit Practice</h1>

        <Link href="/dashboard/practices" style={{ textDecoration: "none" }}>
          ← Practices
        </Link>
      </div>

      <form action={updatePractice} style={{ display: "grid", gap: 18 }}>
        <input type="hidden" name="id" value={practice.id} />

        <div style={card}>
          <h3 style={sectionTitle}>Temel Bilgiler</h3>

          <div style={grid2}>
            <label style={label}>
              <span>Status</span>
              <select name="status" defaultValue={practice.status} style={input}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="scheduled">scheduled</option>
              </select>
            </label>

            <label style={label}>
              <span>Tür</span>
              <select name="kind" defaultValue={practice.kind} style={input}>
                <option value="breath">breath</option>
                <option value="meditation">meditation</option>
              </select>
            </label>
          </div>

          <label style={label}>
            <span>Başlık</span>
            <input
              name="title"
              defaultValue={practice.title ?? ""}
              style={input}
              placeholder="Örn. Rahatlama"
            />
          </label>

          <label style={label}>
            <span>Teknik adı</span>
            <input
              name="technique_title"
              defaultValue={practice.technique_title ?? ""}
              style={input}
              placeholder="Örn. 4-4-6 Nefes Tekniği"
            />
          </label>

          <label style={label}>
            <span>Kısa açıklama</span>
            <textarea
              name="summary"
              defaultValue={practice.summary ?? ""}
              style={textarea}
              placeholder="Kart üzerinde görünecek kısa açıklama"
            />
          </label>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>Asset ve Görünüm</h3>

          <label style={label}>
            <span>Kapak asset id</span>
            <input
              name="cover_asset_id"
              defaultValue={practice.cover_asset_id ?? ""}
              style={input}
              placeholder="UUID"
            />
          </label>

          <label style={label}>
            <span>Ses asset id</span>
            <input
              name="audio_asset_id"
              defaultValue={practice.audio_asset_id ?? ""}
              style={input}
              placeholder="UUID"
            />
          </label>

          <div style={grid2}>
            <label style={label}>
              <span>Accent color</span>
              <input
                name="accent_color"
                defaultValue={practice.accent_color ?? ""}
                style={input}
                placeholder="#CFA7F2"
              />
            </label>

            <label style={label}>
              <span>Slug</span>
              <input
                name="slug"
                defaultValue={practice.slug ?? ""}
                style={input}
                placeholder="rahatlama"
              />
            </label>
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>Sıralama ve Süre</h3>

          <div style={grid2}>
            <label style={label}>
              <span>Varsayılan süre (sn)</span>
              <input
                type="number"
                name="default_duration_seconds"
                defaultValue={practice.default_duration_seconds ?? 180}
                style={input}
                min={1}
              />
            </label>

            <label style={label}>
              <span>Sıra</span>
              <input
                type="number"
                name="sort_order"
                defaultValue={practice.sort_order ?? 0}
                style={input}
                min={0}
              />
            </label>
          </div>

          <label style={{ ...label, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={!!practice.is_featured}
            />
            <span>Öne çıkan içerik</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={btnPrimary}>
            Save
          </button>

          <Link href="/dashboard/practices" style={btnSecondary}>
            Listeye dön
          </Link>
        </div>
      </form>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 14,
  resize: "vertical",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  color: "#111",
  display: "inline-block",
};