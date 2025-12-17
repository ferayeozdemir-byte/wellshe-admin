// app/update-password/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
style={{ padding: 10, width: "100%", color: "#111", background: "#fff", border: "1px solid #ccc" }}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!password || password.length < 6) {
    redirect("/update-password?error=short");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect("/update-password?error=1");

  redirect("/dashboard");
}
