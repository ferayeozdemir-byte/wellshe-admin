// app/dashboard/weekly/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function createWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const category = String(formData.get("category") ?? "");
  const week_label = String(formData.get("week_label") ?? "");
  const teaser = String(formData.get("teaser") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft");

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

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id eksik");

  const category = String(formData.get("category") ?? "");
  const week_label = String(formData.get("week_label") ?? "");
  const teaser = String(formData.get("teaser") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const { error } = await supabase
    .from("weekly_items")
    .update({ category, week_label, teaser, title, description, status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
  revalidatePath(`/dashboard/weekly/${id}`);
}

export async function deleteWeeklyItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id eksik");

  const { error } = await supabase.from("weekly_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/weekly");
}
