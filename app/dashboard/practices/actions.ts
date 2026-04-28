"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

function nullableString(value: FormDataEntryValue | null) {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

function numberValue(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
      technique_title: "",
      summary: "",
      default_duration_seconds: 180,
      sort_order: 0,
      is_featured: false,
      accent_color: "#CFA7F2",
      slug: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Practice oluşturulamadı.");
  }

  revalidatePath("/dashboard/practices");
  redirect(`/dashboard/practices/${data.id}/edit`);
}

export async function updatePractice(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Practice id bulunamadı.");

  const status = String(formData.get("status") ?? "draft");
  const kind = String(formData.get("kind") ?? "breath");

  const payload = {
    status,
    kind,
    title: String(formData.get("title") ?? "").trim(),
    technique_title: nullableString(formData.get("technique_title")),
    summary: nullableString(formData.get("summary")),
    cover_asset_id: nullableString(formData.get("cover_asset_id")),
    audio_asset_id: nullableString(formData.get("audio_asset_id")),
    default_duration_seconds: Math.max(
      1,
      numberValue(formData.get("default_duration_seconds"), 180)
    ),
    sort_order: Math.max(0, numberValue(formData.get("sort_order"), 0)),
    accent_color: nullableString(formData.get("accent_color")),
    is_featured: formData.get("is_featured") === "on",
    slug: nullableString(formData.get("slug")),
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("breathing_practices")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/practices");
  revalidatePath(`/dashboard/practices/${id}/edit`);

  redirect(`/dashboard/practices/${id}/edit`);
}