"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

function toNullableString(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function toNullableNumber(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "") === "on";
}

export async function createPractice() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("breathing_practices")
    .insert({
      status: "draft",
      kind: "breath",
      title: "Yeni pratik",
      technique_title: null,
      summary: null,
      cover_asset_id: null,
      audio_asset_id: null,
      default_duration_seconds: 180,
      sort_order: 0,
      accent_color: "#CFA7F2",
      is_featured: false,
      slug: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Pratik oluşturulamadı");
  }

  revalidatePath("/dashboard/practices");
  redirect(`/dashboard/practices/${data.id}/edit`);
}

export async function updatePractice(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID eksik");

  const payload = {
    status: String(formData.get("status") || "draft"),
    kind: String(formData.get("kind") || "breath"),
    title: String(formData.get("title") || "").trim(),
    technique_title: toNullableString(formData.get("technique_title")),
    summary: toNullableString(formData.get("summary")),
    cover_asset_id: toNullableString(formData.get("cover_asset_id")),
    audio_asset_id: toNullableString(formData.get("audio_asset_id")),
    default_duration_seconds: toNullableNumber(
      formData.get("default_duration_seconds")
    ),
    sort_order: toNullableNumber(formData.get("sort_order")),
    accent_color:
      String(formData.get("accent_color") || "").trim() || "#CFA7F2",
    is_featured: toBoolean(formData.get("is_featured")),
    slug: toNullableString(formData.get("slug")),
  };

  const { error } = await supabase
    .from("breathing_practices")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/practices");
  revalidatePath(`/dashboard/practices/${id}/edit`);
  redirect("/dashboard/practices");
}

export async function deletePractice(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("ID eksik");

  const supabase = await createClient();

  const { error } = await supabase
    .from("breathing_practices")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/practices");
}