// app/dashboard/categories/page.tsx
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Categories</h2>
        <pre>Fetch error: {error.message}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <h2>Categories</h2>

      {/* Ekleme formu (server action) */}
      <form action={createCategory} style={{ display: "flex", gap: 8 }}>
        <input
          name="name"
          placeholder="Kategori adı"
          required
          style={{ padding: 8, minWidth: 260 }}
        />
        <input
          name="slug"
          placeholder="slug (ör: wellbeing)"
          required
          style={{ padding: 8, minWidth: 260 }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>
          Ekle
        </button>
      </form>

      {/* Liste */}
      <div style={{ display: "grid", gap: 8 }}>
        {(categories ?? []).map((c: any) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ opacity: 0.7, fontSize: 13 }}>{c.slug}</div>
            </div>

            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" style={{ padding: "8px 12px" }}>
                Sil
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
