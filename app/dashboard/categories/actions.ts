// app/dashboard/categories/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) throw new Error("name/slug zorunlu");

  const { error } = await supabase.from("categories").insert({ name, slug });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/categories");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("id zorunlu");

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/categories");
}
