// app/dashboard/weekly/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

function norm(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

const ALLOWED = new Set(["movie", "music", "book"]);
const ALLOWED_STATUS = new Set(["draft", "published"]);

export async function createWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const category = norm(formData.get("category"));
  const week_label = norm(formData.get("week_label"));
  const teaser = norm(formData.get("teaser"));
  const title = norm(formData.get("title"));
  const description = norm(formData.get("description"));
  const status = norm(formData.get("status")) || "draft";

  if (!ALLOWED.has(category)) throw new Error("Geçersiz category");
  if (!week_label || !teaser || !title || !description) {
    throw new Error("Tüm alanlar zorunlu");
  }
  if (!ALLOWED_STATUS.has(status)) throw new Error("Geçersiz status");

  const { data, error } = await supabase
    .from("weekly_items")
    .insert({
      category,
      week_label,
      teaser,
      title,
      description,
      status,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "Weekly item oluşturulamadı");

  revalidatePath("/dashboard/weekly");
  redirect(`/dashboard/weekly/${data.id}/edit`);
}

export async function deleteWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = norm(formData.get("id"));
  if (!id) throw new Error("id zorunlu");

  const { error } = await supabase.from("weekly_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
}

export async function updateWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = norm(formData.get("id"));
  const category = norm(formData.get("category"));
  const week_label = norm(formData.get("week_label"));
  const teaser = norm(formData.get("teaser"));
  const title = norm(formData.get("title"));
  const description = norm(formData.get("description"));
  const status = norm(formData.get("status"));

  if (!id) throw new Error("id zorunlu");
  if (!ALLOWED.has(category)) throw new Error("Geçersiz category");
  if (!ALLOWED_STATUS.has(status)) throw new Error("Geçersiz status");
  if (!week_label || !teaser || !title || !description) {
    throw new Error("Tüm alanlar zorunlu");
  }

  const { error } = await supabase
    .from("weekly_items")
    .update({
      category,
      week_label,
      teaser,
      title,
      description,
      status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
  revalidatePath(`/dashboard/weekly/${id}/edit`);
}
