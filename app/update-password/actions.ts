"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!password || password.length < 6) {
    redirect("/update-password?error=" + encodeURIComponent("Şifre en az 6 karakter olmalı."));
  }

  if (password !== confirm) {
    redirect("/update-password?error=" + encodeURIComponent("Şifreler eşleşmiyor."));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/update-password?error=" + encodeURIComponent(error.message));
  }

  redirect("/login?success=" + encodeURIComponent("Şifre güncellendi. Giriş yapabilirsiniz."));
}
