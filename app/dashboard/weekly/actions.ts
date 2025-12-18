"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

function getStr(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const category = getStr(formData, "category"); // movie|music|book
  const week_label = getStr(formData, "week_label");
  const teaser = getStr(formData, "teaser");
  const title = getStr(formData, "title");
  const description = getStr(formData, "description");
  const status = getStr(formData, "status") || "draft";

  if (!category || !week_label || !teaser || !title || !description) {
    throw new Error("Zorunlu alanlar eksik.");
  }

  const { error } = await supabase.from("weekly_items").insert({
    category,
    week_label,
    teaser,
    title,
    description,
    status,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
}

export async function updateWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = getStr(formData, "id");
  if (!id) throw new Error("ID eksik.");

  const category = getStr(formData, "category");
  const week_label = getStr(formData, "week_label");
  const teaser = getStr(formData, "teaser");
  const title = getStr(formData, "title");
  const description = getStr(formData, "description");
  const status = getStr(formData, "status") || "draft";

  if (!category || !week_label || !teaser || !title || !description) {
    throw new Error("Zorunlu alanlar eksik.");
  }

  const { error } = await supabase
    .from("weekly_items")
    .update({ category, week_label, teaser, title, description, status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
  revalidatePath(`/dashboard/weekly/${id}/edit`);
}

export async function deleteWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = getStr(formData, "id");
  if (!id) throw new Error("ID eksik.");

  const { error } = await supabase.from("weekly_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
}
