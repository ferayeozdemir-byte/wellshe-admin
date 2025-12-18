// app/dashboard/weekly/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function createWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "").trim();
  const week_label = String(formData.get("week_label") ?? "").trim();
  const teaser = String(formData.get("teaser") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!category || !week_label || !teaser || !title || !description) {
    throw new Error("Zorunlu alanlar eksik.");
  }

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

  if (error || !data) throw new Error(error?.message ?? "Insert başarısız");

  revalidatePath("/dashboard/weekly");
  redirect(`/dashboard/weekly/${data.id}/edit`);
}

export async function updateWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID eksik.");

  const category = String(formData.get("category") ?? "").trim();
  const week_label = String(formData.get("week_label") ?? "").trim();
  const teaser = String(formData.get("teaser") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!category || !week_label || !teaser || !title || !description) {
    throw new Error("Zorunlu alanlar eksik.");
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

export async function deleteWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID eksik.");

  const { error } = await supabase.from("weekly_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
  redirect("/dashboard/weekly");
}
