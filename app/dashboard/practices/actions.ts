"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";

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